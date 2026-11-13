import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { ClientRecord } from './types';
import { CLINICAL_THEME_LABELS } from './types';
import { buildPreparationBriefing } from './lib/sessionBriefing';
import { IconArrowRight } from '../components/icons';

/**
 * Session Preparation — briefing only.
 * Answers: “What do I need to understand before I greet this client?”
 * UX Rule #2: context before data.
 */
export function SessionPreparationView({
  client,
  therapistName,
}: {
  client: ClientRecord;
  therapistName?: string;
}) {
  const brief = buildPreparationBriefing(client, { therapistName });

  return (
    <div className="session-prep">
      <header className="pf-page-hero session-prep-hero">
        <div>
          <p className="pf-eyebrow">Session preparation</p>
          <h1 className="pf-title">Before you greet {brief.clientName}</h1>
          <p className="pf-subtitle">
            A concise briefing from approved clinical data — readable in under a minute.
          </p>
        </div>
      </header>

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
            No session-to-session delta yet. After the first approved apply and debrief, changes
            appear here.
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
        <p className="pf-meta">Generated only from therapist-approved clinical data.</p>
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
        <p className="ci-ai-label">AI-assisted planning suggestion</p>
        {brief.approvedStrategy.length > 0 && (
          <ul className="session-prep-list">
            {brief.approvedStrategy.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        <ul className="session-prep-list session-prep-suggestions">
          {brief.strategySuggestions.map((s) => (
            <li key={s.id}>{s.text}</li>
          ))}
        </ul>
        <p className="pf-meta">Suggestions only — the therapist decides treatment direction.</p>
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Outstanding questions</h2>
        {brief.outstandingQuestions.length ? (
          <ul className="session-prep-list">
            {brief.outstandingQuestions.map((q) => (
              <li key={q.id}>{q.text}</li>
            ))}
          </ul>
        ) : (
          <p className="pf-meta">No open clarifying questions on the approved record.</p>
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
        <Link className="btn primary" to={brief.practiceHref}>
          Start Guided Practice <IconArrowRight size={16} />
        </Link>
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
