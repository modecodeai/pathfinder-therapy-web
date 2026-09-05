/**
 * Client intake — first-class clinical evidence source (modality-neutral).
 */

import type { CoreClinicalFormulation } from '../clinicalReasoning';

export type ClinicalSourceType =
  | 'intake'
  | 'transcript'
  | 'referral'
  | 'therapist-note'
  | 'assessment'
  | 'client-document'
  | 'session-debrief';

export type IntakeFieldKey =
  | 'personalInformation'
  | 'presentingProblem'
  | 'reasonForTherapy'
  | 'severityImpact'
  | 'currentSymptoms'
  | 'currentRelationships'
  | 'familyRelationships'
  | 'developmentalHistory'
  | 'traumaHistory'
  | 'mentalHealthHistory'
  | 'previousTherapy'
  | 'medication'
  | 'physicalHealth'
  | 'substanceUse'
  | 'currentSupports'
  | 'strengthsResources'
  | 'riskHistory'
  | 'goalsForTherapy'
  | 'referralSource'
  | 'therapistNotes';

export const INTAKE_FIELD_LABELS: Record<IntakeFieldKey, string> = {
  personalInformation: 'Personal information',
  presentingProblem: 'Presenting problem',
  reasonForTherapy: 'Reason for therapy',
  severityImpact: 'Severity / impact',
  currentSymptoms: 'Current symptoms / difficulties',
  currentRelationships: 'Current relationships',
  familyRelationships: 'Family / significant relationships',
  developmentalHistory: 'Developmental / childhood history',
  traumaHistory: 'Trauma / adverse experiences',
  mentalHealthHistory: 'Mental health history',
  previousTherapy: 'Previous therapy',
  medication: 'Medication',
  physicalHealth: 'Physical health',
  substanceUse: 'Substance use',
  currentSupports: 'Current supports',
  strengthsResources: 'Strengths / resources',
  riskHistory: 'Risk / self-harm / suicidal history',
  goalsForTherapy: 'Goals for therapy',
  referralSource: 'Referral source',
  therapistNotes: 'Therapist notes',
};

export interface ClientIntakeFields {
  personalInformation?: string;
  presentingProblem?: string;
  reasonForTherapy?: string;
  severityImpact?: string;
  currentSymptoms?: string;
  currentRelationships?: string;
  familyRelationships?: string;
  developmentalHistory?: string;
  traumaHistory?: string;
  mentalHealthHistory?: string;
  previousTherapy?: string;
  medication?: string;
  physicalHealth?: string;
  substanceUse?: string;
  currentSupports?: string;
  strengthsResources?: string;
  riskHistory?: string;
  goalsForTherapy?: string;
  referralSource?: string;
  therapistNotes?: string;
}

export interface ClinicalMaterialSource {
  id: string;
  sourceType: ClinicalSourceType;
  label: string;
  text: string;
  createdAt: string;
  analysedAt?: string;
}

/** Provenance for a single clinical datum across sources. */
export interface ClinicalDatumProvenance {
  sourceIds: string[];
  sourceTypes: ClinicalSourceType[];
  status: 'single' | 'corroborated' | 'conflict';
  notes?: string;
}

export interface IntakeExtractedFinding {
  id: string;
  category:
    | 'presenting-problem'
    | 'symptom'
    | 'functional-impact'
    | 'trigger'
    | 'significant-experience'
    | 'relational-pattern'
    | 'resource'
    | 'strength'
    | 'support'
    | 'risk'
    | 'goal'
    | 'outstanding'
    | 'working-hypothesis';
  text: string;
  /** Soft language — never a diagnosis */
  framing: 'possible-clinical-consideration' | 'possible-working-hypothesis' | 'information-requiring-clarification' | 'extracted-fact';
  provenance: ClinicalDatumProvenance;
  reviewStatus: 'pending' | 'approved' | 'edited' | 'rejected';
  therapistEditedValue?: string;
}

export interface ClientIntakeRecord {
  fields: ClientIntakeFields;
  rawPaste?: string;
  updatedAt: string;
  extractedFindings?: IntakeExtractedFinding[];
  riskReviewRequired?: boolean;
}

export type ClientSetupStep =
  | 'basic-details'
  | 'intake'
  | 'existing-material'
  | 'initial-reasoning'
  | 'current-approach'
  | 'ready';

export interface ClientSetupProgress {
  basicDetailsComplete?: boolean;
  intakeSkipped?: boolean;
  intakeComplete?: boolean;
  materialSkipped?: boolean;
  materialComplete?: boolean;
  initialReasoningComplete?: boolean;
  approachSelected?: boolean;
  ready?: boolean;
  lastStep?: ClientSetupStep;
}

export const SETUP_STEPS: Array<{ id: ClientSetupStep; label: string }> = [
  { id: 'basic-details', label: 'Basic Details' },
  { id: 'intake', label: 'Intake' },
  { id: 'existing-material', label: 'Existing Material' },
  { id: 'initial-reasoning', label: 'Initial Reasoning' },
  { id: 'current-approach', label: 'Current Approach' },
  { id: 'ready', label: 'Ready' },
];

const RISK_TERMS =
  /\b(self[- ]?harm|suicid(?:e|al)|kill\s+(?:my|him|her|them)self|homicid|violence|overdose|acute\s+medical)\b/i;

export function detectRiskReviewRequired(text: string): boolean {
  return RISK_TERMS.test(text);
}

export function intakeFieldsToText(fields: ClientIntakeFields): string {
  const parts: string[] = [];
  for (const [key, label] of Object.entries(INTAKE_FIELD_LABELS) as Array<[IntakeFieldKey, string]>) {
    const v = fields[key]?.trim();
    if (v) parts.push(`${label}:\n${v}`);
  }
  return parts.join('\n\n');
}

/**
 * Lightweight local extraction from intake text when building before AI analysis.
 * Does not diagnose; labels findings as possible considerations.
 */
export function extractIntakeFindingsHeuristic(
  text: string,
  sourceId: string,
): IntakeExtractedFinding[] {
  const findings: IntakeExtractedFinding[] = [];
  const lower = text.toLowerCase();
  const push = (
    category: IntakeExtractedFinding['category'],
    phrase: string,
    framing: IntakeExtractedFinding['framing'] = 'extracted-fact',
  ) => {
    if (!lower.includes(phrase.toLowerCase())) return;
    findings.push({
      id: `if_${category}_${hash(phrase)}`,
      category,
      text: phrase,
      framing,
      provenance: {
        sourceIds: [sourceId],
        sourceTypes: ['intake'],
        status: 'single',
      },
      reviewStatus: 'pending',
    });
  };

  // Common clinical themes — phrase match only; therapist must review
  const symptomHints = ['anxiety', 'depression', 'panic', 'insomnia', 'flashback', 'nightmares', 'anger', 'shame', 'guilt'];
  for (const s of symptomHints) {
    if (lower.includes(s)) push('symptom', s.charAt(0).toUpperCase() + s.slice(1));
  }
  if (lower.includes('childhood') || lower.includes('growing up')) {
    push('significant-experience', 'Difficult childhood / developmental history noted', 'possible-clinical-consideration');
  }
  if (lower.includes('friend') || lower.includes('support')) {
    push('support', 'Supportive relationship or resource noted');
  }
  if (detectRiskReviewRequired(text)) {
    push('risk', 'Risk-related content present — clinical review required', 'information-requiring-clarification');
  }

  return findings;
}

/**
 * Merge new findings into existing — corroborate rather than duplicate.
 */
export function mergeFindingsWithoutDuplicates(
  existing: IntakeExtractedFinding[],
  incoming: IntakeExtractedFinding[],
): IntakeExtractedFinding[] {
  const out = existing.map((f) => ({ ...f, provenance: { ...f.provenance } }));
  for (const item of incoming) {
    const norm = normalise(item.text);
    const match = out.find(
      (e) => e.category === item.category && (normalise(e.text) === norm || similar(normalise(e.text), norm)),
    );
    if (match) {
      const types = new Set([...match.provenance.sourceTypes, ...item.provenance.sourceTypes]);
      const ids = new Set([...match.provenance.sourceIds, ...item.provenance.sourceIds]);
      match.provenance = {
        sourceIds: [...ids],
        sourceTypes: [...types],
        status: types.size > 1 ? 'corroborated' : match.provenance.status,
        notes: match.provenance.notes,
      };
      continue;
    }
    // Conflict: same category, different meaning keywords
    const softConflict = out.find(
      (e) =>
        e.category === item.category &&
        e.category === 'symptom' &&
        normalise(e.text) !== norm &&
        antonymConflict(e.text, item.text),
    );
    if (softConflict) {
      out.push({
        ...item,
        framing: 'information-requiring-clarification',
        provenance: {
          ...item.provenance,
          status: 'conflict',
          notes: `Possible update / conflict with: ${softConflict.text}`,
        },
      });
      continue;
    }
    out.push(item);
  }
  return out;
}

export function findingsToCorePatch(findings: IntakeExtractedFinding[]): Partial<CoreClinicalFormulation> {
  const approved = findings.filter((f) => f.reviewStatus === 'approved' || f.reviewStatus === 'edited');
  const textOf = (f: IntakeExtractedFinding) =>
    f.reviewStatus === 'edited' ? (f.therapistEditedValue ?? f.text) : f.text;

  return {
    presentingProblems: approved
      .filter((f) => f.category === 'presenting-problem')
      .map((f) => ({ id: f.id, text: textOf(f) })),
    symptoms: approved
      .filter((f) => f.category === 'symptom')
      .map((f) => ({ id: f.id, text: textOf(f) })),
    currentTriggers: approved
      .filter((f) => f.category === 'trigger')
      .map((f) => ({ id: f.id, text: textOf(f) })),
    significantExperiences: approved
      .filter((f) => f.category === 'significant-experience')
      .map((f) => ({ id: f.id, headline: textOf(f) })),
    relationships: approved
      .filter((f) => f.category === 'relational-pattern')
      .map((f) => ({ id: f.id, text: textOf(f) })),
    resources: approved
      .filter((f) => f.category === 'resource' || f.category === 'support')
      .map((f) => ({
        id: f.id,
        kind: f.category === 'support' ? ('external' as const) : ('internal' as const),
        text: textOf(f),
      })),
    strengths: approved
      .filter((f) => f.category === 'strength')
      .map((f) => ({ id: f.id, text: textOf(f) })),
    goals: approved
      .filter((f) => f.category === 'goal')
      .map((f) => ({ id: f.id, text: textOf(f) })),
    workingHypotheses: approved
      .filter((f) => f.category === 'working-hypothesis')
      .map((f) => ({
        id: f.id,
        statement: textOf(f),
        evidenceStrength: 'limited' as const,
        evidence: [],
        status: 'working' as const,
        clinicianApproved: true,
      })),
    outstandingQuestions: approved
      .filter((f) => f.category === 'outstanding')
      .map((f) => ({
        id: f.id,
        text: textOf(f),
        status: 'open' as const,
        createdAt: new Date().toISOString(),
      })),
    vulnerabilities: approved
      .filter((f) => f.category === 'risk')
      .map((f) => ({
        id: f.id,
        text: textOf(f),
      })),
  };
}

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function similar(a: string, b: string): boolean {
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

function antonymConflict(a: string, b: string): boolean {
  const pairs = [
    ['anxiety', 'calm'],
    ['depression', 'euthymic'],
  ];
  const na = normalise(a);
  const nb = normalise(b);
  return pairs.some(
    ([x, y]) => (na.includes(x) && nb.includes(y)) || (na.includes(y) && nb.includes(x)),
  );
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export function hasCoreFormulationContent(core?: CoreClinicalFormulation | null): boolean {
  if (!core) return false;
  return (
    (core.presentingProblems?.length ?? 0) > 0 ||
    (core.symptoms?.length ?? 0) > 0 ||
    (core.workingHypotheses?.length ?? 0) > 0 ||
    (core.significantExperiences?.length ?? 0) > 0 ||
    (core.resources?.length ?? 0) > 0
  );
}
