import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { getClient, patchClient } from './lib/api';
import {
  approveDebrief,
  buildDebriefDraft,
  captureFormulationSnapshot,
} from './lib/sessionBriefing';
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

/**
 * Session Debrief — review after Guided Practice + Clinical Intelligence apply.
 * Nothing is written without therapist approval.
 */
export function SessionDebriefPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const analysisId = params.get('analysisId') ?? undefined;
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<SessionDebriefRecord | null>(null);
  const [summaryEdit, setSummaryEdit] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<TreatmentPlanSuggestionId[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId)
      .then((c) => {
        setClient(c);
        const prior =
          (c.sessionDebriefs ?? []).filter((d) => d.status === 'approved').slice(-1)[0]
            ?.updatedFormulation ?? captureFormulationSnapshot(c);
        // If we have a prior debrief, use its updated as prior; rebuild current from client
        const lastApproved = (c.sessionDebriefs ?? []).filter((d) => d.status === 'approved').slice(
          -1,
        )[0];
        const d = buildDebriefDraft(c, {
          analysisId,
          prior: lastApproved?.updatedFormulation ?? prior,
        });
        // Fix prior: if lastApproved exists, its updatedFormulation is the "before" for next cycle
        // but current client already IS the updated state — so prior should be lastApproved.updated
        // and if no lastApproved, prior equals current (first debrief).
        if (lastApproved) {
          d.priorFormulation = lastApproved.updatedFormulation;
        }
        setDraft(d);
        setSummaryEdit(d.sessionSummary);
        setSelectedPlans(d.treatmentPlanSuggestions.slice(0, 1).map((s) => s.id));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load client'));
  }, [auth.isAuthenticated, clientId, analysisId]);

  const latestChange = useMemo(
    () => (client?.sessionChanges ?? []).slice(-1)[0] ?? null,
    [client],
  );

  const onApprove = async () => {
    if (!client || !draft) return;
    setBusy(true);
    setError(null);
    try {
      const next = approveDebrief(client, draft, {
        approvedPlanIds: selectedPlans,
        editedSummary: summaryEdit,
      });
      const res = await patchClient(clientId, {
        lastSessionSummary: next.lastSessionSummary,
        outstandingQuestions: next.outstandingQuestions,
        treatmentStrategy: next.treatmentStrategy,
        nextSessionPrepHints: next.nextSessionPrepHints,
        sessionDebriefs: next.sessionDebriefs,
        sessionTimeline: next.sessionTimeline,
        sessionCount: next.sessionCount,
      });
      if (!res.ok || !res.client) {
        setError(res.error ?? 'Could not save debrief');
        return;
      }
      setClient(res.client);
      setSaved(true);
    } catch {
      setError('Could not save debrief');
    } finally {
      setBusy(false);
    }
  };

  const togglePlan = (id: TreatmentPlanSuggestionId) => {
    setSelectedPlans((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="clients" />
      <main className="practice-main session-debrief">
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

        {!auth.isAuthenticated && (
          <section className="pf-surface-card">
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        )}
        {error && <p className="ci-error-banner">{error}</p>}

        {client && !latestChange && !client.lastSessionSummary && (
          <section className="pf-surface-card">
            <h2>Complete Clinical Intelligence first</h2>
            <p>
              Paste the session transcript, review findings, and apply approved updates before
              debriefing.
            </p>
            <div className="stack-btns horizontal wrap">
              <Link
                className="btn primary"
                to={`/clients/${clientId}/clinical-intelligence?finish=1`}
              >
                Paste transcript
              </Link>
              <Link className="btn secondary" to={`/clients/${clientId}?tab=preparation`}>
                Back to preparation
              </Link>
            </div>
          </section>
        )}

        {client && draft && (latestChange || client.lastSessionSummary) && !saved && (
          <>
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
                  <li className="pf-meta">None derived from the approved record.</li>
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
                {busy ? 'Saving…' : 'Approve & save'}
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

        {saved && client && (
          <section className="pf-surface-card">
            <h2>Debrief saved</h2>
            <p>
              Session Preparation has been updated. Outstanding questions and treatment strategy
              now reflect this review.
            </p>
            <div className="stack-btns horizontal wrap">
              <Link className="btn primary" to={`/clients/${clientId}?tab=preparation`}>
                Open Session Preparation
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
