import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { getClient, patchClient, purgeClientTranscripts } from './lib/api';
import {
  approveDebrief,
  buildDebriefDraft,
} from './lib/sessionBriefing';
import {
  completeCycle,
  getRetentionPreference,
} from './lib/clinicalCycle';
import { ClinicalContextBar } from './components/ClinicalContextBar';
import { ClinicalCycleRail } from './components/ClinicalCycleRail';
import type {
  ClientRecord,
  FormulationSnapshot,
  SessionDebriefRecord,
  TreatmentPlanSuggestionId,
} from './types';

function SnapshotCompare({
  prior,
  next,
}: {
  prior: FormulationSnapshot;
  next: FormulationSnapshot;
}) {
  const rows: Array<[string, string, string]> = [
    [
      'Presenting problems',
      prior.presentingProblems.join('; ') || '—',
      next.presentingProblems.join('; ') || '—',
    ],
    ['Primary theme', prior.primaryTheme || '—', next.primaryTheme || '—'],
    [
      'Secondary themes',
      prior.secondaryThemes.join('; ') || '—',
      next.secondaryThemes.join('; ') || '—',
    ],
    ['Trigger', prior.currentTrigger || '—', next.currentTrigger || '—'],
    ['Target', prior.currentTarget || '—', next.currentTarget || '—'],
    ['NC', prior.nc || '—', next.nc || '—'],
    ['PC', prior.pc || '—', next.pc || '—'],
    [
      'SUD / VoC',
      `${prior.sud ?? '—'} / ${prior.voc ?? '—'}`,
      `${next.sud ?? '—'} / ${next.voc ?? '—'}`,
    ],
    [
      'Resources',
      prior.resources.join('; ') || '—',
      next.resources.join('; ') || '—',
    ],
  ];
  return (
    <div className="session-debrief-compare">
      <table className="session-debrief-compare-table">
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Current formulation</th>
            <th scope="col">Updated formulation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{a}</td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sourceLabel(source: string): string {
  if (source === 'transcript-ci' || source === 'approved-apply') return 'Transcript / CI analysis';
  if (source === 'therapist') return 'Therapist entered';
  return 'System';
}

/**
 * Session Debrief — review after Guided Practice (+ optional Clinical Intelligence).
 * Supports finish-without-transcript (manual). Nothing writes without therapist approval.
 */
export function SessionDebriefPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const analysisId = params.get('analysisId') ?? undefined;
  const sessionIdParam = params.get('sessionId') ?? undefined;
  const manual = params.get('manual') === '1';
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<SessionDebriefRecord | null>(null);
  const [summaryEdit, setSummaryEdit] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<TreatmentPlanSuggestionId[]>([]);
  const [saved, setSaved] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
  const [retentionPrompt, setRetentionPrompt] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId)
      .then((c) => {
        setClient(c);
        const lastApproved = (c.sessionDebriefs ?? []).filter((d) => d.status === 'approved').slice(
          -1,
        )[0];
        const d = buildDebriefDraft(c, {
          analysisId,
          sessionId: sessionIdParam ?? c.activeCycle?.sessionId,
          manual: manual || c.activeCycle?.finishMode === 'without-transcript',
          prior: lastApproved?.updatedFormulation,
        });
        if (c.activeCycle?.drafts?.debriefSummary) {
          d.sessionSummary = c.activeCycle.drafts.debriefSummary;
        }
        setDraft(d);
        setSummaryEdit(d.sessionSummary);
        setSelectedPlans(d.treatmentPlanSuggestions.slice(0, 1).map((s) => s.id));
        setDraftStatus('saved');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load client'));
  }, [auth.isAuthenticated, clientId, analysisId, sessionIdParam, manual]);

  useEffect(() => {
    if (!client?.activeCycle || !summaryEdit) return;
    setDraftStatus('unsaved');
    const t = window.setTimeout(() => {
      setDraftStatus('saving');
      const cycle = {
        ...client.activeCycle!,
        drafts: {
          ...client.activeCycle!.drafts,
          debriefSummary: summaryEdit,
          savedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      void patchClient(clientId, { activeCycle: cycle })
        .then((res) => {
          if (res.client) setClient(res.client);
          setDraftStatus('saved');
        })
        .catch(() => setDraftStatus('unsaved'));
    }, 900);
    return () => window.clearTimeout(t);
  }, [summaryEdit]); // draft autosave

  const latestChange = useMemo(
    () => (client?.sessionChanges ?? []).slice(-1)[0] ?? null,
    [client],
  );

  const canDebrief =
    manual ||
    Boolean(latestChange) ||
    Boolean(client?.lastSessionSummary) ||
    client?.activeCycle?.finishMode === 'without-transcript' ||
    client?.activeCycle?.workflowStatus === 'awaiting-debrief';

  const applyRetention = async (_c: ClientRecord, sessionId?: string, analysis?: string) => {
    const pref = getRetentionPreference();
    if (pref === 'keep') return;
    if (pref === 'ask') {
      setRetentionPrompt(true);
      return;
    }
    if (pref === 'delete-after-approve' && (sessionId || analysis)) {
      await purgeClientTranscripts(clientId, { sessionId, analysisId: analysis });
    }
  };

  const onApprove = async () => {
    if (!client || !draft) return;
    setBusy(true);
    setError(null);
    try {
      const approvedClient = approveDebrief(client, draft, {
        approvedPlanIds: selectedPlans,
        editedSummary: summaryEdit,
      });
      const completed = completeCycle(approvedClient, draft.id);
      const res = await patchClient(clientId, {
        lastSessionSummary: completed.lastSessionSummary,
        outstandingQuestions: completed.outstandingQuestions,
        treatmentStrategy: completed.treatmentStrategy,
        strategyItems: completed.strategyItems,
        nextSessionPrepHints: completed.nextSessionPrepHints,
        sessionDebriefs: completed.sessionDebriefs,
        sessionTimeline: completed.sessionTimeline,
        sessionCount: completed.sessionCount,
        activeCycle: completed.activeCycle,
        clinicalCycles: completed.clinicalCycles,
      });
      if (!res.ok || !res.client) {
        setError(res.error ?? 'Could not save debrief');
        return;
      }
      setClient(res.client);
      setSaved(true);
      await applyRetention(
        res.client,
        draft.sessionId ?? sessionIdParam,
        draft.analysisId ?? analysisId,
      );
    } catch {
      setError('Could not save debrief');
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteTranscript = async () => {
    await purgeClientTranscripts(clientId, {
      sessionId: draft?.sessionId ?? sessionIdParam,
      analysisId: draft?.analysisId ?? analysisId,
    });
    setRetentionPrompt(false);
  };

  const togglePlan = (id: TreatmentPlanSuggestionId) => {
    setSelectedPlans((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="clients" />
      <main className="practice-main session-debrief clinical-cycle-page">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to={`/clients/${clientId}`}>{client?.displayName || 'Client'}</Link>
            <span aria-hidden> › </span>
            Session Debrief
          </p>
          <h1>Session Debrief</h1>
          <p className="lede">
            Review what changed — then approve. Nothing enters the clinical record without your
            approval.
          </p>
        </header>

        {client && (
          <>
            <ClinicalContextBar
              clientName={client.displayName}
              clientId={client.id}
              cycle={client.activeCycle}
              draftStatus={draftStatus}
            />
            <ClinicalCycleRail
              cycle={client.activeCycle}
              status={saved ? 'complete' : client.activeCycle?.workflowStatus ?? 'awaiting-debrief'}
            />
          </>
        )}

        {!auth.isAuthenticated && (
          <section className="pf-surface-card">
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        )}
        {error && <p className="ci-error-banner">{error}</p>}

        {client && !canDebrief && (
          <section className="pf-surface-card">
            <h2>Complete Clinical Intelligence first — or finish without transcript</h2>
            <p>
              Paste a session transcript and apply approved updates, or continue with a manual
              debrief if you are not using AI this session.
            </p>
            <div className="stack-btns horizontal wrap">
              <Link
                className="btn primary"
                to={`/clients/${clientId}/clinical-intelligence?finish=1${
                  sessionIdParam ? `&sessionId=${encodeURIComponent(sessionIdParam)}` : ''
                }`}
              >
                Paste transcript
              </Link>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  const d = buildDebriefDraft(client, {
                    sessionId: sessionIdParam ?? client.activeCycle?.sessionId,
                    manual: true,
                  });
                  setDraft(d);
                  setSummaryEdit(d.sessionSummary);
                }}
              >
                Continue with manual debrief
              </button>
              <Link className="btn tertiary" to={`/clients/${clientId}?tab=preparation`}>
                Back to preparation
              </Link>
            </div>
          </section>
        )}

        {client && draft && canDebrief && !saved && (
          <>
            {draft.manual && (
              <p className="ci-ai-label">Manual debrief — no Clinical Intelligence dependency</p>
            )}
            <section className="pf-surface-card">
              <h2>Session summary</h2>
              <p className="ci-ai-label">From approved findings — edit before saving</p>
              <textarea
                className="session-debrief-summary"
                rows={6}
                value={summaryEdit}
                onChange={(e) => setSummaryEdit(e.target.value)}
              />
            </section>

            <section className="pf-surface-card">
              <h2>What changed today</h2>
              <ul className="session-prep-list">
                {draft.whatChanged.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>

            {draft.provenance && draft.provenance.length > 0 && (
              <section className="pf-surface-card">
                <h2>Update provenance</h2>
                <ul className="session-debrief-provenance">
                  {draft.provenance.map((p) => (
                    <li key={p.id}>
                      <strong>{p.label}</strong>
                      <span className="pf-meta">
                        Source: {sourceLabel(p.source)} · Status: {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="pf-surface-card">
              <h2>Clinical updates</h2>
              <SnapshotCompare prior={draft.priorFormulation} next={draft.updatedFormulation} />
            </section>

            <section className="pf-surface-card">
              <h2>Target status</h2>
              <dl className="ci-kv">
                <dt>Current target</dt>
                <dd>{draft.targetStatus.headline || '—'}</dd>
                <dt>Status</dt>
                <dd>{draft.targetStatus.status}</dd>
                <dt>Current SUD</dt>
                <dd>{draft.targetStatus.sud ?? '—'}</dd>
                <dt>Current VoC</dt>
                <dd>{draft.targetStatus.voc ?? '—'}</dd>
                <dt>Outstanding work</dt>
                <dd>
                  {draft.targetStatus.outstandingWork.length
                    ? draft.targetStatus.outstandingWork.join('; ')
                    : '—'}
                </dd>
              </dl>
            </section>

            <section className="pf-surface-card">
              <h2>Treatment plan</h2>
              <p className="ci-ai-label">Suggestion — select what to carry forward</p>
              <ul className="session-debrief-plans">
                {draft.treatmentPlanSuggestions.map((s) => (
                  <li key={s.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedPlans.includes(s.id)}
                        onChange={() => togglePlan(s.id)}
                      />
                      <span>
                        <strong>{s.label}</strong>
                        <span className="pf-meta">{s.rationale}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <section className="pf-surface-card">
              <h2>Homework</h2>
              {draft.homework.length ? (
                <ul className="session-prep-list">
                  {draft.homework.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="pf-meta">
                  No homework suggested — only shown when the approved record supports it. Never
                  invented.
                </p>
              )}
            </section>

            <section className="pf-surface-card">
              <h2>Next session preparation</h2>
              <p className="pf-meta" style={{ marginBottom: 8 }}>
                Approving this debrief updates Session Preparation automatically.
              </p>
              <ul className="session-prep-list">
                {draft.nextSessionPrep.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>

            <section className="pf-surface-card">
              <h2>Outstanding questions</h2>
              <ul className="session-prep-list">
                {draft.outstandingQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
                {!draft.outstandingQuestions.length && (
                  <li className="pf-meta">No open clinical questions from approved analyses.</li>
                )}
              </ul>
            </section>

            <div className="stack-btns horizontal wrap session-debrief-actions">
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() => void onApprove()}
              >
                {busy ? 'Saving…' : 'Approve & Complete Session'}
              </button>
              <button
                type="button"
                className="btn secondary"
                disabled={busy}
                onClick={() => navigate(`/clients/${clientId}?tab=preparation`)}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {retentionPrompt && (
          <div className="pf-modal-backdrop" role="presentation">
            <div className="pf-modal" role="dialog" aria-modal="true">
              <h2>Raw transcript retention</h2>
              <p>
                Debrief is approved. Keep the raw transcript, or delete it now (derived findings
                remain on the client record)?
              </p>
              <div className="pf-modal-actions">
                <button type="button" className="btn secondary" onClick={() => setRetentionPrompt(false)}>
                  Keep transcript
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => void confirmDeleteTranscript()}
                >
                  Delete raw transcript
                </button>
              </div>
            </div>
          </div>
        )}

        {saved && client && (
          <section className="pf-surface-card">
            <h2>Session complete</h2>
            <p>
              Session Preparation has been updated from approved state only. Outstanding questions
              and treatment strategy now reflect this review.
            </p>
            <div className="stack-btns horizontal wrap">
              <Link className="btn primary" to={`/clients/${clientId}?tab=preparation`}>
                Prepare Next Session
              </Link>
              <Link className="btn secondary" to={`/clients/${clientId}?tab=sessions`}>
                View session timeline
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
