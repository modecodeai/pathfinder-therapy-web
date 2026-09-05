import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ClientRecord, OutstandingQuestionStatus, TreatmentStrategyItem } from './types';
import { CLINICAL_THEME_LABELS } from './types';
import { buildPreparationBriefing } from './lib/sessionBriefing';
import {
  acceptedStrategyTexts,
  ensureActiveCycle,
  markPracticeStarted,
  practiceHref,
  resumeCycleHref,
} from './lib/clinicalCycle';
import { patchClient, upsertClinicalSession } from './lib/api';
import { IconArrowRight } from '../components/icons';
import { ClinicalCycleRail } from './components/ClinicalCycleRail';
import { ClinicalContextBar } from './components/ClinicalContextBar';

/**
 * Session Preparation — briefing from approved clinical data only.
 */
export function SessionPreparationView({
  client,
  therapistName,
  onClientUpdate,
}: {
  client: ClientRecord;
  therapistName?: string;
  onClientUpdate?: (c: ClientRecord) => void;
}) {
  const navigate = useNavigate();
  const brief = buildPreparationBriefing(client, { therapistName });
  const strategyTexts = acceptedStrategyTexts(client);
  const resume = resumeCycleHref(client);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPractice = async () => {
    setBusy(true);
    setError(null);
    try {
      const { client: withCycle, cycle } = ensureActiveCycle(client);
      const practiced = markPracticeStarted(withCycle, cycle);
      await upsertClinicalSession({
        id: cycle.sessionId,
        referenceLabel: `${client.displayName} · ${cycle.protocol}`,
        phase: practiced.activeCycle?.phase,
        target: client.activeTarget ?? {},
      });
      const res = await patchClient(client.id, {
        activeCycle: practiced.activeCycle,
        sessionTimeline: practiced.sessionTimeline,
        currentProtocol: practiced.currentProtocol,
        currentPhase: practiced.currentPhase,
      });
      if (res.client) onClientUpdate?.(res.client);
      navigate(practiceHref(client.id, cycle.sessionId));
    } catch {
      setError('Could not start guided practice for this session.');
    } finally {
      setBusy(false);
    }
  };

  const updateQuestionStatus = async (id: string, status: OutstandingQuestionStatus) => {
    const outstandingQuestions = (client.outstandingQuestions ?? []).map((q) =>
      q.id === id
        ? {
            ...q,
            status,
            resolvedAt:
              status === 'addressed' || status === 'no-longer-relevant'
                ? new Date().toISOString()
                : q.resolvedAt,
          }
        : q,
    );
    const res = await patchClient(client.id, { outstandingQuestions });
    if (res.client) onClientUpdate?.(res.client);
  };

  const decideStrategy = async (
    suggestionText: string,
    decision: TreatmentStrategyItem['decision'],
    editedText?: string,
  ) => {
    const item: TreatmentStrategyItem = {
      id: `strat_${Date.now()}`,
      text: suggestionText,
      decision,
      editedText,
      source: 'ai-assisted',
      sessionId: client.activeCycle?.sessionId,
      rejectedAt: decision === 'rejected' ? new Date().toISOString() : undefined,
    };
    const prior = (client.strategyItems ?? []).filter(
      (s) => s.text.toLowerCase() !== suggestionText.toLowerCase(),
    );
    const strategyItems = [...prior, item];
    const treatmentStrategy =
      decision === 'accepted' || decision === 'edited'
        ? [
            ...(client.treatmentStrategy ?? []).filter(
              (t) => t.toLowerCase() !== suggestionText.toLowerCase(),
            ),
            decision === 'edited' && editedText ? editedText : suggestionText,
          ]
        : (client.treatmentStrategy ?? []).filter(
            (t) => t.toLowerCase() !== suggestionText.toLowerCase(),
          );
    const res = await patchClient(client.id, { strategyItems, treatmentStrategy });
    if (res.client) onClientUpdate?.(res.client);
  };

  return (
    <div className="session-prep clinical-cycle-page">
      <ClinicalContextBar
        clientName={brief.clientName}
        clientId={client.id}
        cycle={client.activeCycle}
      />
      <ClinicalCycleRail cycle={client.activeCycle} status={client.activeCycle?.workflowStatus ?? 'not-started'} />

      <header className="pf-page-hero session-prep-hero">
        <div>
          <p className="pf-eyebrow">Session preparation</p>
          <h1 className="pf-title">Before you greet {brief.clientName}</h1>
          <p className="pf-subtitle">
            A concise briefing from therapist-approved clinical data — readable in under a minute.
          </p>
        </div>
      </header>

      {resume && client.activeCycle && client.activeCycle.workflowStatus !== 'not-started' && (
        <section className="pf-surface-card session-resume-card">
          <h2 className="pf-card-title">Resume Clinical Cycle</h2>
          <p className="pf-meta">
            An active session is in progress ({client.activeCycle.sessionId}).
          </p>
          <Link className="btn secondary" to={resume.href}>
            {resume.label} <IconArrowRight size={16} />
          </Link>
        </section>
      )}

      <section className="pf-surface-card session-prep-delta" aria-label="What has changed">
        <h2 className="pf-card-title">What has changed since you last saw this client?</h2>
        {brief.delta.length ? (
          <ul className="session-prep-delta-list">
            {brief.delta.map((d) => (
              <li key={d.id} data-kind={d.kind}>
                {d.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pf-meta">
            No approved session-to-session changes yet. After the first approved apply and debrief,
            true deltas appear here.
          </p>
        )}
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Today&apos;s session</h2>
        <dl className="ci-kv session-prep-today">
          <dt>Client</dt>
          <dd>{brief.clientName}</dd>
          <dt>Session</dt>
          <dd>#{brief.sessionNumber}</dd>
          <dt>Protocol</dt>
          <dd>{brief.protocol}</dd>
          <dt>Current phase</dt>
          <dd>{brief.currentPhase}</dd>
          <dt>Date</dt>
          <dd>{brief.dateLabel}</dd>
          <dt>Last seen</dt>
          <dd>{brief.lastSeenLabel}</dd>
          <dt>Estimated duration</dt>
          <dd>{brief.estimatedDuration}</dd>
        </dl>
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Clinical snapshot</h2>
        <p className="session-prep-snapshot">{brief.clinicalSnapshot}</p>
        <p className="pf-meta">
          Generated only from therapist-entered, therapist-approved, and approved debrief data —
          never from pending or rejected AI findings.
        </p>
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Current formulation</h2>
        <dl className="ci-kv">
          <dt>Presenting problems</dt>
          <dd>
            {brief.formulation.presentingProblems.length
              ? brief.formulation.presentingProblems.join('; ')
              : '—'}
          </dd>
          <dt>Primary theme</dt>
          <dd>{brief.formulation.primaryTheme || '—'}</dd>
          <dt>Secondary themes</dt>
          <dd>
            {brief.formulation.secondaryThemes.length
              ? brief.formulation.secondaryThemes.join('; ')
              : '—'}
          </dd>
          <dt>Current trigger</dt>
          <dd>{brief.formulation.currentTrigger || '—'}</dd>
          <dt>Current target</dt>
          <dd>{brief.formulation.currentTarget || '—'}</dd>
          <dt>NC</dt>
          <dd>{brief.formulation.nc || '—'}</dd>
          <dt>PC</dt>
          <dd>{brief.formulation.pc || '—'}</dd>
          <dt>Resources</dt>
          <dd>
            {brief.formulation.resources.length
              ? brief.formulation.resources.join('; ')
              : '—'}
          </dd>
        </dl>
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Current treatment strategy</h2>
        {strategyTexts.length > 0 ? (
          <ul className="session-prep-list">
            {strategyTexts.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="pf-meta">No accepted treatment strategy yet.</p>
        )}
        <p className="ci-ai-label">AI-assisted planning suggestions</p>
        <ul className="session-prep-strategy-list">
          {brief.strategySuggestions
            .filter((s) => {
              const rejected = (client.strategyItems ?? []).some(
                (i) =>
                  i.decision === 'rejected' &&
                  i.text.toLowerCase() === s.text.toLowerCase(),
              );
              return !rejected;
            })
            .map((s) => (
              <li key={s.id}>
                <span>{s.text}</span>
                <span className="stack-btns horizontal wrap">
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => void decideStrategy(s.text, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => {
                      const edited = window.prompt('Edit strategy', s.text);
                      if (edited?.trim()) void decideStrategy(s.text, 'edited', edited.trim());
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => void decideStrategy(s.text, 'deferred')}
                  >
                    Defer
                  </button>
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => void decideStrategy(s.text, 'rejected')}
                  >
                    Reject
                  </button>
                </span>
              </li>
            ))}
        </ul>
        <p className="pf-meta">Suggestions only — the therapist decides treatment direction.</p>
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Outstanding questions</h2>
        {brief.outstandingQuestions.length ? (
          <ul className="session-prep-questions">
            {brief.outstandingQuestions.map((q) => (
              <li key={q.id}>
                <div>
                  <strong>{q.text}</strong>
                  {q.possibleAnswerFound ? (
                    <p className="ci-ai-label">Possible answer found — confirm before resolving</p>
                  ) : null}
                  <span className="pf-meta">Status: {q.status}</span>
                </div>
                <span className="stack-btns horizontal wrap">
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => void updateQuestionStatus(q.id, 'addressed')}
                  >
                    Addressed
                  </button>
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => void updateQuestionStatus(q.id, 'deferred')}
                  >
                    Deferred
                  </button>
                  <button
                    type="button"
                    className="btn tertiary"
                    onClick={() => void updateQuestionStatus(q.id, 'no-longer-relevant')}
                  >
                    No longer relevant
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pf-meta">No open clinical questions from approved analyses.</p>
        )}
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Things to review today</h2>
        <ul className="session-prep-list">
          {brief.thingsToReview.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Potential next targets</h2>
        <dl className="ci-kv">
          <dt>Current target</dt>
          <dd>{brief.currentTarget || '—'}</dd>
          {brief.futureCandidates.map((c, i) => (
            <Fragment key={c}>
              <dt>Future candidate {i + 1}</dt>
              <dd>{c}</dd>
            </Fragment>
          ))}
        </dl>
        {!brief.futureCandidates.length && (
          <p className="pf-meta">No future target candidates on the approved record.</p>
        )}
        <p className="pf-meta">Pathfinder never automatically changes treatment order.</p>
      </section>

      <section className="pf-surface-card session-prep-ready">
        <h2 className="pf-card-title">Ready to begin</h2>
        <p className="pf-meta" style={{ marginBottom: 16 }}>
          Start Guided Practice for {brief.clientName} · {brief.protocol}
        </p>
        {error && <p className="ci-error-banner">{error}</p>}
        <button type="button" className="btn primary" disabled={busy} onClick={() => void startPractice()}>
          {busy ? 'Starting…' : 'Start Guided Practice'} <IconArrowRight size={16} />
        </button>
        <div className="stack-btns horizontal wrap" style={{ marginTop: 12 }}>
          <Link className="btn secondary" to={`/clients/${client.id}/aip-formulation`}>
            Open formulation
          </Link>
          <Link className="btn tertiary" to={`/clients/${client.id}/clinical-intelligence`}>
            Clinical reasoning
          </Link>
        </div>
      </section>

      {client.themes.length > 0 && (
        <p className="pf-meta session-prep-theme-note">
          Themes on record:{' '}
          {client.themes.map((t) => CLINICAL_THEME_LABELS[t.theme]).join(' · ')}
        </p>
      )}
    </div>
  );
}
