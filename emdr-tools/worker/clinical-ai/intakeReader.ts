/**
 * Server-side Intake Reader — OpenAI document extraction only.
 * Never import from browser bundles. Never diagnose or formulate.
 */

import {
  ClinicalAIError,
  callOpenAIResponses,
  type OpenAIEnv,
} from './openai';
import {
  INTAKE_READER_VERSION,
  type ExtractedIntake,
  validateAndSanitizeExtractedIntake,
} from '../../src/clinical-intelligence/lib/intakeExtraction';

export const INTAKE_READER_SYSTEM = `You are extracting data from a completed psychotherapy intake form.

Your task is document extraction, not clinical interpretation.

Identify the answer actually supplied for each known intake field.

Do not treat:
- question labels,
- required-field asterisks,
- placeholder text,
- option labels (including Yes/No when both appear without a clear selection),
- numeric scale choices (1–10) when all options appear without a clear selection,
- UI text (Save & Continue, Save & Exit, Cancel, thank-you messages),
as client answers.

If a field is not clearly answered, return null.

Do not infer an answer.

Do not choose Yes or No merely because both options appear in the pasted text.

Do not choose a rating merely because numbers 1–10 appear.

Preserve narrative answers as closely as possible. Do not invent missing endings for truncated text.

Return only valid data matching the supplied schema.

Never diagnose, formulate, infer trauma meaning, suggest modalities, or create EMDR/TA constructs.`;

const nullableString = { type: ['string', 'null'] } as const;
const nullableNumber = { type: ['number', 'null'] } as const;
const nullableBoolean = { type: ['boolean', 'null'] } as const;
const nullableStringArray = {
  type: ['array', 'null'],
  items: { type: 'string' },
} as const;

const warningItem = {
  type: 'object',
  additionalProperties: false,
  properties: {
    code: {
      type: 'string',
      enum: [
        'label_rejected',
        'truncated',
        'ambiguous_boolean',
        'ambiguous_rating',
        'low_confidence',
        'missing_critical',
        'extraction_failed',
        'other',
      ],
    },
    message: { type: 'string' },
    fieldPath: nullableString,
    sourceExcerpt: nullableString,
  },
  required: ['code', 'message', 'fieldPath', 'sourceExcerpt'],
} as const;

const fieldMetaItem = {
  type: 'object',
  additionalProperties: false,
  properties: {
    path: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'moderate', 'low'] },
    sourceQuestion: nullableString,
    sourceExcerpt: nullableString,
  },
  required: ['path', 'confidence', 'sourceQuestion', 'sourceExcerpt'],
} as const;

export const EXTRACTED_INTAKE_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    personalInformation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fullName: nullableString,
        preferredName: nullableString,
        pronouns: nullableString,
        dateOfBirth: nullableString,
        currentAge: nullableNumber,
        homeAddress: nullableString,
        telephone: nullableString,
        permissionToCall: nullableBoolean,
        email: nullableString,
        permissionToEmail: nullableBoolean,
      },
      required: [
        'fullName',
        'preferredName',
        'pronouns',
        'dateOfBirth',
        'currentAge',
        'homeAddress',
        'telephone',
        'permissionToCall',
        'email',
        'permissionToEmail',
      ],
    },
    referralInformation: {
      type: 'object',
      additionalProperties: false,
      properties: {
        gpPractice: nullableString,
        relationshipStatus: nullableString,
        referralSource: nullableString,
        whyThisTherapist: nullableString,
      },
      required: ['gpPractice', 'relationshipStatus', 'referralSource', 'whyThisTherapist'],
    },
    presentingProblem: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: nullableString,
        severity: nullableNumber,
      },
      required: ['summary', 'severity'],
    },
    goals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        therapyGoals: nullableStringArray,
      },
      required: ['therapyGoals'],
    },
    medicalHistory: {
      type: 'object',
      additionalProperties: false,
      properties: {
        physicalHealthRating: nullableNumber,
        diagnosedConditions: nullableStringArray,
        prescribedMedication: nullableStringArray,
        currentInvestigations: nullableBoolean,
        chronicPain: nullableBoolean,
      },
      required: [
        'physicalHealthRating',
        'diagnosedConditions',
        'prescribedMedication',
        'currentInvestigations',
        'chronicPain',
      ],
    },
    psychologicalHistory: {
      type: 'object',
      additionalProperties: false,
      properties: {
        previousTherapy: nullableBoolean,
        previousTherapyDetails: nullableString,
        psychiatricMedicationHistory: nullableBoolean,
        familyMentalHealthHistory: nullableBoolean,
        familyMentalHealthDetails: nullableString,
      },
      required: [
        'previousTherapy',
        'previousTherapyDetails',
        'psychiatricMedicationHistory',
        'familyMentalHealthHistory',
        'familyMentalHealthDetails',
      ],
    },
    lifestyleAndSymptoms: {
      type: 'object',
      additionalProperties: false,
      properties: {
        sleepProblems: nullableBoolean,
        sleepRating: nullableNumber,
        exerciseFrequency: nullableString,
        exerciseTypes: nullableStringArray,
        foodBodyImageIssues: nullableBoolean,
        foodBodyImageDetails: nullableString,
        depressionGriefSadness: nullableBoolean,
        depressionGriefDetails: nullableString,
        anxietyPanicPhobias: nullableBoolean,
        anxietyDetails: nullableString,
        alcoholDrugs: nullableBoolean,
        alcoholDrugDetails: nullableString,
        romanticRelationship: nullableBoolean,
        relationshipLength: nullableString,
        relationshipRating: nullableNumber,
      },
      required: [
        'sleepProblems',
        'sleepRating',
        'exerciseFrequency',
        'exerciseTypes',
        'foodBodyImageIssues',
        'foodBodyImageDetails',
        'depressionGriefSadness',
        'depressionGriefDetails',
        'anxietyPanicPhobias',
        'anxietyDetails',
        'alcoholDrugs',
        'alcoholDrugDetails',
        'romanticRelationship',
        'relationshipLength',
        'relationshipRating',
      ],
    },
    psychosocialFactors: {
      type: 'object',
      additionalProperties: false,
      properties: {
        household: nullableString,
        familyRelationshipRating: nullableNumber,
        familyConflict: nullableBoolean,
        socialNetwork: nullableBoolean,
        socialisingFrequency: nullableString,
        occupation: nullableString,
        enjoysWork: nullableBoolean,
        workStress: nullableString,
        religiousSpiritual: nullableBoolean,
        faithDescription: nullableString,
      },
      required: [
        'household',
        'familyRelationshipRating',
        'familyConflict',
        'socialNetwork',
        'socialisingFrequency',
        'occupation',
        'enjoysWork',
        'workStress',
        'religiousSpiritual',
        'faithDescription',
      ],
    },
    developmentalHistory: {
      type: 'object',
      additionalProperties: false,
      properties: {
        childhoodDescription: nullableString,
        schoolExperience: nullableString,
      },
      required: ['childhoodDescription', 'schoolExperience'],
    },
    traumaHistory: {
      type: 'object',
      additionalProperties: false,
      properties: {
        traumaticEvent: nullableBoolean,
        traumaticEventDetails: nullableString,
        childhoodAdolescentAbuse: nullableBoolean,
        abuseDetails: nullableString,
      },
      required: [
        'traumaticEvent',
        'traumaticEventDetails',
        'childhoodAdolescentAbuse',
        'abuseDetails',
      ],
    },
    identityAndSelfDescription: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fiveWords: nullableStringArray,
        mostImportantThing: nullableString,
        significantAchievement: nullableString,
      },
      required: ['fiveWords', 'mostImportantThing', 'significantAchievement'],
    },
    strengths: {
      type: 'object',
      additionalProperties: false,
      properties: {
        strengths: nullableString,
      },
      required: ['strengths'],
    },
    vulnerabilities: {
      type: 'object',
      additionalProperties: false,
      properties: {
        weaknesses: nullableString,
      },
      required: ['weaknesses'],
    },
    extractionWarnings: {
      type: 'array',
      items: warningItem,
    },
    fieldMeta: {
      type: 'array',
      items: fieldMetaItem,
    },
  },
  required: [
    'personalInformation',
    'referralInformation',
    'presentingProblem',
    'goals',
    'medicalHistory',
    'psychologicalHistory',
    'lifestyleAndSymptoms',
    'psychosocialFactors',
    'developmentalHistory',
    'traumaHistory',
    'identityAndSelfDescription',
    'strengths',
    'vulnerabilities',
    'extractionWarnings',
    'fieldMeta',
  ],
};

export interface IntakeReaderResult {
  extracted: ExtractedIntake;
  extractorVersion: string;
  model: string;
  latencyMs: number;
}

export async function extractIntakeFromRawText(
  env: OpenAIEnv,
  rawText: string,
): Promise<IntakeReaderResult> {
  const text = rawText.trim();
  if (!text) {
    throw new ClinicalAIError('Intake text is required for extraction.', 'request_failed', 400);
  }

  const result = await callOpenAIResponses(env, {
    instructions: INTAKE_READER_SYSTEM,
    input: `Extract client answers from this pasted Pathfinder Client Intake Form text.\n\n---\n${text}\n---`,
    jsonSchema: {
      name: 'extracted_intake_v2',
      schema: EXTRACTED_INTAKE_JSON_SCHEMA,
    },
  });

  let parsed: ExtractedIntake;
  try {
    parsed = JSON.parse(result.text) as ExtractedIntake;
  } catch {
    throw new ClinicalAIError(
      'Intake Reader returned invalid JSON. The raw intake was preserved.',
      'invalid_output',
      502,
    );
  }

  const extracted = validateAndSanitizeExtractedIntake(parsed);
  return {
    extracted,
    extractorVersion: INTAKE_READER_VERSION,
    model: result.model,
    latencyMs: result.latencyMs,
  };
}
