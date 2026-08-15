import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import {
  CLINICAL_THEME_LABELS,
  type ClinicalSuggestion,
  type ClinicalThemeAnalysis,
  type ClinicalThemeId,
  type CognitionSuggestion,
  type MemorySuggestion,
  type ReviewStatus,
  type TranscriptAnalysis,
  type TranscriptEvidence,
} from './types';
import {
  SYNTHETIC_TEST_TRANSCRIPT,
  analyseTranscript,
  applyFindings,
  fetchCIStatus,
  getClient,
} from './lib/api';

type Phase = 'form' | 'review' | 'apply-preview';

function effectiveValue<T>(item: ClinicalSuggestion<T> | MemorySuggestion): string {
  if ('therapistEditedValue' in item && item.reviewStatus === 'edited' && item.therapistEditedValue) {
    return String(item.therapistEditedValue);
  }
  if ('headline' in item) return item.headline;
  return String((item as ClinicalSuggestion<string>).value);
}

function patchSuggestionStatus<T extends { id: string; reviewStatus: ReviewStatus }>(
  items: T[],
  id: string,
  status: ReviewStatus,
  edited?: string,
): T[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    if (status === 'edited') {
      const asRecord = item as T & {
        value?: string;
        headline?: string;
        originalAIValue?: string;
        therapistEditedValue?: string;
      };
      const original = asRecord.value ?? asRecord.headline ?? '';
      return {
        ...item,
        reviewStatus: 'edited',
        originalAIValue: original,
        therapistEditedValue: edited,
        ...(asRecord.value !== undefined ? { value: edited ?? asRecord.value } : {}),
        ...(asRecord.headline !== undefined ? { headline: edited ?? asRecord.headline } : {}),
      };
    }
    return { ...item, reviewStatus: status };
  });
}

export function AnalyseTranscriptPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('Client');
  const [ciReady, setCiReady] = useState<boolean | null>(null);
  const [protocol] = useState<'standard-emdr'>('standard-emdr');
  const [phase] = useState<'history'>('history');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transcript, setTranscript] = useState('');
  const [phaseView, setPhaseView] = useState<Phase>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptAnalysis | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [themeResolutions, setThemeResolutions] = useState<
    Record<string, 'keep-existing' | 'add-additional' | 'replace'>
  >({});
  const [memoryResolutions, setMemoryResolutions] = useState<
    Record<string, { existingMemoryId: string; resolution: 'merge' | 'keep-separate' }>
  >({});
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId).then((c) => setClientName(c.displayName));
    void fetchCIStatus()
      .then((s) => setCiReady(s.configured))
      .catch(() => setCiReady(false));
  }, [auth.isAuthenticated, clientId]);

  const highlightedTranscript = useMemo(() => {
    if (!highlight || !transcript) return transcript;
    const idx = transcript.toLowerCase().indexOf(highlight.toLowerCase());
    if (idx < 0) return transcript;
    return (
      transcript.slice(0, idx) +
      '⟦' +
      transcript.slice(idx, idx + highlight.length) +
      '⟧' +
      transcript.slice(idx + highlight.length)
    );
  }, [transcript, highlight]);

  const onAnalyse = async () => {
    setBusy(true);
    setError(null);
    setApplyMessage(null);
    try {
      const res = await analyseTranscript({
        clientId,
        protocol,
        phase,
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
      setPhaseView('review');
      setSelectedIds(new Set());
    } catch {
      setError(
        'Clinical Intelligence could not analyse this transcript. The transcript has been preserved.',
      );
    } finally {
      setBusy(false);
    }
  };

  const updateResult = (next: TranscriptAnalysis) => setResult(next);

  const setItemStatus = (
    collection:
      | 'presentingProblems'
      | 'symptoms'
      | 'recentExamples'
      | 'triggers'
      | 'internalResources'
      | 'externalResources'
      | 'targetCandidates'
      | 'clinicalConsiderations'
      | 'negativeCognitions'
      | 'positiveCognitions',
    id: string,
    status: ReviewStatus,
    edited?: string,
  ) => {
    if (!result) return;
    updateResult({
      ...result,
      [collection]: patchSuggestionStatus(result[collection] as ClinicalSuggestion[], id, status, edited),
    } as TranscriptAnalysis);
  };

  const setMemoryStatus = (id: string, status: ReviewStatus, edited?: string) => {
    if (!result) return;
    updateResult({
      ...result,
      memories: patchSuggestionStatus(result.memories, id, status, edited) as MemorySuggestion[],
    });
  };

  const setThemeStatus = (id: string, status: ReviewStatus) => {
    if (!result) return;
    updateResult({
      ...result,
      themes: result.themes.map((t) => (t.id === id ? { ...t, reviewStatus: status } : t)),
    });
  };

  const approveSelected = () => {
    if (!result || !selectedIds.size) return;
    const mark = <T extends { id: string; reviewStatus: ReviewStatus }>(items: T[]) =>
      items.map((i) => (selectedIds.has(i.id) && i.reviewStatus === 'pending' ? { ...i, reviewStatus: 'approved' as const } : i));
    updateResult({
      ...result,
      presentingProblems: mark(result.presentingProblems),
      symptoms: mark(result.symptoms),
      recentExamples: mark(result.recentExamples),
      triggers: mark(result.triggers),
      memories: mark(result.memories),
      themes: mark(result.themes),
      negativeCognitions: mark(result.negativeCognitions),
      positiveCognitions: mark(result.positiveCognitions),
      internalResources: mark(result.internalResources),
      externalResources: mark(result.externalResources),
      targetCandidates: mark(result.targetCandidates),
      clinicalConsiderations: mark(result.clinicalConsiderations),
      summary: selectedIds.has(result.summary.id)
        ? { ...result.summary, reviewStatus: 'approved' }
        : result.summary,
    });
  };

  const approvedPreview = useMemo(() => {
    if (!result) return null;
    const keep = <T extends { reviewStatus: ReviewStatus }>(items: T[]) =>
      items.filter((i) => i.reviewStatus === 'approved' || i.reviewStatus === 'edited');
    return {
      presentingProblems: keep(result.presentingProblems),
      triggers: keep(result.triggers),
      memories: keep(result.memories),
      themes: keep(result.themes),
      resources: [...keep(result.internalResources), ...keep(result.externalResources)],
      targetCandidates: keep(result.targetCandidates),
    };
  }, [result]);

  const onApply = async () => {
    if (!result || !analysisId) return;
    setBusy(true);
    setError(null);
    setConflicts([]);
    try {
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
        setConflicts(res.conflicts);
        setPhaseView('apply-preview');
        return;
      }
      if (!res.ok) {
        setError(res.error ?? 'Could not apply findings');
        return;
      }
      setApplyMessage('Approved findings applied to the client record.');
      navigate(`/clients/${clientId}`);
    } catch {
      setError('Could not apply findings');
    } finally {
      setBusy(false);
    }
  };

  const analyseDisabled = !ciReady || busy || !transcript.trim() || phase !== 'history';

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main ci-analyse-page">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to={`/clients/${clientId}`}>{clientName}</Link>
            <span aria-hidden> › </span>
            Clinical Intelligence
          </p>
          <h1>Clinical Intelligence</h1>
          <p className="lede">Client: {clientName}</p>
        </header>

        {!auth.isAuthenticated && (
          <section className="panel">
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        )}

        {auth.isAuthenticated && phaseView === 'form' && (
          <section className="panel ci-analyse-form">
            <div className="ci-form-row">
              <label className="field">
                <span>Protocol</span>
                <select value={protocol} disabled>
                  <option value="standard-emdr">Standard EMDR</option>
                </select>
              </label>
              <label className="field">
                <span>Phase</span>
                <select value={phase} disabled>
                  <option value="history">History / Treatment Planning</option>
                </select>
              </label>
              <label className="field">
                <span>Session Date</span>
                <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </label>
            </div>

            {ciReady === false && (
              <div className="ci-error-banner" role="status">
                Clinical Intelligence is not connected. Analyse Transcript is disabled until the
                connection test succeeds in Settings.
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
                onClick={() => setTranscript(SYNTHETIC_TEST_TRANSCRIPT)}
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

        {auth.isAuthenticated && result && (phaseView === 'review' || phaseView === 'apply-preview') && (
          <>
            <div className="stack-btns horizontal wrap">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setPhaseView('form');
                  setResult(null);
                  setError(null);
                }}
              >
                ← Back to transcript
              </button>
              <button type="button" className="btn" onClick={approveSelected} disabled={!selectedIds.size}>
                Approve selected
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => setPhaseView('apply-preview')}
              >
                Apply Approved Findings
              </button>
            </div>

            {error && <div className="ci-error-banner">{error}</div>}

            <div className="ci-review-layout">
              <section className="panel ci-transcript-pane" aria-label="Transcript">
                <h2>Transcript</h2>
                <pre className="ci-transcript-pre">{highlightedTranscript}</pre>
                <p className="hint">Evidence excerpts are marked with ⟦ ⟧ when you choose View Evidence.</p>
              </section>

              <section className="panel ci-findings-pane" aria-label="Clinical Intelligence">
                <h2>Clinical Intelligence</h2>

                <FindingSection title="Information Still Needed">
                  <ul className="ci-needed-list">
                    {result.unansweredQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                    {!result.unansweredQuestions.length && <li>None listed by the model</li>}
                  </ul>
                </FindingSection>

                <FindingSection title="Possible Areas to Clarify">
                  <p className="hint">AI-assisted — not treatment instructions.</p>
                  <ul>
                    {result.clarificationSuggestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </FindingSection>

                <FindingSection title="Summary">
                  <SuggestionCard
                    title="Session summary"
                    item={result.summary}
                    selected={selectedIds.has(result.summary.id)}
                    onSelect={(on) =>
                      setSelectedIds((prev) => {
                        const n = new Set(prev);
                        if (on) n.add(result.summary.id);
                        else n.delete(result.summary.id);
                        return n;
                      })
                    }
                    onStatus={(s, edited) =>
                      updateResult({
                        ...result,
                        summary: {
                          ...result.summary,
                          reviewStatus: s,
                          ...(s === 'edited'
                            ? {
                                originalAIValue: result.summary.value,
                                therapistEditedValue: edited,
                                value: edited ?? result.summary.value,
                              }
                            : {}),
                        },
                      })
                    }
                    onEvidence={(ex) => setHighlight(ex)}
                  />
                </FindingSection>

                <FindingSection title="Presenting Problems">
                  {result.presentingProblems.map((item) => (
                    <SuggestionCard
                      key={item.id}
                      title={effectiveValue(item)}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                      onStatus={(s, edited) => setItemStatus('presentingProblems', item.id, s, edited)}
                      onEvidence={(ex) => setHighlight(ex)}
                    />
                  ))}
                </FindingSection>

                <FindingSection title="Triggers">
                  {result.triggers.map((item) => (
                    <SuggestionCard
                      key={item.id}
                      title={effectiveValue(item)}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                      onStatus={(s, edited) => setItemStatus('triggers', item.id, s, edited)}
                      onEvidence={(ex) => setHighlight(ex)}
                    />
                  ))}
                </FindingSection>

                <FindingSection title="Memories">
                  {result.memories.map((m) => (
                    <MemoryCard
                      key={m.id}
                      memory={m}
                      selected={selectedIds.has(m.id)}
                      onSelect={(on) => toggleId(setSelectedIds, m.id, on)}
                      onStatus={(s, edited) => setMemoryStatus(m.id, s, edited)}
                      onEvidence={(ex) => setHighlight(ex)}
                    />
                  ))}
                </FindingSection>

                <FindingSection title="Clinical Themes">
                  {result.themes.map((t) => (
                    <ThemeCard
                      key={t.id}
                      theme={t}
                      selected={selectedIds.has(t.id)}
                      onSelect={(on) => toggleId(setSelectedIds, t.id, on)}
                      onStatus={(s) => setThemeStatus(t.id, s)}
                      onEvidence={(ex) => setHighlight(ex)}
                    />
                  ))}
                </FindingSection>

                <FindingSection title="Negative Cognitions">
                  {result.negativeCognitions.map((item) => (
                    <CognitionCard
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                      onStatus={(s, edited) => setItemStatus('negativeCognitions', item.id, s, edited)}
                      onEvidence={(ex) => setHighlight(ex)}
                    />
                  ))}
                </FindingSection>

                <FindingSection title="Positive Cognitions">
                  {result.positiveCognitions.length ? (
                    result.positiveCognitions.map((item) => (
                      <CognitionCard
                        key={item.id}
                        item={item}
                        selected={selectedIds.has(item.id)}
                        onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                        onStatus={(s, edited) => setItemStatus('positiveCognitions', item.id, s, edited)}
                        onEvidence={(ex) => setHighlight(ex)}
                      />
                    ))
                  ) : (
                    <p className="hint">Not established</p>
                  )}
                </FindingSection>

                <FindingSection title="Resources">
                  {[...result.internalResources.map((r) => ({ ...r, _k: 'internal' as const })), ...result.externalResources.map((r) => ({ ...r, _k: 'external' as const }))].map(
                    (item) => (
                      <SuggestionCard
                        key={item.id}
                        title={`${item._k}: ${effectiveValue(item)}`}
                        item={item}
                        selected={selectedIds.has(item.id)}
                        onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                        onStatus={(s, edited) =>
                          setItemStatus(
                            item._k === 'internal' ? 'internalResources' : 'externalResources',
                            item.id,
                            s,
                            edited,
                          )
                        }
                        onEvidence={(ex) => setHighlight(ex)}
                      />
                    ),
                  )}
                </FindingSection>

                <FindingSection title="Target Candidates">
                  {result.targetCandidates.map((item) => (
                    <SuggestionCard
                      key={item.id}
                      title={effectiveValue(item)}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      onSelect={(on) => toggleId(setSelectedIds, item.id, on)}
                      onStatus={(s, edited) => setItemStatus('targetCandidates', item.id, s, edited)}
                      onEvidence={(ex) => setHighlight(ex)}
                    />
                  ))}
                </FindingSection>
              </section>
            </div>

            {phaseView === 'apply-preview' && approvedPreview && (
              <section className="panel ci-apply-preview">
                <h2>Apply Approved Findings</h2>
                <p>
                  The following approved clinical information will be added or proposed for this
                  client&apos;s record.
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

                {conflicts.length > 0 && (
                  <div className="ci-error-banner">
                    <strong>Possible conflict</strong>
                    <ul>
                      {conflicts.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                    <p className="hint">
                      Choose Keep Existing / Add as Additional Theme / Replace for theme conflicts,
                      or Merge / Keep Separate for duplicate memories, then try again.
                    </p>
                    {approvedPreview.themes.map((t) => (
                      <label key={t.id} className="field">
                        <span>{CLINICAL_THEME_LABELS[t.theme]} resolution</span>
                        <select
                          value={themeResolutions[t.theme] ?? ''}
                          onChange={(e) =>
                            setThemeResolutions((prev) => ({
                              ...prev,
                              [t.theme]: e.target.value as 'keep-existing' | 'add-additional' | 'replace',
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
                    {approvedPreview.memories.map((m) => (
                      <label key={m.id} className="field">
                        <span>Memory “{m.headline}” if duplicate</span>
                        <select
                          value={memoryResolutions[m.id]?.resolution ?? ''}
                          onChange={(e) =>
                            setMemoryResolutions((prev) => ({
                              ...prev,
                              [m.id]: {
                                existingMemoryId: prev[m.id]?.existingMemoryId || m.id,
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
                  <button type="button" className="btn ghost" onClick={() => setPhaseView('review')}>
                    Back to review
                  </button>
                </div>
                {applyMessage && <p className="ci-success-banner">{applyMessage}</p>}
              </section>
            )}
          </>
        )}
      </main>
    </div>
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
        <button
          type="button"
          className="btn"
          onClick={() => {
            setEditing(true);
          }}
        >
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
        {item.kind === 'explicit' ? 'Explicit' : 'Suggested'} {item.polarity === 'negative' ? 'NC' : 'PC'}
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
