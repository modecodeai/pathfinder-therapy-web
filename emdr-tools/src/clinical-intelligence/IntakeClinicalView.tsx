import { useMemo, useState } from 'react';
import type { ClientRecord } from './types';
import {
  INTAKE_SECTION_LABELS,
  INTAKE_CLINICAL_STATUS_LABELS,
  PATHFINDER_INTAKE_FORM_VERSION,
  PATHFINDER_INTAKE_QUESTIONS,
  answersToStructuredIntake,
  canApproveIntoFormulation,
  isExtractionConfirmedStatus,
  type IntakeAnswerMap,
  type IntakeClinicalStatus,
} from './lib/pathfinderIntakeForm';
import {
  analyseIntakeCoreOnly,
  approvedFindingsToCore,
  type IntakeCoreFinding,
} from './lib/intakeReasoning';
import { analyseConfirmedIntake } from './lib/intakeAnalysisPipeline';
import { buildSemanticClinicalEvidence, type ClinicalEvidence } from './lib/intakeSemanticEvidence';
import { extractedToStructuredIntake } from './lib/intakeExtraction';
import {
  buildFirstSessionPreparation,
  firstSessionPreparationPlainText,
} from './lib/firstSessionPrep';
import { extractIntakeFromPaste, patchClient } from './lib/api';
import type { PrimaryTreatmentApproach } from './clinicalReasoning';
import { setPrimaryTreatmentApproach } from './lib/lensGovernance';
import {
  INTAKE_READER_VERSION,
  hasCriticalExtractionErrors,
  type ExtractedIntake,
  type IntakeExtractionRecord,
  type IntakeExtractionWarning,
} from './lib/intakeExtraction';
import { findingsEligibleForApproveAllConfirmed } from './lib/initialClinicalBrief';
import { InitialClinicalReview } from './components/InitialClinicalReview';

type ViewMode = 'view' | 'paste' | 'manual' | 'clinical-review';

function rawTextFromClient(client: ClientRecord): string | null {
  const raws = client.rawIntakeSubmissions ?? [];
  const last = raws[raws.length - 1];
  if (!last) return client.intake?.rawPaste ?? null;
  if ('text' in last.rawPayload && typeof last.rawPayload.text === 'string') return last.rawPayload.text;
  if (client.intake?.rawPaste) return client.intake.rawPaste;
  return JSON.stringify(last.rawPayload, null, 2);
}

/**
 * Clinician intake workspace — Initial Clinical Review is person-first.
 * Extraction architecture is unchanged.
 */
export function IntakeClinicalView({
  client,
  onClientUpdate,
}: {
  client: ClientRecord;
  onClientUpdate?: (c: ClientRecord) => void;
}) {
  const defaultMode = (): ViewMode => {
    const s = client.intakeClinicalStatus;
    if (s === 'extraction-ready' || s === 'clinical-reasoning-ready' || s === 'ai-review-ready') {
      return 'clinical-review';
    }
    if (s === 'therapist-reviewed') return 'clinical-review';
    return 'view';
  };

  const [mode, setMode] = useState<ViewMode>(defaultMode);
  const [paste, setPaste] = useState('');
  const [answers, setAnswers] = useState<IntakeAnswerMap>({});
  const [extracted, setExtracted] = useState<ExtractedIntake | null>(
    client.intakeExtraction?.extracted ?? null,
  );
  const [warnings, setWarnings] = useState<IntakeExtractionWarning[]>(
    client.intakeExtraction?.warnings ?? [],
  );
  const [clinicalEvidence, setClinicalEvidence] = useState<ClinicalEvidence[]>(
    client.clinicalEvidence ?? [],
  );
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [findings, setFindings] = useState<IntakeCoreFinding[]>(client.intakeCoreFindings ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approach, setApproach] = useState<PrimaryTreatmentApproach>(
    client.primaryTreatmentApproach ?? 'unspecified',
  );
  const [, setPrepText] = useState(
    client.firstSessionPreparation
      ? firstSessionPreparationPlainText(client.firstSessionPreparation)
      : '',
  );

  const status: IntakeClinicalStatus = client.intakeClinicalStatus ?? 'not-requested';
  const extractionConfirmed = isExtractionConfirmedStatus(status);
  const criticalErrors = hasCriticalExtractionErrors(warnings);
  const needsConfirm =
    Boolean(extracted || client.intakeExtraction?.extracted) &&
    !client.intakeExtraction?.confirmed &&
    (status === 'extraction-ready' || !extractionConfirmed);

  const activeExtracted = extracted ?? client.intakeExtraction?.extracted ?? null;

  /** Preview semantic evidence before confirm so the brief is clinically useful immediately. */
  const previewEvidence = useMemo(() => {
    if (clinicalEvidence.length) return clinicalEvidence;
    if (client.clinicalEvidence?.length) return client.clinicalEvidence;
    if (!activeExtracted) return [];
    const { answerMap, structured } = extractedToStructuredIntake(activeExtracted);
    return buildSemanticClinicalEvidence({
      answers: answerMap,
      structured,
      extracted: activeExtracted,
    }).evidence;
  }, [clinicalEvidence, client.clinicalEvidence, activeExtracted]);

  const persist = async (patch: Partial<ClientRecord>) => {
    const res = await patchClient(client.id, patch);
    if (!res.ok || !res.client) throw new Error(res.error ?? 'Save failed');
    onClientUpdate?.(res.client);
    return res.client;
  };

  const storeRawIfNeeded = async (source: 'paste' | 'therapist-manual', textOrAnswers: string | IntakeAnswerMap) => {
    const rawId = `raw_${Date.now().toString(36)}`;
    const rawSubmission = {
      id: rawId,
      clientId: client.id,
      formVersion: PATHFINDER_INTAKE_FORM_VERSION,
      submittedAt: new Date().toISOString(),
      source: source === 'paste' ? ('paste' as const) : ('therapist-manual' as const),
      rawPayload: source === 'paste' ? { text: textOrAnswers as string } : (textOrAnswers as IntakeAnswerMap),
      privacyPolicyVersion: 'privacy-v1',
      consentVersion: 'privacy-v1',
    };
    await persist({
      rawIntakeSubmissions: [...(client.rawIntakeSubmissions ?? []), rawSubmission],
      intakeClinicalStatus: 'raw-received',
      intakeStatus: 'submitted',
      intake: {
        fields: client.intake?.fields ?? {},
        rawPaste: source === 'paste' ? (textOrAnswers as string) : undefined,
        updatedAt: new Date().toISOString(),
        extractedFindings: [],
      },
    });
    return rawId;
  };

  const runExtract = async (rawText: string, opts?: { rawSubmissionId?: string; skipNewRaw?: boolean }) => {
    setBusy(true);
    setError(null);
    setExtractionFailed(false);
    try {
      let rawSubmissionId = opts?.rawSubmissionId;
      if (!opts?.skipNewRaw) {
        rawSubmissionId = await storeRawIfNeeded('paste', rawText);
      }
      await persist({ intakeClinicalStatus: 'extraction-pending' });

      const res = await extractIntakeFromPaste({ rawText, clientId: client.id });
      if (!res.success || !res.extracted || !res.structuredIntake || !res.answerMap) {
        setExtractionFailed(true);
        setError(res.error ?? "We couldn't reliably structure this intake submission.");
        await persist({ intakeClinicalStatus: 'raw-received' });
        return;
      }

      const record: IntakeExtractionRecord = {
        extractorVersion: res.extractorVersion ?? INTAKE_READER_VERSION,
        extractedAt: new Date().toISOString(),
        extracted: res.extracted,
        structuredIntake: res.structuredIntake,
        answerMap: res.answerMap,
        warnings: res.warnings ?? res.extracted.extractionWarnings ?? [],
        confirmed: false,
        rawSubmissionId,
        model: res.model,
      };

      const history = [
        ...(client.intakeExtraction
          ? [{ ...client.intakeExtraction, superseded: true as const }]
          : []),
        ...(client.intakeExtractionHistory ?? []),
      ];

      setExtracted(res.extracted);
      setWarnings(record.warnings);
      setFindings([]);
      setClinicalEvidence([]);
      const next = await persist({
        structuredIntake: res.structuredIntake,
        intakeExtraction: record,
        intakeExtractionHistory: history,
        intakeCoreFindings: [],
        clinicalEvidence: [],
        intakeClinicalStatus: 'extraction-ready',
        intakeStatus: 'submitted',
        email: res.extracted.personalInformation.email ?? client.email,
        phone: res.extracted.personalInformation.telephone ?? client.phone,
        preferredName: res.extracted.personalInformation.preferredName ?? client.preferredName,
        dateOfBirth: res.extracted.personalInformation.dateOfBirth ?? client.dateOfBirth,
        pronouns: res.extracted.personalInformation.pronouns ?? client.pronouns,
        presentingProblem: res.extracted.presentingProblem.summary ?? client.presentingProblem,
        intake: {
          fields: {
            presentingProblem: res.extracted.presentingProblem.summary ?? undefined,
            goalsForTherapy: res.answerMap.therapyGoals,
            traumaHistory: res.answerMap.trauma,
            strengthsResources: res.answerMap.strengths,
          },
          rawPaste: rawText,
          updatedAt: new Date().toISOString(),
          extractedFindings: [],
        },
      });
      setMode('clinical-review');
      onClientUpdate?.(next);
    } catch (e) {
      setExtractionFailed(true);
      setError(e instanceof Error ? e.message : "We couldn't reliably structure this intake submission.");
      try {
        await persist({ intakeClinicalStatus: 'raw-received' });
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmExtractionAndAnalyse = async () => {
    if (!activeExtracted) return;
    setBusy(true);
    setError(null);
    try {
      const { structured, answerMap } = extractedToStructuredIntake(activeExtracted);
      const analysis = analyseConfirmedIntake({
        answers: answerMap,
        structured,
        extracted: activeExtracted,
        rawSubmissionId: client.intakeExtraction?.rawSubmissionId,
      });
      const record: IntakeExtractionRecord = {
        ...(client.intakeExtraction ?? {
          extractorVersion: INTAKE_READER_VERSION,
          extractedAt: new Date().toISOString(),
          answerMap,
          structuredIntake: structured,
          warnings,
          rawSubmissionId: undefined,
        }),
        extracted: activeExtracted,
        structuredIntake: structured,
        answerMap,
        warnings: activeExtracted.extractionWarnings ?? warnings,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      };
      setFindings(analysis.findings);
      setClinicalEvidence(analysis.clinicalEvidence);
      setAnswers(answerMap);
      const next = await persist({
        structuredIntake: structured,
        intakeExtraction: record,
        intakeCoreFindings: analysis.findings,
        clinicalEvidence: analysis.clinicalEvidence,
        intakeClinicalStatus: 'clinical-reasoning-ready',
        intakeStatus: 'submitted',
        presentingProblem: structured.presentingProblem.mainProblems ?? client.presentingProblem,
        intake: {
          fields: {
            presentingProblem: structured.presentingProblem.mainProblems,
            goalsForTherapy: structured.goals.clientStatedGoals,
            traumaHistory: structured.traumaHistory.trauma,
            strengthsResources: structured.strengths.strengths,
          },
          rawPaste: client.intake?.rawPaste ?? (paste || undefined),
          updatedAt: new Date().toISOString(),
          extractedFindings: [],
          riskReviewRequired: analysis.clinicalReviewRequired,
        },
      });
      setMode('clinical-review');
      onClientUpdate?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm extraction');
    } finally {
      setBusy(false);
    }
  };

  const runManualAnalyse = async (answerMap: IntakeAnswerMap) => {
    setBusy(true);
    setError(null);
    try {
      const rawId = await storeRawIfNeeded('therapist-manual', answerMap);
      const structured = answersToStructuredIntake(answerMap);
      const analysis = analyseIntakeCoreOnly({
        answers: answerMap,
        structured,
        rawSubmissionId: rawId,
      });
      setFindings(analysis.findings);
      setExtracted(null);
      const next = await persist({
        structuredIntake: structured,
        intakeCoreFindings: analysis.findings,
        intakeClinicalStatus: 'clinical-reasoning-ready',
        intakeStatus: 'submitted',
        email: structured.personalInformation.email ?? client.email,
        phone: structured.personalInformation.telephone ?? client.phone,
        preferredName: structured.personalInformation.preferredName ?? client.preferredName,
        dateOfBirth: structured.personalInformation.dateOfBirth ?? client.dateOfBirth,
        pronouns: structured.personalInformation.pronouns ?? client.pronouns,
        presentingProblem: structured.presentingProblem.mainProblems ?? client.presentingProblem,
        intake: {
          fields: {
            presentingProblem: structured.presentingProblem.mainProblems,
            goalsForTherapy: structured.goals.clientStatedGoals,
            traumaHistory: structured.traumaHistory.trauma,
            strengthsResources: structured.strengths.strengths,
          },
          updatedAt: new Date().toISOString(),
          extractedFindings: [],
          riskReviewRequired: analysis.clinicalReviewRequired,
        },
      });
      setMode('clinical-review');
      onClientUpdate?.(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse failed');
    } finally {
      setBusy(false);
    }
  };

  const reExtract = async () => {
    const text = rawTextFromClient(client) ?? paste;
    if (!text?.trim()) {
      setError('No immutable raw intake found to re-extract.');
      return;
    }
    const lastRaw = client.rawIntakeSubmissions?.[client.rawIntakeSubmissions.length - 1];
    await runExtract(text, { skipNewRaw: true, rawSubmissionId: lastRaw?.id });
  };

  const saveReview = async () => {
    setBusy(true);
    setError(null);
    try {
      await persist({ intakeCoreFindings: findings, clinicalEvidence: clinicalEvidence.length ? clinicalEvidence : previewEvidence });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save review');
    } finally {
      setBusy(false);
    }
  };

  const applyReview = async (findingsOverride?: IntakeCoreFinding[]) => {
    if (!canApproveIntoFormulation(status) && status !== 'clinical-reasoning-ready' && status !== 'ai-review-ready') {
      setError('Confirm initial information before approving into Core Formulation.');
      return;
    }
    if (criticalErrors) {
      setError('Resolve critical extraction errors before approving into formulation.');
      return;
    }
    const useFindings = findingsOverride ?? findings;
    setBusy(true);
    setError(null);
    try {
      const core = approvedFindingsToCore(useFindings, client.coreFormulation);
      const prep = buildFirstSessionPreparation(
        { ...client, intakeCoreFindings: useFindings },
        useFindings,
      );
      setPrepText(firstSessionPreparationPlainText(prep));
      let nextClient = await persist({
        intakeCoreFindings: useFindings,
        clinicalEvidence: clinicalEvidence.length ? clinicalEvidence : previewEvidence,
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
        primaryClinicalLens:
          client.primaryClinicalLens ??
          (approach === 'transactional-analysis' || approach === 'integrated-ta-emdr'
            ? 'transactional-analysis'
            : approach === 'emdr' || approach === 'pain'
              ? 'emdr'
              : approach === 'general-integrative'
                ? 'transactional-analysis'
                : 'none'),
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

  const showClinicalReview =
    mode === 'clinical-review' && Boolean(activeExtracted || findings.length);

  return (
    <div className="pf-intake-clinical">
      <section className="pf-surface-card">
        <h2>Intake</h2>
        <p className="pf-meta">
          Status: <strong>{INTAKE_CLINICAL_STATUS_LABELS[status]}</strong>
          {' · '}Form: {client.structuredIntake?.formVersion ?? PATHFINDER_INTAKE_FORM_VERSION}
        </p>
        <p className="hint">
          Confidential client information — kept separate from clinical session notes.
        </p>
        <div className="clients-filters" role="group" aria-label="Intake actions">
          <button
            type="button"
            className={mode === 'clinical-review' || mode === 'view' ? 'is-active' : ''}
            onClick={() => setMode(activeExtracted || findings.length ? 'clinical-review' : 'view')}
          >
            Initial Clinical Review
          </button>
          <button type="button" className={mode === 'paste' ? 'is-active' : ''} onClick={() => setMode('paste')}>
            Paste intake
          </button>
          <button type="button" className={mode === 'manual' ? 'is-active' : ''} onClick={() => setMode('manual')}>
            Manual entry
          </button>
          {(client.rawIntakeSubmissions?.length ?? 0) > 0 && (
            <button type="button" className="btn tertiary" disabled={busy} onClick={() => void reExtract()}>
              {busy ? 'Re-extracting…' : 'Re-extract Intake'}
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="ci-error-banner" role="alert">
          <p>{error}</p>
          {extractionFailed && (
            <div className="stack-btns horizontal wrap">
              <button
                type="button"
                className="btn primary"
                disabled={busy || !(paste.trim() || rawTextFromClient(client))}
                onClick={() =>
                  void runExtract(paste.trim() || rawTextFromClient(client) || '', {
                    skipNewRaw: Boolean(rawTextFromClient(client)),
                  })
                }
              >
                Try Again
              </button>
              <button type="button" className="btn tertiary" onClick={() => setMode('manual')}>
                Enter Manually
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'paste' && (
        <section className="pf-surface-card">
          <h3>Paste completed intake</h3>
          <p className="pf-meta">
            Intake Reader extracts what the client wrote. Clinical review follows confirmation.
          </p>
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
            onClick={() => void runExtract(paste)}
          >
            {busy ? 'Extracting…' : 'Extract Intake'}
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
            onClick={() => void runManualAnalyse(answers)}
          >
            {busy ? 'Analysing…' : 'Confirm manual entry & Analyse (core only)'}
          </button>
        </section>
      )}

      {showClinicalReview && (
        <InitialClinicalReview
          client={client}
          extracted={activeExtracted}
          evidence={previewEvidence}
          findings={findings}
          warnings={warnings.length ? warnings : activeExtracted?.extractionWarnings ?? []}
          busy={busy}
          needsConfirm={needsConfirm}
          approach={approach}
          onApproachChange={setApproach}
          onConfirmAndAnalyse={() => void confirmExtractionAndAnalyse()}
          onFindingsChange={(next) => {
            setFindings(next);
            // Persist canonical review state so counters / prep stay in sync without reload
            void patchClient(client.id, { intakeCoreFindings: next }).then((res) => {
              if (res.client) onClientUpdate?.(res.client);
            });
          }}
          onSaveReview={() => void saveReview()}
          onApproveAndPrepare={() => {
            const eligible = new Set(findingsEligibleForApproveAllConfirmed(findings));
            const next = findings.map((f) =>
              eligible.has(f.id) ? { ...f, reviewStatus: 'approved' as const } : f,
            );
            setFindings(next);
            void applyReview(next);
          }}
          onMarkRiskReviewed={() => {
            setFindings((prev) => {
              const next = prev.map((f) =>
                f.category === 'risk-clinical-review' ? { ...f, reviewStatus: 'approved' as const } : f,
              );
              void patchClient(client.id, { intakeCoreFindings: next }).then((res) => {
                if (res.client) onClientUpdate?.(res.client);
              });
              return next;
            });
          }}
          onAddSafetyQuestion={() => {
            const title = 'Clarify current safety / risk status';
            setFindings((prev) => {
              if (
                prev.some(
                  (f) =>
                    f.category === 'outstanding-question' &&
                    /safety|risk status/i.test(f.text),
                )
              ) {
                return prev;
              }
              const next = [
                ...prev,
                {
                  id: `icf_safety_q_${Date.now().toString(36)}`,
                  category: 'outstanding-question' as const,
                  text: title,
                  framing: 'information-requiring-clarification' as const,
                  evidence: [],
                  provenanceStatus: 'single' as const,
                  reviewStatus: 'pending' as const,
                },
              ];
              void patchClient(client.id, { intakeCoreFindings: next }).then((res) => {
                if (res.client) onClientUpdate?.(res.client);
              });
              return next;
            });
          }}
          rawText={rawTextFromClient(client)}
        />
      )}

      {mode === 'view' && !showClinicalReview && (
        <section className="pf-surface-card">
          <div className="pf-empty">
            <p>No intake yet. Paste the Pathfinder Client Intake Form to begin Initial Clinical Review.</p>
            <button type="button" className="btn primary" onClick={() => setMode('paste')}>
              Add Intake
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
