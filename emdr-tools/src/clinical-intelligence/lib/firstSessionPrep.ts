/**
 * First Session Preparation — briefing from approved intake / core only.
 * Target: readable in under ~2 minutes (~500 words).
 */

import type { ClientRecord } from '../types';
import type { IntakeCoreFinding } from './intakeReasoning';

export interface FirstSessionPreparation {
  generatedAt: string;
  wordCount: number;
  whySeekingTherapy: string;
  clientStatedGoals: string;
  relevantCurrentSymptoms: string;
  medicalPsychosocialContext: string;
  resourcesSupports: string;
  riskItemsToClarify: string;
  outstandingQuestions: string;
  initialWorkingHypotheses: string;
  /** Explicit label for therapist UI */
  sourceLabel: 'Pre-session information from client intake.';
  /** No modality-specific formulation unless approach selected elsewhere */
  modalityNote: string;
}

function pick(findings: IntakeCoreFinding[], cats: IntakeCoreFinding['category'][]): string {
  const approved = findings.filter(
    (f) =>
      (f.reviewStatus === 'approved' || f.reviewStatus === 'edited') && cats.includes(f.category),
  );
  if (!approved.length) return 'Not established from approved intake.';
  return approved
    .map((f) => {
      const t = f.reviewStatus === 'edited' ? (f.therapistEditedValue ?? f.text) : f.text;
      const quote = f.clientStatement && f.clientStatement !== t ? ` (“${f.clientStatement}”)` : '';
      return `• ${t}${quote}`;
    })
    .join('\n');
}

export function buildFirstSessionPreparation(
  client: ClientRecord,
  findings?: IntakeCoreFinding[],
): FirstSessionPreparation {
  const f =
    findings ??
    client.intakeCoreFindings ??
    [];
  const why = pick(f, ['presenting-problem']);
  const goals = pick(f, ['therapeutic-goal']);
  const symptoms = pick(f, ['symptom', 'lifestyle', 'functional-impact', 'current-stressor']);
  const context = pick(f, [
    'medical-consideration',
    'psychological-history',
    'clinical-consideration',
    'veteran-information',
    'significant-experience',
    'trauma-adversity',
    'relational-pattern',
  ]);
  const resources = pick(f, ['strength', 'internal-resource', 'external-resource', 'current-support']);
  const risk = pick(f, ['risk-clinical-review']);
  const outstanding = pick(f, ['outstanding-question', 'not-established']);
  const hypotheses = pick(f, ['working-hypothesis']);

  const body = [why, goals, symptoms, context, resources, risk, outstanding, hypotheses].join('\n');
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  return {
    generatedAt: new Date().toISOString(),
    wordCount,
    whySeekingTherapy: why,
    clientStatedGoals: goals,
    relevantCurrentSymptoms: symptoms,
    medicalPsychosocialContext: context,
    resourcesSupports: resources,
    riskItemsToClarify: risk,
    outstandingQuestions: outstanding,
    initialWorkingHypotheses: hypotheses,
    sourceLabel: 'Pre-session information from client intake.',
    modalityNote:
      client.primaryTreatmentApproach && client.primaryTreatmentApproach !== 'unspecified'
        ? `Current approach selected: ${client.primaryTreatmentApproach}. Modality-specific formulation is not included here.`
        : 'No treatment approach selected yet — this briefing is modality-neutral.',
  };
}

export function firstSessionPreparationPlainText(prep: FirstSessionPreparation): string {
  const sections = [
    ['Why client is seeking therapy', prep.whySeekingTherapy],
    ["Client's stated goals", prep.clientStatedGoals],
    ['Relevant current symptoms', prep.relevantCurrentSymptoms],
    ['Important medical / psychosocial context', prep.medicalPsychosocialContext],
    ['Resources / supports', prep.resourcesSupports],
    ['Risk items to clarify', prep.riskItemsToClarify],
    ['Outstanding questions', prep.outstandingQuestions],
    ['Initial working hypotheses', prep.initialWorkingHypotheses],
  ] as const;
  let out = `${prep.sourceLabel}\n\n`;
  for (const [h, body] of sections) {
    out += `${h}\n${body}\n\n`;
  }
  out += prep.modalityNote;
  return out.trim();
}
