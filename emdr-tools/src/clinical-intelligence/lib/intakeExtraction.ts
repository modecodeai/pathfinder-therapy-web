/**
 * Intake Reader — document extraction types, validation, and conversion.
 * Extraction answers "what did the client write?" — never clinical interpretation.
 */

import {
  PATHFINDER_INTAKE_FORM_VERSION,
  answersToStructuredIntake,
  type IntakeAnswerMap,
  type StructuredIntake,
} from './pathfinderIntakeForm';

export const INTAKE_READER_VERSION = 'intake-reader-v2' as const;

export type ExtractionConfidence = 'high' | 'moderate' | 'low';

export interface IntakeExtractionWarning {
  code:
    | 'label_rejected'
    | 'truncated'
    | 'ambiguous_boolean'
    | 'ambiguous_rating'
    | 'low_confidence'
    | 'missing_critical'
    | 'extraction_failed'
    | 'other';
  message: string;
  fieldPath?: string;
  sourceExcerpt?: string;
}

export interface FieldExtractionMeta {
  path: string;
  confidence: ExtractionConfidence;
  sourceQuestion?: string | null;
  sourceExcerpt?: string | null;
}

/** AI structured extraction result — null means not established. */
export interface ExtractedIntake {
  personalInformation: {
    fullName: string | null;
    preferredName: string | null;
    pronouns: string | null;
    dateOfBirth: string | null;
    currentAge: number | null;
    homeAddress: string | null;
    telephone: string | null;
    permissionToCall: boolean | null;
    email: string | null;
    permissionToEmail: boolean | null;
  };
  referralInformation: {
    gpPractice: string | null;
    relationshipStatus: string | null;
    referralSource: string | null;
    whyThisTherapist: string | null;
  };
  presentingProblem: {
    summary: string | null;
    severity: number | null;
  };
  goals: {
    therapyGoals: string[] | null;
  };
  medicalHistory: {
    physicalHealthRating: number | null;
    diagnosedConditions: string[] | null;
    prescribedMedication: string[] | null;
    currentInvestigations: boolean | null;
    chronicPain: boolean | null;
  };
  psychologicalHistory: {
    previousTherapy: boolean | null;
    previousTherapyDetails: string | null;
    psychiatricMedicationHistory: boolean | null;
    familyMentalHealthHistory: boolean | null;
    familyMentalHealthDetails: string | null;
  };
  lifestyleAndSymptoms: {
    sleepProblems: boolean | null;
    sleepRating: number | null;
    exerciseFrequency: string | null;
    exerciseTypes: string[] | null;
    foodBodyImageIssues: boolean | null;
    foodBodyImageDetails: string | null;
    depressionGriefSadness: boolean | null;
    depressionGriefDetails: string | null;
    anxietyPanicPhobias: boolean | null;
    anxietyDetails: string | null;
    alcoholDrugs: boolean | null;
    alcoholDrugDetails: string | null;
    romanticRelationship: boolean | null;
    relationshipLength: string | null;
    relationshipRating: number | null;
  };
  psychosocialFactors: {
    household: string | null;
    familyRelationshipRating: number | null;
    familyConflict: boolean | null;
    socialNetwork: boolean | null;
    socialisingFrequency: string | null;
    occupation: string | null;
    enjoysWork: boolean | null;
    workStress: string | null;
    religiousSpiritual: boolean | null;
    faithDescription: string | null;
  };
  developmentalHistory: {
    childhoodDescription: string | null;
    schoolExperience: string | null;
  };
  traumaHistory: {
    traumaticEvent: boolean | null;
    traumaticEventDetails: string | null;
    childhoodAdolescentAbuse: boolean | null;
    abuseDetails: string | null;
  };
  identityAndSelfDescription: {
    fiveWords: string[] | null;
    mostImportantThing: string | null;
    significantAchievement: string | null;
  };
  strengths: {
    strengths: string | null;
  };
  vulnerabilities: {
    weaknesses: string | null;
  };
  extractionWarnings: IntakeExtractionWarning[];
  fieldMeta?: FieldExtractionMeta[];
}

export interface IntakeExtractionRecord {
  extractorVersion: typeof INTAKE_READER_VERSION | string;
  extractedAt: string;
  extracted: ExtractedIntake;
  structuredIntake: StructuredIntake;
  answerMap: IntakeAnswerMap;
  warnings: IntakeExtractionWarning[];
  confirmed: boolean;
  confirmedAt?: string;
  superseded?: boolean;
  rawSubmissionId?: string;
  model?: string;
}

/** Values that are never valid client answers (labels / placeholders / UI). */
export const REJECTED_LABEL_VALUES = [
  '*',
  'Address',
  'Number*',
  'Number',
  'Contact Details*',
  'Contact Details',
  '(He/Him, She/Her, They/Them)',
  'He/Him, She/Her, They/Them',
  'Full Name*',
  'Full Name',
  'Current Age*',
  'Current Age',
  'Preferred Name*',
  'Preferred Name',
  'Date of Birth*',
  'Date of Birth',
  'Email*',
  'Email',
  'Telephone*',
  'Telephone',
  'Home Address*',
  'Home Address',
  'GP Practice*',
  'Save & Continue',
  'Save & Exit',
  'Cancel',
  'Yes',
  'No',
  'Select',
  'N/A*',
] as const;

const REJECTED_SET = new Set(REJECTED_LABEL_VALUES.map((s) => s.toLowerCase()));

const LABEL_LIKE =
  /^(full name|preferred name|date of birth|current age|home address|telephone|email|pronouns|contact details|gp practice|relationship status)\*?$/i;

export function isRejectedLabelValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'number' || typeof value === 'boolean') return false;
  const s = String(value).trim();
  if (!s) return false;
  if (s === '*') return true;
  if (REJECTED_SET.has(s.toLowerCase())) return true;
  if (LABEL_LIKE.test(s)) return true;
  if (/^\*+$/.test(s)) return true;
  // Lone option lists pasted as "value"
  if (/^(yes\s*\/\s*no|no\s*\/\s*yes)$/i.test(s)) return true;
  return false;
}

export function looksTruncated(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const t = text.trim();
  if (t.length < 40) return false;
  // Ends mid-word or with dangling connector / incomplete sentence cues
  if (/[a-z]$/.test(t) && !/[.!?)"']$/.test(t) && /\s\w{1,3}$/.test(t)) return true;
  if (/,\s*$/.test(t)) return true;
  if (/\b(and|or|the|a|to|of|for|with|e)$/i.test(t)) return true;
  return false;
}

function rejectString(
  value: string | null,
  fieldPath: string,
  warnings: IntakeExtractionWarning[],
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isRejectedLabelValue(trimmed)) {
    warnings.push({
      code: 'label_rejected',
      message: `Rejected label/placeholder value for ${fieldPath}.`,
      fieldPath,
      sourceExcerpt: trimmed.slice(0, 80),
    });
    return null;
  }
  if (looksTruncated(trimmed)) {
    warnings.push({
      code: 'truncated',
      message: `Response for ${fieldPath} appears truncated in supplied text.`,
      fieldPath,
      sourceExcerpt: trimmed.slice(-60),
    });
  }
  return trimmed;
}

function rejectStringArray(
  value: string[] | null,
  fieldPath: string,
  warnings: IntakeExtractionWarning[],
): string[] | null {
  if (value == null) return null;
  const cleaned = value
    .map((v) => rejectString(v, fieldPath, warnings))
    .filter((v): v is string => Boolean(v));
  return cleaned.length ? cleaned : null;
}

/** Post-process AI output: reject labels, flag truncation, never invent. */
export function validateAndSanitizeExtractedIntake(raw: ExtractedIntake): ExtractedIntake {
  const warnings: IntakeExtractionWarning[] = [...(raw.extractionWarnings ?? [])];

  const personalInformation = {
    fullName: rejectString(raw.personalInformation?.fullName ?? null, 'personalInformation.fullName', warnings),
    preferredName: rejectString(
      raw.personalInformation?.preferredName ?? null,
      'personalInformation.preferredName',
      warnings,
    ),
    pronouns: rejectString(raw.personalInformation?.pronouns ?? null, 'personalInformation.pronouns', warnings),
    dateOfBirth: rejectString(
      raw.personalInformation?.dateOfBirth ?? null,
      'personalInformation.dateOfBirth',
      warnings,
    ),
    currentAge:
      typeof raw.personalInformation?.currentAge === 'number' &&
      Number.isFinite(raw.personalInformation.currentAge)
        ? raw.personalInformation.currentAge
        : null,
    homeAddress: rejectString(
      raw.personalInformation?.homeAddress ?? null,
      'personalInformation.homeAddress',
      warnings,
    ),
    telephone: rejectString(
      raw.personalInformation?.telephone ?? null,
      'personalInformation.telephone',
      warnings,
    ),
    permissionToCall:
      typeof raw.personalInformation?.permissionToCall === 'boolean'
        ? raw.personalInformation.permissionToCall
        : null,
    email: rejectString(raw.personalInformation?.email ?? null, 'personalInformation.email', warnings),
    permissionToEmail:
      typeof raw.personalInformation?.permissionToEmail === 'boolean'
        ? raw.personalInformation.permissionToEmail
        : null,
  };

  if (personalInformation.email && !/.+@.+\..+/.test(personalInformation.email)) {
    warnings.push({
      code: 'low_confidence',
      message: 'Email value does not look like an email address.',
      fieldPath: 'personalInformation.email',
      sourceExcerpt: personalInformation.email,
    });
    personalInformation.email = isRejectedLabelValue(personalInformation.email)
      ? null
      : personalInformation.email;
    if (isRejectedLabelValue(personalInformation.email) || personalInformation.email === 'Address') {
      personalInformation.email = null;
    }
  }

  const presentingSummary = rejectString(
    raw.presentingProblem?.summary ?? null,
    'presentingProblem.summary',
    warnings,
  );

  const sanitized: ExtractedIntake = {
    personalInformation,
    referralInformation: {
      gpPractice: rejectString(
        raw.referralInformation?.gpPractice ?? null,
        'referralInformation.gpPractice',
        warnings,
      ),
      relationshipStatus: rejectString(
        raw.referralInformation?.relationshipStatus ?? null,
        'referralInformation.relationshipStatus',
        warnings,
      ),
      referralSource: rejectString(
        raw.referralInformation?.referralSource ?? null,
        'referralInformation.referralSource',
        warnings,
      ),
      whyThisTherapist: rejectString(
        raw.referralInformation?.whyThisTherapist ?? null,
        'referralInformation.whyThisTherapist',
        warnings,
      ),
    },
    presentingProblem: {
      summary: presentingSummary,
      severity:
        typeof raw.presentingProblem?.severity === 'number' &&
        raw.presentingProblem.severity >= 1 &&
        raw.presentingProblem.severity <= 10
          ? raw.presentingProblem.severity
          : null,
    },
    goals: {
      therapyGoals: rejectStringArray(raw.goals?.therapyGoals ?? null, 'goals.therapyGoals', warnings),
    },
    medicalHistory: {
      physicalHealthRating:
        typeof raw.medicalHistory?.physicalHealthRating === 'number' ? raw.medicalHistory.physicalHealthRating : null,
      diagnosedConditions: rejectStringArray(
        raw.medicalHistory?.diagnosedConditions ?? null,
        'medicalHistory.diagnosedConditions',
        warnings,
      ),
      prescribedMedication: rejectStringArray(
        raw.medicalHistory?.prescribedMedication ?? null,
        'medicalHistory.prescribedMedication',
        warnings,
      ),
      currentInvestigations:
        typeof raw.medicalHistory?.currentInvestigations === 'boolean'
          ? raw.medicalHistory.currentInvestigations
          : null,
      chronicPain: typeof raw.medicalHistory?.chronicPain === 'boolean' ? raw.medicalHistory.chronicPain : null,
    },
    psychologicalHistory: {
      previousTherapy:
        typeof raw.psychologicalHistory?.previousTherapy === 'boolean'
          ? raw.psychologicalHistory.previousTherapy
          : null,
      previousTherapyDetails: rejectString(
        raw.psychologicalHistory?.previousTherapyDetails ?? null,
        'psychologicalHistory.previousTherapyDetails',
        warnings,
      ),
      psychiatricMedicationHistory:
        typeof raw.psychologicalHistory?.psychiatricMedicationHistory === 'boolean'
          ? raw.psychologicalHistory.psychiatricMedicationHistory
          : null,
      familyMentalHealthHistory:
        typeof raw.psychologicalHistory?.familyMentalHealthHistory === 'boolean'
          ? raw.psychologicalHistory.familyMentalHealthHistory
          : null,
      familyMentalHealthDetails: rejectString(
        raw.psychologicalHistory?.familyMentalHealthDetails ?? null,
        'psychologicalHistory.familyMentalHealthDetails',
        warnings,
      ),
    },
    lifestyleAndSymptoms: {
      sleepProblems:
        typeof raw.lifestyleAndSymptoms?.sleepProblems === 'boolean'
          ? raw.lifestyleAndSymptoms.sleepProblems
          : null,
      sleepRating:
        typeof raw.lifestyleAndSymptoms?.sleepRating === 'number'
          ? raw.lifestyleAndSymptoms.sleepRating
          : null,
      exerciseFrequency: rejectString(
        raw.lifestyleAndSymptoms?.exerciseFrequency ?? null,
        'lifestyleAndSymptoms.exerciseFrequency',
        warnings,
      ),
      exerciseTypes: rejectStringArray(
        raw.lifestyleAndSymptoms?.exerciseTypes ?? null,
        'lifestyleAndSymptoms.exerciseTypes',
        warnings,
      ),
      foodBodyImageIssues:
        typeof raw.lifestyleAndSymptoms?.foodBodyImageIssues === 'boolean'
          ? raw.lifestyleAndSymptoms.foodBodyImageIssues
          : null,
      foodBodyImageDetails: rejectString(
        raw.lifestyleAndSymptoms?.foodBodyImageDetails ?? null,
        'lifestyleAndSymptoms.foodBodyImageDetails',
        warnings,
      ),
      depressionGriefSadness:
        typeof raw.lifestyleAndSymptoms?.depressionGriefSadness === 'boolean'
          ? raw.lifestyleAndSymptoms.depressionGriefSadness
          : null,
      depressionGriefDetails: rejectString(
        raw.lifestyleAndSymptoms?.depressionGriefDetails ?? null,
        'lifestyleAndSymptoms.depressionGriefDetails',
        warnings,
      ),
      anxietyPanicPhobias:
        typeof raw.lifestyleAndSymptoms?.anxietyPanicPhobias === 'boolean'
          ? raw.lifestyleAndSymptoms.anxietyPanicPhobias
          : null,
      anxietyDetails: rejectString(
        raw.lifestyleAndSymptoms?.anxietyDetails ?? null,
        'lifestyleAndSymptoms.anxietyDetails',
        warnings,
      ),
      alcoholDrugs:
        typeof raw.lifestyleAndSymptoms?.alcoholDrugs === 'boolean'
          ? raw.lifestyleAndSymptoms.alcoholDrugs
          : null,
      alcoholDrugDetails: rejectString(
        raw.lifestyleAndSymptoms?.alcoholDrugDetails ?? null,
        'lifestyleAndSymptoms.alcoholDrugDetails',
        warnings,
      ),
      romanticRelationship:
        typeof raw.lifestyleAndSymptoms?.romanticRelationship === 'boolean'
          ? raw.lifestyleAndSymptoms.romanticRelationship
          : null,
      relationshipLength: rejectString(
        raw.lifestyleAndSymptoms?.relationshipLength ?? null,
        'lifestyleAndSymptoms.relationshipLength',
        warnings,
      ),
      relationshipRating:
        typeof raw.lifestyleAndSymptoms?.relationshipRating === 'number'
          ? raw.lifestyleAndSymptoms.relationshipRating
          : null,
    },
    psychosocialFactors: {
      household: rejectString(
        raw.psychosocialFactors?.household ?? null,
        'psychosocialFactors.household',
        warnings,
      ),
      familyRelationshipRating:
        typeof raw.psychosocialFactors?.familyRelationshipRating === 'number'
          ? raw.psychosocialFactors.familyRelationshipRating
          : null,
      familyConflict:
        typeof raw.psychosocialFactors?.familyConflict === 'boolean'
          ? raw.psychosocialFactors.familyConflict
          : null,
      socialNetwork:
        typeof raw.psychosocialFactors?.socialNetwork === 'boolean'
          ? raw.psychosocialFactors.socialNetwork
          : null,
      socialisingFrequency: rejectString(
        raw.psychosocialFactors?.socialisingFrequency ?? null,
        'psychosocialFactors.socialisingFrequency',
        warnings,
      ),
      occupation: rejectString(
        raw.psychosocialFactors?.occupation ?? null,
        'psychosocialFactors.occupation',
        warnings,
      ),
      enjoysWork:
        typeof raw.psychosocialFactors?.enjoysWork === 'boolean'
          ? raw.psychosocialFactors.enjoysWork
          : null,
      workStress: rejectString(
        raw.psychosocialFactors?.workStress ?? null,
        'psychosocialFactors.workStress',
        warnings,
      ),
      religiousSpiritual:
        typeof raw.psychosocialFactors?.religiousSpiritual === 'boolean'
          ? raw.psychosocialFactors.religiousSpiritual
          : null,
      faithDescription: rejectString(
        raw.psychosocialFactors?.faithDescription ?? null,
        'psychosocialFactors.faithDescription',
        warnings,
      ),
    },
    developmentalHistory: {
      childhoodDescription: rejectString(
        raw.developmentalHistory?.childhoodDescription ?? null,
        'developmentalHistory.childhoodDescription',
        warnings,
      ),
      schoolExperience: rejectString(
        raw.developmentalHistory?.schoolExperience ?? null,
        'developmentalHistory.schoolExperience',
        warnings,
      ),
    },
    traumaHistory: {
      traumaticEvent:
        typeof raw.traumaHistory?.traumaticEvent === 'boolean' ? raw.traumaHistory.traumaticEvent : null,
      traumaticEventDetails: rejectString(
        raw.traumaHistory?.traumaticEventDetails ?? null,
        'traumaHistory.traumaticEventDetails',
        warnings,
      ),
      childhoodAdolescentAbuse:
        typeof raw.traumaHistory?.childhoodAdolescentAbuse === 'boolean'
          ? raw.traumaHistory.childhoodAdolescentAbuse
          : null,
      abuseDetails: rejectString(
        raw.traumaHistory?.abuseDetails ?? null,
        'traumaHistory.abuseDetails',
        warnings,
      ),
    },
    identityAndSelfDescription: {
      fiveWords: rejectStringArray(
        raw.identityAndSelfDescription?.fiveWords ?? null,
        'identityAndSelfDescription.fiveWords',
        warnings,
      ),
      mostImportantThing: rejectString(
        raw.identityAndSelfDescription?.mostImportantThing ?? null,
        'identityAndSelfDescription.mostImportantThing',
        warnings,
      ),
      significantAchievement: rejectString(
        raw.identityAndSelfDescription?.significantAchievement ?? null,
        'identityAndSelfDescription.significantAchievement',
        warnings,
      ),
    },
    strengths: {
      strengths: rejectString(raw.strengths?.strengths ?? null, 'strengths.strengths', warnings),
    },
    vulnerabilities: {
      weaknesses: rejectString(raw.vulnerabilities?.weaknesses ?? null, 'vulnerabilities.weaknesses', warnings),
    },
    extractionWarnings: warnings,
    fieldMeta: raw.fieldMeta,
  };

  if (!sanitized.personalInformation.fullName && !sanitized.presentingProblem.summary) {
    warnings.push({
      code: 'missing_critical',
      message: 'Critical fields (name and presenting problem) were not established.',
    });
    sanitized.extractionWarnings = warnings;
  }

  return sanitized;
}

function boolToAnswer(v: boolean | null): string | undefined {
  if (v === null) return undefined;
  return v ? 'Yes' : 'No';
}

function numToAnswer(v: number | null): string | undefined {
  if (v === null || !Number.isFinite(v)) return undefined;
  return String(v);
}

function joinList(v: string[] | null): string | undefined {
  if (!v?.length) return undefined;
  return v.join('\n');
}

function combineBoolDetails(flag: boolean | null, details: string | null): string | undefined {
  if (details?.trim()) {
    if (flag === true) return details.trim();
    if (flag === false) return `No. ${details.trim()}`;
    return details.trim();
  }
  return boolToAnswer(flag);
}

/** Map ExtractedIntake → flat answer map used by StructuredIntake / reasoning. */
export function extractedIntakeToAnswerMap(extracted: ExtractedIntake): IntakeAnswerMap {
  const e = extracted;
  const exerciseParts = [
    e.lifestyleAndSymptoms.exerciseFrequency,
    ...(e.lifestyleAndSymptoms.exerciseTypes ?? []),
  ].filter(Boolean);

  const romanticParts = [
    boolToAnswer(e.lifestyleAndSymptoms.romanticRelationship),
    e.lifestyleAndSymptoms.relationshipLength
      ? `Length: ${e.lifestyleAndSymptoms.relationshipLength}`
      : null,
    e.lifestyleAndSymptoms.relationshipRating != null
      ? `Rating: ${e.lifestyleAndSymptoms.relationshipRating}`
      : null,
  ].filter(Boolean);

  const workParts = [
    e.psychosocialFactors.enjoysWork != null
      ? `Enjoys work: ${e.psychosocialFactors.enjoysWork ? 'Yes' : 'No'}`
      : null,
    e.psychosocialFactors.workStress,
  ].filter(Boolean);

  const faithParts = [
    boolToAnswer(e.psychosocialFactors.religiousSpiritual),
    e.psychosocialFactors.faithDescription,
  ].filter(Boolean);

  return {
    fullName: e.personalInformation.fullName ?? undefined,
    preferredName: e.personalInformation.preferredName ?? undefined,
    pronouns: e.personalInformation.pronouns ?? undefined,
    dateOfBirth: e.personalInformation.dateOfBirth ?? undefined,
    currentAge: numToAnswer(e.personalInformation.currentAge),
    homeAddress: e.personalInformation.homeAddress ?? undefined,
    telephone: e.personalInformation.telephone ?? undefined,
    permissionCallLeaveMessage: boolToAnswer(e.personalInformation.permissionToCall),
    email: e.personalInformation.email ?? undefined,
    permissionEmail: boolToAnswer(e.personalInformation.permissionToEmail),
    gpPractice: e.referralInformation.gpPractice ?? undefined,
    relationshipStatus: e.referralInformation.relationshipStatus ?? undefined,
    referralSource: e.referralInformation.referralSource ?? undefined,
    whyThisTherapist: e.referralInformation.whyThisTherapist ?? undefined,
    mainProblems: e.presentingProblem.summary ?? undefined,
    currentSeverity: numToAnswer(e.presentingProblem.severity),
    therapyGoals: joinList(e.goals.therapyGoals),
    physicalHealthRating: numToAnswer(e.medicalHistory.physicalHealthRating),
    diagnosedHealthConditions: joinList(e.medicalHistory.diagnosedConditions),
    medication: joinList(e.medicalHistory.prescribedMedication),
    currentInvestigations: boolToAnswer(e.medicalHistory.currentInvestigations),
    chronicPain: boolToAnswer(e.medicalHistory.chronicPain),
    previousTherapy: combineBoolDetails(
      e.psychologicalHistory.previousTherapy,
      e.psychologicalHistory.previousTherapyDetails,
    ),
    previousMentalHealthTreatment: e.psychologicalHistory.previousTherapyDetails ?? undefined,
    psychiatricMedication: boolToAnswer(e.psychologicalHistory.psychiatricMedicationHistory),
    familyMentalHealthAddictionDvHistory: combineBoolDetails(
      e.psychologicalHistory.familyMentalHealthHistory,
      e.psychologicalHistory.familyMentalHealthDetails,
    ),
    sleepProblems: combineBoolDetails(
      e.lifestyleAndSymptoms.sleepProblems,
      null,
    ),
    sleepRating: numToAnswer(e.lifestyleAndSymptoms.sleepRating),
    exercise: exerciseParts.length ? exerciseParts.join(' · ') : undefined,
    foodAppetiteWeightBodyImage: combineBoolDetails(
      e.lifestyleAndSymptoms.foodBodyImageIssues,
      e.lifestyleAndSymptoms.foodBodyImageDetails,
    ),
    depressionGriefSadness: combineBoolDetails(
      e.lifestyleAndSymptoms.depressionGriefSadness,
      e.lifestyleAndSymptoms.depressionGriefDetails,
    ),
    anxietyPanicPhobias: combineBoolDetails(
      e.lifestyleAndSymptoms.anxietyPanicPhobias,
      e.lifestyleAndSymptoms.anxietyDetails,
    ),
    alcoholRecreationalDrugUse: combineBoolDetails(
      e.lifestyleAndSymptoms.alcoholDrugs,
      e.lifestyleAndSymptoms.alcoholDrugDetails,
    ),
    romanticRelationship: romanticParts.length ? romanticParts.join('. ') : undefined,
    household: e.psychosocialFactors.household ?? undefined,
    familyRelationshipRating: numToAnswer(e.psychosocialFactors.familyRelationshipRating),
    familyConflict: boolToAnswer(e.psychosocialFactors.familyConflict),
    socialNetwork: boolToAnswer(e.psychosocialFactors.socialNetwork),
    socialising: e.psychosocialFactors.socialisingFrequency ?? undefined,
    occupation: e.psychosocialFactors.occupation ?? undefined,
    workEnjoymentStress: workParts.length ? workParts.join('. ') : undefined,
    religionSpirituality: faithParts.length ? faithParts.join('. ') : undefined,
    childhood: e.developmentalHistory.childhoodDescription ?? undefined,
    schoolExperience: e.developmentalHistory.schoolExperience ?? undefined,
    trauma: combineBoolDetails(e.traumaHistory.traumaticEvent, e.traumaHistory.traumaticEventDetails),
    childhoodAdolescentAbuse: combineBoolDetails(
      e.traumaHistory.childhoodAdolescentAbuse,
      e.traumaHistory.abuseDetails,
    ),
    fiveWordsDescribingSelf: joinList(e.identityAndSelfDescription.fiveWords),
    mostImportantThingInLife: e.identityAndSelfDescription.mostImportantThing ?? undefined,
    significantAchievement: e.identityAndSelfDescription.significantAchievement ?? undefined,
    strengths: e.strengths.strengths ?? undefined,
    weaknesses: e.vulnerabilities.weaknesses ?? undefined,
  };
}

export function extractedToStructuredIntake(
  extracted: ExtractedIntake,
  formVersion = PATHFINDER_INTAKE_FORM_VERSION,
): { structured: StructuredIntake; answerMap: IntakeAnswerMap } {
  const answerMap = extractedIntakeToAnswerMap(extracted);
  const structured = answersToStructuredIntake(answerMap, formVersion);
  return { structured, answerMap };
}

export function hasCriticalExtractionErrors(warnings: IntakeExtractionWarning[]): boolean {
  return warnings.some((w) => w.code === 'missing_critical' || w.code === 'extraction_failed');
}

export function displayExtractedValue(value: string | number | boolean | string[] | null | undefined): string {
  if (value == null) return 'Not established';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not established';
  const t = value.trim();
  return t || 'Not established';
}

export function emptyExtractedIntake(): ExtractedIntake {
  return {
    personalInformation: {
      fullName: null,
      preferredName: null,
      pronouns: null,
      dateOfBirth: null,
      currentAge: null,
      homeAddress: null,
      telephone: null,
      permissionToCall: null,
      email: null,
      permissionToEmail: null,
    },
    referralInformation: {
      gpPractice: null,
      relationshipStatus: null,
      referralSource: null,
      whyThisTherapist: null,
    },
    presentingProblem: { summary: null, severity: null },
    goals: { therapyGoals: null },
    medicalHistory: {
      physicalHealthRating: null,
      diagnosedConditions: null,
      prescribedMedication: null,
      currentInvestigations: null,
      chronicPain: null,
    },
    psychologicalHistory: {
      previousTherapy: null,
      previousTherapyDetails: null,
      psychiatricMedicationHistory: null,
      familyMentalHealthHistory: null,
      familyMentalHealthDetails: null,
    },
    lifestyleAndSymptoms: {
      sleepProblems: null,
      sleepRating: null,
      exerciseFrequency: null,
      exerciseTypes: null,
      foodBodyImageIssues: null,
      foodBodyImageDetails: null,
      depressionGriefSadness: null,
      depressionGriefDetails: null,
      anxietyPanicPhobias: null,
      anxietyDetails: null,
      alcoholDrugs: null,
      alcoholDrugDetails: null,
      romanticRelationship: null,
      relationshipLength: null,
      relationshipRating: null,
    },
    psychosocialFactors: {
      household: null,
      familyRelationshipRating: null,
      familyConflict: null,
      socialNetwork: null,
      socialisingFrequency: null,
      occupation: null,
      enjoysWork: null,
      workStress: null,
      religiousSpiritual: null,
      faithDescription: null,
    },
    developmentalHistory: { childhoodDescription: null, schoolExperience: null },
    traumaHistory: {
      traumaticEvent: null,
      traumaticEventDetails: null,
      childhoodAdolescentAbuse: null,
      abuseDetails: null,
    },
    identityAndSelfDescription: {
      fiveWords: null,
      mostImportantThing: null,
      significantAchievement: null,
    },
    strengths: { strengths: null },
    vulnerabilities: { weaknesses: null },
    extractionWarnings: [],
  };
}
