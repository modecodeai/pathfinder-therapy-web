/**
 * First Session Preparation — briefing from approved intake / core only.
 * Target: readable in under ~2 minutes (~500 words).
 * CORE-FIRST — no TA drivers/injunctions or EMDR constructs.
 */

import type { ClientRecord } from '../types';
import type { IntakeCoreFinding } from './intakeReasoning';

export interface FirstSessionPreparation {
  generatedAt: string;
  wordCount: number;
  whySeekingTherapy: string;
  clientStatedGoals: string;
  relevantCurrentSymptoms: string;
  /** Patterns the client identifies (core, not TA) */
  patternsClientIdentifies: string;
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

function pickPatterns(findings: IntakeCoreFinding[]): string {
  const approved = findings.filter(
    (f) =>
      (f.reviewStatus === 'approved' || f.reviewStatus === 'edited') &&
      (f.category === 'relational-pattern' || f.category === 'protective-process') &&
      /defensive|withdraw|asking for help|self-reli|fixing|overthink|self[- ]?doubt|alone/i.test(
        f.text + (f.clientStatement ?? ''),
      ),
  );
  if (!approved.length) {
    // Fall back: any approved relational pattern that looks like a client-identified pattern
    const rel = findings.filter(
      (f) =>
        (f.reviewStatus === 'approved' || f.reviewStatus === 'edited') &&
        f.category === 'relational-pattern',
    );
    if (!rel.length) return 'Not established from approved intake.';
    return rel
      .map((f) => `• ${f.reviewStatus === 'edited' ? (f.therapistEditedValue ?? f.text) : f.text}`)
      .join('\n');
  }
  return approved
    .map((f) => `• ${f.reviewStatus === 'edited' ? (f.therapistEditedValue ?? f.text) : f.text}`)
    .join('\n');
}

export function buildFirstSessionPreparation(
  client: ClientRecord,
  findings?: IntakeCoreFinding[],
): FirstSessionPreparation {
  const f = findings ?? client.intakeCoreFindings ?? [];
  const why = pick(f, ['presenting-problem']);
  const goals = pick(f, ['therapeutic-goal']);
  const symptoms = pick(f, ['symptom', 'lifestyle', 'functional-impact', 'current-stressor']);
  const patterns = pickPatterns(f);
  const context = pick(f, [
    'medical-consideration',
    'psychological-history',
    'clinical-consideration',
    'veteran-information',
    'significant-experience',
    'trauma-adversity',
  ]);
  const resources = pick(f, ['strength', 'internal-resource', 'external-resource', 'current-support']);
  const risk = pick(f, ['risk-clinical-review']);
  const outstanding = pick(f, ['outstanding-question', 'not-established']);
  const hypotheses = pick(f, ['working-hypothesis']);

  const body = [why, goals, symptoms, patterns, context, resources, risk, outstanding, hypotheses].join(
    '\n',
  );
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  return {
    generatedAt: new Date().toISOString(),
    wordCount,
    whySeekingTherapy: why,
    clientStatedGoals: goals,
    relevantCurrentSymptoms: symptoms,
    patternsClientIdentifies: patterns,
    medicalPsychosocialContext: context,
    resourcesSupports: resources,
    riskItemsToClarify: risk,
    outstandingQuestions: outstanding,
    initialWorkingHypotheses: hypotheses,
    sourceLabel: 'Pre-session information from client intake.',
    modalityNote:
      client.primaryTreatmentApproach && client.primaryTreatmentApproach !== 'unspecified'
        ? `Current approach selected: ${client.primaryTreatmentApproach}. First Session Preparation remains core-first — lens-specific formulation is deferred until Primary Lens analysis.`
        : 'No treatment approach selected yet — this briefing is modality-neutral (core-first).',
  };
}

export function firstSessionPreparationPlainText(prep: FirstSessionPreparation): string {
  const sections = [
    ['Why seeking therapy', prep.whySeekingTherapy],
    ['Currently reported', prep.relevantCurrentSymptoms],
    ['Patterns client identifies', prep.patternsClientIdentifies],
    ['Goals', prep.clientStatedGoals],
    ['Resources / supports', prep.resourcesSupports],
    ['Important medical / psychosocial context', prep.medicalPsychosocialContext],
    ['Clinical review', prep.riskItemsToClarify],
    ['To clarify', prep.outstandingQuestions],
    ['Working hypotheses', prep.initialWorkingHypotheses],
  ] as const;
  let out = `${prep.sourceLabel}\n\n`;
  for (const [h, body] of sections) {
    out += `${h.toUpperCase()}\n${body}\n\n`;
  }
  out += prep.modalityNote;
  return out.trim();
}
