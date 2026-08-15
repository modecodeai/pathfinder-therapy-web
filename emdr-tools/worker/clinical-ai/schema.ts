/** JSON Schema for OpenAI structured output (strict). */

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

const themeId = {
  type: 'string',
  enum: [
    'responsibility-defectiveness',
    'belonging',
    'safety-vulnerability',
    'power-control',
  ],
} as const;

export const TRANSCRIPT_ANALYSIS_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: suggestionBase,
    presentingProblems: { type: 'array', items: suggestionBase },
    symptoms: { type: 'array', items: suggestionBase },
    recentExamples: { type: 'array', items: suggestionBase },
    triggers: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...suggestionBase.properties,
          relatedMemories: { type: 'array', items: { type: 'string' } },
        },
        required: [...suggestionBase.required, 'relatedMemories'],
      },
    },
    memories: {
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
          possibleThemes: { type: 'array', items: themeId },
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
    associativeLinks: { type: 'array', items: suggestionBase },
    themes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          theme: themeId,
          confidence: { type: 'string', enum: ['high', 'moderate', 'low'] },
          evidenceLevel: { type: 'string', enum: ['explicit', 'inferred', 'suggested', 'unknown'] },
          reasoning: { type: 'string' },
          evidence: { type: 'array', items: evidenceItem },
          relatedMemories: { type: 'array', items: { type: 'string' } },
          relatedTriggers: { type: 'array', items: { type: 'string' } },
          possibleCognitions: { type: 'array', items: { type: 'string' } },
          reviewStatus: { type: 'string', enum: ['pending', 'approved', 'edited', 'rejected'] },
        },
        required: [
          'id',
          'theme',
          'confidence',
          'evidenceLevel',
          'reasoning',
          'evidence',
          'relatedMemories',
          'relatedTriggers',
          'possibleCognitions',
          'reviewStatus',
        ],
      },
    },
    negativeCognitions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...suggestionBase.properties,
          kind: { type: 'string', enum: ['explicit', 'suggested'] },
          polarity: { type: 'string', enum: ['negative', 'positive'] },
        },
        required: [...suggestionBase.required, 'kind', 'polarity'],
      },
    },
    positiveCognitions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...suggestionBase.properties,
          kind: { type: 'string', enum: ['explicit', 'suggested'] },
          polarity: { type: 'string', enum: ['negative', 'positive'] },
        },
        required: [...suggestionBase.required, 'kind', 'polarity'],
      },
    },
    internalResources: { type: 'array', items: suggestionBase },
    externalResources: { type: 'array', items: suggestionBase },
    targetCandidates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ...suggestionBase.properties,
          relatedMemoryId: { type: ['string', 'null'] },
          approximateAge: { type: ['number', 'null'] },
          possibleThemes: { type: 'array', items: themeId },
        },
        required: [...suggestionBase.required, 'relatedMemoryId', 'approximateAge', 'possibleThemes'],
      },
    },
    clinicalConsiderations: { type: 'array', items: suggestionBase },
    unansweredQuestions: { type: 'array', items: { type: 'string' } },
    clarificationSuggestions: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'summary',
    'presentingProblems',
    'symptoms',
    'recentExamples',
    'triggers',
    'memories',
    'associativeLinks',
    'themes',
    'negativeCognitions',
    'positiveCognitions',
    'internalResources',
    'externalResources',
    'targetCandidates',
    'clinicalConsiderations',
    'unansweredQuestions',
    'clarificationSuggestions',
  ],
};

export function parseTranscriptAnalysisJson(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(unfenced) as unknown;
}

export function validateTranscriptAnalysis(data: unknown): { ok: true; value: import('../../src/clinical-intelligence/types').TranscriptAnalysis } | { ok: false; error: string } {
  if (!data || typeof data !== 'object') return { ok: false, error: 'not_object' };
  const d = data as Record<string, unknown>;
  const arrays = [
    'presentingProblems',
    'symptoms',
    'recentExamples',
    'triggers',
    'memories',
    'themes',
    'negativeCognitions',
    'positiveCognitions',
    'internalResources',
    'externalResources',
    'targetCandidates',
    'clinicalConsiderations',
    'unansweredQuestions',
    'clarificationSuggestions',
  ];
  if (!d.summary || typeof d.summary !== 'object') return { ok: false, error: 'missing_summary' };
  for (const key of arrays) {
    if (!Array.isArray(d[key])) return { ok: false, error: `missing_${key}` };
  }
  // associativeLinks added in v2 — default empty for forward compatibility with older payloads
  if (d.associativeLinks != null && !Array.isArray(d.associativeLinks)) {
    return { ok: false, error: 'missing_associativeLinks' };
  }
  // Normalise nullables from strict schema
  const memories = (d.memories as Array<Record<string, unknown>>).map((m) => ({
    ...m,
    approximateAge: m.approximateAge == null ? undefined : Number(m.approximateAge),
    description: m.description == null ? undefined : String(m.description),
    reviewStatus: (m.reviewStatus as string) || 'pending',
  }));
  const triggers = (d.triggers as Array<Record<string, unknown>>).map((t) => ({
    ...t,
    relatedMemories: Array.isArray(t.relatedMemories) ? t.relatedMemories : [],
    reviewStatus: (t.reviewStatus as string) || 'pending',
  }));
  const targets = (d.targetCandidates as Array<Record<string, unknown>>).map((t) => ({
    ...t,
    relatedMemoryId: t.relatedMemoryId == null ? undefined : String(t.relatedMemoryId),
    approximateAge: t.approximateAge == null ? undefined : Number(t.approximateAge),
    possibleThemes: Array.isArray(t.possibleThemes) ? t.possibleThemes : [],
    reviewStatus: (t.reviewStatus as string) || 'pending',
  }));

  const ensurePending = <T extends { reviewStatus?: string }>(items: T[]): T[] =>
    items.map((i) => ({ ...i, reviewStatus: i.reviewStatus || 'pending' }));

  return {
    ok: true,
    value: {
      summary: { ...(d.summary as object), reviewStatus: 'pending' } as import('../../src/clinical-intelligence/types').ClinicalSuggestion<string>,
      presentingProblems: ensurePending(d.presentingProblems as never[]),
      symptoms: ensurePending(d.symptoms as never[]),
      recentExamples: ensurePending(d.recentExamples as never[]),
      triggers: ensurePending(triggers as never[]),
      memories: ensurePending(memories as never[]),
      associativeLinks: ensurePending((Array.isArray(d.associativeLinks) ? d.associativeLinks : []) as never[]),
      themes: ensurePending(d.themes as never[]),
      negativeCognitions: ensurePending(d.negativeCognitions as never[]),
      positiveCognitions: ensurePending(d.positiveCognitions as never[]),
      internalResources: ensurePending(d.internalResources as never[]),
      externalResources: ensurePending(d.externalResources as never[]),
      targetCandidates: ensurePending(targets as never[]),
      clinicalConsiderations: ensurePending(d.clinicalConsiderations as never[]),
      unansweredQuestions: d.unansweredQuestions as string[],
      clarificationSuggestions: d.clarificationSuggestions as string[],
    },
  };
}
