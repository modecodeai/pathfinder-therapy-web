import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import {
  CLINICAL_THEME_LABELS,
  type AnyStructuredAnalysis,
  type ClientRecord,
  type ClinicalSuggestion,
  type ClinicalThemeAnalysis,
  type ClinicalThemeId,
  type CognitionSuggestion,
  type MemorySuggestion,
  type ReviewStatus,
  type SupportedAnalysisPhase,
  type TranscriptAnalysis,
  type TranscriptEvidence,
} from './types';
import {
  SYNTHETIC_PHASE3_TRANSCRIPT,
  SYNTHETIC_PHASE4_TRANSCRIPT,
  SYNTHETIC_TEST_TRANSCRIPT,
  analyseTranscript,
  applyFindings,
  applyToTarget,
  fetchCIStatus,
  getClient,
  saveReviewedAnalysis,
} from './lib/api';
import { Phase3ReviewPanel } from './components/Phase3ReviewPanel';
import { Phase4ReviewPanel } from './components/Phase4ReviewPanel';

type View = 'form' | 'review' | 'apply-preview';

const PROTOCOLS = [{ id: 'standard-emdr', label: 'Standard EMDR' }] as const;
const PHASES = [
  { id: 'history', label: 'Phase 1 — History / Treatment Planning', supported: true },
  { id: 'preparation', label: 'Phase 2 — Preparation', supported: false },
  { id: 'assessment', label: 'Phase 3 — Assessment', supported: true },
  { id: 'desensitisation', label: 'Phase 4 — Desensitisation', supported: true },
] as const;

function effectiveValue(item: ClinicalSuggestion | MemorySuggestion): string {
  if ('therapistEditedValue' in item && item.reviewStatus === 'edited' && item.therapistEditedValue) {
    return String(item.therapistEditedValue);
  }
  if ('headline' in item) return item.headline;
  return String((item as ClinicalSuggestion).value);
}

function patchStatus<T extends { id: string; reviewStatus: ReviewStatus }>(
  items: T[],
  id: string,
  status: ReviewStatus,
  edited?: string,
): T[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    if (status === 'edited') {
      const row = item as T & { value?: string; headline?: string };
      const original = row.value ?? row.headline ?? '';
      return {
        ...item,
        reviewStatus: 'edited',
        originalAIValue: original,
        therapistEditedValue: edited,
        ...(row.value !== undefined ? { value: edited ?? row.value } : {}),
        ...(row.headline !== undefined ? { headline: edited ?? row.headline } : {}),
      };
    }
    return { ...item, reviewStatus: status };
  });
}

function isApproved(s: ReviewStatus) {
  return s === 'approved' || s === 'edited';
}

export function AnalyseTranscriptPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [ciReady, setCiReady] = useState<boolean | null>(null);
  const [protocol, setProtocol] = useState<'standard-emdr'>('standard-emdr');
  const [phase, setPhase] = useState<(typeof PHASES)[number]['id']>('history');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transcript, setTranscript] = useState('');
  const [view, setView] = useState<View>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<AnyStructuredAnalysis | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [themeResolutions, setThemeResolutions] = useState<
    Record<string, 'keep-existing' | 'add-additional' | 'replace'>
  >({});
  const [memoryResolutions, setMemoryResolutions] = useState<
    Record<string, { existingMemoryId: string; resolution: 'merge' | 'keep-separate' }>
  >({});
  const [serverConflicts, setServerConflicts] = useState<string[]>([]);
  const transcriptPaneRef = useRef<HTMLPreElement>(null);

  const phaseMeta = PHASES.find((p) => p.id === phase) ?? PHASES[0];
  const analysisSupported = protocol === 'standard-emdr' && phaseMeta.supported;
  const phase1 = result?.analysisKind === 'phase1-history' ? result : null;
  const phase3 = result?.analysisKind === 'phase3-assessment' ? result : null;
  const phase4 = result?.analysisKind === 'phase4-desensitisation' ? result : null;

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId).then(setClient);
    void fetchCIStatus()
      .then((s) => setCiReady(s.configured))
      .catch(() => setCiReady(false));
  }, [auth.isAuthenticated, clientId]);

  useEffect(() => {
    if (!highlight || !transcriptPaneRef.current) return;
    const mark = transcriptPaneRef.current.querySelector('mark');
    mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight]);

  const onAnalyse = async () => {
    if (!analysisSupported) return;
    setBusy(true);
    setError(null);
    try {
      const res = await analyseTranscript({
        clientId,
        protocol,
        phase: phase as SupportedAnalysisPhase,
        transcript,
        sessionDate,
      });
      if (!res.success || !res.structuredResult) {
        setError(
          res.error ??
            'Clinical Intelligence could not analyse this transcript. The transcript has been preserved.',
        );
        return;
      }
      setResult(res.structuredResult);
      setAnalysisId(res.analysis?.id ?? null);
      setView('review');
      setSelectedIds(new Set());
      setHighlight(null);
      void getClient(clientId).then(setClient);
    } catch {
      setError(
        'Clinical Intelligence could not analyse this transcript. The transcript has been preserved.',
      );
    } finally {
      setBusy(false);
    }
  };

  const persistReview = async (
    next: AnyStructuredAnalysis,
    status: 'partially-reviewed' | 'reviewed' = 'partially-reviewed',
  ) => {
    if (!analysisId) return;
    try {
      await saveReviewedAnalysis(analysisId, next, status);
    } catch {
      // non-fatal for local review; apply will retry
    }
  };

  const updateResult = (next: AnyStructuredAnalysis) => {
    setResult(next);
    void persistReview(next);
  };

  const setCollectionStatus = (
    collection: keyof TranscriptAnalysis,
    id: string,
    status: ReviewStatus,
    edited?: string,
  ) => {
    if (!phase1) return;
    if (collection === 'summary') {
      updateResult({
        ...phase1,
        summary: {
          ...phase1.summary,
          reviewStatus: status,
          ...(status === 'edited'
            ? {
                originalAIValue: phase1.summary.value,
                therapistEditedValue: edited,
                value: edited ?? phase1.summary.value,
              }
            : {}),
        },
      });
      return;
    }
    if (collection === 'memories') {
      updateResult({ ...phase1, memories: patchStatus(phase1.memories, id, status, edited) });
      return;
    }
    if (collection === 'themes') {
      updateResult({
        ...phase1,
        themes: phase1.themes.map((t) => (t.id === id ? { ...t, reviewStatus: status } : t)),
      });
      return;
    }
    const arr = phase1[collection];
    if (!Array.isArray(arr) || typeof arr[0] === 'string') return;
    updateResult({
      ...phase1,
      [collection]: patchStatus(arr as ClinicalSuggestion[], id, status, edited),
    } as TranscriptAnalysis);
  };

  const approveSelected = () => {
    if (!phase1 || !selectedIds.size) return;
    const mark = <T extends { id: string; reviewStatus: ReviewStatus }>(items: T[]) =>
      items.map((i) =>
        selectedIds.has(i.id) && i.reviewStatus === 'pending' ? { ...i, reviewStatus: 'approved' as const } : i,
      );
    updateResult({
      ...phase1,
      presentingProblems: mark(phase1.presentingProblems),
      symptoms: mark(phase1.symptoms),
      recentExamples: mark(phase1.recentExamples),
      triggers: mark(phase1.triggers),
      memories: mark(phase1.memories),
      associativeLinks: mark(phase1.associativeLinks ?? []),
      themes: mark(phase1.themes),
      negativeCognitions: mark(phase1.negativeCognitions),
      positiveCognitions: mark(phase1.positiveCognitions),
      internalResources: mark(phase1.internalResources),
      externalResources: mark(phase1.externalResources),
      targetCandidates: mark(phase1.targetCandidates),
      clinicalConsiderations: mark(phase1.clinicalConsiderations),
      summary: selectedIds.has(phase1.summary.id)
        ? { ...phase1.summary, reviewStatus: 'approved' }
        : phase1.summary,
    });
  };

  const localConflicts = useMemo(() => {
    if (!phase1 || !client)
      return [] as Array<{
        kind: string;
        message: string;
        theme?: ClinicalThemeId;
        memoryId?: string;
        existingId?: string;
      }>;
    const out: Array<{
      kind: string;
      message: string;
      theme?: ClinicalThemeId;
      memoryId?: string;
      existingId?: string;
    }> = [];
    const existingPrimary = client.themes.find((t) => t.primary)?.theme;
    for (const t of phase1.themes.filter((x) => isApproved(x.reviewStatus))) {
      if (existingPrimary && t.theme !== existingPrimary && !themeResolutions[t.theme]) {
        out.push({
          kind: 'theme',
          theme: t.theme,
          message: `Existing primary theme: ${CLINICAL_THEME_LABELS[existingPrimary]} · New approved analysis: ${CLINICAL_THEME_LABELS[t.theme]}`,
        });
      }
    }
    for (const m of phase1.memories.filter((x) => isApproved(x.reviewStatus))) {
      const headline = effectiveValue(m);
      const similar = client.memories.find((x) => x.headline.toLowerCase() === headline.toLowerCase());
      if (similar && !memoryResolutions[m.id]) {
        out.push({
          kind: 'memory',
          memoryId: m.id,
          existingId: similar.id,
          message: `Possible duplicate memory: “${headline}” already on the timeline`,
        });
      }
    }
    return out;
  }, [phase1, client, themeResolutions, memoryResolutions]);

  const onApply = async () => {
    if (!result || !analysisId) return;
    if (phase3) {
      setBusy(true);
      setError(null);
      try {
        await saveReviewedAnalysis(analysisId, phase3, 'reviewed');
        const res = await applyToTarget(clientId, {
          clientId,
          analysisId,
          reviewedResult: phase3,
        });
        if (!res.ok) {
          setError(res.error ?? 'Could not apply to target assessment');
          return;
        }
        navigate(`/clients/${clientId}`);
      } catch {
        setError('Could not apply to target assessment');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (phase1 && localConflicts.length) {
      setView('apply-preview');
      setError('Resolve conflicts before applying approved findings.');
      return;
    }
    setBusy(true);
    setError(null);
    setServerConflicts([]);
    try {
      await saveReviewedAnalysis(analysisId, result, 'reviewed');
      const res = await applyFindings(clientId, {
        clientId,
        analysisId,
        structuredResult: result,
        themeConflicts: Object.entries(themeResolutions).map(([theme, resolution]) => ({
          theme: theme as ClinicalThemeId,
          resolution,
        })),
        memoryDuplicates: Object.entries(memoryResolutions).map(([suggestionId, v]) => ({
          suggestionId,
          existingMemoryId: v.existingMemoryId,
          resolution: v.resolution,
        })),
      });
      if (res.needsResolution && res.conflicts?.length) {
        setServerConflicts(res.conflicts);
        setView('apply-preview');
        return;
      }
      if (!res.ok) {
        setError(res.error ?? 'Could not apply findings');
        return;
      }
      navigate(`/clients/${clientId}`);
    } catch {
      setError('Could not apply findings');
    } finally {
      setBusy(false);
    }
  };

  const analyseDisabled =
    !ciReady || busy || !transcript.trim() || !analysisSupported || !auth.isAuthenticated;

  const approvedPreview = useMemo(() => {
    if (!phase1) return null;
    const keep = <T extends { reviewStatus: ReviewStatus }>(items: T[]) =>
      items.filter((i) => isApproved(i.reviewStatus));
    return {
      presentingProblems: keep(phase1.presentingProblems),
      triggers: keep(phase1.triggers),
      memories: keep(phase1.memories),
      themes: keep(phase1.themes),
      resources: [...keep(phase1.internalResources), ...keep(phase1.externalResources)],
      targetCandidates: keep(phase1.targetCandidates),
    };
  }, [phase1]);

  const syntheticForPhase = () => {
    if (phase === 'assessment') setTranscript(SYNTHETIC_PHASE3_TRANSCRIPT);
    else if (phase === 'desensitisation') setTranscript(SYNTHETIC_PHASE4_TRANSCRIPT);
    else setTranscript(SYNTHETIC_TEST_TRANSCRIPT);
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main ci-analyse-page">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to={`/clients/${clientId}`}>{client?.displayName || 'Client'}</Link>
            <span aria-hidden> › </span>
            Clinical Intelligence
          </p>
          <h1>Clinical Intelligence</h1>
          <p className="lede">Client: {client?.displayName || '…'}</p>
        </header>

        {!auth.isAuthenticated && (
          <section className="panel">
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        )}

        {auth.isAuthenticated && view === 'form' && (
          <section className="panel ci-analyse-form">
            <div className="ci-form-row">
              <label className="field">
                <span>Protocol</span>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as 'standard-emdr')}
                >
                  {PROTOCOLS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Phase</span>
                <select value={phase} onChange={(e) => setPhase(e.target.value as typeof phase)}>
                  {PHASES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                      {!p.supported ? ' (not yet supported)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Session Date</span>
                <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </label>
            </div>

            {!phaseMeta.supported && (
              <div className="ci-error-banner" role="status">
                v0.3 supports Standard EMDR Phase 1, Phase 3 Assessment, and Phase 4 Desensitisation.
                Analyse is disabled for this selection.
              </div>
            )}

            {ciReady === false && (
              <div className="ci-error-banner" role="status">
                Clinical Intelligence is not connected. Analyse Transcript is disabled until the
                connection test succeeds.
                <div className="stack-btns horizontal wrap" style={{ marginTop: '0.75rem' }}>
                  <Link className="btn" to="/settings/clinical-intelligence">
                    Open Clinical Intelligence Settings
                  </Link>
                </div>
              </div>
            )}

            <label className="field">
              <span>Paste session transcript</span>
              <textarea
                className="ci-transcript-editor"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={18}
                placeholder="Paste the full session transcript here…"
              />
            </label>

            <div className="stack-btns horizontal wrap">
              <button
                type="button"
                className="btn primary"
                disabled={analyseDisabled}
                onClick={() => void onAnalyse()}
              >
                {busy ? 'Analysing…' : 'Analyse Transcript'}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={syntheticForPhase}
              >
                Load synthetic test transcript
              </button>
            </div>

            {error && (
              <div className="ci-error-banner" role="alert">
                <p>{error}</p>
                <button type="button" className="btn" onClick={() => void onAnalyse()} disabled={busy}>
                  Try Again
                </button>
              </div>
            )}
          </section>
        )}

        {auth.isAuthenticated && result && (view === 'review' || view === 'apply-preview') && (
          <>
            <div className="stack-btns horizontal wrap">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setView('form');
                  setResult(null);
                  setError(null);
                }}
              >
                ← Back to transcript
              </button>
              <button
                type="button"
                className="btn"
                onClick={approveSelected}
                disabled={!phase1 || !selectedIds.size}
              >
                Approve selected
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  if (phase3 || phase4) {
                    void onApply();
                    return;
                  }
                  setView('apply-preview');
                  setError(null);
                }}
              >
                {phase3
                  ? 'Apply to Target Assessment'
                  : phase4
                    ? 'Apply Approved Processing Notes'
                    : 'Apply Approved Findings'}
              </button>
            </div>

            {error && <div className="ci-error-banner">{error}</div>}

            <div className="ci-review-layout">
              <section className="panel ci-transcript-pane" aria-label="Transcript">
                <h2>Transcript</h2>
                <pre className="ci-transcript-pre" ref={transcriptPaneRef}>
                  <TranscriptWithHighlight text={transcript} highlight={highlight} />
                </pre>
                <p className="hint">Use View Evidence to highlight supporting excerpts.</p>
              </section>

              <section className="panel ci-findings-pane" aria-label="Clinical Intelligence">
                <h2>Clinical Intelligence</h2>

                {phase3 && (
                  <Phase3ReviewPanel
                    result={phase3}
                    onChange={(n) => updateResult(n)}
                    onHighlight={setHighlight}
                  />
                )}

                {phase4 && (
                  <Phase4ReviewPanel
                    result={phase4}
                    onChange={(n) => updateResult(n)}
                    onHighlight={setHighlight}
                  />
                )}

                {phase1 && (
                  <>
                <FindingSection title="Information Still Needed">
                  <ul className="ci-needed-list">
                    {(phase1.unansweredQuestions.length
                      ? phase1.unansweredQuestions
                      : ['Not established — model returned no unanswered items']
                    ).map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </FindingSection>

                <FindingSection title="Possible Areas to Clarify">
                  <p className="hint">AI-assisted — not treatment instructions.</p>
                  <ul>
                    {phase1.clarificationSuggestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                    {!phase1.clarificationSuggestions.length && <li className="hint">None</li>}
                  </ul>
                </FindingSection>

                <FindingSection title="Summary">
                  <SuggestionCard
                    title="Session summary"
                    item={phase1.summary}
                    selected={selectedIds.has(phase1.summary.id)}
                    onSelect={(on) => toggleId(setSelectedIds, phase1.summary.id, on)}
                    onStatus={(s, edited) => setCollectionStatus('summary', phase1.summary.id, s, edited)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Presenting Problems">
                  <SuggestionList
                    items={phase1.presentingProblems}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('presentingProblems', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Symptoms / Difficulties">
                  <SuggestionList
                    items={phase1.symptoms}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('symptoms', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Recent Examples">
                  <SuggestionList
                    items={phase1.recentExamples}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('recentExamples', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Current Triggers">
                  <SuggestionList
                    items={phase1.triggers}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('triggers', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Memory Timeline / Earlier Experiences">
                  {phase1.memories.length ? (
                    phase1.memories.map((m) => (
                      <MemoryCard
                        key={m.id}
                        memory={m}
                        selected={selectedIds.has(m.id)}
                        onSelect={(on) => toggleId(setSelectedIds, m.id, on)}
                        onStatus={(s, edited) => setCollectionStatus('memories', m.id, s, edited)}
                        onEvidence={setHighlight}
                      />
                    ))
                  ) : (
                    <p className="hint">Not established</p>
                  )}
                </FindingSection>

                <FindingSection title="Possible Associative Links">
                  <SuggestionList
                    items={phase1.associativeLinks ?? []}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('associativeLinks', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Clinical Themes">
                  {phase1.themes.map((t) => (
                    <ThemeCard
                      key={t.id}
                      theme={t}
                      selected={selectedIds.has(t.id)}
                      onSelect={(on) => toggleId(setSelectedIds, t.id, on)}
                      onStatus={(s) => setCollectionStatus('themes', t.id, s)}
                      onEvidence={setHighlight}
                    />
                  ))}
                  {!phase1.themes.length && <p className="hint">Not established</p>}
                </FindingSection>

                <FindingSection title="Possible NCs">
                  {phase1.negativeCognitions.length ? (
                    phase1.negativeCognitions.map((item) => (
                      <CognitionCard
                        key={item.id}
                        item={item}
                        selected={selectedIds.has(item.id)}
                        onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                        onStatus={(s, e) => setCollectionStatus('negativeCognitions', item.id, s, e)}
                        onEvidence={setHighlight}
                      />
                    ))
                  ) : (
                    <p className="hint">Not established</p>
                  )}
                </FindingSection>

                <FindingSection title="Possible PCs">
                  {phase1.positiveCognitions.length ? (
                    phase1.positiveCognitions.map((item) => (
                      <CognitionCard
                        key={item.id}
                        item={item}
                        selected={selectedIds.has(item.id)}
                        onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                        onStatus={(s, e) => setCollectionStatus('positiveCognitions', item.id, s, e)}
                        onEvidence={setHighlight}
                      />
                    ))
                  ) : (
                    <p className="hint">Not established</p>
                  )}
                </FindingSection>

                <FindingSection title="Internal Resources">
                  <SuggestionList
                    items={phase1.internalResources}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('internalResources', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="External Resources">
                  <SuggestionList
                    items={phase1.externalResources}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('externalResources', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Target Candidates">
                  <SuggestionList
                    items={phase1.targetCandidates}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('targetCandidates', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>

                <FindingSection title="Clinical Considerations">
                  <SuggestionList
                    items={phase1.clinicalConsiderations}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('clinicalConsiderations', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                  </>
                )}
              </section>
            </div>

            {view === 'apply-preview' && approvedPreview && (
              <section className="panel ci-apply-preview">
                <h2>Apply Approved Findings</h2>
                <p>
                  The following approved clinical information will be added or proposed for this
                  client&apos;s record. Existing approved data is not overwritten silently.
                </p>
                <PreviewBlock title="Presenting Problems" items={approvedPreview.presentingProblems.map(effectiveValue)} />
                <PreviewBlock title="Triggers" items={approvedPreview.triggers.map(effectiveValue)} />
                <PreviewBlock title="Memories" items={approvedPreview.memories.map(effectiveValue)} />
                <PreviewBlock
                  title="Clinical Themes"
                  items={approvedPreview.themes.map((t) => CLINICAL_THEME_LABELS[t.theme])}
                />
                <PreviewBlock title="Resources" items={approvedPreview.resources.map(effectiveValue)} />
                <PreviewBlock
                  title="Target Candidates"
                  items={approvedPreview.targetCandidates.map(effectiveValue)}
                />

                {(localConflicts.length > 0 || serverConflicts.length > 0) && (
                  <div className="ci-error-banner">
                    <strong>Possible conflict — choose how to proceed</strong>
                    <ul>
                      {localConflicts.map((c) => (
                        <li key={c.message}>{c.message}</li>
                      ))}
                      {serverConflicts.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                    {localConflicts
                      .filter((c) => c.kind === 'theme' && c.theme)
                      .map((c) => (
                        <label key={c.theme} className="field">
                          <span>{CLINICAL_THEME_LABELS[c.theme!]}</span>
                          <select
                            value={themeResolutions[c.theme!] ?? ''}
                            onChange={(e) =>
                              setThemeResolutions((prev) => ({
                                ...prev,
                                [c.theme!]: e.target.value as
                                  | 'keep-existing'
                                  | 'add-additional'
                                  | 'replace',
                              }))
                            }
                          >
                            <option value="">Select…</option>
                            <option value="keep-existing">Keep Existing</option>
                            <option value="add-additional">Add as Additional Theme</option>
                            <option value="replace">Replace</option>
                          </select>
                        </label>
                      ))}
                    {localConflicts
                      .filter((c) => c.kind === 'memory' && c.memoryId)
                      .map((c) => (
                        <label key={c.memoryId} className="field">
                          <span>Duplicate memory resolution</span>
                          <select
                            value={memoryResolutions[c.memoryId!]?.resolution ?? ''}
                            onChange={(e) =>
                              setMemoryResolutions((prev) => ({
                                ...prev,
                                [c.memoryId!]: {
                                  existingMemoryId: c.existingId || c.memoryId!,
                                  resolution: e.target.value as 'merge' | 'keep-separate',
                                },
                              }))
                            }
                          >
                            <option value="">Select…</option>
                            <option value="merge">Merge</option>
                            <option value="keep-separate">Keep Separate</option>
                          </select>
                        </label>
                      ))}
                  </div>
                )}

                <div className="stack-btns horizontal wrap">
                  <button type="button" className="btn primary" disabled={busy} onClick={() => void onApply()}>
                    {busy ? 'Applying…' : 'Confirm apply'}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setView('review')}>
                    Back to review
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function TranscriptWithHighlight({ text, highlight }: { text: string; highlight: string | null }) {
  if (!highlight) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="ci-evidence-mark">{text.slice(idx, idx + highlight.length)}</mark>
      {text.slice(idx + highlight.length)}
    </>
  );
}

function toggleId(setter: (fn: (prev: Set<string>) => Set<string>) => void, id: string, on: boolean) {
  setter((prev) => {
    const n = new Set(prev);
    if (on) n.add(id);
    else n.delete(id);
    return n;
  });
}

function FindingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ci-finding-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function PreviewBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="ci-preview-block">
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      ) : (
        <p className="hint">None approved</p>
      )}
    </div>
  );
}

function EvidenceList({
  evidence,
  onEvidence,
}: {
  evidence: TranscriptEvidence[];
  onEvidence: (excerpt: string) => void;
}) {
  if (!evidence?.length) return <p className="hint">No evidence excerpts returned</p>;
  return (
    <ul className="ci-evidence-list">
      {evidence.map((e, i) => (
        <li key={`${e.excerpt}-${i}`}>
          <q>{e.excerpt}</q>
          {e.speaker && <span className="hint">({e.speaker})</span>}
          <button type="button" className="btn ghost" onClick={() => onEvidence(e.excerpt)}>
            View Evidence
          </button>
        </li>
      ))}
    </ul>
  );
}

function ReviewActions({
  status,
  onStatus,
}: {
  status: ReviewStatus;
  onStatus: (s: ReviewStatus, edited?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  return (
    <div className="ci-review-actions">
      <span className="hint">Status: {status}</span>
      <button type="button" className="btn" onClick={() => onStatus('approved')}>
        Approve
      </button>
      {!editing ? (
        <button type="button" className="btn" onClick={() => setEditing(true)}>
          Edit
        </button>
      ) : (
        <>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Edited value" />
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onStatus('edited', draft);
              setEditing(false);
            }}
          >
            Save edit
          </button>
        </>
      )}
      <button type="button" className="btn ghost" onClick={() => onStatus('rejected')}>
        Reject
      </button>
    </div>
  );
}

function SuggestionList({
  items,
  selectedIds,
  setSelectedIds,
  onStatus,
  onEvidence,
}: {
  items: ClinicalSuggestion[];
  selectedIds: Set<string>;
  setSelectedIds: (fn: (prev: Set<string>) => Set<string>) => void;
  onStatus: (id: string, s: ReviewStatus, edited?: string) => void;
  onEvidence: (excerpt: string) => void;
}) {
  if (!items.length) return <p className="hint">Not established</p>;
  return (
    <>
      {items.map((item) => (
        <SuggestionCard
          key={item.id}
          title={effectiveValue(item)}
          item={item}
          selected={selectedIds.has(item.id)}
          onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
          onStatus={(s, e) => onStatus(item.id, s, e)}
          onEvidence={onEvidence}
        />
      ))}
    </>
  );
}

function SuggestionCard({
  title,
  item,
  selected,
  onSelect,
  onStatus,
  onEvidence,
}: {
  title: string;
  item: ClinicalSuggestion;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onStatus: (s: ReviewStatus, edited?: string) => void;
  onEvidence: (excerpt: string) => void;
}) {
  return (
    <article className={`ci-finding-card status-${item.reviewStatus}`}>
      <label className="ci-select">
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
        Select
      </label>
      <h4>{title}</h4>
      <p>
        Confidence: {item.confidence} · Evidence level: {item.evidenceLevel}
      </p>
      <EvidenceList evidence={item.evidence} onEvidence={onEvidence} />
      <ReviewActions status={item.reviewStatus} onStatus={onStatus} />
    </article>
  );
}

function MemoryCard({
  memory,
  selected,
  onSelect,
  onStatus,
  onEvidence,
}: {
  memory: MemorySuggestion;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onStatus: (s: ReviewStatus, edited?: string) => void;
  onEvidence: (excerpt: string) => void;
}) {
  return (
    <article className={`ci-finding-card status-${memory.reviewStatus}`}>
      <label className="ci-select">
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
        Select
      </label>
      <h4>{memory.headline}</h4>
      <p>
        {memory.approximateAge != null ? `Age ~${memory.approximateAge} · ` : ''}
        Confidence: {memory.confidence} · Evidence level: {memory.evidenceLevel}
      </p>
      {memory.description && <p>{memory.description}</p>}
      {memory.possibleTouchstoneCandidate && (
        <p className="hint">Possible touchstone candidate (requires therapist confirmation)</p>
      )}
      <EvidenceList evidence={memory.evidence} onEvidence={onEvidence} />
      <ReviewActions status={memory.reviewStatus} onStatus={onStatus} />
    </article>
  );
}

function ThemeCard({
  theme,
  selected,
  onSelect,
  onStatus,
  onEvidence,
}: {
  theme: ClinicalThemeAnalysis;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onStatus: (s: ReviewStatus) => void;
  onEvidence: (excerpt: string) => void;
}) {
  return (
    <article className={`ci-finding-card status-${theme.reviewStatus}`}>
      <label className="ci-select">
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
        Select
      </label>
      <h4>{CLINICAL_THEME_LABELS[theme.theme]}</h4>
      <p>
        Confidence: {theme.confidence} · Evidence level: {theme.evidenceLevel}
      </p>
      <p>
        <strong>Why this may fit</strong>
        <br />
        {theme.reasoning}
      </p>
      <EvidenceList evidence={theme.evidence} onEvidence={onEvidence} />
      <ReviewActions status={theme.reviewStatus} onStatus={onStatus} />
    </article>
  );
}

function CognitionCard({
  item,
  selected,
  onSelect,
  onStatus,
  onEvidence,
}: {
  item: CognitionSuggestion;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onStatus: (s: ReviewStatus, edited?: string) => void;
  onEvidence: (excerpt: string) => void;
}) {
  return (
    <article className={`ci-finding-card status-${item.reviewStatus}`}>
      <label className="ci-select">
        <input type="checkbox" checked={selected} onChange={(e) => onSelect(e.target.checked)} />
        Select
      </label>
      <h4>
        {item.kind === 'explicit' ? 'Explicit' : 'Suggested'}{' '}
        {item.polarity === 'negative' ? 'NC' : 'PC'}
      </h4>
      <p>{effectiveValue(item)}</p>
      <p>
        Confidence: {item.confidence} · Evidence level: {item.evidenceLevel}
      </p>
      <EvidenceList evidence={item.evidence} onEvidence={onEvidence} />
      <ReviewActions status={item.reviewStatus} onStatus={onStatus} />
    </article>
  );
}
