import { useMemo, useState } from 'react';
import type { ClientRecord } from './types';
import {
  INTAKE_SECTION_LABELS,
  INTAKE_CLINICAL_STATUS_LABELS,
  PATHFINDER_INTAKE_FORM_VERSION,
  PATHFINDER_INTAKE_QUESTIONS,
  answersToStructuredIntake,
  parsePastedIntakeToAnswers,
  type IntakeAnswerMap,
  type IntakeClinicalStatus,
} from './lib/pathfinderIntakeForm';
import {
  analyseIntakeCoreOnly,
  approvedFindingsToCore,
  type IntakeCoreFinding,
  type IntakeFindingCategory,
} from './lib/intakeReasoning';
import {
  buildFirstSessionPreparation,
  firstSessionPreparationPlainText,
} from './lib/firstSessionPrep';
import { patchClient } from './lib/api';
import { PRIMARY_APPROACH_LABELS, type PrimaryTreatmentApproach } from './clinicalReasoning';
import { setPrimaryTreatmentApproach } from './lib/lensGovernance';

const REVIEW_SECTIONS: Array<{ title: string; cats: IntakeFindingCategory[] }> = [
  { title: 'Presenting Concerns', cats: ['presenting-problem', 'functional-impact'] },
  { title: 'Current Symptoms / Difficulties', cats: ['symptom', 'lifestyle', 'current-stressor'] },
  { title: 'Current Life Context', cats: ['medical-consideration', 'psychological-history', 'veteran-information'] },
  { title: 'Relevant History', cats: ['significant-experience', 'trauma-adversity'] },
  { title: 'Relationships', cats: ['relational-pattern'] },
  { title: 'Resources and Strengths', cats: ['strength', 'internal-resource', 'external-resource', 'current-support'] },
  { title: 'Risk / Clinical Review', cats: ['risk-clinical-review', 'clinical-consideration', 'reported-diagnosis'] },
  { title: 'Client Goals', cats: ['therapeutic-goal'] },
  { title: 'Working Hypotheses', cats: ['working-hypothesis', 'protective-process'] },
  { title: 'Information Still Needed', cats: ['outstanding-question', 'not-established'] },
];

/**
 * Clinician intake workspace — raw / structured / core review remain distinct.
 */
export function IntakeClinicalView({
  client,
  onClientUpdate,
}: {
  client: ClientRecord;
  onClientUpdate?: (c: ClientRecord) => void;
}) {
  const [mode, setMode] = useState<'paste' | 'manual' | 'view'>('view');
  const [paste, setPaste] = useState('');
  const [answers, setAnswers] = useState<IntakeAnswerMap>({});
  const [findings, setFindings] = useState<IntakeCoreFinding[]>(client.intakeCoreFindings ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approach, setApproach] = useState<PrimaryTreatmentApproach>(
    client.primaryTreatmentApproach ?? 'unspecified',
  );
  const [prepText, setPrepText] = useState(
    client.firstSessionPreparation
      ? firstSessionPreparationPlainText(client.firstSessionPreparation)
      : '',
  );

  const status: IntakeClinicalStatus = client.intakeClinicalStatus ?? 'not-requested';
  const clinicalReview = useMemo(
    () => findings.some((f) => f.clinicalReviewRequired) || findings.some((f) => f.category === 'risk-clinical-review'),
    [findings],
  );
  const explorePain = useMemo(
    () => findings.some((f) => /chronic pain/i.test(f.text)),
    [findings],
  );

  const persist = async (patch: Partial<ClientRecord>) => {
    const res = await patchClient(client.id, patch);
    if (!res.ok || !res.client) throw new Error(res.error ?? 'Save failed');
    onClientUpdate?.(res.client);
    return res.client;
  };

  const runAnalyse = async (answerMap: IntakeAnswerMap, source: 'paste' | 'therapist-manual') => {
    setBusy(true);
    setError(null);
    try {
      const rawId = `raw_${Date.now().toString(36)}`;
      const structured = answersToStructuredIntake(answerMap);
      const analysis = analyseIntakeCoreOnly({
        answers: answerMap,
        structured,
        rawSubmissionId: rawId,
      });
      const rawSubmission = {
        id: rawId,
        clientId: client.id,
        formVersion: PATHFINDER_INTAKE_FORM_VERSION,
        submittedAt: new Date().toISOString(),
        source: source === 'paste' ? ('paste' as const) : ('therapist-manual' as const),
        rawPayload: source === 'paste' ? { text: paste } : answerMap,
        privacyPolicyVersion: 'privacy-v1',
        consentVersion: 'privacy-v1',
      };
      setFindings(analysis.findings);
      const next = await persist({
        rawIntakeSubmissions: [...(client.rawIntakeSubmissions ?? []), rawSubmission],
        structuredIntake: structured,
        intakeCoreFindings: analysis.findings,
        intakeClinicalStatus: 'ai-review-ready',
        intakeStatus: 'submitted',
        email: structured.personalInformation.email ?? client.email,
        phone: structured.personalInformation.telephone ?? client.phone,
        preferredName: structured.personalInformation.preferredName ?? client.preferredName,
        dateOfBirth: structured.personalInformation.dateOfBirth ?? client.dateOfBirth,
        pronouns: structured.personalInformation.pronouns ?? client.pronouns,
        presentingProblem: structured.presentingProblem.mainProblems ?? client.presentingProblem,
        // legacy mirror for older UI
        intake: {
          fields: {
            presentingProblem: structured.presentingProblem.mainProblems,
            goalsForTherapy: structured.goals.clientStatedGoals,
            traumaHistory: structured.traumaHistory.trauma,
            strengthsResources: structured.strengths.strengths,
          },
          rawPaste: source === 'paste' ? paste : undefined,
          updatedAt: new Date().toISOString(),
          extractedFindings: [],
          riskReviewRequired: analysis.clinicalReviewRequired,
        },
      });
      setMode('view');
      onClientUpdate?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse failed');
    } finally {
      setBusy(false);
    }
  };

  const applyReview = async () => {
    setBusy(true);
    setError(null);
    try {
      const core = approvedFindingsToCore(findings, client.coreFormulation);
      const prep = buildFirstSessionPreparation({ ...client, intakeCoreFindings: findings }, findings);
      setPrepText(firstSessionPreparationPlainText(prep));
      let nextClient = await persist({
        intakeCoreFindings: findings,
        coreFormulation: core,
        firstSessionPreparation: prep,
        intakeClinicalStatus: 'therapist-reviewed',
        intakeStatus: 'reviewed',
        presentingProblems: [
          ...new Set([
            ...(client.presentingProblems ?? []),
            ...core.presentingProblems.map((p) => p.text),
          ]),
        ],
        outstandingQuestions: core.outstandingQuestions,
      });
      if (approach !== (client.primaryTreatmentApproach ?? 'unspecified')) {
        nextClient = setPrimaryTreatmentApproach(nextClient, approach);
        const res = await persist({
          primaryTreatmentApproach: nextClient.primaryTreatmentApproach,
          treatmentApproachHistory: nextClient.treatmentApproachHistory,
          activeClinicalLenses: nextClient.activeClinicalLenses,
        });
        nextClient = res;
      }
      onClientUpdate?.(nextClient);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not apply review');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pf-intake-clinical">
      <section className="pf-surface-card">
        <h2>Intake</h2>
        <p className="pf-meta">
          Status: <strong>{INTAKE_CLINICAL_STATUS_LABELS[status]}</strong>
          {' · '}Form version: {client.structuredIntake?.formVersion ?? PATHFINDER_INTAKE_FORM_VERSION}
        </p>
        <p className="hint">
          Intake record is confidential client information and is kept separate from clinical session notes.
        </p>
        {clinicalReview && (
          <div className="pf-clinical-review-alert" role="alert">
            <strong>CLINICAL REVIEW REQUIRED</strong>
            <p>Risk-related or safeguarding language appears in intake. Do not invent severity, intent, plan, or means.</p>
          </div>
        )}
        <div className="clients-filters" role="group" aria-label="Intake actions">
          <button type="button" className={mode === 'view' ? 'is-active' : ''} onClick={() => setMode('view')}>
            Review
          </button>
          <button type="button" className={mode === 'paste' ? 'is-active' : ''} onClick={() => setMode('paste')}>
            Paste intake
          </button>
          <button type="button" className={mode === 'manual' ? 'is-active' : ''} onClick={() => setMode('manual')}>
            Manual entry
          </button>
        </div>
      </section>

      {error && <p className="ci-error-banner">{error}</p>}

      {mode === 'paste' && (
        <section className="pf-surface-card">
          <h3>Paste completed intake</h3>
          <p className="pf-meta">AI/heuristics only structure supplied answers — missing answers are not invented.</p>
          <textarea
            className="ci-transcript-editor"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="Paste the completed Pathfinder Client Intake Form…"
          />
          <button
            type="button"
            className="btn primary"
            disabled={busy || !paste.trim()}
            onClick={() => {
              const mapped = parsePastedIntakeToAnswers(paste);
              setAnswers(mapped);
              void runAnalyse(mapped, 'paste');
            }}
          >
            {busy ? 'Structuring…' : 'Structure & Analyse (core only)'}
          </button>
        </section>
      )}

      {mode === 'manual' && (
        <section className="pf-surface-card">
          <h3>Therapist manual entry</h3>
          <div className="pf-intake-fields">
            {PATHFINDER_INTAKE_QUESTIONS.filter((q) => !q.optionalFuture).map((q) => (
              <label key={q.id} className="field">
                <span>
                  {INTAKE_SECTION_LABELS[q.sectionId]} — {q.label}
                </span>
                <textarea
                  rows={2}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={() => void runAnalyse(answers, 'therapist-manual')}
          >
            {busy ? 'Analysing…' : 'Analyse Intake (core only)'}
          </button>
        </section>
      )}

      {mode === 'view' && (
        <>
          {(client.rawIntakeSubmissions?.length ?? 0) > 0 && (
            <details className="pf-intake-section">
              <summary>Original intake (immutable raw)</summary>
              <pre className="pf-raw-intake">
                {JSON.stringify(client.rawIntakeSubmissions?.[client.rawIntakeSubmissions.length - 1], null, 2)}
              </pre>
            </details>
          )}

          {client.structuredIntake && (
            <details className="pf-intake-section" open>
              <summary>Structured intake</summary>
              <pre className="pf-raw-intake">{JSON.stringify(client.structuredIntake, null, 2)}</pre>
            </details>
          )}

          <section className="pf-surface-card">
            <h3>INITIAL CLINICAL UNDERSTANDING</h3>
            <p className="pf-meta">Core only — Approve / Edit / Reject before formulation updates.</p>
            {REVIEW_SECTIONS.map((sec) => {
              const items = findings.filter((f) => sec.cats.includes(f.category));
              if (!items.length) return null;
              return (
                <details key={sec.title} className="pf-intake-section" open>
                  <summary>{sec.title}</summary>
                  <ul className="pf-finding-list">
                    {items.map((f) => (
                      <li key={f.id}>
                        <div className="pf-finding-main">
                          {f.clientStatement && (
                            <p>
                              <em>Client statement:</em> “{f.clientStatement}”
                            </p>
                          )}
                          <strong>{f.therapistEditedValue ?? f.text}</strong>
                          <span className="pf-meta">{f.framing.replace(/-/g, ' ')}</span>
                          {f.evidence[0] && (
                            <span className="pf-meta">
                              Source: Intake → {f.evidence[0].sectionLabel} · “{f.evidence[0].questionLabel}” ·
                              Response: {f.evidence[0].clientResponse.slice(0, 120)}
                              {f.evidence[0].clientResponse.length > 120 ? '…' : ''}
                            </span>
                          )}
                          {f.provenanceStatus === 'corroborated' && (
                            <span className="pf-meta">Already known / corroborated</span>
                          )}
                        </div>
                        <div className="stack-btns horizontal wrap">
                          <button
                            type="button"
                            className="btn tertiary"
                            onClick={() =>
                              setFindings((prev) =>
                                prev.map((x) => (x.id === f.id ? { ...x, reviewStatus: 'approved' } : x)),
                              )
                            }
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => {
                              const edited = window.prompt('Edit finding', f.therapistEditedValue ?? f.text);
                              if (edited == null) return;
                              setFindings((prev) =>
                                prev.map((x) =>
                                  x.id === f.id
                                    ? { ...x, reviewStatus: 'edited', therapistEditedValue: edited }
                                    : x,
                                ),
                              );
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() =>
                              setFindings((prev) =>
                                prev.map((x) => (x.id === f.id ? { ...x, reviewStatus: 'rejected' } : x)),
                              )
                            }
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
            {!findings.length && (
              <div className="pf-empty">
                <p>No intake analysis yet. Paste or enter the Pathfinder Client Intake Form.</p>
                <button type="button" className="btn primary" onClick={() => setMode('paste')}>
                  Add Intake
                </button>
              </div>
            )}
          </section>

          {explorePain && (
            <section className="pf-surface-card">
              <h3>Possible complementary lenses</h3>
              <p>
                <strong>Pain / Somatic</strong> — Potentially relevant because chronic pain was reported.
                This is a perspective, not a treatment recommendation. Pathfinder does not activate the
                Pain protocol automatically.
              </p>
              <p className="hint">Explore Pain / Somatic Lens — therapist decides.</p>
            </section>
          )}

          <section className="pf-surface-card">
            <h3>Current Treatment Approach</h3>
            <label className="field">
              <span>Approach (default: Not yet decided)</span>
              <select
                value={approach}
                onChange={(e) => setApproach(e.target.value as PrimaryTreatmentApproach)}
              >
                {(
                  [
                    'unspecified',
                    'transactional-analysis',
                    'emdr',
                    'integrated-ta-emdr',
                    'general-integrative',
                    'pain',
                    'other',
                  ] as PrimaryTreatmentApproach[]
                ).map((a) => (
                  <option key={a} value={a}>
                    {a === 'integrated-ta-emdr' ? 'Integrated' : PRIMARY_APPROACH_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn primary" disabled={busy || !findings.length} onClick={() => void applyReview()}>
              {busy ? 'Saving…' : 'Approve into Core Formulation & First Session Prep'}
            </button>
          </section>

          {prepText && (
            <section className="pf-surface-card">
              <h3>FIRST SESSION PREPARATION</h3>
              <p className="pf-meta">Pre-session information from client intake.</p>
              <pre className="pf-session-prep">{prepText}</pre>
            </section>
          )}
        </>
      )}
    </div>
  );
}
