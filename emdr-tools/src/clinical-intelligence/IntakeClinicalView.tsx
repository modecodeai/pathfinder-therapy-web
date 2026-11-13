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
  type IntakeFindingCategory,
} from './lib/intakeReasoning';
import {
  buildFirstSessionPreparation,
  firstSessionPreparationPlainText,
} from './lib/firstSessionPrep';
import { extractIntakeFromPaste, patchClient } from './lib/api';
import { PRIMARY_APPROACH_LABELS, type PrimaryTreatmentApproach } from './clinicalReasoning';
import { setPrimaryTreatmentApproach } from './lib/lensGovernance';
import {
  INTAKE_READER_VERSION,
  displayExtractedValue,
  extractedToStructuredIntake,
  hasCriticalExtractionErrors,
  type ExtractedIntake,
  type IntakeExtractionRecord,
  type IntakeExtractionWarning,
} from './lib/intakeExtraction';

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

type ViewMode = 'view' | 'paste' | 'manual' | 'extraction-review';

function FieldRow({ label, value }: { label: string; value: string }) {
  const uncertain = value === 'Not established';
  return (
    <div className="pf-extraction-field">
      <dt>{label}</dt>
      <dd className={uncertain ? 'pf-extraction-unknown' : undefined}>{value}</dd>
    </div>
  );
}

function ExtractionReviewSections({
  extracted,
  onEditField,
}: {
  extracted: ExtractedIntake;
  onEditField: (path: string, current: string) => void;
}) {
  const p = extracted.personalInformation;
  const r = extracted.referralInformation;
  const pp = extracted.presentingProblem;
  const g = extracted.goals;
  const m = extracted.medicalHistory;
  const psy = extracted.psychologicalHistory;
  const life = extracted.lifestyleAndSymptoms;
  const soc = extracted.psychosocialFactors;
  const dev = extracted.developmentalHistory;
  const tr = extracted.traumaHistory;
  const id = extracted.identityAndSelfDescription;

  const sections: Array<{
    title: string;
    rows: Array<{ label: string; path: string; value: string }>;
  }> = [
    {
      title: 'Personal Details',
      rows: [
        { label: 'Full name', path: 'personalInformation.fullName', value: displayExtractedValue(p.fullName) },
        { label: 'Preferred name', path: 'personalInformation.preferredName', value: displayExtractedValue(p.preferredName) },
        { label: 'Pronouns', path: 'personalInformation.pronouns', value: displayExtractedValue(p.pronouns) },
        { label: 'Date of birth', path: 'personalInformation.dateOfBirth', value: displayExtractedValue(p.dateOfBirth) },
        { label: 'Current age', path: 'personalInformation.currentAge', value: displayExtractedValue(p.currentAge) },
        { label: 'Email', path: 'personalInformation.email', value: displayExtractedValue(p.email) },
        { label: 'Telephone', path: 'personalInformation.telephone', value: displayExtractedValue(p.telephone) },
        { label: 'Home address', path: 'personalInformation.homeAddress', value: displayExtractedValue(p.homeAddress) },
      ],
    },
    {
      title: 'Presenting Concerns',
      rows: [
        { label: 'Summary', path: 'presentingProblem.summary', value: displayExtractedValue(pp.summary) },
        { label: 'Severity', path: 'presentingProblem.severity', value: displayExtractedValue(pp.severity) },
        {
          label: 'Why this therapist',
          path: 'referralInformation.whyThisTherapist',
          value: displayExtractedValue(r.whyThisTherapist),
        },
        { label: 'Referral source', path: 'referralInformation.referralSource', value: displayExtractedValue(r.referralSource) },
        { label: 'GP practice', path: 'referralInformation.gpPractice', value: displayExtractedValue(r.gpPractice) },
      ],
    },
    {
      title: 'Goals',
      rows: [
        { label: 'Therapy goals', path: 'goals.therapyGoals', value: displayExtractedValue(g.therapyGoals) },
      ],
    },
    {
      title: 'Medical / Psychological History',
      rows: [
        {
          label: 'Diagnosed conditions',
          path: 'medicalHistory.diagnosedConditions',
          value: displayExtractedValue(m.diagnosedConditions),
        },
        {
          label: 'Medication',
          path: 'medicalHistory.prescribedMedication',
          value: displayExtractedValue(m.prescribedMedication),
        },
        { label: 'Chronic pain', path: 'medicalHistory.chronicPain', value: displayExtractedValue(m.chronicPain) },
        {
          label: 'Previous therapy',
          path: 'psychologicalHistory.previousTherapyDetails',
          value: displayExtractedValue(psy.previousTherapyDetails ?? boolDisplay(psy.previousTherapy)),
        },
        {
          label: 'Family mental health',
          path: 'psychologicalHistory.familyMentalHealthDetails',
          value: displayExtractedValue(psy.familyMentalHealthDetails ?? boolDisplay(psy.familyMentalHealthHistory)),
        },
      ],
    },
    {
      title: 'Lifestyle / Symptoms',
      rows: [
        { label: 'Sleep problems', path: 'lifestyleAndSymptoms.sleepProblems', value: displayExtractedValue(life.sleepProblems) },
        { label: 'Sleep rating', path: 'lifestyleAndSymptoms.sleepRating', value: displayExtractedValue(life.sleepRating) },
        {
          label: 'Exercise',
          path: 'lifestyleAndSymptoms.exerciseFrequency',
          value: displayExtractedValue(
            [life.exerciseFrequency, ...(life.exerciseTypes ?? [])].filter(Boolean).join(' · ') || null,
          ),
        },
        {
          label: 'Depression / grief',
          path: 'lifestyleAndSymptoms.depressionGriefDetails',
          value: displayExtractedValue(life.depressionGriefDetails),
        },
        {
          label: 'Anxiety',
          path: 'lifestyleAndSymptoms.anxietyDetails',
          value: displayExtractedValue(life.anxietyDetails),
        },
        {
          label: 'Food / body image',
          path: 'lifestyleAndSymptoms.foodBodyImageDetails',
          value: displayExtractedValue(life.foodBodyImageDetails),
        },
        {
          label: 'Relationship length',
          path: 'lifestyleAndSymptoms.relationshipLength',
          value: displayExtractedValue(life.relationshipLength),
        },
      ],
    },
    {
      title: 'Relationships / Social',
      rows: [
        { label: 'Household', path: 'psychosocialFactors.household', value: displayExtractedValue(soc.household) },
        { label: 'Occupation', path: 'psychosocialFactors.occupation', value: displayExtractedValue(soc.occupation) },
        {
          label: 'Family conflict',
          path: 'psychosocialFactors.familyConflict',
          value: displayExtractedValue(soc.familyConflict),
        },
        {
          label: 'Social network',
          path: 'psychosocialFactors.socialNetwork',
          value: displayExtractedValue(soc.socialNetwork),
        },
      ],
    },
    {
      title: 'Childhood / Trauma',
      rows: [
        {
          label: 'Childhood',
          path: 'developmentalHistory.childhoodDescription',
          value: displayExtractedValue(dev.childhoodDescription),
        },
        {
          label: 'School',
          path: 'developmentalHistory.schoolExperience',
          value: displayExtractedValue(dev.schoolExperience),
        },
        {
          label: 'Traumatic events',
          path: 'traumaHistory.traumaticEventDetails',
          value: displayExtractedValue(tr.traumaticEventDetails),
        },
        {
          label: 'Childhood / adolescent abuse',
          path: 'traumaHistory.abuseDetails',
          value: displayExtractedValue(tr.abuseDetails),
        },
      ],
    },
    {
      title: 'Strengths / Self-description',
      rows: [
        {
          label: 'Five words',
          path: 'identityAndSelfDescription.fiveWords',
          value: displayExtractedValue(id.fiveWords),
        },
        {
          label: 'Most important thing',
          path: 'identityAndSelfDescription.mostImportantThing',
          value: displayExtractedValue(id.mostImportantThing),
        },
        {
          label: 'Significant achievement',
          path: 'identityAndSelfDescription.significantAchievement',
          value: displayExtractedValue(id.significantAchievement),
        },
        { label: 'Strengths', path: 'strengths.strengths', value: displayExtractedValue(extracted.strengths.strengths) },
        {
          label: 'Weaknesses / vulnerabilities',
          path: 'vulnerabilities.weaknesses',
          value: displayExtractedValue(extracted.vulnerabilities.weaknesses),
        },
      ],
    },
  ];

  return (
    <>
      {sections.map((sec) => (
        <details key={sec.title} className="pf-intake-section" open>
          <summary>{sec.title}</summary>
          <dl className="pf-extraction-dl">
            {sec.rows.map((row) => (
              <div key={row.path} className="pf-extraction-row">
                <FieldRow label={row.label} value={row.value} />
                <button type="button" className="btn ghost" onClick={() => onEditField(row.path, row.value)}>
                  Edit
                </button>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </>
  );
}

function boolDisplay(v: boolean | null): string | null {
  if (v === null) return null;
  return v ? 'Yes' : 'No';
}

function setByPath(obj: ExtractedIntake, path: string, value: string): ExtractedIntake {
  const next = structuredClone(obj);
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = next;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]!];
  const leaf = parts[parts.length - 1]!;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'Not established') {
    cur[leaf] = null;
  } else if (leaf === 'therapyGoals' || leaf === 'fiveWords' || leaf === 'exerciseTypes' || leaf === 'diagnosedConditions' || leaf === 'prescribedMedication') {
    cur[leaf] = trimmed.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  } else if (
    ['currentAge', 'severity', 'physicalHealthRating', 'sleepRating', 'relationshipRating', 'familyRelationshipRating'].includes(
      leaf,
    )
  ) {
    const n = Number(trimmed);
    cur[leaf] = Number.isFinite(n) ? n : null;
  } else if (
    [
      'permissionToCall',
      'permissionToEmail',
      'currentInvestigations',
      'chronicPain',
      'previousTherapy',
      'psychiatricMedicationHistory',
      'familyMentalHealthHistory',
      'sleepProblems',
      'foodBodyImageIssues',
      'depressionGriefSadness',
      'anxietyPanicPhobias',
      'alcoholDrugs',
      'romanticRelationship',
      'familyConflict',
      'socialNetwork',
      'enjoysWork',
      'religiousSpiritual',
      'traumaticEvent',
      'childhoodAdolescentAbuse',
    ].includes(leaf)
  ) {
    const lower = trimmed.toLowerCase();
    if (lower === 'yes' || lower === 'true') cur[leaf] = true;
    else if (lower === 'no' || lower === 'false') cur[leaf] = false;
    else cur[leaf] = null;
  } else {
    cur[leaf] = trimmed;
  }
  return next;
}

function rawTextFromClient(client: ClientRecord): string | null {
  const raws = client.rawIntakeSubmissions ?? [];
  const last = raws[raws.length - 1];
  if (!last) return client.intake?.rawPaste ?? null;
  if ('text' in last.rawPayload && typeof last.rawPayload.text === 'string') return last.rawPayload.text;
  if (client.intake?.rawPaste) return client.intake.rawPaste;
  return JSON.stringify(last.rawPayload, null, 2);
}

/**
 * Clinician intake workspace — extraction review and clinical reasoning remain distinct.
 */
export function IntakeClinicalView({
  client,
  onClientUpdate,
}: {
  client: ClientRecord;
  onClientUpdate?: (c: ClientRecord) => void;
}) {
  const [mode, setMode] = useState<ViewMode>(
    client.intakeClinicalStatus === 'extraction-ready' ? 'extraction-review' : 'view',
  );
  const [paste, setPaste] = useState('');
  const [answers, setAnswers] = useState<IntakeAnswerMap>({});
  const [extracted, setExtracted] = useState<ExtractedIntake | null>(
    client.intakeExtraction?.extracted ?? null,
  );
  const [warnings, setWarnings] = useState<IntakeExtractionWarning[]>(
    client.intakeExtraction?.warnings ?? [],
  );
  const [extractionFailed, setExtractionFailed] = useState(false);
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
  const extractionConfirmed = isExtractionConfirmedStatus(status);
  const criticalErrors = hasCriticalExtractionErrors(warnings);
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
        ...(client.intakeExtraction && !client.intakeExtraction.confirmed
          ? [{ ...client.intakeExtraction, superseded: true }]
          : client.intakeExtraction
            ? [{ ...client.intakeExtraction, superseded: true }]
            : []),
        ...(client.intakeExtractionHistory ?? []),
      ];

      setExtracted(res.extracted);
      setWarnings(record.warnings);
      setFindings([]);
      const next = await persist({
        structuredIntake: res.structuredIntake,
        intakeExtraction: record,
        intakeExtractionHistory: history,
        intakeCoreFindings: [],
        intakeClinicalStatus: 'extraction-ready',
        intakeStatus: 'submitted',
        // Do NOT mark therapist-reviewed; do not copy broken fields into identity blindly
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
      setMode('extraction-review');
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
    if (!extracted) return;
    setBusy(true);
    setError(null);
    try {
      const { structured, answerMap } = extractedToStructuredIntake(extracted);
      const analysis = analyseIntakeCoreOnly({
        answers: answerMap,
        structured,
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
        extracted,
        structuredIntake: structured,
        answerMap,
        warnings: extracted.extractionWarnings ?? warnings,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      };
      setFindings(analysis.findings);
      setAnswers(answerMap);
      const next = await persist({
        structuredIntake: structured,
        intakeExtraction: record,
        intakeCoreFindings: analysis.findings,
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
      setMode('view');
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
        intakeExtraction: {
          extractorVersion: 'manual-entry',
          extractedAt: new Date().toISOString(),
          extracted: {
            personalInformation: {
              fullName: answerMap.fullName ?? null,
              preferredName: answerMap.preferredName ?? null,
              pronouns: answerMap.pronouns ?? null,
              dateOfBirth: answerMap.dateOfBirth ?? null,
              currentAge: answerMap.currentAge ? Number(answerMap.currentAge) : null,
              homeAddress: answerMap.homeAddress ?? null,
              telephone: answerMap.telephone ?? null,
              permissionToCall: null,
              email: answerMap.email ?? null,
              permissionToEmail: null,
            },
            referralInformation: {
              gpPractice: answerMap.gpPractice ?? null,
              relationshipStatus: answerMap.relationshipStatus ?? null,
              referralSource: answerMap.referralSource ?? null,
              whyThisTherapist: answerMap.whyThisTherapist ?? null,
            },
            presentingProblem: {
              summary: answerMap.mainProblems ?? null,
              severity: answerMap.currentSeverity ? Number(answerMap.currentSeverity) : null,
            },
            goals: {
              therapyGoals: answerMap.therapyGoals
                ? answerMap.therapyGoals.split(/\n+/).map((s) => s.trim()).filter(Boolean)
                : null,
            },
            medicalHistory: {
              physicalHealthRating: null,
              diagnosedConditions: null,
              prescribedMedication: null,
              currentInvestigations: null,
              chronicPain: null,
            },
            psychologicalHistory: {
              previousTherapy: null,
              previousTherapyDetails: answerMap.previousTherapy ?? null,
              psychiatricMedicationHistory: null,
              familyMentalHealthHistory: null,
              familyMentalHealthDetails: null,
            },
            lifestyleAndSymptoms: {
              sleepProblems: null,
              sleepRating: null,
              exerciseFrequency: null,
              exerciseTypes: null,
              foodBodyImageIssues: null,
              foodBodyImageDetails: null,
              depressionGriefSadness: null,
              depressionGriefDetails: null,
              anxietyPanicPhobias: null,
              anxietyDetails: null,
              alcoholDrugs: null,
              alcoholDrugDetails: null,
              romanticRelationship: null,
              relationshipLength: null,
              relationshipRating: null,
            },
            psychosocialFactors: {
              household: answerMap.household ?? null,
              familyRelationshipRating: null,
              familyConflict: null,
              socialNetwork: null,
              socialisingFrequency: null,
              occupation: answerMap.occupation ?? null,
              enjoysWork: null,
              workStress: null,
              religiousSpiritual: null,
              faithDescription: null,
            },
            developmentalHistory: {
              childhoodDescription: answerMap.childhood ?? null,
              schoolExperience: answerMap.schoolExperience ?? null,
            },
            traumaHistory: {
              traumaticEvent: null,
              traumaticEventDetails: answerMap.trauma ?? null,
              childhoodAdolescentAbuse: null,
              abuseDetails: answerMap.childhoodAdolescentAbuse ?? null,
            },
            identityAndSelfDescription: {
              fiveWords: null,
              mostImportantThing: answerMap.mostImportantThingInLife ?? null,
              significantAchievement: answerMap.significantAchievement ?? null,
            },
            strengths: { strengths: answerMap.strengths ?? null },
            vulnerabilities: { weaknesses: answerMap.weaknesses ?? null },
            extractionWarnings: [],
          },
          structuredIntake: structured,
          answerMap,
          warnings: [],
          confirmed: true,
          confirmedAt: new Date().toISOString(),
          rawSubmissionId: rawId,
        },
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
      setMode('view');
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

  const applyReview = async () => {
    if (!canApproveIntoFormulation(status) || !extractionConfirmed) {
      setError('Confirm extraction before approving into Core Formulation.');
      return;
    }
    if (criticalErrors) {
      setError('Resolve critical extraction errors before approving into formulation.');
      return;
    }
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

  const approveDisabled =
    busy ||
    !findings.length ||
    !canApproveIntoFormulation(status) ||
    criticalErrors ||
    status === 'extraction-ready' ||
    status === 'raw-received' ||
    status === 'extraction-pending';

  return (
    <div className="pf-intake-clinical">
      <section className="pf-surface-card">
        <h2>Intake</h2>
        <p className="pf-meta">
          Status: <strong>{INTAKE_CLINICAL_STATUS_LABELS[status]}</strong>
          {' · '}Form version: {client.structuredIntake?.formVersion ?? PATHFINDER_INTAKE_FORM_VERSION}
          {client.intakeExtraction?.extractorVersion
            ? ` · Extractor: ${client.intakeExtraction.extractorVersion}`
            : ''}
        </p>
        <p className="hint">
          Intake record is confidential client information and is kept separate from clinical session notes.
          Document extraction and clinical reasoning are separate steps.
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
          <button
            type="button"
            className={mode === 'extraction-review' ? 'is-active' : ''}
            onClick={() => setMode('extraction-review')}
            disabled={!extracted && !client.intakeExtraction}
          >
            Extracted intake
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
                onClick={() => void runExtract(paste.trim() || rawTextFromClient(client) || '', { skipNewRaw: Boolean(rawTextFromClient(client)) })}
              >
                Try Again
              </button>
              <button type="button" className="btn tertiary" onClick={() => setMode('manual')}>
                Enter Manually
              </button>
              <button type="button" className="btn ghost" onClick={() => setMode('view')}>
                Review Original
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'paste' && (
        <section className="pf-surface-card">
          <h3>Paste completed intake</h3>
          <p className="pf-meta">
            OpenAI Intake Reader extracts what the client wrote. Clinical reasoning runs only after you confirm
            extraction.
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

      {mode === 'extraction-review' && (extracted || client.intakeExtraction?.extracted) && (
        <section className="pf-surface-card">
          <h3>Review extracted intake</h3>
          <p className="pf-meta">
            Confirm what the client wrote before clinical analysis. “Not established” means selection or answer
            could not be reliably determined.
          </p>
          {(warnings.length > 0 || (extracted ?? client.intakeExtraction!.extracted).extractionWarnings?.length > 0) && (
            <ul className="pf-extraction-warnings">
              {(warnings.length ? warnings : (extracted ?? client.intakeExtraction!.extracted).extractionWarnings).map(
                (w, i) => (
                  <li key={`${w.code}-${i}`}>
                    {w.message}
                    {w.fieldPath ? ` (${w.fieldPath})` : ''}
                  </li>
                ),
              )}
            </ul>
          )}
          <ExtractionReviewSections
            extracted={extracted ?? client.intakeExtraction!.extracted}
            onEditField={(path, current) => {
              const edited = window.prompt(`Edit ${path}`, current === 'Not established' ? '' : current);
              if (edited == null) return;
              const base = extracted ?? client.intakeExtraction!.extracted;
              setExtracted(setByPath(base, path, edited));
            }}
          />
          <div className="stack-btns horizontal wrap">
            <button
              type="button"
              className="btn primary"
              disabled={busy || criticalErrors}
              onClick={() => void confirmExtractionAndAnalyse()}
            >
              {busy ? 'Analysing…' : 'Confirm extraction & Analyse clinically'}
            </button>
            <button type="button" className="btn tertiary" disabled={busy} onClick={() => void reExtract()}>
              Re-extract
            </button>
          </div>
        </section>
      )}

      {mode === 'view' && (
        <>
          {(client.rawIntakeSubmissions?.length ?? 0) > 0 && (
            <details className="pf-intake-section">
              <summary>View Original Submission</summary>
              <pre className="pf-raw-intake">{rawTextFromClient(client)}</pre>
            </details>
          )}

          {client.intakeExtraction && !client.intakeExtraction.confirmed && status === 'extraction-ready' && (
            <section className="pf-surface-card">
              <h3>Extraction ready for review</h3>
              <p>Structured answers are ready. Confirm them before clinical reasoning.</p>
              <button type="button" className="btn primary" onClick={() => setMode('extraction-review')}>
                Review extracted intake
              </button>
            </section>
          )}

          {client.intakeExtraction?.confirmed && client.structuredIntake && (
            <details className="pf-intake-section">
              <summary>Confirmed structured intake (summary)</summary>
              <p className="pf-meta">
                Extractor {client.intakeExtraction.extractorVersion}
                {client.intakeExtraction.confirmedAt
                  ? ` · Confirmed ${new Date(client.intakeExtraction.confirmedAt).toLocaleString()}`
                  : ''}
              </p>
              <dl className="pf-extraction-dl">
                <FieldRow
                  label="Full name"
                  value={displayExtractedValue(client.structuredIntake.personalInformation.fullName)}
                />
                <FieldRow
                  label="Presenting problems"
                  value={displayExtractedValue(client.structuredIntake.presentingProblem.mainProblems)}
                />
                <FieldRow
                  label="Goals"
                  value={displayExtractedValue(client.structuredIntake.goals.clientStatedGoals)}
                />
              </dl>
            </details>
          )}

          <section className="pf-surface-card">
            <h3>INITIAL CLINICAL UNDERSTANDING</h3>
            <p className="pf-meta">Core only — runs after extraction is confirmed. Approve / Edit / Reject before formulation updates.</p>
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
                <p>
                  {status === 'extraction-ready'
                    ? 'Confirm extracted intake before clinical analysis.'
                    : 'No intake analysis yet. Paste the Pathfinder Client Intake Form, then confirm extraction.'}
                </p>
                <button type="button" className="btn primary" onClick={() => setMode(status === 'extraction-ready' ? 'extraction-review' : 'paste')}>
                  {status === 'extraction-ready' ? 'Review extraction' : 'Add Intake'}
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
            <button
              type="button"
              className="btn primary"
              disabled={approveDisabled}
              title={
                approveDisabled
                  ? 'Confirm extraction and complete clinical review first'
                  : undefined
              }
              onClick={() => void applyReview()}
            >
              {busy ? 'Saving…' : 'Approve into Core Formulation & First Session Prep'}
            </button>
            {approveDisabled && findings.length > 0 && (
              <p className="hint">Available after extraction is confirmed and clinical findings are ready.</p>
            )}
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
