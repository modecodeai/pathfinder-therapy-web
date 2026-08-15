import { Fragment, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ClientRecord, OutstandingQuestionStatus, TreatmentStrategyItem } from './types';
import { CLINICAL_THEME_LABELS } from './types';
import {
  LENS_ID_LABELS,
  PRIMARY_APPROACH_LABELS,
  TA_DRIVER_LABELS,
  TA_EGO_STATE_LABELS,
  TA_INJUNCTION_LABELS,
  type LensId,
  type PrimaryTreatmentApproach,
} from './clinicalReasoning';
import { ensureClinicalReasoningStores } from './lib/coreFormulation';
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
import {
  approachStatusSummary,
  complementaryLenses,
  defaultSessionTypeOptions,
  emdrLensStatus,
  phaseLabelForProtocol,
  primaryLensCta,
  protocolFromSessionType,
  resolvePrimaryClinicalLens,
  sessionApproachMismatch,
  shouldShowEmdrPrepFields,
  shouldShowTaPrepFields,
} from './lib/primaryLensPrep';
import {
  applyApprovedPendingTaFindings,
  proposeTaLensFromApprovedCore,
  type PendingTaFinding,
} from './lib/taLensFromApprovedCore';
import { setPrimaryTreatmentApproach } from './lib/lensGovernance';

/**
 * Session Preparation — read model from approved Core + approved primary-lens formulation.
 * Never invents EMDR concepts when EMDR is inactive.
 */
export function SessionPreparationView({
  client: clientProp,
  therapistName,
  onClientUpdate,
}: {
  client: ClientRecord;
  therapistName?: string;
  onClientUpdate?: (c: ClientRecord) => void;
}) {
  const navigate = useNavigate();
  const client = ensureClinicalReasoningStores(clientProp);
  const brief = buildPreparationBriefing(client, { therapistName });
  const strategyTexts = acceptedStrategyTexts(client);
  const resume = resumeCycleHref(client);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState(
    defaultSessionTypeOptions(client)[0]?.id ?? 'general-ta',
  );
  const status = approachStatusSummary(client);
  const cta = primaryLensCta(client);
  const mismatch = sessionApproachMismatch(client);
  const showEmdr = shouldShowEmdrPrepFields(client);
  const showTa = shouldShowTaPrepFields(client);
  const ta = client.taFormulation ?? client.taLens;
  const pendingTa = client.pendingTaLensReview ?? [];
  const primaryLens = resolvePrimaryClinicalLens(client);
  const approach = (client.primaryTreatmentApproach ?? 'unspecified') as PrimaryTreatmentApproach;
  const sessionOptions = useMemo(() => defaultSessionTypeOptions(client), [client]);

  const persist = async (patch: Partial<ClientRecord>) => {
    const res = await patchClient(client.id, patch);
    if (res.client) onClientUpdate?.(res.client);
    return res.client;
  };

  const runTaLens = async () => {
    setBusy(true);
    setError(null);
    try {
      const proposals = proposeTaLensFromApprovedCore(client);
      await persist({
        pendingTaLensReview: proposals,
        taLensAnalysedAt: new Date().toISOString(),
        primaryClinicalLens:
          client.primaryClinicalLens && client.primaryClinicalLens !== 'none'
            ? client.primaryClinicalLens
            : 'transactional-analysis',
      });
    } catch {
      setError('Could not run TA lens from approved Core.');
    } finally {
      setBusy(false);
    }
  };

  const decideTaFinding = async (
    id: string,
    decision: PendingTaFinding['reviewStatus'],
    edited?: string,
  ) => {
    const nextPending = pendingTa.map((p) =>
      p.id === id
        ? {
            ...p,
            reviewStatus: decision,
            body: edited?.trim() ? edited.trim() : p.body,
          }
        : p,
    );
    const stillPending = nextPending.some((p) => p.reviewStatus === 'pending');
    const taFormulation = applyApprovedPendingTaFindings(
      client.taFormulation ?? client.taLens,
      nextPending,
    );
    await persist({
      pendingTaLensReview: stillPending ? nextPending : nextPending.filter((p) => p.reviewStatus === 'pending'),
      taFormulation,
      taLens: taFormulation,
    });
  };

  const setPrimaryLens = async (lens: LensId | 'none') => {
    const patched: ClientRecord = { ...client, primaryClinicalLens: lens };
    let next = patched;
    if (approach === 'unspecified' && lens === 'transactional-analysis') {
      next = setPrimaryTreatmentApproach(patched, 'integrated-ta-emdr');
    }
    await persist({
      primaryClinicalLens: lens,
      primaryTreatmentApproach: next.primaryTreatmentApproach,
      treatmentApproachHistory: next.treatmentApproachHistory,
      activeClinicalLenses: next.activeClinicalLenses,
    });
  };

  const exploreEmdr = async () => {
    await persist({
      emdrLensExplored: true,
      activeClinicalLenses: [...new Set([...(client.activeClinicalLenses ?? []), 'emdr' as LensId])],
    });
  };

  const resolveMismatch = async (choice: 'change' | 'keep' | 'close') => {
    if (!client.activeCycle) return;
    if (choice === 'keep') return;
    if (choice === 'change') {
      const protocol = protocolFromSessionType(sessionType);
      await persist({
        activeCycle: {
          ...client.activeCycle,
          protocol,
          phase: phaseLabelForProtocol(protocol),
          updatedAt: new Date().toISOString(),
        },
        currentProtocol: protocol,
        currentPhase: phaseLabelForProtocol(protocol),
      });
      return;
    }
    // close and create new
    const { client: withCycle, cycle } = ensureActiveCycle(
      { ...client, activeCycle: { ...client.activeCycle, workflowStatus: 'complete' } },
      { protocol: protocolFromSessionType(sessionType), forceNew: true },
    );
    await persist({
      activeCycle: withCycle.activeCycle,
      clinicalCycles: [...(client.clinicalCycles ?? []), { ...client.activeCycle, workflowStatus: 'complete' }],
      currentProtocol: cycle.protocol,
      currentPhase: cycle.phase,
      sessionTimeline: withCycle.sessionTimeline,
    });
  };

  const startSession = async () => {
    setBusy(true);
    setError(null);
    try {
      const protocol = protocolFromSessionType(sessionType);
      const { client: withCycle, cycle } = ensureActiveCycle(client, { protocol });
      // If existing mismatched cycle, do not silently continue into EMDR
      if (
        !withCycle.activeCycle?.protocol ||
        (/emdr/i.test(withCycle.activeCycle.protocol) &&
          !showEmdr &&
          withCycle.activeCycle.sessionId === client.activeCycle?.sessionId)
      ) {
        // prefer newly selected protocol when creating
      }
      const practiced = markPracticeStarted(
        { ...withCycle, currentProtocol: protocol },
        { ...cycle, protocol, phase: phaseLabelForProtocol(protocol) },
      );
      if (/standard emdr/i.test(protocol)) {
        await upsertClinicalSession({
          id: cycle.sessionId,
          referenceLabel: `${client.displayName} · ${protocol}`,
          phase: practiced.activeCycle?.phase,
          target: client.activeTarget ?? {},
        });
      }
      const res = await patchClient(client.id, {
        activeCycle: practiced.activeCycle,
        sessionTimeline: practiced.sessionTimeline,
        currentProtocol: protocol,
        currentPhase: practiced.currentPhase,
      });
      if (res.client) onClientUpdate?.(res.client);
      navigate(practiceHref(client.id, cycle.sessionId, protocol));
    } catch {
      setError('Could not start session.');
    } finally {
      setBusy(false);
    }
  };

  const updateQuestionStatus = async (id: string, statusQ: OutstandingQuestionStatus) => {
    const outstandingQuestions = (client.outstandingQuestions ?? []).map((q) =>
      q.id === id
        ? {
            ...q,
            status: statusQ,
            resolvedAt:
              statusQ === 'addressed' || statusQ === 'no-longer-relevant'
                ? new Date().toISOString()
                : q.resolvedAt,
          }
        : q,
    );
    await persist({ outstandingQuestions });
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
    await persist({ strategyItems, treatmentStrategy });
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
            Briefing from therapist-approved Core and primary-lens formulation — not platform defaults.
          </p>
        </div>
      </header>

      <section className="pf-surface-card" aria-label="Clinical approach status">
        <h2 className="pf-card-title">Clinical approach status</h2>
        <dl className="ci-kv">
          <dt>Current approach</dt>
          <dd>{status.approach}</dd>
          <dt>Primary lens</dt>
          <dd>
            <select
              value={primaryLens}
              onChange={(e) => void setPrimaryLens(e.target.value as LensId | 'none')}
              aria-label="Primary clinical lens"
            >
              <option value="none">Not selected</option>
              <option value="transactional-analysis">{LENS_ID_LABELS['transactional-analysis']}</option>
              <option value="emdr">{LENS_ID_LABELS.emdr}</option>
              <option value="gestalt">{LENS_ID_LABELS.gestalt}</option>
              <option value="attachment">{LENS_ID_LABELS.attachment}</option>
            </select>
          </dd>
          <dt>Complementary lenses</dt>
          <dd>
            {complementaryLenses(client).length
              ? complementaryLenses(client).map((l) => LENS_ID_LABELS[l]).join('; ')
              : 'None active'}
            {emdrLensStatus(client) === 'inactive' && primaryLens === 'transactional-analysis' ? (
              <>
                {' '}
                <button type="button" className="btn ghost" onClick={() => void exploreEmdr()}>
                  Explore EMDR Lens
                </button>
              </>
            ) : null}
          </dd>
          <dt>Core</dt>
          <dd>{status.core}</dd>
          <dt>TA</dt>
          <dd>{status.ta}</dd>
          <dt>EMDR</dt>
          <dd>{status.emdr}</dd>
        </dl>
        {cta.action !== 'none' && (
          <div className="stack-btns horizontal wrap" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => {
                if (cta.action === 'run-ta' || cta.action === 'review-ta') void runTaLens();
                if (cta.action === 'run-emdr') void exploreEmdr();
              }}
            >
              {cta.label}
            </button>
          </div>
        )}
        {cta.action === 'none' && cta.label === 'TA Formulation Approved' && (
          <p className="pf-meta" style={{ marginTop: '0.5rem' }}>
            TA Formulation Approved — Integrated synthesis updated from approved findings.
          </p>
        )}
      </section>

      {mismatch && (
        <section className="pf-surface-card" aria-label="Session approach mismatch">
          <h2 className="pf-card-title">Session approach mismatch</h2>
          <p>
            Current client approach: <strong>{mismatch.clientApproachLabel}</strong>
          </p>
          <p>
            Existing active session: <strong>{mismatch.sessionProtocol}</strong>
          </p>
          <div className="stack-btns horizontal wrap">
            <button type="button" className="btn tertiary" onClick={() => void resolveMismatch('change')}>
              Change session approach
            </button>
            <button type="button" className="btn ghost" onClick={() => void resolveMismatch('keep')}>
              Keep {mismatch.sessionProtocol}
            </button>
            <button type="button" className="btn ghost" onClick={() => void resolveMismatch('close')}>
              Close session and create new
            </button>
          </div>
        </section>
      )}

      {pendingTa.length > 0 && (
        <section className="pf-surface-card" aria-label="TA findings review">
          <h2 className="pf-card-title">Review TA findings</h2>
          <p className="pf-meta">Working hypotheses from approved Core — Approve / Edit / Reject before they enter Preparation.</p>
          <ul className="session-prep-strategy-list">
            {pendingTa
              .filter((p) => p.reviewStatus === 'pending')
              .map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>{p.title}</strong>
                    <p>{p.body}</p>
                    {p.evidence.length > 0 && (
                      <p className="pf-meta">Evidence: {p.evidence.join(' · ')}</p>
                    )}
                    <p className="ci-ai-label">
                      Confidence: {p.confidence} · Working hypothesis
                    </p>
                  </div>
                  <span className="stack-btns horizontal wrap">
                    <button
                      type="button"
                      className="btn tertiary"
                      onClick={() => void decideTaFinding(p.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => {
                        const edited = window.prompt('Edit finding', p.body);
                        if (edited != null) void decideTaFinding(p.id, 'edited', edited);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => void decideTaFinding(p.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {resume && client.activeCycle && client.activeCycle.workflowStatus !== 'not-started' && !mismatch && (
        <section className="pf-surface-card session-resume-card">
          <h2 className="pf-card-title">Resume Clinical Cycle</h2>
          <p className="pf-meta">
            An active session is in progress ({client.activeCycle.protocol} · {client.activeCycle.sessionId}).
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
          <dt>Approach</dt>
          <dd>{PRIMARY_APPROACH_LABELS[approach]}</dd>
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
          From approved Core / Initial Clinical Brief — not a truncated raw intake paragraph.
        </p>
      </section>

      <section className="pf-surface-card">
        <h2 className="pf-card-title">Core formulation</h2>
        <dl className="ci-kv">
          <dt>Presenting problems</dt>
          <dd>
            {brief.formulation.presentingProblems.length
              ? brief.formulation.presentingProblems.join('; ')
              : 'Not established from approved Core'}
          </dd>
          <dt>Resources</dt>
          <dd>
            {brief.formulation.resources.length
              ? brief.formulation.resources.join('; ')
              : 'Not established'}
          </dd>
        </dl>
      </section>

      {showTa && (
        <section className="pf-surface-card">
          <h2 className="pf-card-title">TA working formulation</h2>
          <dl className="ci-kv">
            <dt>Driver patterns</dt>
            <dd>
              {ta?.drivers?.length
                ? ta.drivers.map((d) => TA_DRIVER_LABELS[d.driver]).join('; ')
                : 'None approved yet'}
            </dd>
            <dt>Possible injunction hypotheses</dt>
            <dd>
              {ta?.injunctionHypotheses?.length
                ? ta.injunctionHypotheses.map((i) => TA_INJUNCTION_LABELS[i.injunction]).join('; ')
                : 'None approved yet'}
            </dd>
            <dt>Ego-state observations</dt>
            <dd>
              {ta?.egoStateObservations?.length
                ? ta.egoStateObservations
                    .map((e) => TA_EGO_STATE_LABELS[e.egoState] ?? e.egoState)
                    .join('; ')
                : 'None approved yet'}
            </dd>
            <dt>Script summary</dt>
            <dd>{ta?.scriptSummary || 'Not sufficiently established'}</dd>
          </dl>
        </section>
      )}

      {showEmdr ? (
        <section className="pf-surface-card">
          <h2 className="pf-card-title">EMDR preparation</h2>
          <dl className="ci-kv">
            <dt>Primary theme</dt>
            <dd>{brief.formulation.primaryTheme || 'Not established'}</dd>
            <dt>Current trigger</dt>
            <dd>{brief.formulation.currentTrigger || 'Not established'}</dd>
            <dt>Current target</dt>
            <dd>{brief.formulation.currentTarget || 'Not established'}</dd>
            <dt>NC</dt>
            <dd>{brief.formulation.nc || 'Not established'}</dd>
            <dt>PC</dt>
            <dd>{brief.formulation.pc || 'Not established'}</dd>
          </dl>
        </section>
      ) : (
        <section className="pf-surface-card">
          <h2 className="pf-card-title">EMDR</h2>
          <p className="pf-meta">
            Inactive. Possible complementary lens only if justified — no targets, NC/PC, SUD/VoC, or
            network fields until EMDR is explored.
          </p>
          {emdrLensStatus(client) === 'inactive' && (
            <button type="button" className="btn ghost" onClick={() => void exploreEmdr()}>
              Explore EMDR Lens
            </button>
          )}
        </section>
      )}

      {showTa && primaryLens === 'transactional-analysis' && (
        <section className="pf-surface-card">
          <h2 className="pf-card-title">Complementary clinical lens considerations</h2>
          <p className="pf-meta">
            Trauma-related childhood adversity may justify exploring EMDR later. Do not generate
            targets or cognitions until deliberately opened.
          </p>
        </section>
      )}

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

      {showEmdr && (
        <section className="pf-surface-card">
          <h2 className="pf-card-title">Potential next targets</h2>
          <dl className="ci-kv">
            <dt>Current target</dt>
            <dd>{brief.currentTarget || 'Not established'}</dd>
            {brief.futureCandidates.map((c, i) => (
              <Fragment key={c}>
                <dt>Future candidate {i + 1}</dt>
                <dd>{c}</dd>
              </Fragment>
            ))}
          </dl>
          <p className="pf-meta">Pathfinder never automatically changes treatment order.</p>
        </section>
      )}

      <section className="pf-surface-card session-prep-ready">
        <h2 className="pf-card-title">Ready to begin</h2>
        <label className="field">
          <span>Session type</span>
          <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
            {sessionOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <p className="pf-meta" style={{ marginBottom: 16 }}>
          Start session for {brief.clientName} · inherits {PRIMARY_APPROACH_LABELS[approach]} /{' '}
          {status.primaryLens}
        </p>
        {error && <p className="ci-error-banner">{error}</p>}
        <button type="button" className="btn primary" disabled={busy} onClick={() => void startSession()}>
          {busy
            ? 'Starting…'
            : /emdr/i.test(protocolFromSessionType(sessionType)) && !/explore/i.test(protocolFromSessionType(sessionType))
              ? 'Start Guided Practice'
              : 'Start Session'}{' '}
          <IconArrowRight size={16} />
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

      {showEmdr && client.themes.length > 0 && (
        <p className="pf-meta session-prep-theme-note">
          Themes on record:{' '}
          {client.themes.map((t) => CLINICAL_THEME_LABELS[t.theme]).join(' · ')}
        </p>
      )}
    </div>
  );
}
