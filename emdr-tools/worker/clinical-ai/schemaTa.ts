import type { TaTranscriptAnalysis } from '../../src/clinical-intelligence/clinicalReasoning';

const suggestionBase = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'evidenceLevel',
    'confidence',
    'evidence',
    'reasoning',
    'reviewStatus',
    'clinicalLens',
  ],
  properties: {
    id: { type: 'string' },
    evidenceLevel: { type: 'string', enum: ['explicit', 'inferred', 'suggested', 'unknown'] },
    confidence: { type: 'string', enum: ['high', 'moderate', 'low'] },
    evidence: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['excerpt'],
        properties: {
          excerpt: { type: 'string' },
          speaker: { type: 'string', enum: ['client', 'therapist', 'unknown'] },
          startOffset: { type: ['number', 'null'] },
          endOffset: { type: ['number', 'null'] },
        },
      },
    },
    reasoning: { type: 'string' },
    reviewStatus: { type: 'string', enum: ['pending', 'approved', 'edited', 'rejected'] },
    clinicalLens: { type: 'string', enum: ['transactional-analysis'] },
    findingDelta: {
      type: ['string', 'null'],
      enum: ['new', 'updated', 'possible-conflict', 'already-known', null],
    },
  },
} as const;

export const TA_FORMULATION_JSON_SCHEMA = {
  name: 'ta_formulation_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'analysisKind',
      'clinicalLens',
      'summary',
      'egoStates',
      'drivers',
      'injunctionHypotheses',
      'scriptMessages',
      'lifePositions',
      'transactions',
      'gamePatterns',
      'racketSystems',
      'discounting',
      'redecisionAreas',
      'unansweredQuestions',
      'clarificationSuggestions',
      'noSufficientTaEvidence',
      'lensConsiderations',
      'reasoningMode',
      'primaryApproach',
    ],
    properties: {
      analysisKind: { type: 'string', enum: ['ta-formulation'] },
      clinicalLens: { type: 'string', enum: ['transactional-analysis'] },
      summary: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'value', 'evidenceLevel', 'confidence', 'evidence', 'reviewStatus'],
        properties: {
          id: { type: 'string' },
          value: { type: 'string' },
          evidenceLevel: { type: 'string', enum: ['explicit', 'inferred', 'suggested', 'unknown'] },
          confidence: { type: 'string', enum: ['high', 'moderate', 'low'] },
          evidence: suggestionBase.properties.evidence,
          reviewStatus: { type: 'string', enum: ['pending', 'approved', 'edited', 'rejected'] },
        },
      },
      egoStates: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'egoState'],
          properties: {
            ...suggestionBase.properties,
            egoState: {
              type: 'string',
              enum: [
                'parent',
                'adult',
                'child',
                'critical-parent',
                'nurturing-parent',
                'adapted-child',
                'free-child',
              ],
            },
            context: { type: ['string', 'null'] },
          },
        },
      },
      drivers: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'driver'],
          properties: {
            ...suggestionBase.properties,
            driver: {
              type: 'string',
              enum: ['be-perfect', 'be-strong', 'please-others', 'try-hard', 'hurry-up'],
            },
            relatedBehaviours: { type: 'array', items: { type: 'string' } },
            relatedContexts: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      injunctionHypotheses: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'injunction', 'hypothesisLabel'],
          properties: {
            ...suggestionBase.properties,
            injunction: {
              type: 'string',
              enum: [
                'dont-be',
                'dont-be-you',
                'dont-be-a-child',
                'dont-grow-up',
                'dont-succeed',
                'dont-be-important',
                'dont-belong',
                'dont-be-close',
                'dont-feel',
                'dont-think',
                'dont-be-well',
                'dont-do',
              ],
            },
            hypothesisLabel: { type: 'string', enum: ['Possible injunction hypothesis'] },
          },
        },
      },
      scriptMessages: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'kind', 'clientLanguage'],
          properties: {
            ...suggestionBase.properties,
            kind: {
              type: 'string',
              enum: ['counter-injunction', 'script-message', 'permission'],
            },
            clientLanguage: { type: 'string' },
          },
        },
      },
      lifePositions: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'position', 'contextSpecific', 'context'],
          properties: {
            ...suggestionBase.properties,
            position: {
              type: 'string',
              enum: ['ok-ok', 'ok-not-ok', 'not-ok-ok', 'not-ok-not-ok'],
            },
            contextSpecific: { type: 'boolean', enum: [true] },
            context: { type: 'string' },
          },
        },
      },
      transactions: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'kind', 'description'],
          properties: {
            ...suggestionBase.properties,
            kind: { type: 'string', enum: ['complementary', 'crossed', 'ulterior'] },
            description: { type: 'string' },
          },
        },
      },
      gamePatterns: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'label', 'sequence'],
          properties: {
            ...suggestionBase.properties,
            label: { type: 'string', enum: ['Possible game pattern'] },
            sequence: { type: 'string' },
            payoff: { type: ['string', 'null'] },
          },
        },
      },
      racketSystems: {
        type: 'array',
        items: {
          ...suggestionBase,
          properties: {
            ...suggestionBase.properties,
            racketFeeling: { type: ['string', 'null'] },
            authenticFeeling: { type: ['string', 'null'] },
            racketBehaviour: { type: ['string', 'null'] },
            racketBeliefs: { type: ['string', 'null'] },
            reinforcingMemories: { type: ['string', 'null'] },
            payoff: { type: ['string', 'null'] },
          },
        },
      },
      discounting: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'domain', 'description'],
          properties: {
            ...suggestionBase.properties,
            domain: {
              type: 'string',
              enum: ['existence', 'significance', 'change-possibilities', 'personal-abilities'],
            },
            description: { type: 'string' },
          },
        },
      },
      redecisionAreas: {
        type: 'array',
        items: {
          ...suggestionBase,
          required: [...suggestionBase.required, 'oldDecision', 'possibleNewDecision'],
          properties: {
            ...suggestionBase.properties,
            oldDecision: { type: 'string' },
            possibleNewDecision: { type: 'string' },
          },
        },
      },
      unansweredQuestions: { type: 'array', items: { type: 'string' } },
      clarificationSuggestions: { type: 'array', items: { type: 'string' } },
      noSufficientTaEvidence: { type: 'boolean' },
      lensConsiderations: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'lens', 'relevance', 'reason', 'label'],
          properties: {
            id: { type: 'string' },
            lens: {
              type: 'string',
              enum: [
                'emdr',
                'transactional-analysis',
                'gestalt',
                'pain',
                'attachment',
                'act',
                'cbt',
              ],
            },
            relevance: {
              type: 'string',
              enum: [
                'strongly-relevant',
                'potentially-relevant',
                'limited-current-evidence',
                'not-currently-indicated',
                'not-assessed',
              ],
            },
            reason: { type: 'string' },
            label: { type: 'string', enum: ['Possible complementary clinical lens'] },
          },
        },
      },
      reasoningMode: {
        type: ['string', 'null'],
        enum: ['primary-lens-only', 'integrated', 'core-only', 'choose-lenses', null],
      },
      primaryApproach: {
        type: ['string', 'null'],
        enum: [
          'general-integrative',
          'transactional-analysis',
          'emdr',
          'integrated-ta-emdr',
          'pain',
          'other',
          'unspecified',
          null,
        ],
      },
    },
  },
} as const;

export function validateTaAnalysis(data: unknown): TaTranscriptAnalysis {
  const d = data as TaTranscriptAnalysis;
  if (!d || d.analysisKind !== 'ta-formulation') {
    throw new Error('Invalid TA analysis: analysisKind');
  }
  if (d.clinicalLens !== 'transactional-analysis') {
    throw new Error('Invalid TA analysis: clinicalLens');
  }
  if (typeof d.noSufficientTaEvidence !== 'boolean') {
    d.noSufficientTaEvidence = !(
      (d.drivers?.length || 0) +
      (d.egoStates?.length || 0) +
      (d.injunctionHypotheses?.length || 0)
    );
  }
  d.egoStates = d.egoStates ?? [];
  d.drivers = d.drivers ?? [];
  d.injunctionHypotheses = d.injunctionHypotheses ?? [];
  d.scriptMessages = d.scriptMessages ?? [];
  d.lifePositions = d.lifePositions ?? [];
  d.transactions = d.transactions ?? [];
  d.gamePatterns = d.gamePatterns ?? [];
  d.racketSystems = d.racketSystems ?? [];
  d.discounting = d.discounting ?? [];
  d.redecisionAreas = d.redecisionAreas ?? [];
  d.unansweredQuestions = d.unansweredQuestions ?? [];
  d.clarificationSuggestions = d.clarificationSuggestions ?? [];
  d.lensConsiderations = (d.lensConsiderations ?? []).map((c) => ({
    ...c,
    label: 'Possible complementary clinical lens' as const,
  }));
  for (const inj of d.injunctionHypotheses) {
    inj.hypothesisLabel = 'Possible injunction hypothesis';
  }
  for (const g of d.gamePatterns) {
    g.label = 'Possible game pattern';
  }
  return d;
}
