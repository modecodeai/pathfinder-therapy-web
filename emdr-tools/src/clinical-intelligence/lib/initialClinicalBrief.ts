/**
 * Initial Clinical Review model — clinician-first briefing from confirmed
 * extraction + semantic corroboration. Modality-neutral; no TA/EMDR.
 */

import type { ExtractedIntake, IntakeExtractionWarning } from './intakeExtraction';
import type { ClinicalEvidence } from './intakeSemanticEvidence';
import {
  formatGoalsAsBullets,
  prioritiseExtractionWarnings,
} from './intakeSemanticEvidence';
import type { IntakeCoreFinding } from './intakeReasoning';

export type ReviewConfidenceLabel = 'Confirmed' | 'High confidence' | 'Needs review' | 'Not established';

export interface ClinicalReviewItem {
  id: string;
  title: string;
  body: string;
  confidence: ReviewConfidenceLabel;
  evidenceLevel?: string;
  sourceField?: string;
  sourceExcerpt?: string;
  formSelectionNote?: string;
  findingId?: string;
  kind: 'fact' | 'pattern' | 'resource' | 'cost' | 'clarification' | 'hypothesis' | 'ambiguity' | 'risk';
}

export interface InitialClinicalReviewModel {
  preferredName: string;
  brief: string;
  currentSituation: string[];
  goals: Array<{ text: string; sourceExcerpt?: string }>;
  difficulties: ClinicalReviewItem[];
  lifeContext: ClinicalReviewItem[];
  relationships: ClinicalReviewItem[];
  significantExperiences: ClinicalReviewItem[];
  resources: ClinicalReviewItem[];
  /** Grouped self-descriptors — one card, not one per word */
  selfDescribedQualities: {
    display: string;
    rawWords: string[];
  } | null;
  currentCosts: ClinicalReviewItem[];
  patterns: ClinicalReviewItem[];
  riskPanel: {
    required: boolean;
    reason: string;
    items: Array<{ label: string; status: string }>;
    findingIds: string[];
  } | null;
  clarifications: ClinicalReviewItem[];
  hypotheses: ClinicalReviewItem[];
  ambiguities: ClinicalReviewItem[];
  clientDetails: Array<{ label: string; value: string }>;
  warningGroups: ReturnType<typeof prioritiseExtractionWarnings>;
  formVsEvidence: Array<{
    label: string;
    clinical: string;
    formValue: string;
  }>;
}

export interface ReviewFindingStats {
  total: number;
  confirmedFacts: number;
  clinicalReviewItems: number;
  workingHypotheses: number;
  needClarification: number;
  approved: number;
  pending: number;
}

/** Clinician-facing display normalisation — does not mutate raw/source. */
export function displayNormalise(text: string): string {
  return text
    .replace(/\bSelf\s+employe+d\b/gi, 'Self-employed')
    .replace(/\bBiopolar\b/gi, 'Bipolar disorder')
    .replace(/\bbig heart\b/gi, 'Big-hearted')
    .replace(/\s+/g, ' ')
    .trim();
}

function clarificationKey(title: string): string {
  const t = title
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/\bfather'?s?\b/g, 'father')
    .replace(/\bfemur\b|\bleg injury\b|\bleg\b/g, 'femur')
    .replace(/\bincident\b|\binjury\b/g, 'femur')
    .replace(/\brole\/?context\b|\bcontext\b|\brole\b/g, 'context')
    .replace(/\bclarify\b|\bexplore\b|\bunderstand\b/g, 'ask')
    .replace(/\bsafety\s*\/?\s*risk\b|\brisk status\b|\bsafety\b/g, 'safety')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|and|of|a|an|to|for|with)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Collapse repeated tokens (e.g. femur femur)
  const parts = t.split(' ');
  const uniq: string[] = [];
  for (const p of parts) {
    if (uniq[uniq.length - 1] === p) continue;
    uniq.push(p);
  }
  return uniq.join(' ');
}

function clarificationTokens(title: string): Set<string> {
  return new Set(
    clarificationKey(title)
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function clarificationsSimilar(a: string, b: string): boolean {
  if (clarificationKey(a) === clarificationKey(b)) return true;
  const A = clarificationTokens(a);
  const B = clarificationTokens(b);
  if (!A.size || !B.size) return false;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  const union = A.size + B.size - inter;
  return union > 0 && inter / union >= 0.72;
}

/** Merge duplicate / near-duplicate clarification questions. */
export function dedupeClarifications(items: ClinicalReviewItem[]): ClinicalReviewItem[] {
  const out: ClinicalReviewItem[] = [];
  for (const item of items) {
    if (out.some((existing) => clarificationsSimilar(existing.title, item.title))) continue;
    out.push({ ...item, title: displayNormalise(item.title) });
  }
  return out;
}

export function computeReviewFindingStats(findings: IntakeCoreFinding[]): ReviewFindingStats {
  const pending = findings.filter((f) => f.reviewStatus === 'pending' || !f.reviewStatus);
  return {
    total: findings.length,
    confirmedFacts: 0, // filled by caller after eligible known — see withEligibleStats
    clinicalReviewItems: findings.filter((f) => f.category === 'risk-clinical-review').length,
    workingHypotheses: findings.filter((f) => f.category === 'working-hypothesis').length,
    needClarification: findings.filter(
      (f) =>
        f.category === 'outstanding-question' ||
        (f.category === 'not-established' && (f.reviewStatus === 'pending' || !f.reviewStatus)),
    ).length,
    approved: findings.filter((f) => f.reviewStatus === 'approved' || f.reviewStatus === 'edited').length,
    pending: pending.length,
  };
}


function wordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  return `${words.slice(0, maxWords).join(' ')}…`;
}

function nameOf(extracted: ExtractedIntake | null | undefined, fallback = 'The client'): string {
  return (
    extracted?.personalInformation.preferredName?.trim() ||
    extracted?.personalInformation.fullName?.trim()?.split(/\s+/)[0] ||
    fallback
  );
}

function evidenceByConcept(evidence: ClinicalEvidence[]): Map<string, ClinicalEvidence> {
  const map = new Map<string, ClinicalEvidence>();
  for (const e of evidence) {
    if (e.contradicts) continue;
    const prev = map.get(e.concept);
    if (!prev || (e.corroborates?.length ?? 0) >= (prev.corroborates?.length ?? 0)) {
      map.set(e.concept, e);
    }
  }
  return map;
}

function confFromEvidence(e: ClinicalEvidence | undefined): ReviewConfidenceLabel {
  if (!e) return 'Needs review';
  if (e.evidenceLevel === 'explicitly-reported' && e.confidence === 'high') return 'High confidence';
  if (e.confidence === 'moderate') return 'Needs review';
  if (e.confidence === 'low') return 'Needs review';
  return 'High confidence';
}

function formNote(e: ClinicalEvidence | undefined): string | undefined {
  if (!e?.formFieldId) return undefined;
  if (e.formSelectionStatus === 'unknown' || e.formSelectionStatus === 'absent') {
    return 'Original Yes/No selection: Not recoverable from pasted form';
  }
  if (e.formSelectionStatus === 'yes') return 'Original form selection: Yes';
  if (e.formSelectionStatus === 'no') return 'Original form selection: No';
  return undefined;
}

/**
 * Build modality-neutral Initial Clinical Brief (~150–200 words).
 */
export function buildInitialClinicalBrief(args: {
  extracted: ExtractedIntake | null | undefined;
  evidence: ClinicalEvidence[];
  findings?: IntakeCoreFinding[];
}): string {
  const { extracted, evidence } = args;
  const by = evidenceByConcept(evidence);
  const who = nameOf(extracted);
  const parts: string[] = [];

  const situationBits: string[] = [];
  if (by.has('relationship-crisis')) {
    situationBits.push('an acute marital / relationship crisis');
  }
  const summary = extracted?.presentingProblem.summary?.trim();
  if (situationBits.length) {
    parts.push(
      `${who} presents during ${situationBits.join(' and ')}${
        /divorce/i.test(summary ?? '') ? ' involving possible divorce' : ''
      }.`,
    );
  } else if (summary) {
    parts.push(`${who} presents seeking therapy. ${summary.slice(0, 160)}${summary.length > 160 ? '…' : ''}`);
  }

  const patternBits: string[] = [];
  if (by.has('defensiveness')) patternBits.push('defensiveness');
  if (by.has('emotional-withdrawal')) patternBits.push('emotional withdrawal');
  if (by.has('self-reliance') || by.has('fixing-solutions')) patternBits.push('self-reliance / fixing');
  if (by.has('trauma-adversity')) {
    parts.push(
      patternBits.length
        ? `${who} links the current situation with longstanding patterns of ${patternBits.join(', ')} and childhood adversity.`
        : `${who} reports significant childhood adversity / traumatic experiences.`,
    );
  } else if (patternBits.length) {
    parts.push(`${who} describes patterns involving ${patternBits.join(', ')}.`);
  }

  const diffs: string[] = [];
  if (by.has('anxiety')) diffs.push('severe anxiety');
  if (by.has('sleep-disturbance')) {
    const sleepEx = by.get('sleep-disturbance')!.sourceExcerpt;
    const hours = sleepEx.match(/\d\s*[-–]\s*\d\s*hours?/i);
    diffs.push(hours ? `poor sleep of approximately ${hours[0].replace(/\s+/g, ' ')} per night` : 'poor sleep');
  }
  if (by.has('intrusive-thoughts')) diffs.push('intrusive thoughts');
  if (by.has('depression-grief')) diffs.push('sadness / grief');
  if (by.has('hopelessness')) diffs.push('periods of hopelessness');
  if (by.has('food-appetite-stress')) diffs.push('stress-related disruption to meals');
  if (diffs.length) {
    parts.push(`${who} explicitly reports ${diffs.join(', ')}.`);
  }

  const resources: string[] = [];
  const strengths = extracted?.strengths.strengths ?? '';
  if (/family|father|dogs/i.test(strengths + (extracted?.identityAndSelfDescription.mostImportantThing ?? ''))) {
    resources.push('family');
  }
  if (/father|daughter|child|parent/i.test(strengths + (extracted?.psychosocialFactors.household ?? ''))) {
    resources.push('a meaningful parenting role');
  }
  if (extracted?.lifestyleAndSymptoms.exerciseTypes?.length || /exercise/i.test(strengths)) {
    resources.push('exercise');
  }
  if (by.has('previous-therapy')) resources.push('previous therapy experience');
  const words = extracted?.identityAndSelfDescription.fiveWords ?? [];
  const hasMotivation = /motivat/i.test(strengths);
  if (resources.length || hasMotivation || words.length) {
    const resourceClause = resources.length
      ? `and draws on ${[...new Set(resources)].slice(0, 5).join(', ')}`
      : '';
    const identityClause = words.length
      ? ` He describes himself as ${words.slice(0, 4).map((w) => displayNormalise(w).toLowerCase()).join(', ')}.`
      : '';
    parts.push(
      `${who} ${hasMotivation ? 'appears motivated for change' : 'is engaging with therapy'} ${resourceClause}.${identityClause}`.replace(
        /\s+/g,
        ' ',
      ),
    );
  }

  const clarify: string[] = [];
  if (by.has('hopelessness')) clarify.push('current safety / risk');
  if (by.has('intrusive-thoughts')) clarify.push('the nature of intrusive thoughts');
  if (by.has('trauma-adversity') || extracted?.developmentalHistory.childhoodDescription) {
    clarify.push('developmental history');
  }
  if (by.has('relationship-crisis')) clarify.push('current relationship dynamics');
  if (by.has('ambiguous-abuse-detail') || /femur/i.test(extracted?.traumaHistory.abuseDetails ?? '')) {
    clarify.push('the context of several childhood experiences');
  }
  if (clarify.length) {
    parts.push(`Areas requiring clarification include ${clarify.join(', ')}.`);
  }

  return wordLimit(parts.join(' '), 200);
}

function difficultyItems(by: Map<string, ClinicalEvidence>): ClinicalReviewItem[] {
  const specs: Array<{ concept: string; title: string; body?: (e: ClinicalEvidence) => string }> = [
    { concept: 'anxiety', title: 'Severe anxiety' },
    {
      concept: 'sleep-disturbance',
      title: 'Poor sleep',
      body: (e) => {
        const m = e.sourceExcerpt.match(/\d\s*[-–]\s*\d\s*hours?/i);
        return m ? `${m[0].replace(/\s+/g, ' ')}/night · Explicitly reported` : 'Explicitly reported';
      },
    },
    { concept: 'intrusive-thoughts', title: 'Intrusive thoughts' },
    { concept: 'depression-grief', title: 'Grief / sadness' },
    { concept: 'hopelessness', title: 'Periods of hopelessness' },
    {
      concept: 'food-appetite-stress',
      title: 'Stress-related skipped meals',
    },
  ];
  return specs
    .filter((s) => by.has(s.concept))
    .map((s) => {
      const e = by.get(s.concept)!;
      return {
        id: `diff_${s.concept}`,
        title: s.title,
        body: s.body?.(e) ?? 'Explicitly reported',
        confidence: confFromEvidence(e),
        evidenceLevel: e.evidenceLevel.replace(/-/g, ' '),
        sourceField: e.sourceField,
        sourceExcerpt: e.sourceExcerpt,
        formSelectionNote: formNote(e),
        kind: 'fact' as const,
      };
    });
}

function patternItems(by: Map<string, ClinicalEvidence>, findings: IntakeCoreFinding[]): ClinicalReviewItem[] {
  const fromEvidence: Array<{ concept: string; title: string }> = [
    { concept: 'defensiveness', title: 'Defensive when criticised/misunderstood' },
    { concept: 'emotional-withdrawal', title: 'Emotional withdrawal' },
    { concept: 'difficulty-asking-help', title: 'Difficulty asking for help' },
    { concept: 'self-reliance', title: 'Handles problems alone' },
    { concept: 'fixing-solutions', title: 'Fixing/problem-solving' },
    { concept: 'self-doubt-overthinking', title: 'Anxiety/self-doubt/overthinking' },
  ];
  const items = fromEvidence
    .filter((s) => by.has(s.concept))
    .map((s) => {
      const e = by.get(s.concept)!;
      return {
        id: `pat_${s.concept}`,
        title: s.title,
        body: 'Client-identified pattern',
        confidence: confFromEvidence(e) as ReviewConfidenceLabel,
        sourceField: e.sourceField,
        sourceExcerpt: e.sourceExcerpt,
        kind: 'pattern' as const,
      };
    });
  if (items.length) return items;
  return findings
    .filter(
      (f) =>
        (f.category === 'relational-pattern' || f.category === 'protective-process') &&
        /defensive|withdraw|help|alone|fixing|overthink|self[- ]?doubt/i.test(f.text),
    )
    .map((f) => ({
      id: f.id,
      title: f.therapistEditedValue ?? f.text,
      body: 'Client-identified pattern',
      confidence: 'Needs review' as ReviewConfidenceLabel,
      findingId: f.id,
      sourceExcerpt: f.clientStatement,
      kind: 'pattern' as const,
    }));
}

/**
 * Build full Initial Clinical Review model for the therapist UI.
 */
export function buildInitialClinicalReviewModel(args: {
  extracted: ExtractedIntake | null | undefined;
  evidence: ClinicalEvidence[];
  findings: IntakeCoreFinding[];
  warnings?: IntakeExtractionWarning[];
}): InitialClinicalReviewModel {
  const { extracted, evidence, findings } = args;
  const by = evidenceByConcept(evidence);
  const who = nameOf(extracted);
  const warnings = args.warnings ?? extracted?.extractionWarnings ?? [];

  const situation: string[] = [];
  if (by.has('relationship-crisis')) situation.push('Acute marital / relationship crisis');
  if (/divorce/i.test(extracted?.presentingProblem.summary ?? '')) {
    situation.push('Threatened / possible divorce');
  }
  if (extracted?.psychosocialFactors.workStress) situation.push(`Work stress: ${extracted.psychosocialFactors.workStress}`);
  if (!situation.length && extracted?.presentingProblem.summary) {
    situation.push(extracted.presentingProblem.summary.slice(0, 180));
  }

  const goals = formatGoalsAsBullets(extracted?.goals.therapyGoals).map((text) => ({
    text,
    sourceExcerpt: text,
  }));

  const resources: ClinicalReviewItem[] = [];
  const pushResource = (title: string, body: string, excerpt?: string) => {
    resources.push({
      id: `res_${title}`,
      title: displayNormalise(title),
      body,
      confidence: 'High confidence',
      sourceExcerpt: excerpt,
      kind: 'resource',
    });
  };
  if (/family|dogs/i.test(extracted?.identityAndSelfDescription.mostImportantThing ?? '')) {
    pushResource('Strong commitment to family', 'Client-reported', extracted?.identityAndSelfDescription.mostImportantThing ?? undefined);
  }
  if (/daughter|child|father|parent/i.test(extracted?.psychosocialFactors.household ?? '')) {
    pushResource('Fatherhood / parenting role', 'Client-reported', extracted?.psychosocialFactors.household ?? undefined);
  }
  if (by.has('previous-therapy')) {
    pushResource('Previous therapy engagement', 'Explicitly reported', by.get('previous-therapy')!.sourceExcerpt);
  }
  if (extracted?.lifestyleAndSymptoms.exerciseTypes?.length) {
    pushResource(
      'Exercise',
      extracted.lifestyleAndSymptoms.exerciseTypes.map(displayNormalise).join(' · '),
      extracted.lifestyleAndSymptoms.exerciseFrequency ?? undefined,
    );
  }
  if (/motivat/i.test(extracted?.strengths.strengths ?? '')) {
    pushResource('Motivation for change', 'Client-reported', extracted?.strengths.strengths ?? undefined);
  }
  if (extracted?.strengths.strengths && resources.length < 2) {
    pushResource('Strengths (client-reported)', extracted.strengths.strengths, extracted.strengths.strengths);
  }

  const rawWords = extracted?.identityAndSelfDescription.fiveWords ?? [];
  const selfDescribedQualities =
    rawWords.length > 0
      ? {
          display: rawWords.map((w) => displayNormalise(w)).join(' · '),
          rawWords,
        }
      : null;

  const patterns = patternItems(by, findings);
  const patternBlob = patterns.map((p) => p.title.toLowerCase()).join(' ');

  const currentCosts: ClinicalReviewItem[] = [];
  if (extracted?.vulnerabilities.weaknesses) {
    // Impact only — do not repeat the full weaknesses narrative already covered by patterns
    const impactBits: string[] = [];
    if (/relationship|marriage|connect/i.test(extracted.vulnerabilities.weaknesses) && !/relationship/i.test(patternBlob)) {
      impactBits.push('Relational strain linked to these patterns');
    }
    if (/stress/i.test(extracted.vulnerabilities.weaknesses)) {
      impactBits.push('Patterns intensify under stress');
    }
    if (!impactBits.length) {
      impactBits.push('These patterns currently cost emotional availability and ease asking for support');
    }
    currentCosts.push({
      id: 'cost_impact',
      title: 'Impact / current costs',
      body: impactBits.join('. ') + '.',
      confidence: 'High confidence',
      sourceExcerpt: extracted.vulnerabilities.weaknesses,
      kind: 'cost',
    });
  }

  const lifeContext: ClinicalReviewItem[] = [];
  if (by.has('previous-therapy')) {
    lifeContext.push({
      id: 'ctx_prev',
      title: 'Previous therapy',
      body: by.get('previous-therapy')!.statement,
      confidence: confFromEvidence(by.get('previous-therapy')),
      sourceExcerpt: by.get('previous-therapy')!.sourceExcerpt,
      formSelectionNote: formNote(by.get('previous-therapy')),
      kind: 'fact',
    });
  }
  if (by.has('family-mental-health') || extracted?.psychologicalHistory.familyMentalHealthDetails) {
    const raw =
      extracted?.psychologicalHistory.familyMentalHealthDetails ??
      by.get('family-mental-health')?.sourceExcerpt ??
      '';
    const display = displayNormalise(raw)
      .replace(/^Bipolar disorder,?\s*/i, 'Bipolar disorder / ')
      .replace(/Bipolar disorder \/ severe depression/i, 'Bipolar disorder / severe depression');
    lifeContext.push({
      id: 'ctx_fam',
      title: 'Reported family mental-health history',
      body: `${display.trim() || 'See source'}\nRelationship to client: Not established`,
      confidence: 'Needs review',
      sourceExcerpt: raw,
      kind: 'fact',
    });
  }
  if (extracted?.psychosocialFactors.occupation) {
    lifeContext.push({
      id: 'ctx_occ',
      title: 'Occupation',
      body: displayNormalise(extracted.psychosocialFactors.occupation),
      confidence: 'Confirmed',
      sourceExcerpt: extracted.psychosocialFactors.occupation,
      kind: 'fact',
    });
  }

  const relationships: ClinicalReviewItem[] = [];
  if (by.has('relationship-crisis')) {
    relationships.push({
      id: 'rel_crisis',
      title: 'Acute marital / relationship crisis',
      body: 'Explicitly reported',
      confidence: 'High confidence',
      sourceExcerpt: by.get('relationship-crisis')!.sourceExcerpt,
      kind: 'fact',
    });
  }
  if (extracted?.lifestyleAndSymptoms.relationshipLength) {
    relationships.push({
      id: 'rel_len',
      title: 'Relationship length',
      body: extracted.lifestyleAndSymptoms.relationshipLength,
      confidence: 'Confirmed',
      kind: 'fact',
    });
  }
  if (extracted?.psychosocialFactors.household) {
    relationships.push({
      id: 'rel_house',
      title: 'Household',
      body: extracted.psychosocialFactors.household,
      confidence: 'Confirmed',
      kind: 'fact',
    });
  }

  const significantExperiences: ClinicalReviewItem[] = [];
  if (by.has('trauma-adversity') || extracted?.traumaHistory.traumaticEventDetails) {
    significantExperiences.push({
      id: 'sig_trauma',
      title: 'Childhood adversity / traumatic experiences',
      body: 'Client reports significant childhood adversity / traumatic experiences (not a trauma diagnosis).',
      confidence: 'High confidence',
      sourceExcerpt:
        by.get('trauma-adversity')?.sourceExcerpt ??
        extracted?.traumaHistory.traumaticEventDetails ??
        extracted?.developmentalHistory.childhoodDescription ??
        undefined,
      kind: 'fact',
    });
  }
  if (extracted?.developmentalHistory.childhoodDescription) {
    significantExperiences.push({
      id: 'sig_child',
      title: 'Childhood (client narrative)',
      body: extracted.developmentalHistory.childhoodDescription.slice(0, 280),
      confidence: 'High confidence',
      sourceExcerpt: extracted.developmentalHistory.childhoodDescription,
      kind: 'fact',
    });
  }

  const ambiguities: ClinicalReviewItem[] = [];
  const abuse = extracted?.traumaHistory.abuseDetails?.trim();
  if (abuse && /femur|breaking .{0,20}leg/i.test(abuse)) {
    ambiguities.push({
      id: 'amb_femur',
      title: 'Possible ambiguity to clarify',
      body: `The client entered: “${abuse}” under the childhood/adolescent abuse section. The subject/context is unclear — do not rewrite as an injury inflicted on the client.`,
      confidence: 'Needs review',
      sourceExcerpt: abuse,
      kind: 'ambiguity',
    });
  }

  const riskFindingIds = findings.filter((f) => f.category === 'risk-clinical-review').map((f) => f.id);
  const riskPanel =
    by.has('hopelessness') || riskFindingIds.length
      ? {
          required: true,
          reason:
            'Hopelessness was explicitly reported during an acute marital crisis (or as stated in the intake).',
          items: [
            { label: 'Current suicidal ideation', status: 'Not established' },
            { label: 'Self-harm', status: 'Not established' },
            { label: 'Intent', status: 'Not established' },
            { label: 'Plan', status: 'Not established' },
            { label: 'Means', status: 'Not established' },
            { label: 'Immediacy', status: 'Not established' },
          ],
          findingIds: riskFindingIds,
        }
      : null;

  const clarificationsRaw: ClinicalReviewItem[] = [];
  const pushClarify = (title: string, excerpt?: string) => {
    clarificationsRaw.push({
      id: `clar_${title}`,
      title,
      body: 'Possible area to clarify — not a mandatory intervention.',
      confidence: 'Needs review',
      sourceExcerpt: excerpt,
      kind: 'clarification',
    });
  };
  if (riskPanel) pushClarify('Clarify current safety / risk status');
  if (by.has('intrusive-thoughts')) pushClarify('Clarify the nature and frequency of intrusive thoughts');
  if (by.has('sleep-disturbance')) pushClarify('Clarify current sleep impact');
  if (significantExperiences.length) pushClarify('Explore developmental / childhood history');
  if (ambiguities.length) pushClarify('Clarify the childhood femur incident and father’s role/context');
  if (lifeContext.some((c) => c.id === 'ctx_fam')) {
    pushClarify('Clarify family mental-health history and relationship to client');
  }
  if (by.has('relationship-crisis')) pushClarify('Understand current marital dynamics');
  pushClarify('Clarify current support network');
  if (/emotional safety/i.test(goals.map((g) => g.text).join(' '))) {
    pushClarify('Explore what “emotional safety” means to the client');
  }
  for (const f of findings.filter((x) => x.category === 'outstanding-question')) {
    clarificationsRaw.push({
      id: f.id,
      title: f.therapistEditedValue ?? f.text,
      body: 'Outstanding question from intake review',
      confidence: 'Needs review',
      findingId: f.id,
      sourceExcerpt: f.clientStatement,
      kind: 'clarification',
    });
  }
  const clarifications = dedupeClarifications(clarificationsRaw);

  const hypotheses: ClinicalReviewItem[] = findings
    .filter((f) => f.category === 'working-hypothesis')
    .map((f) => ({
      id: f.id,
      title: 'Possible protective function',
      body: f.therapistEditedValue ?? f.text,
      confidence: 'Needs review' as ReviewConfidenceLabel,
      findingId: f.id,
      sourceExcerpt: f.evidence[0]?.clientResponse ?? f.clientStatement,
      kind: 'hypothesis' as const,
    }));

  const clientDetails: Array<{ label: string; value: string }> = [];
  const p = extracted?.personalInformation;
  if (p?.fullName) clientDetails.push({ label: 'Full name', value: p.fullName });
  if (p?.preferredName) clientDetails.push({ label: 'Preferred name', value: p.preferredName });
  if (p?.dateOfBirth) clientDetails.push({ label: 'Date of birth', value: p.dateOfBirth });
  if (p?.currentAge != null) clientDetails.push({ label: 'Age', value: String(p.currentAge) });
  if (p?.email) clientDetails.push({ label: 'Email', value: p.email });
  if (p?.telephone) clientDetails.push({ label: 'Telephone', value: p.telephone });
  if (p?.homeAddress) clientDetails.push({ label: 'Address', value: p.homeAddress });
  if (p?.pronouns) clientDetails.push({ label: 'Pronouns', value: p.pronouns });

  const formVsEvidence: InitialClinicalReviewModel['formVsEvidence'] = [];
  if (by.has('anxiety')) {
    formVsEvidence.push({
      label: 'Anxiety',
      clinical: 'Explicitly reported',
      formValue: 'Not recoverable from pasted form',
    });
  }
  if (by.has('sleep-disturbance')) {
    formVsEvidence.push({
      label: 'Sleep problems',
      clinical: 'Explicitly reported',
      formValue: 'Not recoverable from pasted form',
    });
  }

  return {
    preferredName: who,
    brief: buildInitialClinicalBrief({ extracted, evidence, findings }),
    currentSituation: situation,
    goals,
    difficulties: difficultyItems(by),
    lifeContext,
    relationships,
    significantExperiences,
    resources,
    selfDescribedQualities,
    currentCosts,
    patterns,
    riskPanel,
    clarifications,
    hypotheses,
    ambiguities,
    clientDetails,
    warningGroups: prioritiseExtractionWarnings(warnings),
    formVsEvidence,
  };
}

/** Findings safe to bulk-approve (facts only — not hypotheses, risk, or ambiguities). */
export function findingsEligibleForApproveAllConfirmed(findings: IntakeCoreFinding[]): string[] {
  return findings
    .filter((f) => {
      if (f.reviewStatus === 'approved' || f.reviewStatus === 'edited' || f.reviewStatus === 'rejected') {
        return false;
      }
      if (f.category === 'working-hypothesis') return false;
      if (f.category === 'protective-process' && /hypothesis/i.test(f.text)) return false;
      if (f.category === 'risk-clinical-review') return false;
      if (f.category === 'outstanding-question') return false;
      if (f.category === 'not-established') return false;
      if (/source inconsistency|clarify the childhood femur|ambiguous/i.test(f.text)) return false;
      return true;
    })
    .map((f) => f.id);
}

export function reviewStatsWithEligible(findings: IntakeCoreFinding[]): ReviewFindingStats {
  const base = computeReviewFindingStats(findings);
  return {
    ...base,
    confirmedFacts: findingsEligibleForApproveAllConfirmed(findings).length,
  };
}

export function countUnresolvedHighPriority(findings: IntakeCoreFinding[]): number {
  return findings.filter(
    (f) =>
      (f.reviewStatus === 'pending' || !f.reviewStatus) &&
      (f.category === 'risk-clinical-review' ||
        f.clinicalReviewRequired ||
        (f.category === 'outstanding-question' && /femur|inconsistency|safety|risk/i.test(f.text))),
  ).length;
}
