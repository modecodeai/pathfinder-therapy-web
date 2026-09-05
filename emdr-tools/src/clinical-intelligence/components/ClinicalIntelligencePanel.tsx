import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CLINICAL_THEME_LABELS, type ClientRecord, type SupportedAnalysisPhase } from '../types';
import type { TargetSummary } from '../../emdr/guided/types/guidedScript';
import {
  SYNTHETIC_PHASE3_TRANSCRIPT,
  SYNTHETIC_PHASE4_TRANSCRIPT,
  analyseTranscript,
  analyseTranscriptSegment,
  applyFindings,
  applyToTarget,
  fetchCIStatus,
  getClient,
  listClientAnalyses,
  listClients,
  saveReviewedAnalysis,
} from '../lib/api';
import { Phase3ReviewPanel } from './Phase3ReviewPanel';
import { Phase4ReviewPanel } from './Phase4ReviewPanel';
import type { AnyStructuredAnalysis, Phase4DesensitisationAnalysis } from '../types';

type TabId = 'session' | 'themes' | 'targets' | 'processing';

const PHASE_MAP: Record<string, SupportedAnalysisPhase | null> = {
  history: 'history',
  assessment: 'assessment',
  desensitisation: 'desensitisation',
};

interface Props {
  consolePhase: string;
  target: TargetSummary;
  onApplyTargetDraft: (draft: {
    label?: string;
    image?: string;
    nc?: string;
    pc?: string;
    voc?: number | null;
    sud?: number | null;
    emotion?: string;
    body?: string;
  }) => void;
  /** When true (Phase 4), panel starts collapsed */
  defaultCollapsed?: boolean;
}

export function ClinicalIntelligencePanel({
  consolePhase,
  target,
  onApplyTargetDraft,
  defaultCollapsed = false,
}: Props) {
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [tab, setTab] = useState<TabId>('session');
  const [clients, setClients] = useState<Array<{ id: string; displayName: string }>>([]);
  const [clientId, setClientId] = useState(() => localStorage.getItem('pf-ci-linked-client') ?? '');
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [ciReady, setCiReady] = useState<boolean | null>(null);
  const [segment, setSegment] = useState('');
  const [parentAnalysisId, setParentAnalysisId] = useState<string | null>(
    () => localStorage.getItem('pf-ci-parent-analysis') || null,
  );
  const [analyses, setAnalyses] = useState<Array<{ id: string; phase: string; createdAt: string; reviewStatus: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnyStructuredAnalysis | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  const analysisPhase = PHASE_MAP[consolePhase] ?? null;

  useEffect(() => {
    setCollapsed(defaultCollapsed);
  }, [defaultCollapsed, consolePhase]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void listClients().then(setClients).catch(() => setClients([]));
    void fetchCIStatus()
      .then((s) => setCiReady(s.configured))
      .catch(() => setCiReady(false));
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!clientId || !auth.isAuthenticated) {
      setClient(null);
      return;
    }
    localStorage.setItem('pf-ci-linked-client', clientId);
    void getClient(clientId).then(setClient).catch(() => setClient(null));
    void listClientAnalyses(clientId)
      .then((rows) => {
        setAnalyses(rows);
        const match = rows.find((r) => r.phase === analysisPhase);
        if (match && !parentAnalysisId) setParentAnalysisId(match.id);
      })
      .catch(() => setAnalyses([]));
  }, [clientId, auth.isAuthenticated, analysisPhase]);

  useEffect(() => {
    if (parentAnalysisId) localStorage.setItem('pf-ci-parent-analysis', parentAnalysisId);
  }, [parentAnalysisId]);

  const runAnalyse = async (asSegment: boolean) => {
    if (!clientId || !analysisPhase || !segment.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload = {
        clientId,
        protocol: 'standard-emdr' as const,
        phase: analysisPhase,
        transcript: segment,
      };
      const res =
        asSegment && parentAnalysisId
          ? await analyseTranscriptSegment({ ...payload, parentAnalysisId })
          : await analyseTranscript(payload);
      if (!res.success || !res.structuredResult) {
        setError(res.error ?? 'Analysis failed. Transcript preserved.');
        return;
      }
      setResult(res.structuredResult);
      setAnalysisId(res.analysis?.id ?? null);
      if (res.analysis?.id) setParentAnalysisId(res.analysis.id);
      setTab('session');
      void getClient(clientId).then(setClient);
    } catch {
      setError('Analysis failed. Transcript preserved.');
    } finally {
      setBusy(false);
    }
  };

  const persist = (next: AnyStructuredAnalysis) => {
    setResult(next);
    if (analysisId) void saveReviewedAnalysis(analysisId, next);
  };

  const onApplyPhase3 = async () => {
    if (!result || result.analysisKind !== 'phase3-assessment' || !analysisId || !clientId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await applyToTarget(clientId, {
        clientId,
        analysisId,
        reviewedResult: result,
      });
      if (!res.ok || !res.draft) {
        setError(res.error ?? 'Could not apply to target assessment');
        return;
      }
      onApplyTargetDraft({
        label: res.draft.label,
        image: res.draft.image,
        nc: res.draft.nc,
        pc: res.draft.pc,
        voc: res.draft.voc,
        sud: res.draft.sud,
        emotion: res.draft.emotion,
        body: res.draft.body,
      });
      void getClient(clientId).then(setClient);
    } catch {
      setError('Could not apply to target assessment');
    } finally {
      setBusy(false);
    }
  };

  const onApplyPhase4 = async () => {
    if (!result || result.analysisKind !== 'phase4-desensitisation' || !analysisId || !clientId) return;
    setBusy(true);
    setError(null);
    try {
      await saveReviewedAnalysis(analysisId, result, 'reviewed');
      const res = await applyFindings(clientId, {
        clientId,
        analysisId,
        structuredResult: result,
      });
      if (!res.ok) {
        setError(res.error ?? 'Could not apply processing findings');
        return;
      }
      void getClient(clientId).then(setClient);
      setResult(null);
    } catch {
      setError('Could not apply processing findings');
    } finally {
      setBusy(false);
    }
  };

  const loadSynthetic = () => {
    if (analysisPhase === 'assessment') setSegment(SYNTHETIC_PHASE3_TRANSCRIPT);
    else if (analysisPhase === 'desensitisation') setSegment(SYNTHETIC_PHASE4_TRANSCRIPT);
    else setSegment('');
  };

  return (
    <section className={`ci-practice-panel${collapsed ? ' is-collapsed' : ''}`}>
      <header className="ci-practice-panel-head">
        <button type="button" className="btn ghost ci-panel-toggle" onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? 'Show' : 'Hide'} Clinical Intelligence
        </button>
        {!collapsed && <span className="hint">Four-layer review · never auto-writes clinical record</span>}
      </header>

      {!collapsed && (
        <div className="ci-practice-panel-body">
          {!auth.isAuthenticated && (
            <p>
              <Link to="/account">Sign in</Link> to use Clinical Intelligence.
            </p>
          )}

          {auth.isAuthenticated && (
            <>
              <label className="field">
                <span>Linked client record</span>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setResult(null);
                    setParentAnalysisId(null);
                  }}
                >
                  <option value="">Select client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </label>
              {ciReady === false && (
                <p className="ci-error-banner">
                  CI not connected. <Link to="/settings/clinical-intelligence">Settings</Link>
                </p>
              )}

              <div className="ci-panel-tabs" role="tablist">
                {(
                  [
                    ['session', 'Current Session'],
                    ['themes', 'Themes'],
                    ['targets', 'Targets'],
                    ['processing', 'Processing'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className={tab === id ? 'is-active' : ''}
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'session' && (
                <div className="ci-panel-tab-panel">
                  {!analysisPhase && (
                    <p className="hint">
                      Phase 1 / 3 / 4 analysis is available from History, Assessment, or Desensitisation.
                    </p>
                  )}
                  {analysisPhase && (
                    <>
                      <label className="field">
                        <span>Analyse New Transcript Segment</span>
                        <textarea
                          rows={6}
                          value={segment}
                          onChange={(e) => setSegment(e.target.value)}
                          placeholder="Paste additional transcript from this session…"
                        />
                      </label>
                      {analyses.length > 0 && (
                        <label className="field">
                          <span>Parent analysis (for incremental segment)</span>
                          <select
                            value={parentAnalysisId ?? ''}
                            onChange={(e) => setParentAnalysisId(e.target.value || null)}
                          >
                            <option value="">None — full analyse</option>
                            {analyses
                              .filter((a) => a.phase === analysisPhase)
                              .map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.phase} · {new Date(a.createdAt).toLocaleString()} · {a.reviewStatus}
                                </option>
                              ))}
                          </select>
                        </label>
                      )}
                      <div className="stack-btns horizontal wrap">
                        <button
                          type="button"
                          className="btn primary"
                          disabled={!ciReady || busy || !clientId || !segment.trim()}
                          onClick={() => void runAnalyse(Boolean(parentAnalysisId))}
                        >
                          {busy ? 'Analysing…' : parentAnalysisId ? 'Analyse Segment' : 'Analyse Transcript'}
                        </button>
                        <button type="button" className="btn ghost" onClick={loadSynthetic}>
                          Load synthetic
                        </button>
                      </div>
                    </>
                  )}

                  {error && <div className="ci-error-banner">{error}</div>}

                  {result?.analysisKind === 'phase3-assessment' && (
                    <>
                      <Phase3ReviewPanel
                        result={result}
                        onChange={(n) => persist(n)}
                        onHighlight={setHighlight}
                      />
                      <button
                        type="button"
                        className="btn primary"
                        disabled={busy}
                        onClick={() => void onApplyPhase3()}
                      >
                        Apply to Target Assessment
                      </button>
                    </>
                  )}
                  {result?.analysisKind === 'phase4-desensitisation' && (
                    <>
                      <Phase4ReviewPanel
                        result={result as Phase4DesensitisationAnalysis}
                        onChange={(n) => persist(n)}
                        onHighlight={setHighlight}
                      />
                      <button
                        type="button"
                        className="btn primary"
                        disabled={busy}
                        onClick={() => void onApplyPhase4()}
                      >
                        Apply approved processing notes
                      </button>
                    </>
                  )}
                  {result?.analysisKind === 'phase1-history' && (
                    <p className="hint">
                      Phase 1 review is available on the{' '}
                      <Link to={`/clients/${clientId}/clinical-intelligence`}>full Analyse page</Link>.
                    </p>
                  )}
                  {highlight && <p className="hint">Evidence: “{highlight}”</p>}
                </div>
              )}

              {tab === 'themes' && (
                <div className="ci-panel-tab-panel">
                  {!client?.themes?.length && <p className="hint">No approved themes yet.</p>}
                  <ul>
                    {client?.themes?.map((t) => (
                      <li key={t.theme}>
                        {CLINICAL_THEME_LABELS[t.theme]}
                        {t.primary ? ' (primary)' : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tab === 'targets' && (
                <div className="ci-panel-tab-panel">
                  <h4>Console target</h4>
                  <dl className="ci-kv">
                    <dt>Label</dt>
                    <dd>{target.label || '—'}</dd>
                    <dt>Image</dt>
                    <dd>{target.image || '—'}</dd>
                    <dt>NC</dt>
                    <dd>{target.nc || '—'}</dd>
                    <dt>PC</dt>
                    <dd>{target.pc || '—'}</dd>
                    <dt>VoC</dt>
                    <dd>{target.voc ?? 'Not established'}</dd>
                    <dt>SUD</dt>
                    <dd>{target.sud ?? 'Not established'}</dd>
                    <dt>Emotion</dt>
                    <dd>{target.emotion || '—'}</dd>
                    <dt>Body</dt>
                    <dd>{target.body || '—'}</dd>
                  </dl>
                  {client?.activeTarget && (
                    <>
                      <h4>Approved client active target</h4>
                      <dl className="ci-kv">
                        <dt>Headline</dt>
                        <dd>{client.activeTarget.headline}</dd>
                        <dt>NC / PC</dt>
                        <dd>
                          {client.activeTarget.nc || '—'} / {client.activeTarget.pc || '—'}
                        </dd>
                        <dt>VoC / SUD</dt>
                        <dd>
                          {client.activeTarget.voc ?? 'Not established'} /{' '}
                          {client.activeTarget.sud ?? 'Not established'}
                        </dd>
                      </dl>
                    </>
                  )}
                  {!!client?.targetCandidates?.length && (
                    <>
                      <h4>Target candidates</h4>
                      <ul>
                        {client.targetCandidates.map((t) => (
                          <li key={t.id}>{t.headline}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {tab === 'processing' && (
                <div className="ci-panel-tab-panel">
                  {!client?.processingNotes?.length && (
                    <p className="hint">No approved processing sequence notes yet.</p>
                  )}
                  <ol className="ci-processing-sequence">
                    {(client?.processingNotes ?? [])
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((n) => (
                        <li key={n.id}>
                          <strong>
                            {n.order}. {n.sequenceLabel}
                          </strong>{' '}
                          <span className="hint">({n.category})</span>
                          <div>{n.value}</div>
                        </li>
                      ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

