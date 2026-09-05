/** Phase 3 & Phase 4 JSON schemas + validators */

const evidenceItem = {
  type: 'object',
  additionalProperties: false,
  properties: {
    excerpt: { type: 'string' },
    speaker: { type: 'string', enum: ['client', 'therapist', 'unknown'] },
    startOffset: { type: ['number', 'null'] },
    endOffset: { type: ['number', 'null'] },
  },
  required: ['excerpt', 'speaker', 'startOffset', 'endOffset'],
} as const;

const suggestionBase = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    value: { type: 'string' },
    evidenceLevel: { type: 'string', enum: ['explicit', 'inferred', 'suggested', 'unknown'] },
    confidence: { type: 'string', enum: ['high', 'moderate', 'low'] },
    evidence: { type: 'array', items: evidenceItem },
    reviewStatus: { type: 'string', enum: ['pending', 'approved', 'edited', 'rejected'] },
  },
  required: ['id', 'value', 'evidenceLevel', 'confidence', 'evidence', 'reviewStatus'],
} as const;

const cognitionOrNull = {
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        ...suggestionBase.properties,
        kind: { type: 'string', enum: ['explicit', 'suggested'] },
        polarity: { type: 'string', enum: ['negative', 'positive'] },
      },
      required: [...suggestionBase.required, 'kind', 'polarity'],
    },
    { type: 'null' },
  ],
};

const suggestionOrNull = {
  anyOf: [suggestionBase, { type: 'null' }],
};

export const PHASE3_ASSESSMENT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    analysisKind: { type: 'string', enum: ['phase3-assessment'] },
    summary: suggestionBase,
    target: suggestionBase,
    worstPart: suggestionOrNull,
    image: suggestionOrNull,
    negativeCognition: cognitionOrNull,
    positiveCognition: cognitionOrNull,
    voc: suggestionOrNull,
    vocNumeric: { type: ['number', 'null'] },
    emotion: suggestionOrNull,
    sud: suggestionOrNull,
    sudNumeric: { type: ['number', 'null'] },
    bodyLocation: suggestionOrNull,
    unansweredQuestions: { type: 'array', items: { type: 'string' } },
    clarificationSuggestions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'analysisKind',
    'summary',
    'target',
    'worstPart',
    'image',
    'negativeCognition',
    'positiveCognition',
    'voc',
    'vocNumeric',
    'emotion',
    'sud',
    'sudNumeric',
    'bodyLocation',
    'unansweredQuestions',
    'clarificationSuggestions',
  ],
};

export const PHASE4_DESENSITISATION_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    analysisKind: { type: 'string', enum: ['phase4-desensitisation'] },
    summary: suggestionBase,
    sequence: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          order: { type: 'number' },
          sequenceLabel: { type: 'string' },
          timestamp: { type: ['string', 'null'] },
          category: {
            type: 'string',
            enum: [
              'image',
              'thought',
              'emotion',
              'body',
              'association',
              'new-memory',
              'adaptive',
              'sud',
              'feeder',
              'blocking-belief',
              'intervention',
              'other',
            ],
          },
          value: { type: 'string' },
          evidenceLevel: { type: 'string', enum: ['explicit', 'inferred', 'suggested', 'unknown'] },
          confidence: { type: 'string', enum: ['high', 'moderate', 'low'] },
          evidence: { type: 'array', items: evidenceItem },
          reviewStatus: { type: 'string', enum: ['pending', 'approved', 'edited', 'rejected'] },
        },
        required: [
          'id',
          'order',
          'sequenceLabel',
          'timestamp',
          'category',
          'value',
          'evidenceLevel',
          'confidence',
          'evidence',
          'reviewStatus',
        ],
      },
    },
    associations: { type: 'array', items: suggestionBase },
    newMemories: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          headline: { type: 'string' },
          approximateAge: { type: ['number', 'null'] },
          description: { type: ['string', 'null'] },
          evidenceLevel: { type: 'string', enum: ['explicit', 'inferred', 'suggested', 'unknown'] },
          confidence: { type: 'string', enum: ['high', 'moderate', 'low'] },
          evidence: { type: 'array', items: evidenceItem },
          possibleThemes: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'responsibility-defectiveness',
                'belonging',
                'safety-vulnerability',
                'power-control',
              ],
            },
          },
          possibleTouchstoneCandidate: { type: 'boolean' },
          reviewStatus: { type: 'string', enum: ['pending', 'approved', 'edited', 'rejected'] },
        },
        required: [
          'id',
          'headline',
          'approximateAge',
          'description',
          'evidenceLevel',
          'confidence',
          'evidence',
          'possibleThemes',
          'possibleTouchstoneCandidate',
          'reviewStatus',
        ],
      },
    },
    adaptiveInformation: { type: 'array', items: suggestionBase },
    sudChanges: { type: 'array', items: suggestionBase },
    feederMemories: { type: 'array', items: suggestionBase },
    blockingBeliefs: { type: 'array', items: suggestionBase },
    therapistInterventions: { type: 'array', items: suggestionBase },
    imageThoughtEmotionBodyChanges: { type: 'array', items: suggestionBase },
    resolutionStatus: { type: 'string', enum: ['not-established', 'in-progress', 'incomplete'] },
    unansweredQuestions: { type: 'array', items: { type: 'string' } },
    clarificationSuggestions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'analysisKind',
    'summary',
    'sequence',
    'associations',
    'newMemories',
    'adaptiveInformation',
    'sudChanges',
    'feederMemories',
    'blockingBeliefs',
    'therapistInterventions',
    'imageThoughtEmotionBodyChanges',
    'resolutionStatus',
    'unansweredQuestions',
    'clarificationSuggestions',
  ],
};

function pendingSug<T extends { reviewStatus?: string }>(v: T | null | undefined): T | null {
  if (v == null) return null;
  return { ...v, reviewStatus: v.reviewStatus || 'pending' };
}

export function validatePhase3Analysis(
  data: unknown,
):
  | { ok: true; value: import('../../src/clinical-intelligence/types').Phase3AssessmentAnalysis }
  | { ok: false; error: string } {
  if (!data || typeof data !== 'object') return { ok: false, error: 'not_object' };
  const d = data as Record<string, unknown>;
  if (!d.target || typeof d.target !== 'object') return { ok: false, error: 'missing_target' };
  if (!Array.isArray(d.unansweredQuestions)) return { ok: false, error: 'missing_unanswered' };

  const voc = pendingSug(d.voc as never);
  const sud = pendingSug(d.sud as never);
  // Never keep numeric VoC/SUD unless the paired field is explicit evidence from the transcript
  let vocNumeric = d.vocNumeric == null ? null : Number(d.vocNumeric);
  let sudNumeric = d.sudNumeric == null ? null : Number(d.sudNumeric);
  if (
    !voc ||
    (voc as { evidenceLevel?: string }).evidenceLevel !== 'explicit' ||
    !Number.isFinite(vocNumeric as number)
  ) {
    vocNumeric = null;
  }
  if (
    !sud ||
    (sud as { evidenceLevel?: string }).evidenceLevel !== 'explicit' ||
    !Number.isFinite(sudNumeric as number)
  ) {
    sudNumeric = null;
  }
  const unanswered = [...(d.unansweredQuestions as string[])];
  if (vocNumeric == null && !unanswered.some((q) => /voc|validity of cognition/i.test(q))) {
    unanswered.push('VoC not established');
  }
  if (sudNumeric == null && !unanswered.some((q) => /sud|disturbance/i.test(q))) {
    unanswered.push('SUD not established');
  }
  return {
    ok: true,
    value: {
      analysisKind: 'phase3-assessment',
      summary: pendingSug(d.summary as never) as never,
      target: pendingSug(d.target as never) as never,
      worstPart: pendingSug(d.worstPart as never),
      image: pendingSug(d.image as never),
      negativeCognition: pendingSug(d.negativeCognition as never),
      positiveCognition: pendingSug(d.positiveCognition as never),
      voc: vocNumeric == null ? null : voc,
      vocNumeric,
      emotion: pendingSug(d.emotion as never),
      sud: sudNumeric == null ? null : sud,
      sudNumeric,
      bodyLocation: pendingSug(d.bodyLocation as never),
      unansweredQuestions: unanswered,
      clarificationSuggestions: Array.isArray(d.clarificationSuggestions)
        ? (d.clarificationSuggestions as string[])
        : [],
    },
  };
}

export function validatePhase4Analysis(
  data: unknown,
):
  | { ok: true; value: import('../../src/clinical-intelligence/types').Phase4DesensitisationAnalysis }
  | { ok: false; error: string } {
  if (!data || typeof data !== 'object') return { ok: false, error: 'not_object' };
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.sequence)) return { ok: false, error: 'missing_sequence' };
  const sequence = (d.sequence as Array<Record<string, unknown>>)
    .map((s, i) => ({
      ...s,
      order: typeof s.order === 'number' ? s.order : i + 1,
      timestamp: s.timestamp == null ? null : String(s.timestamp),
      reviewStatus: (s.reviewStatus as string) || 'pending',
    }))
    .sort((a, b) => Number(a.order) - Number(b.order));

  const ensure = <T extends { reviewStatus?: string }>(items: unknown): T[] =>
    Array.isArray(items) ? items.map((i) => ({ ...(i as T), reviewStatus: (i as T).reviewStatus || 'pending' })) : [];

  const memories = ensure(d.newMemories).map((m) => {
    const row = m as Record<string, unknown>;
    return {
      ...row,
      approximateAge: row.approximateAge == null ? undefined : Number(row.approximateAge),
      description: row.description == null ? undefined : String(row.description),
    };
  });

  const resolution = d.resolutionStatus;
  const resolutionStatus =
    resolution === 'in-progress' || resolution === 'incomplete' || resolution === 'not-established'
      ? resolution
      : 'not-established';

  return {
    ok: true,
    value: {
      analysisKind: 'phase4-desensitisation',
      summary: pendingSug(d.summary as never) as never,
      sequence: sequence as never,
      associations: ensure(d.associations),
      newMemories: memories as never,
      adaptiveInformation: ensure(d.adaptiveInformation),
      sudChanges: ensure(d.sudChanges),
      feederMemories: ensure(d.feederMemories),
      blockingBeliefs: ensure(d.blockingBeliefs),
      therapistInterventions: ensure(d.therapistInterventions),
      imageThoughtEmotionBodyChanges: ensure(d.imageThoughtEmotionBodyChanges),
      resolutionStatus,
      unansweredQuestions: Array.isArray(d.unansweredQuestions) ? (d.unansweredQuestions as string[]) : [],
      clarificationSuggestions: Array.isArray(d.clarificationSuggestions)
        ? (d.clarificationSuggestions as string[])
        : [],
    },
  };
}
