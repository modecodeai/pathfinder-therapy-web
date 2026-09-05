import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  type TranscriptAnalysis,
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
  patchClient,
  saveReviewedAnalysis,
} from './lib/api';
import { Phase3ReviewPanel } from './components/Phase3ReviewPanel';
import { Phase4ReviewPanel } from './components/Phase4ReviewPanel';
import { CompactFindingCard } from './components/CompactFindingCard';
import { ClinicalContextBar } from './components/ClinicalContextBar';
import { ClinicalCycleRail } from './components/ClinicalCycleRail';
import {
  debriefHref,
  markAnalysisStarted,
  markFindingsAwaitingReview,
  markFindingsReviewed,
  markTranscriptDraft,
} from './lib/clinicalCycle';
import {
  PRIMARY_APPROACH_LABELS,
  LENS_ID_LABELS,
  type PrimaryTreatmentApproach,
  type ReasoningMode,
} from './clinicalReasoning';
import {
  REASONING_MODE_LABELS,
  LENS_RELEVANCE_LABELS,
  approachToProtocol,
  approachToPrimaryLens,
  ensureLensGovernance,
  inferPrimaryApproach,
  resolveSessionAnalysisPlan,
} from './lib/lensGovernance';


type View = 'form' | 'review' | 'apply-preview';
type ReviewFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'memories'
  | 'themes'
  | 'nc-pc'
  | 'targets'
  | 'resources';

const PHASES = [
  { id: 'history', label: 'Phase 1 — History / Treatment Planning', supported: true },
  { id: 'formulation', label: 'Formulation (Core / TA)', supported: true },
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
  const [searchParams] = useSearchParams();
  const finishFlow = searchParams.get('finish') === '1';
  const sessionIdParam = searchParams.get('sessionId');
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [ciReady, setCiReady] = useState<boolean | null>(null);
  const [protocol, setProtocol] = useState<
    'standard-emdr' | 'general-psychotherapy' | 'transactional-analysis' | 'integrated'
  >(() => {
    const p = searchParams.get('protocol');
    if (
      p === 'transactional-analysis' ||
      p === 'integrated' ||
      p === 'general-psychotherapy' ||
      p === 'standard-emdr'
    ) {
      return p;
    }
    return 'general-psychotherapy';
  });
  const [clinicalLens, setClinicalLens] = useState<'integrated' | 'emdr' | 'transactional-analysis'>(
    () => {
      const l = searchParams.get('lens');
      if (l === 'emdr' || l === 'transactional-analysis' || l === 'integrated') return l;
      return 'integrated';
    },
  );
  const [primaryApproach, setPrimaryApproach] = useState<PrimaryTreatmentApproach>('unspecified');
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>(() => {
    const m = searchParams.get('mode');
    if (
      m === 'integrated' ||
      m === 'core-only' ||
      m === 'choose-lenses' ||
      m === 'primary-lens-only'
    ) {
      return m;
    }
    return 'primary-lens-only';
  });
  const [exploreEmdr, setExploreEmdr] = useState(searchParams.get('exploreEmdr') === '1');
  const [phase, setPhase] = useState<(typeof PHASES)[number]['id']>('history');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [transcript, setTranscript] = useState('');
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
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
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const transcriptPaneRef = useRef<HTMLPreElement>(null);

  const phaseMeta = PHASES.find((p) => p.id === phase) ?? PHASES[0];
  const analysisPlan = client
    ? resolveSessionAnalysisPlan({
        client,
        reasoningMode,
        clinicalLens: exploreEmdr ? 'emdr' : clinicalLens,
        exploreEmdr,
      })
    : null;
  const analysisSupported =
    phaseMeta.supported &&
    !(
      (analysisPlan?.runEmdr || clinicalLens === 'emdr' || protocol === 'standard-emdr') &&
      phase === 'formulation'
    ) &&
    !(
      (analysisPlan?.runTa && !analysisPlan?.runEmdr) &&
      (phase === 'assessment' || phase === 'desensitisation')
    );
  const phase1 = result?.analysisKind === 'phase1-history' ? result : null;
  const phase3 = result?.analysisKind === 'phase3-assessment' ? result : null;
  const phase4 = result?.analysisKind === 'phase4-desensitisation' ? result : null;
  const taResult = result?.analysisKind === 'ta-formulation' ? result : null;

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId).then((c) => {
      const governed = ensureLensGovernance(c);
      setClient(governed);
      const approach = inferPrimaryApproach(governed);
      setPrimaryApproach(approach);
      // Do NOT default to EMDR — follow client primary approach
      if (!searchParams.get('protocol') && !searchParams.get('lens')) {
        const proto = approachToProtocol(approach);
        setProtocol(proto);
        const lens = approachToPrimaryLens(approach);
        setClinicalLens(lens);
        if (lens === 'transactional-analysis' || approach === 'unspecified') {
          setPhase('formulation');
        }
      }
      const draftText = governed.activeCycle?.drafts?.transcript;
      if (draftText && !transcript) {
        setTranscript(draftText);
        setDraftStatus('saved');
      }
      if (governed.activeCycle?.sessionDate) setSessionDate(governed.activeCycle.sessionDate);
    });
    void fetchCIStatus()
      .then((s) => setCiReady(s.configured))
      .catch(() => setCiReady(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore draft once on load
  }, [auth.isAuthenticated, clientId]);

  useEffect(() => {
    if (!client || !auth.isAuthenticated) return;
    if (!transcript.trim() && !client.activeCycle?.drafts?.transcript) return;
    setDraftStatus('unsaved');
    const t = window.setTimeout(() => {
      setDraftStatus('saving');
      const next = markTranscriptDraft(client, transcript);
      void patchClient(clientId, {
        activeCycle: next.activeCycle,
        sessionTimeline: next.sessionTimeline,
      })
        .then((res) => {
          if (res.client) setClient(res.client);
          setDraftStatus('saved');
        })
        .catch(() => setDraftStatus('unsaved'));
    }, 900);
    return () => window.clearTimeout(t);
  }, [transcript]); // intentionally transcript-driven autosave

  useEffect(() => {
    if (!highlight || !transcriptPaneRef.current) return;
    const mark = transcriptPaneRef.current.querySelector('mark');
    mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight]);

  const activeSessionId =
    sessionIdParam || client?.activeCycle?.sessionId || undefined;

  const onAnalyse = async () => {
    if (!analysisSupported) return;
    setBusy(true);
    setError(null);
    try {
      const plan = client
        ? resolveSessionAnalysisPlan({
            client,
            reasoningMode,
            clinicalLens: exploreEmdr ? 'emdr' : clinicalLens,
            exploreEmdr,
          })
        : null;
      const useTaPath = plan ? plan.runTa && !plan.runEmdr : clinicalLens === 'transactional-analysis';
      const res = await analyseTranscript({
        clientId,
        protocol: plan?.protocol ?? protocol,
        phase: useTaPath
          ? 'formulation'
          : (phase as 'history' | 'assessment' | 'desensitisation'),
        clinicalLens: plan?.clinicalLens ?? clinicalLens,
        reasoningMode: plan?.reasoningMode ?? reasoningMode,
        primaryApproach: plan?.primaryApproach ?? primaryApproach,
        exploreEmdr,
        transcript,
        sessionDate,
        sessionId: activeSessionId,
      });
      if (!res.success || !res.structuredResult) {
        setError(
          res.error ??
            'Clinical Reasoning could not analyse this transcript. The transcript has been preserved.',
        );
        return;
      }
      setResult(res.structuredResult);
      setAnalysisId(res.analysis?.id ?? null);
      setView('review');
      setSelectedIds(new Set());
      setHighlight(null);
      if (client && res.analysis?.id) {
        let next = markAnalysisStarted(client, res.analysis.id);
        next = markFindingsAwaitingReview(next);
        const cyclePrimary =
          primaryApproach === 'transactional-analysis'
            ? ('transactional-analysis' as const)
            : primaryApproach === 'emdr' || primaryApproach === 'pain'
              ? ('emdr' as const)
              : primaryApproach === 'general-integrative'
                ? ('general-psychotherapy' as const)
                : ('integrated' as const);
        const cycle: typeof next.activeCycle = next.activeCycle
          ? {
              ...next.activeCycle,
              primaryApproach: cyclePrimary,
              secondaryLenses: exploreEmdr
                ? (['emdr'] as import('./clinicalReasoning').LensId[])
                : next.activeCycle.secondaryLenses,
            }
          : next.activeCycle;
        void patchClient(clientId, {
          activeCycle: cycle,
          sessionTimeline: next.sessionTimeline,
          primaryTreatmentApproach: primaryApproach,
        }).then((r) => {
          if (r.client) setClient(ensureLensGovernance(r.client));
        });
      } else {
        void getClient(clientId).then((c) => setClient(ensureLensGovernance(c)));
      }
    } catch {
      setError(
        'Clinical Reasoning could not analyse this transcript. The transcript has been preserved.',
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
        if (client) {
          const next = markFindingsReviewed(client, analysisId);
          await patchClient(clientId, {
            activeCycle: next.activeCycle,
            sessionTimeline: next.sessionTimeline,
          });
        }
        navigate(
          debriefHref(clientId, activeSessionId || client?.activeCycle?.sessionId || 'unknown', {
            analysisId,
          }),
        );
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
      if (client) {
        const next = markFindingsReviewed(client, analysisId);
        await patchClient(clientId, {
          activeCycle: next.activeCycle,
          sessionTimeline: next.sessionTimeline,
        });
      }
      navigate(
        debriefHref(clientId, activeSessionId || client?.activeCycle?.sessionId || 'unknown', {
          analysisId,
        }),
      );
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

  const statusFilter = (status: ReviewStatus) => {
    if (reviewFilter === 'pending') return status === 'pending';
    if (reviewFilter === 'approved') return status === 'approved' || status === 'edited';
    if (reviewFilter === 'rejected') return status === 'rejected';
    return true;
  };

  const showCat = (cat: ReviewFilter) =>
    reviewFilter === 'all' ||
    reviewFilter === 'pending' ||
    reviewFilter === 'approved' ||
    reviewFilter === 'rejected' ||
    reviewFilter === cat;

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="clients" />
      <main className="practice-main ci-analyse-page">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to={`/clients/${clientId}`}>{client?.displayName || 'Client'}</Link>
            <span aria-hidden> › </span>
            Clinical Reasoning
          </p>
          <h1>Clinical Reasoning</h1>
          <p className="lede">Client: {client?.displayName || '…'}</p>
        </header>

        {client && (
          <>
            <ClinicalContextBar
              clientName={client.displayName}
              clientId={client.id}
              cycle={client.activeCycle}
              draftStatus={draftStatus}
            />
            <ClinicalCycleRail cycle={client.activeCycle} />
          </>
        )}

        {finishFlow && auth.isAuthenticated && view === 'form' && (
          <section className="pf-surface-card session-finish-banner">
            <h2>Finish session</h2>
            <p>
              Paste the transcript below → Analyse Transcript → review findings → Continue to
              Debrief. Or skip AI and use a manual debrief.
            </p>
            {activeSessionId && (
              <p className="pf-meta">Session ID: {activeSessionId}</p>
            )}
            <Link
              className="btn tertiary"
              to={debriefHref(clientId, activeSessionId || 'manual', { manual: true })}
            >
              Finish without transcript (manual debrief)
            </Link>
          </section>
        )}

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
                <span>Clinical frame — Primary approach</span>
                <select
                  value={primaryApproach}
                  onChange={(e) => {
                    const next = e.target.value as PrimaryTreatmentApproach;
                    setPrimaryApproach(next);
                    const proto = approachToProtocol(next);
                    setProtocol(proto);
                    const lens = approachToPrimaryLens(next);
                    setClinicalLens(lens);
                    if (lens === 'transactional-analysis' || next === 'unspecified') {
                      setPhase('formulation');
                    }
                    setExploreEmdr(false);
                  }}
                >
                  {(Object.keys(PRIMARY_APPROACH_LABELS) as PrimaryTreatmentApproach[]).map(
                    (id) => (
                      <option key={id} value={id}>
                        {PRIMARY_APPROACH_LABELS[id]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="field">
                <span>Reasoning mode</span>
                <select
                  value={reasoningMode}
                  onChange={(e) => {
                    const next = e.target.value as ReasoningMode;
                    setReasoningMode(next);
                    if (next === 'core-only') {
                      setClinicalLens('integrated');
                      setPhase('formulation');
                      setExploreEmdr(false);
                    } else if (next === 'integrated') {
                      setClinicalLens('integrated');
                    } else if (next === 'primary-lens-only') {
                      setClinicalLens(approachToPrimaryLens(primaryApproach));
                    }
                  }}
                >
                  {(Object.keys(REASONING_MODE_LABELS) as ReasoningMode[]).map((id) => (
                    <option key={id} value={id}>
                      {REASONING_MODE_LABELS[id]}
                    </option>
                  ))}
                </select>
              </label>
              {(primaryApproach === 'emdr' ||
                primaryApproach === 'pain' ||
                exploreEmdr ||
                clinicalLens === 'emdr') && (
                <label className="field">
                  <span>EMDR phase</span>
                  <select value={phase} onChange={(e) => setPhase(e.target.value as typeof phase)}>
                    {PHASES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                        {!p.supported ? ' (not yet supported)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                <span>Session Date</span>
                <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </label>
            </div>
            <p className="pf-meta">
              Current approach: {PRIMARY_APPROACH_LABELS[primaryApproach]}. Pathfinder never
              auto-applies EMDR — use Explore with EMDR lens when needed.
            </p>
            {primaryApproach !== 'emdr' && primaryApproach !== 'pain' && (
              <div className="stack-btns horizontal wrap" style={{ marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn ${exploreEmdr ? 'primary' : 'tertiary'}`}
                  onClick={() => {
                    setExploreEmdr(true);
                    setClinicalLens('emdr');
                    setPhase('history');
                    setProtocol('standard-emdr');
                  }}
                >
                  Explore with EMDR lens
                </button>
                {exploreEmdr && (
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => {
                      setExploreEmdr(false);
                      setClinicalLens(approachToPrimaryLens(primaryApproach));
                      setProtocol(approachToProtocol(primaryApproach));
                      setPhase('formulation');
                    }}
                  >
                    Cancel EMDR explore
                  </button>
                )}
              </div>
            )}

            {!phaseMeta.supported && (
              <div className="ci-error-banner" role="status">
                v0.3 supports Standard EMDR Phase 1, Phase 3 Assessment, and Phase 4 Desensitisation.
                Analyse is disabled for this selection.
              </div>
            )}

            {ciReady === false && (
              <div className="ci-error-banner" role="status">
                Clinical Reasoning is not connected. Analyse Transcript is disabled until the
                connection test succeeds.
                <div className="stack-btns horizontal wrap" style={{ marginTop: '0.75rem' }}>
                  <Link className="btn" to="/settings/clinical-intelligence">
                    Open Clinical Reasoning Settings
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
            <div className="ci-sticky-toolbar stack-btns horizontal wrap">
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
              {taResult && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const approveAll = <T extends { reviewStatus: string }>(items: T[]): T[] =>
                      items.map((i) =>
                        i.reviewStatus === 'pending' ? { ...i, reviewStatus: 'approved' } : i,
                      );
                    updateResult({
                      ...taResult,
                      summary: {
                        ...taResult.summary,
                        reviewStatus:
                          taResult.summary.reviewStatus === 'pending'
                            ? 'approved'
                            : taResult.summary.reviewStatus,
                      },
                      egoStates: approveAll(taResult.egoStates),
                      drivers: approveAll(taResult.drivers),
                      injunctionHypotheses: approveAll(taResult.injunctionHypotheses),
                      scriptMessages: approveAll(taResult.scriptMessages),
                      lifePositions: approveAll(taResult.lifePositions),
                      transactions: approveAll(taResult.transactions),
                      gamePatterns: approveAll(taResult.gamePatterns),
                      racketSystems: approveAll(taResult.racketSystems),
                      discounting: approveAll(taResult.discounting),
                      redecisionAreas: approveAll(taResult.redecisionAreas),
                    });
                  }}
                >
                  Approve all TA suggestions
                </button>
              )}
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  if (phase3 || phase4 || taResult) {
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
                    : taResult
                      ? 'Apply Approved TA Findings'
                      : 'Apply Approved Findings'}
              </button>
              <Link className="btn ghost" to={`/clients/${clientId}/clinical-reasoning`}>
                Open Clinical Reasoning
              </Link>
            </div>

            {error && <div className="ci-error-banner">{error}</div>}

            {phase1 && (
              <div className="ci-review-filters" role="toolbar" aria-label="Finding filters">
                {(
                  [
                    ['all', 'All'],
                    ['pending', 'Pending'],
                    ['approved', 'Approved'],
                    ['rejected', 'Rejected'],
                    ['memories', 'Memories'],
                    ['themes', 'Themes'],
                    ['nc-pc', 'NC-PC'],
                    ['targets', 'Targets'],
                    ['resources', 'Resources'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={reviewFilter === id ? 'is-active' : ''}
                    onClick={() => setReviewFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <div className="ci-review-layout">
              <section className="panel ci-transcript-pane is-sticky" aria-label="Transcript">
                <h2>Transcript</h2>
                <pre className="ci-transcript-pre" ref={transcriptPaneRef}>
                  <TranscriptWithHighlight text={transcript} highlight={highlight} />
                </pre>
                <p className="hint">View Evidence highlights the source excerpt here.</p>
              </section>

              <section className="panel ci-findings-pane" aria-label="Clinical Reasoning">
                <h2>Clinical Reasoning</h2>

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

                {taResult && (
                  <div className="ci-ta-review">
                    <p className="ci-ai-label">Transactional Analysis lens — hypotheses, not facts</p>
                    {taResult.noSufficientTaEvidence && (
                      <p className="pf-meta">
                        No sufficiently supported TA-specific formulation identified.
                      </p>
                    )}
                    <FindingSection title="Summary">
                      <p>{taResult.summary.value}</p>
                    </FindingSection>
                    {taResult.lensConsiderations && taResult.lensConsiderations.length > 0 && (
                      <FindingSection title="Clinical Lens Considerations">
                        <p className="ci-ai-label">
                          Possible complementary clinical lenses — not treatment recommendations
                        </p>
                        <ul>
                          {taResult.lensConsiderations.map((c) => (
                            <li key={c.id}>
                              <strong>{LENS_ID_LABELS[c.lens] ?? c.lens}</strong>
                              {' — '}
                              {LENS_RELEVANCE_LABELS[c.relevance]}: {c.reason}
                            </li>
                          ))}
                        </ul>
                        {!exploreEmdr &&
                          taResult.lensConsiderations.some((c) => c.lens === 'emdr') && (
                            <button
                              type="button"
                              className="btn tertiary"
                              onClick={() => {
                                setExploreEmdr(true);
                                setClinicalLens('emdr');
                                setPhase('history');
                                setView('form');
                              }}
                            >
                              Explore with EMDR lens
                            </button>
                          )}
                      </FindingSection>
                    )}
                    <FindingSection title="Drivers">
                      <ul>
                        {taResult.drivers.map((d) => (
                          <li key={d.id}>
                            <strong>{d.driver}</strong> ({d.confidence}) — {d.reasoning}
                            <button
                              type="button"
                              className="btn tertiary"
                              onClick={() => setHighlight(d.evidence[0]?.excerpt ?? null)}
                            >
                              View evidence
                            </button>
                          </li>
                        ))}
                        {!taResult.drivers.length && (
                          <li className="pf-meta">None suggested</li>
                        )}
                      </ul>
                    </FindingSection>
                    <FindingSection title="Possible injunction hypotheses">
                      <ul>
                        {taResult.injunctionHypotheses.map((i) => (
                          <li key={i.id}>
                            {i.hypothesisLabel}: {i.injunction} — {i.reasoning}
                          </li>
                        ))}
                        {!taResult.injunctionHypotheses.length && (
                          <li className="pf-meta">None suggested</li>
                        )}
                      </ul>
                    </FindingSection>
                    <FindingSection title="Ego-state observations">
                      <ul>
                        {taResult.egoStates.map((e) => (
                          <li key={e.id}>
                            {e.egoState}
                            {e.context ? ` — ${e.context}` : ''}
                          </li>
                        ))}
                      </ul>
                    </FindingSection>
                    <FindingSection title="Redecision areas">
                      <ul>
                        {taResult.redecisionAreas.map((r) => (
                          <li key={r.id}>
                            Old: “{r.oldDecision}” → Possible: “{r.possibleNewDecision}”
                          </li>
                        ))}
                      </ul>
                    </FindingSection>
                  </div>
                )}

                {phase1 && (
                  <>
                {(reviewFilter === 'all' || reviewFilter === 'pending' || reviewFilter === 'approved' || reviewFilter === 'rejected') && (
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
                )}

                {(reviewFilter === 'all') && (
                <FindingSection title="Possible Areas to Clarify">
                  <p className="hint">AI-assisted — not treatment instructions.</p>
                  <ul>
                    {phase1.clarificationSuggestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                    {!phase1.clarificationSuggestions.length && <li className="hint">None</li>}
                  </ul>
                </FindingSection>
                )}

                {showCat('all') && statusFilter(phase1.summary.reviewStatus) && (
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
                )}

                {showCat('all') && (
                <FindingSection title="Presenting Problems">
                  <SuggestionList
                    items={phase1.presentingProblems.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('presentingProblems', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('all') && (
                <FindingSection title="Symptoms / Difficulties">
                  <SuggestionList
                    items={phase1.symptoms.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('symptoms', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('all') && (
                <FindingSection title="Recent Examples">
                  <SuggestionList
                    items={phase1.recentExamples.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('recentExamples', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('all') && (
                <FindingSection title="Current Triggers">
                  <SuggestionList
                    items={phase1.triggers.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('triggers', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('memories') && (
                <FindingSection title="Memory Timeline / Earlier Experiences">
                  {phase1.memories.filter((m) => statusFilter(m.reviewStatus)).length ? (
                    phase1.memories.filter((m) => statusFilter(m.reviewStatus)).map((m) => (
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
                )}

                {showCat('all') && (
                <FindingSection title="Possible Associative Links">
                  <SuggestionList
                    items={(phase1.associativeLinks ?? []).filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('associativeLinks', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('themes') && (
                <FindingSection title="Clinical Themes">
                  {phase1.themes.filter((t) => statusFilter(t.reviewStatus)).map((t) => (
                    <ThemeCard
                      key={t.id}
                      theme={t}
                      selected={selectedIds.has(t.id)}
                      onSelect={(on) => toggleId(setSelectedIds, t.id, on)}
                      onStatus={(s) => setCollectionStatus('themes', t.id, s)}
                      onEvidence={setHighlight}
                    />
                  ))}
                  {!phase1.themes.filter((t) => statusFilter(t.reviewStatus)).length && (
                    <p className="hint">Not established</p>
                  )}
                </FindingSection>
                )}

                {showCat('nc-pc') && (
                <FindingSection title="Possible NCs">
                  {phase1.negativeCognitions.filter((i) => statusFilter(i.reviewStatus)).length ? (
                    phase1.negativeCognitions.filter((i) => statusFilter(i.reviewStatus)).map((item) => (
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
                )}

                {showCat('nc-pc') && (
                <FindingSection title="Possible PCs">
                  {phase1.positiveCognitions.filter((i) => statusFilter(i.reviewStatus)).length ? (
                    phase1.positiveCognitions.filter((i) => statusFilter(i.reviewStatus)).map((item) => (
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
                )}

                {showCat('resources') && (
                <FindingSection title="Internal Resources">
                  <SuggestionList
                    items={phase1.internalResources.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('internalResources', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('resources') && (
                <FindingSection title="External Resources">
                  <SuggestionList
                    items={phase1.externalResources.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('externalResources', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('targets') && (
                <FindingSection title="Target Candidates">
                  <SuggestionList
                    items={phase1.targetCandidates.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('targetCandidates', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}

                {showCat('all') && (
                <FindingSection title="Clinical Considerations">
                  <SuggestionList
                    items={phase1.clinicalConsiderations.filter((i) => statusFilter(i.reviewStatus))}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onStatus={(id, s, e) => setCollectionStatus('clinicalConsiderations', id, s, e)}
                    onEvidence={setHighlight}
                  />
                </FindingSection>
                )}
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
    <CompactFindingCard
      finding={title}
      evidenceLevel={item.evidenceLevel}
      confidence={item.confidence}
      reviewStatus={item.reviewStatus}
      evidence={item.evidence}
      findingDelta={item.findingDelta}
      selected={selected}
      onSelect={onSelect}
      onStatus={onStatus}
      onViewEvidence={onEvidence}
    />
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
    <CompactFindingCard
      finding={memory.headline}
      evidenceLevel={memory.evidenceLevel}
      confidence={memory.confidence}
      reviewStatus={memory.reviewStatus}
      evidence={memory.evidence}
      findingDelta={memory.findingDelta}
      selected={selected}
      onSelect={onSelect}
      onStatus={onStatus}
      onViewEvidence={onEvidence}
      meta={[
        memory.approximateAge != null ? `Age ~${memory.approximateAge}` : null,
        memory.possibleTouchstoneCandidate ? 'Possible touchstone candidate' : null,
        memory.description || null,
      ]
        .filter(Boolean)
        .join(' · ')}
    />
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
    <CompactFindingCard
      finding={CLINICAL_THEME_LABELS[theme.theme]}
      evidenceLevel={theme.evidenceLevel}
      confidence={theme.confidence}
      reviewStatus={theme.reviewStatus}
      evidence={theme.evidence}
      findingDelta={theme.findingDelta}
      selected={selected}
      onSelect={onSelect}
      onStatus={onStatus}
      onViewEvidence={onEvidence}
      meta={theme.reasoning}
    />
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
    <CompactFindingCard
      finding={effectiveValue(item)}
      evidenceLevel={item.evidenceLevel}
      confidence={item.confidence}
      reviewStatus={item.reviewStatus}
      evidence={item.evidence}
      findingDelta={item.findingDelta}
      selected={selected}
      onSelect={onSelect}
      onStatus={onStatus}
      onViewEvidence={onEvidence}
      meta={`${item.kind === 'explicit' ? 'Explicit' : 'Suggested'} ${item.polarity === 'negative' ? 'NC' : 'PC'}`}
    />
  );
}
