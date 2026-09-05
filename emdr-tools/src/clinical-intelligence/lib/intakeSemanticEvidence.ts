/**
 * Semantic clinical evidence — modality-neutral layer between confirmed
 * intake extraction and core clinical reasoning.
 *
 * Form field selections stay as extracted (null remains null).
 * Narrative elsewhere can still establish clinical evidence independently.
 */

import type { IntakeAnswerMap, StructuredIntake } from './pathfinderIntakeForm';
import type { ExtractedIntake, IntakeExtractionWarning } from './intakeExtraction';
import {
  type IntakeCoreFinding,
  type IntakeEvidenceLink,
  type IntakeFindingCategory,
  type IntakeFindingFraming,
} from './intakeReasoning';
import { INTAKE_SECTION_LABELS, questionById } from './pathfinderIntakeForm';

export type ClinicalEvidenceLevel = 'explicitly-reported' | 'inferred' | 'suggested' | 'unknown';
export type ClinicalEvidenceConfidence = 'high' | 'moderate' | 'low';
export type ClinicalEvidenceSourceType = 'intake-form-field' | 'intake-narrative' | 'intake-corroborated';

export type ClinicalConceptId =
  | 'anxiety'
  | 'sleep-disturbance'
  | 'previous-therapy'
  | 'depression-grief'
  | 'hopelessness'
  | 'trauma-adversity'
  | 'food-appetite-stress'
  | 'relationship-crisis'
  | 'defensiveness'
  | 'emotional-withdrawal'
  | 'self-reliance'
  | 'fixing-solutions'
  | 'difficulty-asking-help'
  | 'self-doubt-overthinking'
  | 'intrusive-thoughts'
  | 'family-mental-health'
  | 'chronic-pain'
  | 'exercise-resource'
  | 'motivation-change'
  | 'ambiguous-abuse-detail';

export interface ClinicalEvidence {
  id: string;
  concept: ClinicalConceptId;
  statement: string;
  evidenceLevel: ClinicalEvidenceLevel;
  confidence: ClinicalEvidenceConfidence;
  sourceType: ClinicalEvidenceSourceType;
  sourceField: string;
  sourceExcerpt: string;
  /** Form question id when mapping to structured answers */
  formFieldId?: string;
  /** Original form selection remains unknown / null / opposite */
  formSelectionStatus?: 'unknown' | 'yes' | 'no' | 'absent';
  contradicts?: boolean;
  corroborates?: string[];
  clinicalReviewRequired?: boolean;
}

export interface SemanticCorroborationResult {
  evidence: ClinicalEvidence[];
  contradictions: ClinicalEvidence[];
  /** Findings derived from narrative when form selection is unknown */
  narrativeFindings: IntakeCoreFinding[];
  clinicalReviewRequired: boolean;
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function allNarrativeSources(answers: IntakeAnswerMap): Array<{ field: string; text: string }> {
  const keys = [
    'mainProblems',
    'therapyGoals',
    'whyThisTherapist',
    'anxietyPanicPhobias',
    'depressionGriefSadness',
    'sleepProblems',
    'foodAppetiteWeightBodyImage',
    'alcoholRecreationalDrugUse',
    'romanticRelationship',
    'previousTherapy',
    'previousMentalHealthTreatment',
    'familyMentalHealthAddictionDvHistory',
    'trauma',
    'childhoodAdolescentAbuse',
    'childhood',
    'schoolExperience',
    'strengths',
    'weaknesses',
    'fiveWordsDescribingSelf',
    'mostImportantThingInLife',
    'significantAchievement',
    'exercise',
    'occupation',
    'workEnjoymentStress',
    'household',
  ] as const;
  const out: Array<{ field: string; text: string }> = [];
  for (const k of keys) {
    const t = answers[k]?.trim();
    if (t) out.push({ field: k, text: t });
  }
  return out;
}

function formBoolStatus(
  extracted: ExtractedIntake | null | undefined,
  path: 'anxiety' | 'sleep' | 'previousTherapy' | 'depression' | 'chronicPain' | 'food',
): 'unknown' | 'yes' | 'no' | 'absent' {
  if (!extracted) return 'absent';
  const map = {
    anxiety: extracted.lifestyleAndSymptoms.anxietyPanicPhobias,
    sleep: extracted.lifestyleAndSymptoms.sleepProblems,
    previousTherapy: extracted.psychologicalHistory.previousTherapy,
    depression: extracted.lifestyleAndSymptoms.depressionGriefSadness,
    chronicPain: extracted.medicalHistory.chronicPain,
    food: extracted.lifestyleAndSymptoms.foodBodyImageIssues,
  } as const;
  const v = map[path];
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return 'unknown';
}

function answerLooksNegative(raw: string | undefined): boolean {
  if (!raw?.trim()) return false;
  return /^(no|n|false|none|n\/a)\b/i.test(raw.trim());
}

function answerLooksPositive(raw: string | undefined): boolean {
  if (!raw?.trim()) return false;
  const t = raw.trim();
  if (answerLooksNegative(t)) return false;
  return /^(yes|y|true)\b/i.test(t) || t.length > 8;
}

interface ConceptRule {
  concept: ClinicalConceptId;
  patterns: RegExp[];
  statement: (excerpt: string) => string;
  category: IntakeFindingCategory;
  framing?: IntakeFindingFraming;
  formFieldId?: string;
  formPath?: 'anxiety' | 'sleep' | 'previousTherapy' | 'depression' | 'chronicPain' | 'food';
  confidence?: ClinicalEvidenceConfidence;
  clinicalReviewRequired?: boolean;
  /** Prefer these source fields when ranking corroboration */
  preferredFields?: string[];
}

const CONCEPT_RULES: ConceptRule[] = [
  {
    concept: 'anxiety',
    patterns: [/\banxiety\b/i, /\banxious\b/i, /\bpanic\b/i],
    statement: () => 'Anxiety explicitly reported.',
    category: 'symptom',
    formFieldId: 'anxietyPanicPhobias',
    formPath: 'anxiety',
    preferredFields: ['mainProblems', 'anxietyPanicPhobias', 'weaknesses'],
  },
  {
    concept: 'sleep-disturbance',
    patterns: [
      /\bpoor sleep\b/i,
      /\bsleep(?:ing)?\s+(?:only\s+)?\d/i,
      /\b\d\s*[-–]\s*\d\s*hours?\s*(?:per|a|\/)\s*night\b/i,
      /\binsomnia\b/i,
      /\bwake(?:s|ing)?\s+at\b/i,
    ],
    statement: (ex) =>
      /\d\s*[-–]\s*\d\s*hours?/i.test(ex) || /\d+\s*hours?\s*(?:per|a|\/)\s*night/i.test(ex)
        ? 'Significant sleep disturbance explicitly reported (do not invent a numerical sleep rating).'
        : 'Significant sleep disturbance explicitly reported.',
    category: 'lifestyle',
    formFieldId: 'sleepProblems',
    formPath: 'sleep',
    preferredFields: ['mainProblems', 'sleepProblems', 'depressionGriefSadness'],
  },
  {
    concept: 'previous-therapy',
    patterns: [
      /\bworked with a therapist\b/i,
      /\bprevious therapy\b/i,
      /\bprior therapy\b/i,
      /\bVeterans Affairs\b/i,
      /\b\bVA\b/,
      /\bcounselling\b/i,
      /\bcounseling\b/i,
      /\bACT\b/,
    ],
    statement: () =>
      'Previous therapy explicitly established by narrative evidence (original form selection may remain unknown).',
    category: 'psychological-history',
    formFieldId: 'previousTherapy',
    formPath: 'previousTherapy',
    preferredFields: ['previousTherapy', 'previousMentalHealthTreatment'],
  },
  {
    concept: 'depression-grief',
    patterns: [
      /\bgrief\b/i,
      /\bsadness\b/i,
      /\bdepress(?:ion|ive|ed)\b/i,
      /\blow mood\b/i,
    ],
    statement: () =>
      'Grief / sadness / depressive symptoms explicitly reported (not a depressive-disorder diagnosis).',
    category: 'symptom',
    formFieldId: 'depressionGriefSadness',
    formPath: 'depression',
    preferredFields: ['depressionGriefSadness', 'mainProblems'],
  },
  {
    concept: 'hopelessness',
    patterns: [/\bhopeless(?:ness)?\b/i],
    statement: () =>
      'Hopelessness explicitly reported. CLINICAL REVIEW REQUIRED — suicidal ideation, self-harm, intent, plan, means, and immediacy are not established from this intake alone. Do not invent risk severity.',
    category: 'risk-clinical-review',
    framing: 'information-requiring-clarification',
    preferredFields: ['depressionGriefSadness', 'mainProblems'],
    clinicalReviewRequired: true,
    confidence: 'high',
  },
  {
    concept: 'trauma-adversity',
    patterns: [
      /\btrauma\b/i,
      /\bhouse fire\b/i,
      /\bparental fighting\b/i,
      /\bemotional neglect\b/i,
      /\bchildhood (?:instability|adversity)\b/i,
      /\bunstable home\b/i,
    ],
    statement: () =>
      'Client reports significant childhood adversity / traumatic experiences (not a trauma diagnosis; modality-specific targeting is not applied at intake).',
    category: 'trauma-adversity',
    formFieldId: 'trauma',
    preferredFields: ['trauma', 'childhood', 'childhoodAdolescentAbuse'],
  },
  {
    concept: 'food-appetite-stress',
    patterns: [
      /\bskipp(?:ing|ed)\s+meals?\b/i,
      /\bnot (?:making|preparing) (?:my|his|her|their)?\s*own food\b/i,
      /\bnot preparing food\b/i,
    ],
    statement: () =>
      'Current stress is affecting eating / meal regularity (not automatically classified as eating-disorder or body-image pathology).',
    category: 'lifestyle',
    formFieldId: 'foodAppetiteWeightBodyImage',
    formPath: 'food',
    preferredFields: ['foodAppetiteWeightBodyImage', 'mainProblems'],
  },
  {
    concept: 'relationship-crisis',
    patterns: [
      /\bdivorce\b/i,
      /\bmarriage .{0,40}crisis\b/i,
      /\bin crisis\b/i,
      /\bwants? (?:a )?divorce\b/i,
      /\bpossible (?:divorce|separation)\b/i,
      /\bseparation\b/i,
    ],
    statement: () => 'Acute marital / relationship crisis explicitly reported.',
    category: 'relational-pattern',
    formFieldId: 'romanticRelationship',
    preferredFields: ['mainProblems', 'romanticRelationship', 'depressionGriefSadness'],
  },
  {
    concept: 'defensiveness',
    patterns: [/\bdefensive(?:ness)?\b/i, /\bwhen criticis/i, /\bwhen misunderstood\b/i],
    statement: () => 'Client identifies defensiveness when criticised or misunderstood.',
    category: 'relational-pattern',
    preferredFields: ['weaknesses', 'mainProblems'],
  },
  {
    concept: 'emotional-withdrawal',
    patterns: [/\bwithdraw(?:al|s|ing)?\b/i, /\bemotional(?:ly)? withdraw/i],
    statement: () => 'Client identifies emotional withdrawal.',
    category: 'relational-pattern',
    preferredFields: ['weaknesses', 'mainProblems'],
  },
  {
    concept: 'self-reliance',
    patterns: [
      /\bhandle(?:s|ing)? problems alone\b/i,
      /\bon (?:my|his|her) own\b/i,
      /\bself[- ]?reliant\b/i,
      /\bindependence\b/i,
    ],
    statement: () => 'Client identifies a tendency to handle problems alone / self-reliance.',
    category: 'relational-pattern',
    preferredFields: ['weaknesses', 'childhood'],
  },
  {
    concept: 'fixing-solutions',
    patterns: [/\bfixing\b/i, /\bsolution[- ]?focus/i, /\binto fixing\b/i],
    statement: () =>
      'Client identifies moving into fixing / solutions (possible protective process — hypothesis only).',
    category: 'protective-process',
    framing: 'possible-working-hypothesis',
    preferredFields: ['weaknesses'],
  },
  {
    concept: 'difficulty-asking-help',
    patterns: [/\bdifficulty asking for help\b/i, /\bhard to ask for help\b/i],
    statement: () => 'Client identifies difficulty asking for help.',
    category: 'relational-pattern',
    preferredFields: ['weaknesses'],
  },
  {
    concept: 'self-doubt-overthinking',
    patterns: [/\bself[- ]?doubt\b/i, /\boverthinking\b/i],
    statement: () => 'Client identifies self-doubt and/or overthinking.',
    category: 'symptom',
    preferredFields: ['weaknesses', 'mainProblems'],
  },
  {
    concept: 'intrusive-thoughts',
    patterns: [/\bintrusive thoughts?\b/i],
    statement: () => 'Intrusive thoughts explicitly reported.',
    category: 'symptom',
    preferredFields: ['mainProblems', 'anxietyPanicPhobias'],
  },
  {
    concept: 'family-mental-health',
    patterns: [
      /\bbiopolar\b/i,
      /\bbipolar\b/i,
      /\bsevere depression\b/i,
      /\bfamily .{0,30}(?:mental|depression|bipolar)/i,
    ],
    statement: (ex) =>
      `Reported family mental-health history: ${ex.trim()}. Relationship to client: not established.`,
    category: 'psychological-history',
    formFieldId: 'familyMentalHealthAddictionDvHistory',
    preferredFields: ['familyMentalHealthAddictionDvHistory'],
  },
];

function linkFor(field: string, excerpt: string, rawSubmissionId?: string): IntakeEvidenceLink | null {
  const q = questionById(field);
  if (!q) {
    return {
      sourceType: 'intake',
      sectionId: 'presentingProblem',
      sectionLabel: 'Presenting Problem',
      questionId: field,
      questionLabel: field,
      clientResponse: excerpt,
      rawSubmissionId,
    };
  }
  return {
    sourceType: 'intake',
    sectionId: q.sectionId,
    sectionLabel: INTAKE_SECTION_LABELS[q.sectionId],
    questionId: q.id,
    questionLabel: q.label,
    clientResponse: excerpt,
    rawSubmissionId,
  };
}

function findingFromEvidence(
  ev: ClinicalEvidence,
  category: IntakeFindingCategory,
  framing: IntakeFindingFraming,
  links: IntakeEvidenceLink[],
): IntakeCoreFinding {
  return {
    id: `icf_sem_${ev.concept}_${hash(ev.statement + links.map((l) => l.questionId).join())}`,
    category,
    clientStatement: links[0]?.clientResponse,
    text: ev.statement,
    framing,
    evidence: links,
    provenanceStatus: links.length > 1 ? 'corroborated' : 'single',
    reviewStatus: 'pending',
    clinicalReviewRequired: ev.clinicalReviewRequired,
  };
}

/**
 * Scan confirmed intake narratives for clinical concepts without mutating form nulls.
 */
export function buildSemanticClinicalEvidence(args: {
  answers: IntakeAnswerMap;
  structured?: StructuredIntake;
  extracted?: ExtractedIntake | null;
  rawSubmissionId?: string;
}): SemanticCorroborationResult {
  const { answers, extracted, rawSubmissionId } = args;
  const sources = allNarrativeSources(answers);
  const evidence: ClinicalEvidence[] = [];
  const contradictions: ClinicalEvidence[] = [];
  const narrativeFindings: IntakeCoreFinding[] = [];
  let clinicalReviewRequired = false;

  for (const rule of CONCEPT_RULES) {
    const hits: Array<{ field: string; text: string; excerpt: string }> = [];
    for (const src of sources) {
      for (const re of rule.patterns) {
        const m = src.text.match(re);
        if (m) {
          const idx = Math.max(0, (m.index ?? 0) - 40);
          const excerpt = src.text.slice(idx, idx + Math.min(160, src.text.length - idx)).trim();
          hits.push({ field: src.field, text: src.text, excerpt });
          break;
        }
      }
    }
    if (!hits.length) continue;

    // Prefer preferred fields ordering, then unique by field
    hits.sort((a, b) => {
      const pa = rule.preferredFields?.indexOf(a.field) ?? 99;
      const pb = rule.preferredFields?.indexOf(b.field) ?? 99;
      return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb);
    });
    const uniqueFields = [...new Map(hits.map((h) => [h.field, h])).values()];
    const primary = uniqueFields[0]!;
    const formStatus = rule.formPath ? formBoolStatus(extracted, rule.formPath) : 'absent';
    const formAnswer = rule.formFieldId ? answers[rule.formFieldId] : undefined;

    // Contradiction: form clearly No but narrative Yes
    let contradicts = false;
    if (rule.formFieldId && (formStatus === 'no' || answerLooksNegative(formAnswer))) {
      contradicts = true;
    }

    const level: ClinicalEvidenceLevel = 'explicitly-reported';
    const statement = rule.statement(primary.excerpt);
    const item: ClinicalEvidence = {
      id: `cev_${rule.concept}_${hash(primary.field + primary.excerpt)}`,
      concept: rule.concept,
      statement,
      evidenceLevel: level,
      confidence: rule.confidence ?? 'high',
      sourceType: uniqueFields.length > 1 ? 'intake-corroborated' : 'intake-narrative',
      sourceField: primary.field,
      sourceExcerpt: primary.excerpt,
      formFieldId: rule.formFieldId,
      formSelectionStatus: formStatus,
      contradicts,
      corroborates: uniqueFields.slice(1).map((h) => h.field),
      clinicalReviewRequired: rule.clinicalReviewRequired,
    };
    evidence.push(item);
    if (contradicts) {
      contradictions.push({
        ...item,
        id: `cev_conflict_${item.id}`,
        statement: `Possible source inconsistency: form selection suggests no, but narrative reports: “${primary.excerpt.slice(0, 120)}”. Therapist review required — do not silently resolve.`,
        evidenceLevel: 'explicitly-reported',
      });
    }
    if (rule.clinicalReviewRequired) clinicalReviewRequired = true;

    // Create core finding from narrative when form selection unknown OR when narrative-only concept
    const formUnknown =
      !rule.formFieldId ||
      formStatus === 'unknown' ||
      formStatus === 'absent' ||
      !answerLooksPositive(formAnswer);

    // Always create finding for concepts (merge later by concept) — form field add() may also fire
    const links = uniqueFields
      .map((h) => linkFor(h.field, h.excerpt, rawSubmissionId))
      .filter((x): x is IntakeEvidenceLink => Boolean(x));

    if (formUnknown || uniqueFields.length > 1 || rule.concept === 'hopelessness') {
      narrativeFindings.push(
        findingFromEvidence(
          item,
          rule.category,
          rule.framing ?? 'client-statement',
          links,
        ),
      );
    } else if (contradicts) {
      narrativeFindings.push(
        findingFromEvidence(
          contradictions[contradictions.length - 1]!,
          'outstanding-question',
          'information-requiring-clarification',
          links,
        ),
      );
    }
  }

  // Ambiguous abuse / femur detail — do not rewrite subject
  const abuse = answers.childhoodAdolescentAbuse?.trim();
  if (abuse && /femur|breaking .{0,20}leg|broke .{0,20}leg/i.test(abuse)) {
    const ev: ClinicalEvidence = {
      id: `cev_ambiguous_abuse_${hash(abuse)}`,
      concept: 'ambiguous-abuse-detail',
      statement:
        'Client supplied a response within the childhood/adolescent abuse section referring to a femur / leg injury. Context / subject is unclear — do not rewrite as an injury inflicted on the client.',
      evidenceLevel: 'explicitly-reported',
      confidence: 'moderate',
      sourceType: 'intake-narrative',
      sourceField: 'childhoodAdolescentAbuse',
      sourceExcerpt: abuse.slice(0, 160),
      formFieldId: 'childhoodAdolescentAbuse',
      formSelectionStatus: 'absent',
    };
    evidence.push(ev);
    const link = linkFor('childhoodAdolescentAbuse', abuse, rawSubmissionId);
    if (link) {
      narrativeFindings.push({
        id: `icf_outstanding_femur_${hash(abuse)}`,
        category: 'outstanding-question',
        text: 'Clarify the childhood femur / leg injury and the father’s role/context, if clinically appropriate.',
        framing: 'information-requiring-clarification',
        evidence: [link],
        provenanceStatus: 'single',
        reviewStatus: 'pending',
        clientStatement: abuse,
      });
    }
  }

  // Cautious working hypotheses from explicit patterns (CORE — no TA)
  const patternConcepts = evidence.filter((e) =>
    ['defensiveness', 'emotional-withdrawal', 'self-reliance', 'fixing-solutions'].includes(e.concept),
  );
  if (patternConcepts.length >= 2) {
    const hypoTexts = [
      {
        when: patternConcepts.some((p) => p.concept === 'self-reliance' || p.concept === 'fixing-solutions'),
        text: 'Self-reliance and fixing may function protectively when the client feels vulnerable or uncertain (hypothesis only — requires therapist review).',
      },
      {
        when: patternConcepts.some((p) => p.concept === 'defensiveness'),
        text: 'Defensiveness may protect against perceived criticism, shame or misunderstanding (hypothesis only — requires therapist review).',
      },
      {
        when: patternConcepts.some((p) => p.concept === 'emotional-withdrawal'),
        text: 'Emotional withdrawal may reduce immediate overwhelm while contributing to relational disconnection (hypothesis only — requires therapist review).',
      },
    ];
    for (const h of hypoTexts) {
      if (!h.when) continue;
      narrativeFindings.push({
        id: `icf_hypo_${hash(h.text)}`,
        category: 'working-hypothesis',
        text: h.text,
        framing: 'possible-working-hypothesis',
        evidence: patternConcepts
          .slice(0, 3)
          .map((p) => linkFor(p.sourceField, p.sourceExcerpt, rawSubmissionId))
          .filter((x): x is IntakeEvidenceLink => Boolean(x)),
        provenanceStatus: 'single',
        reviewStatus: 'pending',
      });
    }
  }

  // Enrich hopelessness risk finding with explicit not-established checklist
  if (evidence.some((e) => e.concept === 'hopelessness')) {
    const hop = evidence.find((e) => e.concept === 'hopelessness')!;
    const link = linkFor(hop.sourceField, hop.sourceExcerpt, rawSubmissionId);
    if (link) {
      narrativeFindings.push({
        id: `icf_risk_detail_${hash(hop.sourceExcerpt)}`,
        category: 'risk-clinical-review',
        text: [
          'CLINICAL REVIEW REQUIRED',
          'Reason: Hopelessness explicitly reported during acute relationship crisis (if also reported) or as stated in intake.',
          'Current status — Suicidal ideation: Not established · Self-harm: Not established · Intent: Not established · Plan: Not established · Means: Not established · Immediacy: Not established.',
          'Do not invent risk severity. Do not assign a risk tier from this intake alone.',
        ].join(' '),
        framing: 'information-requiring-clarification',
        evidence: [link],
        provenanceStatus: 'single',
        reviewStatus: 'pending',
        clinicalReviewRequired: true,
        clientStatement: hop.sourceExcerpt,
      });
    }
  }

  return {
    evidence,
    contradictions,
    narrativeFindings,
    clinicalReviewRequired,
  };
}

/**
 * Merge semantic narrative findings into core analysis without duplicating concepts.
 * Never merge across unrelated categories (e.g. anxiety symptom ≠ presenting problem).
 */
export function mergeSemanticIntoCoreFindings(
  coreFindings: IntakeCoreFinding[],
  semantic: SemanticCorroborationResult,
): IntakeCoreFinding[] {
  const out = coreFindings.map((f) => ({ ...f, evidence: [...f.evidence] }));

  const semanticConcept = (f: IntakeCoreFinding): string | null => {
    const m = f.id.match(/^icf_sem_([a-z0-9-]+)_/);
    return m?.[1] ?? null;
  };

  for (const item of semantic.narrativeFindings) {
    const concept = semanticConcept(item);
    if (concept) {
      const match = out.find((e) => semanticConcept(e) === concept);
      if (match) {
        match.provenanceStatus = 'corroborated';
        for (const ev of item.evidence) {
          if (
            !match.evidence.some(
              (x) => x.questionId === ev.questionId && x.clientResponse === ev.clientResponse,
            )
          ) {
            match.evidence.push(ev);
          }
        }
        if (item.clinicalReviewRequired) match.clinicalReviewRequired = true;
        // Prefer multi-source statement
        if ((item.evidence?.length ?? 0) >= (match.evidence?.length ?? 0)) {
          match.text = item.text;
        }
      } else {
        // Prefer semantic statement over a thin form-only echo of the same form field
        const formEcho = item.evidence[0]
          ? out.find(
              (e) =>
                e.category === item.category &&
                e.evidence.length === 1 &&
                e.evidence[0]?.questionId === item.evidence[0]?.questionId &&
                e.evidence[0]?.clientResponse === item.evidence[0]?.clientResponse &&
                !semanticConcept(e),
            )
          : undefined;
        if (formEcho) {
          formEcho.text = item.text;
          formEcho.provenanceStatus =
            item.evidence.length > 1 ? 'corroborated' : formEcho.provenanceStatus;
          formEcho.id = item.id;
          formEcho.clinicalReviewRequired =
            item.clinicalReviewRequired || formEcho.clinicalReviewRequired;
          for (const ev of item.evidence) {
            if (
              !formEcho.evidence.some(
                (x) => x.questionId === ev.questionId && x.clientResponse === ev.clientResponse,
              )
            ) {
              formEcho.evidence.push(ev);
            }
          }
          if (item.evidence.length > 1) formEcho.provenanceStatus = 'corroborated';
        } else {
          out.push(item);
        }
      }
      continue;
    }

    // Non-concept-tagged narrative items (e.g. hypotheses, femur outstanding)
    const dup = out.find(
      (e) => e.category === item.category && e.text.trim().toLowerCase() === item.text.trim().toLowerCase(),
    );
    if (!dup) out.push(item);
  }

  for (const c of semantic.contradictions) {
    const already = out.some((f) => /source inconsistency/i.test(f.text));
    if (already) continue;
    const link = linkFor(c.sourceField, c.sourceExcerpt);
    out.push({
      id: `icf_conflict_${hash(c.statement)}`,
      category: 'outstanding-question',
      text: c.statement,
      framing: 'information-requiring-clarification',
      evidence: link ? [link] : [],
      provenanceStatus: 'conflict',
      reviewStatus: 'pending',
    });
  }

  return out;
}

export type WarningPriorityGroup = 'important' | 'form-unrecoverable' | 'other';

export interface PrioritisedWarning {
  key: string;
  group: WarningPriorityGroup;
  message: string;
  fieldPath?: string;
  code: string;
}

/** Deduplicate by field + warning type; assign priority groups. */
export function prioritiseExtractionWarnings(
  warnings: IntakeExtractionWarning[],
): { important: PrioritisedWarning[]; formUnrecoverable: PrioritisedWarning[]; other: PrioritisedWarning[] } {
  const seen = new Set<string>();
  const important: PrioritisedWarning[] = [];
  const formUnrecoverable: PrioritisedWarning[] = [];
  const other: PrioritisedWarning[] = [];

  for (const w of warnings) {
    const key = `${w.fieldPath ?? ''}|${w.code}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const item: PrioritisedWarning = {
      key,
      group: 'other',
      message: w.message,
      fieldPath: w.fieldPath,
      code: w.code,
    };

    if (
      w.code === 'truncated' ||
      w.code === 'missing_critical' ||
      w.code === 'extraction_failed' ||
      /trauma|abuse|risk|hopeless|femur/i.test(w.message + (w.fieldPath ?? ''))
    ) {
      item.group = 'important';
      important.push(item);
    } else if (
      w.code === 'ambiguous_boolean' ||
      w.code === 'ambiguous_rating' ||
      w.code === 'label_rejected' ||
      /pronoun|rating|checkbox|permission|severity|sleepRating|physicalHealth/i.test(
        w.message + (w.fieldPath ?? ''),
      )
    ) {
      item.group = 'form-unrecoverable';
      formUnrecoverable.push(item);
    } else {
      other.push(item);
    }
  }

  return { important, formUnrecoverable, other };
}

/** Format list values for therapist UI without altering raw storage. */
export function formatDisplayList(raw: string | string[] | null | undefined, sep = ' · '): string {
  if (raw == null) return 'Not established';
  if (Array.isArray(raw)) {
    const parts = raw.map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts.join(sep) : 'Not established';
  }
  const parts = raw
    .split(/[\n,;]+|(?:\s*[·•]\s*)/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean);
  // goals often "1. foo 2. bar" or "- foo"
  const bulletish = raw
    .split(/\n+/)
    .map((s) => s.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
  if (bulletish.length > 1) return bulletish.join(sep);
  return parts.length > 1 ? parts.join(sep) : raw.trim() || 'Not established';
}

export function formatGoalsAsBullets(raw: string | string[] | null | undefined): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((s) => s.trim()).filter(Boolean);
  return raw
    .split(/\n+/)
    .map((s) => s.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}
