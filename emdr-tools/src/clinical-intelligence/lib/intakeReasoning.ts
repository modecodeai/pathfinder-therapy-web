/**
 * Core-only intake reasoning — modality-neutral.
 * Never invent diagnoses, EMDR targets, TA constructs, or risk severity.
 */

import type { CoreClinicalFormulation } from '../clinicalReasoning';
import { emptyCoreFormulation } from '../clinicalReasoning';
import type { ClinicalSourceType } from './intake';
import {
  INTAKE_SECTION_LABELS,
  type IntakeAnswerMap,
  type StructuredIntake,
  questionById,
  type IntakeFormSectionId,
} from './pathfinderIntakeForm';

export type IntakeFindingCategory =
  | 'presenting-problem'
  | 'symptom'
  | 'functional-impact'
  | 'current-stressor'
  | 'trigger'
  | 'significant-experience'
  | 'relational-pattern'
  | 'lifestyle'
  | 'medical-consideration'
  | 'psychological-history'
  | 'trauma-adversity'
  | 'protective-process'
  | 'internal-resource'
  | 'external-resource'
  | 'strength'
  | 'current-support'
  | 'therapeutic-goal'
  | 'risk-clinical-review'
  | 'working-hypothesis'
  | 'outstanding-question'
  | 'not-established'
  | 'clinical-consideration'
  | 'veteran-information'
  | 'reported-diagnosis';

export type IntakeFindingFraming =
  | 'client-statement'
  | 'possible-clinical-consideration'
  | 'possible-working-hypothesis'
  | 'existing-reported-diagnosis'
  | 'information-requiring-clarification'
  | 'further-assessment-may-be-needed'
  | 'not-established';

export interface IntakeEvidenceLink {
  sourceType: ClinicalSourceType;
  sectionId: IntakeFormSectionId;
  sectionLabel: string;
  questionId: string;
  questionLabel: string;
  clientResponse: string;
  rawSubmissionId?: string;
}

export interface IntakeCoreFinding {
  id: string;
  category: IntakeFindingCategory;
  /** Prefer client language in text */
  clientStatement?: string;
  text: string;
  framing: IntakeFindingFraming;
  evidence: IntakeEvidenceLink[];
  provenanceStatus: 'single' | 'corroborated' | 'conflict';
  reviewStatus: 'pending' | 'approved' | 'edited' | 'rejected';
  therapistEditedValue?: string;
  clinicalReviewRequired?: boolean;
}

export interface IntakeCoreAnalysisResult {
  findings: IntakeCoreFinding[];
  clinicalReviewRequired: boolean;
  explorePainSomaticLens?: boolean;
  emdrLeakageDetected: boolean;
  forbiddenTermsFound: string[];
}

const FORBIDDEN_AUTO = [
  /\bPTSD\b/i,
  /\bBPD\b/i,
  /\bOCD\b/i,
  /\battachment disorder\b/i,
  /\btouchstone\b/i,
  /\bmemory network\b/i,
  /\bnegative cognition\b/i,
  /\bpositive cognition\b/i,
  /\b\bSUD\b/,
  /\b\bVoC\b|\bVOC\b/,
  /\bEMDR target\b/i,
  /\bBe Perfect\b/,
  /\binjunction\b/i,
  /\bego state\b/i,
];

const RISK_TERMS =
  /\b(self[- ]?harm|suicid(?:e|al)|kill\s+(?:my|him|her|them)self|homicid|violence|overdose|safeguard|acute\s+medical)\b/i;

const DIAGNOSIS_CLAIM =
  /\b(diagnosed with|diagnosis of|I have|I was diagnosed)\s+(PTSD|BPD|OCD|depression|bipolar|ADHD|autism)/i;

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function evidenceFor(
  questionId: string,
  response: string,
  rawSubmissionId?: string,
): IntakeEvidenceLink | null {
  const q = questionById(questionId);
  if (!q || !response.trim()) return null;
  return {
    sourceType: 'intake',
    sectionId: q.sectionId,
    sectionLabel: INTAKE_SECTION_LABELS[q.sectionId],
    questionId: q.id,
    questionLabel: q.label,
    clientResponse: response.trim(),
    rawSubmissionId,
  };
}

function finding(
  category: IntakeFindingCategory,
  text: string,
  framing: IntakeFindingFraming,
  ev: IntakeEvidenceLink,
  opts?: { clientStatement?: string; clinicalReviewRequired?: boolean },
): IntakeCoreFinding {
  return {
    id: `icf_${category}_${hash(text + ev.questionId)}`,
    category,
    clientStatement: opts?.clientStatement ?? (framing === 'client-statement' ? ev.clientResponse : undefined),
    text,
    framing,
    evidence: [ev],
    provenanceStatus: 'single',
    reviewStatus: 'pending',
    clinicalReviewRequired: opts?.clinicalReviewRequired,
  };
}

/**
 * Deterministic core-only extraction from structured intake answers.
 * Does not invent missing answers. Does not create EMDR/TA constructs.
 */
export function analyseIntakeCoreOnly(args: {
  answers: IntakeAnswerMap;
  structured: StructuredIntake;
  rawSubmissionId?: string;
}): IntakeCoreAnalysisResult {
  const { answers, structured, rawSubmissionId } = args;
  const findings: IntakeCoreFinding[] = [];
  let clinicalReviewRequired = false;
  let explorePainSomaticLens = false;

  const add = (
    questionId: string,
    category: IntakeFindingCategory,
    textBuilder: (raw: string) => { text: string; framing: IntakeFindingFraming; clientStatement?: string },
  ) => {
    const raw = answers[questionId]?.trim();
    if (!raw) return;
    const ev = evidenceFor(questionId, raw, rawSubmissionId);
    if (!ev) return;
    const built = textBuilder(raw);
    findings.push(
      finding(category, built.text, built.framing, ev, {
        clientStatement: built.clientStatement ?? raw,
      }),
    );
  };

  // Presenting / goals — preserve client wording
  add('mainProblems', 'presenting-problem', (raw) => ({
    text: raw,
    framing: 'client-statement',
    clientStatement: raw,
  }));
  add('therapyGoals', 'therapeutic-goal', (raw) => ({
    text: raw,
    framing: 'client-statement',
    clientStatement: raw,
  }));
  add('currentSeverity', 'functional-impact', (raw) => ({
    text: `Client-rated severity: ${raw}`,
    framing: 'client-statement',
  }));

  // Symptoms
  add('anxietyPanicPhobias', 'symptom', (raw) => ({
    text: raw,
    framing: 'client-statement',
    clientStatement: raw,
  }));
  add('depressionGriefSadness', 'symptom', (raw) => ({
    text: raw,
    framing: 'client-statement',
    clientStatement: raw,
  }));
  add('sleepProblems', 'lifestyle', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('sleepRating', 'lifestyle', (raw) => ({
    text: `Sleep rating: ${raw}`,
    framing: 'client-statement',
  }));
  add('foodAppetiteWeightBodyImage', 'lifestyle', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('alcoholRecreationalDrugUse', 'lifestyle', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('exercise', 'lifestyle', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('occupation', 'current-stressor', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('workEnjoymentStress', 'current-stressor', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));

  // Relational
  add('romanticRelationship', 'relational-pattern', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('familyConflict', 'relational-pattern', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('socialNetwork', 'current-support', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('household', 'current-support', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));

  // History — trauma = significant experience, NOT EMDR target
  add('trauma', 'trauma-adversity', (raw) => ({
    text: raw,
    framing: 'client-statement',
    clientStatement: raw,
  }));
  add('childhoodAdolescentAbuse', 'trauma-adversity', (raw) => ({
    text: raw,
    framing: 'client-statement',
    clientStatement: raw,
  }));
  add('childhood', 'significant-experience', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('schoolExperience', 'significant-experience', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));

  // Medical
  add('medication', 'medical-consideration', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('diagnosedHealthConditions', 'medical-consideration', (raw) => ({
    text: raw,
    framing: 'existing-reported-diagnosis',
  }));
  add('previousMentalHealthTreatment', 'psychological-history', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('previousTherapy', 'psychological-history', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('psychiatricMedication', 'psychological-history', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));

  // Chronic pain — consideration only, do not activate Pain protocol
  const chronic = answers.chronicPain?.trim();
  if (
    chronic &&
    (/^(y|yes|true|1)\b/i.test(chronic) ||
      (!/^(n|no|false|0|none)\b/i.test(chronic) && chronic.length > 1))
  ) {
    const ev = evidenceFor('chronicPain', chronic, rawSubmissionId);
    if (ev) {
      findings.push(
        finding(
          'clinical-consideration',
          'Chronic pain reported',
          'possible-clinical-consideration',
          ev,
          { clientStatement: chronic },
        ),
      );
      explorePainSomaticLens = true;
    }
  }

  // Veteran — structured, no trauma inference
  if (structured.personalInformation.veteranStatus?.trim()) {
    const bits = [
      structured.personalInformation.veteranStatus,
      structured.personalInformation.rank && `Rank: ${structured.personalInformation.rank}`,
      structured.personalInformation.unit && `Unit: ${structured.personalInformation.unit}`,
      structured.personalInformation.datesServed && `Dates served: ${structured.personalInformation.datesServed}`,
      structured.personalInformation.dischargeReason &&
        `Discharge: ${structured.personalInformation.dischargeReason}`,
      structured.personalInformation.operationalTours &&
        `Operational tours: ${structured.personalInformation.operationalTours}`,
    ]
      .filter(Boolean)
      .join(' · ');
    const ev = evidenceFor(
      'veteranStatus',
      structured.personalInformation.veteranStatus,
      rawSubmissionId,
    );
    if (ev) {
      findings.push(
        finding('veteran-information', bits, 'client-statement', ev, {
          clientStatement: structured.personalInformation.veteranStatus,
        }),
      );
    }
  }

  // Strengths / resources
  add('strengths', 'strength', (raw) => ({
    text: raw,
    framing: 'client-statement',
    clientStatement: raw,
  }));
  add('weaknesses', 'clinical-consideration', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('significantAchievement', 'internal-resource', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));
  add('mostImportantThingInLife', 'internal-resource', (raw) => ({
    text: raw,
    framing: 'client-statement',
  }));

  // Working hypothesis — soft, from explicit conflict→overwhelm language only if pattern-like
  const main = answers.mainProblems?.trim();
  if (main && /overwhelm|shut down|withdraw/i.test(main)) {
    const ev = evidenceFor('mainProblems', main, rawSubmissionId);
    if (ev) {
      findings.push(
        finding(
          'working-hypothesis',
          'Conflict or interpersonal stress may be associated with overwhelm and withdrawal (hypothesis only).',
          'possible-working-hypothesis',
          ev,
          { clientStatement: main },
        ),
      );
    }
  }

  // Risk scan — flag only, no invented severity
  const blob = Object.values(answers).join('\n');
  if (RISK_TERMS.test(blob)) {
    clinicalReviewRequired = true;
    const hitQ =
      PATHFINDER_RISK_SCAN_ORDER.map((id) => (RISK_TERMS.test(answers[id] ?? '') ? id : null)).find(
        Boolean,
      ) ?? 'mainProblems';
    const raw = answers[hitQ!] ?? blob.slice(0, 200);
    const ev = evidenceFor(hitQ!, String(raw).slice(0, 500), rawSubmissionId);
    if (ev) {
      findings.push(
        finding(
          'risk-clinical-review',
          'Risk-related content present in intake — clinical review required. Current status not established beyond what the client wrote.',
          'information-requiring-clarification',
          ev,
          { clinicalReviewRequired: true, clientStatement: ev.clientResponse },
        ),
      );
    }
  }

  // Reported diagnoses only if client explicitly states diagnosis
  for (const [qid, val] of Object.entries(answers)) {
    if (!val) continue;
    const m = val.match(DIAGNOSIS_CLAIM);
    if (m) {
      const ev = evidenceFor(qid, val, rawSubmissionId);
      if (ev) {
        findings.push(
          finding(
            'reported-diagnosis',
            `Existing reported diagnosis language: "${m[0]}" — not independently verified by Pathfinder.`,
            'existing-reported-diagnosis',
            ev,
            { clientStatement: val },
          ),
        );
      }
    }
  }

  // Outstanding / not established placeholders when key areas blank
  if (!answers.trauma?.trim() && !answers.childhoodAdolescentAbuse?.trim()) {
    findings.push({
      id: `icf_not_established_trauma_${hash('trauma')}`,
      category: 'not-established',
      text: 'Trauma / adversity history not established in this intake.',
      framing: 'not-established',
      evidence: [],
      provenanceStatus: 'single',
      reviewStatus: 'pending',
    });
  }

  const forbiddenTermsFound: string[] = [];
  const joined = findings.map((f) => f.text).join(' ');
  for (const re of FORBIDDEN_AUTO) {
    const m = joined.match(re);
    if (m) forbiddenTermsFound.push(m[0]);
  }

  // Strip accidental modality leakage from hypothesis text (safety net)
  for (const f of findings) {
    if (/\b(NC|PC|SUD|VoC|touchstone|ego state|injunction)\b/i.test(f.text)) {
      f.text = f.text.replace(/\b(NC|PC|SUD|VoC|touchstone|ego[- ]?state|injunction)\b/gi, '[removed]');
      forbiddenTermsFound.push('modality-leak-stripped');
    }
  }

  return {
    findings,
    clinicalReviewRequired,
    explorePainSomaticLens,
    emdrLeakageDetected: forbiddenTermsFound.some((t) => /EMDR|touchstone|SUD|VoC|NC|PC/i.test(t)),
    forbiddenTermsFound,
  };
}

const PATHFINDER_RISK_SCAN_ORDER = [
  'mainProblems',
  'depressionGriefSadness',
  'anxietyPanicPhobias',
  'alcoholRecreationalDrugUse',
  'trauma',
  'childhoodAdolescentAbuse',
  'previousMentalHealthTreatment',
];

export function mergeIntakeFindingsCorroborate(
  existing: IntakeCoreFinding[],
  incoming: IntakeCoreFinding[],
): IntakeCoreFinding[] {
  const out = existing.map((f) => ({ ...f, evidence: [...f.evidence] }));
  for (const item of incoming) {
    const norm = (item.clientStatement ?? item.text).trim().toLowerCase();
    const match = out.find((e) => {
      const en = (e.clientStatement ?? e.text).trim().toLowerCase();
      return e.category === item.category && (en === norm || en.includes(norm) || norm.includes(en));
    });
    if (match) {
      match.provenanceStatus = 'corroborated';
      for (const ev of item.evidence) {
        if (!match.evidence.some((x) => x.questionId === ev.questionId && x.clientResponse === ev.clientResponse)) {
          match.evidence.push(ev);
        }
      }
      continue;
    }
    // Soft conflict on substance
    if (item.category === 'lifestyle' && /alcohol|drink/i.test(item.text)) {
      const prior = out.find(
        (e) =>
          e.category === 'lifestyle' &&
          /alcohol|drink/i.test(e.text) &&
          /no|none|not/i.test(e.text) !== /no|none|not/i.test(item.text),
      );
      if (prior) {
        out.push({
          ...item,
          provenanceStatus: 'conflict',
          framing: 'information-requiring-clarification',
          text: `Possible update / conflict with prior: "${prior.text}" → "${item.text}"`,
        });
        continue;
      }
    }
    out.push(item);
  }
  return out;
}

export function approvedFindingsToCore(
  findings: IntakeCoreFinding[],
  prior?: CoreClinicalFormulation | null,
): CoreClinicalFormulation {
  const base = prior ? { ...emptyCoreFormulation(), ...prior } : emptyCoreFormulation();
  const approved = findings.filter((f) => f.reviewStatus === 'approved' || f.reviewStatus === 'edited');
  const textOf = (f: IntakeCoreFinding) =>
    f.reviewStatus === 'edited' ? (f.therapistEditedValue ?? f.text) : f.text;

  const merge = <T extends { id: string }>(a: T[], b: T[]) => {
    const map = new Map(a.map((x) => [x.id, x]));
    for (const x of b) {
      if (!map.has(x.id)) map.set(x.id, x);
    }
    return [...map.values()];
  };

  return {
    ...base,
    presentingProblems: merge(
      base.presentingProblems,
      approved
        .filter((f) => f.category === 'presenting-problem')
        .map((f) => ({ id: f.id, text: textOf(f) })),
    ),
    symptoms: merge(
      base.symptoms,
      approved.filter((f) => f.category === 'symptom').map((f) => ({ id: f.id, text: textOf(f) })),
    ),
    currentTriggers: merge(
      base.currentTriggers,
      approved.filter((f) => f.category === 'trigger').map((f) => ({ id: f.id, text: textOf(f) })),
    ),
    significantExperiences: merge(
      base.significantExperiences,
      approved
        .filter((f) => f.category === 'significant-experience' || f.category === 'trauma-adversity')
        .map((f) => ({ id: f.id, headline: textOf(f), description: f.clientStatement })),
    ),
    relationships: merge(
      base.relationships,
      approved
        .filter((f) => f.category === 'relational-pattern')
        .map((f) => ({ id: f.id, text: textOf(f) })),
    ),
    resources: merge(
      base.resources,
      approved
        .filter(
          (f) =>
            f.category === 'internal-resource' ||
            f.category === 'external-resource' ||
            f.category === 'current-support',
        )
        .map((f) => ({
          id: f.id,
          kind: f.category === 'internal-resource' ? ('internal' as const) : ('external' as const),
          text: textOf(f),
        })),
    ),
    strengths: merge(
      base.strengths,
      approved.filter((f) => f.category === 'strength').map((f) => ({ id: f.id, text: textOf(f) })),
    ),
    goals: merge(
      base.goals,
      approved
        .filter((f) => f.category === 'therapeutic-goal')
        .map((f) => ({ id: f.id, text: f.clientStatement ?? textOf(f) })),
    ),
    workingHypotheses: merge(
      base.workingHypotheses,
      approved
        .filter((f) => f.category === 'working-hypothesis')
        .map((f) => ({
          id: f.id,
          statement: textOf(f),
          evidenceStrength: 'limited' as const,
          evidence: [],
          status: 'working' as const,
          clinicianApproved: true,
        })),
    ),
    outstandingQuestions: merge(
      base.outstandingQuestions,
      approved
        .filter((f) => f.category === 'outstanding-question' || f.category === 'not-established')
        .map((f) => ({
          id: f.id,
          text: textOf(f),
          status: 'open' as const,
          createdAt: new Date().toISOString(),
          source: 'therapist' as const,
        })),
    ),
    vulnerabilities: merge(
      base.vulnerabilities,
      approved
        .filter(
          (f) =>
            f.category === 'clinical-consideration' ||
            f.category === 'medical-consideration' ||
            f.category === 'risk-clinical-review',
        )
        .map((f) => ({ id: f.id, text: textOf(f) })),
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** Assert core-only output has no EMDR target constructs. */
export function assertNoEmdrConstructs(findings: IntakeCoreFinding[]): string[] {
  const hits: string[] = [];
  const blob = findings.map((f) => f.text).join(' ');
  for (const re of [
    /\bEMDR target\b/i,
    /\bnegative cognition\b/i,
    /\bpositive cognition\b/i,
    /\btouchstone\b/i,
    /\b\bSUD\b/,
    /\bVoC\b|\bVOC\b/,
    /\binjunction\b/i,
    /\bego state\b/i,
    /\bAdapted Child\b/i,
    /\bCritical Parent\b/i,
    /\bBe Perfect\b/,
  ]) {
    const m = blob.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}
