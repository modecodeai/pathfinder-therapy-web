/**
 * Pathfinder Client Intake Form — structure source of truth (pathfinder-intake-v1).
 * Do not invent questions. Optional FutureDesiredState is prepared but not on the public form.
 */

export const PATHFINDER_INTAKE_FORM_VERSION = 'pathfinder-intake-v1' as const;

export type IntakeFormSectionId =
  | 'personalInformation'
  | 'generalReferral'
  | 'presentingProblem'
  | 'medicalPsychologicalHistory'
  | 'lifestyleFunctioningSymptoms'
  | 'psychosocialFactors'
  | 'generalInformation';

export interface IntakeFormQuestion {
  id: string;
  sectionId: IntakeFormSectionId;
  label: string;
  /** Optional future field — not on public form until approved */
  optionalFuture?: boolean;
}

export const INTAKE_SECTION_LABELS: Record<IntakeFormSectionId, string> = {
  personalInformation: 'Personal Information',
  generalReferral: 'General / Referral',
  presentingProblem: 'Presenting Problem',
  medicalPsychologicalHistory: 'Medical and Psychological History',
  lifestyleFunctioningSymptoms: 'Lifestyle, Functioning and Symptoms',
  psychosocialFactors: 'Psychosocial Factors',
  generalInformation: 'General Information',
};

/** Exact question catalogue reflecting the existing Pathfinder Client Intake Form. */
export const PATHFINDER_INTAKE_QUESTIONS: IntakeFormQuestion[] = [
  // Personal Information
  { id: 'fullName', sectionId: 'personalInformation', label: 'Full name' },
  { id: 'preferredName', sectionId: 'personalInformation', label: 'Preferred name' },
  { id: 'pronouns', sectionId: 'personalInformation', label: 'Pronouns' },
  { id: 'dateOfBirth', sectionId: 'personalInformation', label: 'Date of birth' },
  { id: 'currentAge', sectionId: 'personalInformation', label: 'Current age' },
  { id: 'homeAddress', sectionId: 'personalInformation', label: 'Home address' },
  { id: 'telephone', sectionId: 'personalInformation', label: 'Telephone' },
  {
    id: 'permissionCallLeaveMessage',
    sectionId: 'personalInformation',
    label: 'Permission to call / leave message',
  },
  { id: 'email', sectionId: 'personalInformation', label: 'Email' },
  { id: 'permissionEmail', sectionId: 'personalInformation', label: 'Permission to email' },
  { id: 'veteranStatus', sectionId: 'personalInformation', label: 'Veteran status' },
  { id: 'rank', sectionId: 'personalInformation', label: 'Rank' },
  { id: 'unit', sectionId: 'personalInformation', label: 'Unit' },
  { id: 'datesServed', sectionId: 'personalInformation', label: 'Dates served' },
  { id: 'dischargeReason', sectionId: 'personalInformation', label: 'Discharge reason' },
  { id: 'operationalTours', sectionId: 'personalInformation', label: 'Operational tours' },

  // General / Referral
  { id: 'gpPractice', sectionId: 'generalReferral', label: 'GP practice' },
  { id: 'relationshipStatus', sectionId: 'generalReferral', label: 'Relationship status' },
  { id: 'referralSource', sectionId: 'generalReferral', label: 'Referral source' },
  { id: 'whyThisTherapist', sectionId: 'generalReferral', label: 'Why this therapist was chosen' },

  // Presenting Problem
  { id: 'mainProblems', sectionId: 'presentingProblem', label: 'Main problems to resolve' },
  { id: 'currentSeverity', sectionId: 'presentingProblem', label: 'Current severity 1–10' },
  { id: 'therapyGoals', sectionId: 'presentingProblem', label: 'Therapy goals' },

  // Medical and Psychological History
  { id: 'physicalHealthRating', sectionId: 'medicalPsychologicalHistory', label: 'Physical health 1–10' },
  {
    id: 'diagnosedHealthConditions',
    sectionId: 'medicalPsychologicalHistory',
    label: 'Diagnosed health conditions',
  },
  { id: 'medication', sectionId: 'medicalPsychologicalHistory', label: 'Medication' },
  { id: 'currentInvestigations', sectionId: 'medicalPsychologicalHistory', label: 'Current investigations' },
  { id: 'chronicPain', sectionId: 'medicalPsychologicalHistory', label: 'Chronic pain' },
  {
    id: 'previousMentalHealthTreatment',
    sectionId: 'medicalPsychologicalHistory',
    label: 'Previous mental health treatment',
  },
  { id: 'previousTherapy', sectionId: 'medicalPsychologicalHistory', label: 'Previous therapy' },
  {
    id: 'psychiatricMedication',
    sectionId: 'medicalPsychologicalHistory',
    label: 'Psychiatric medication',
  },
  {
    id: 'familyMentalHealthAddictionDvHistory',
    sectionId: 'medicalPsychologicalHistory',
    label: 'Family mental health / addiction / domestic violence history',
  },

  // Lifestyle, Functioning and Symptoms
  { id: 'sleepProblems', sectionId: 'lifestyleFunctioningSymptoms', label: 'Sleep problems' },
  { id: 'sleepRating', sectionId: 'lifestyleFunctioningSymptoms', label: 'Sleep rating' },
  { id: 'exercise', sectionId: 'lifestyleFunctioningSymptoms', label: 'Exercise' },
  {
    id: 'foodAppetiteWeightBodyImage',
    sectionId: 'lifestyleFunctioningSymptoms',
    label: 'Food / appetite / weight / body image',
  },
  {
    id: 'depressionGriefSadness',
    sectionId: 'lifestyleFunctioningSymptoms',
    label: 'Depression / grief / sadness',
  },
  {
    id: 'anxietyPanicPhobias',
    sectionId: 'lifestyleFunctioningSymptoms',
    label: 'Anxiety / panic / phobias',
  },
  {
    id: 'alcoholRecreationalDrugUse',
    sectionId: 'lifestyleFunctioningSymptoms',
    label: 'Alcohol / recreational drug use',
  },
  { id: 'romanticRelationship', sectionId: 'lifestyleFunctioningSymptoms', label: 'Romantic relationship' },

  // Psychosocial Factors
  { id: 'household', sectionId: 'psychosocialFactors', label: 'Household' },
  { id: 'familyRelationshipRating', sectionId: 'psychosocialFactors', label: 'Family relationship rating' },
  { id: 'familyConflict', sectionId: 'psychosocialFactors', label: 'Family conflict' },
  { id: 'socialNetwork', sectionId: 'psychosocialFactors', label: 'Social network' },
  { id: 'socialising', sectionId: 'psychosocialFactors', label: 'Socialising' },
  { id: 'occupation', sectionId: 'psychosocialFactors', label: 'Occupation' },
  { id: 'workEnjoymentStress', sectionId: 'psychosocialFactors', label: 'Work enjoyment / stress' },
  { id: 'religionSpirituality', sectionId: 'psychosocialFactors', label: 'Religion / spirituality' },

  // General Information
  { id: 'childhood', sectionId: 'generalInformation', label: 'Childhood' },
  { id: 'schoolExperience', sectionId: 'generalInformation', label: 'School experience' },
  { id: 'trauma', sectionId: 'generalInformation', label: 'Trauma' },
  {
    id: 'childhoodAdolescentAbuse',
    sectionId: 'generalInformation',
    label: 'Childhood / adolescent abuse',
  },
  { id: 'fiveWordsDescribingSelf', sectionId: 'generalInformation', label: 'Five words describing self' },
  { id: 'mostImportantThingInLife', sectionId: 'generalInformation', label: 'Most important thing in life' },
  { id: 'significantAchievement', sectionId: 'generalInformation', label: 'Significant achievement' },
  { id: 'strengths', sectionId: 'generalInformation', label: 'Strengths' },
  { id: 'weaknesses', sectionId: 'generalInformation', label: 'Weaknesses' },

  // Prepared only — do not add to public form unless explicitly approved
  {
    id: 'futureDesiredState',
    sectionId: 'presentingProblem',
    label:
      'If therapy has been worthwhile six months from now, what would be different? How would you know?',
    optionalFuture: true,
  },
];

export type IntakeAnswerMap = Partial<Record<string, string>>;

export type IntakeClinicalStatus =
  | 'not-requested'
  | 'requested'
  | 'in-progress'
  | 'submitted'
  | 'ai-review-ready'
  | 'therapist-reviewed';

export const INTAKE_CLINICAL_STATUS_LABELS: Record<IntakeClinicalStatus, string> = {
  'not-requested': 'Not requested',
  requested: 'Requested',
  'in-progress': 'In progress',
  submitted: 'Submitted',
  'ai-review-ready': 'AI review ready',
  'therapist-reviewed': 'Therapist reviewed',
};

/** Immutable raw submission — never rewrite with AI summaries. */
export interface RawIntakeSubmission {
  id: string;
  clientId: string;
  formVersion: string;
  submittedAt: string;
  source: 'portal' | 'therapist-manual' | 'paste' | 'import' | 'os-booking';
  rawPayload: IntakeAnswerMap | { text: string };
  privacyPolicyVersion?: string;
  consentVersion?: string;
}

export interface StructuredIntake {
  personalInformation: {
    fullName?: string;
    preferredName?: string;
    pronouns?: string;
    dateOfBirth?: string;
    currentAge?: string;
    homeAddress?: string;
    telephone?: string;
    permissionCallLeaveMessage?: string;
    email?: string;
    permissionEmail?: string;
    veteranStatus?: string;
    rank?: string;
    unit?: string;
    datesServed?: string;
    dischargeReason?: string;
    operationalTours?: string;
  };
  referralInformation: {
    gpPractice?: string;
    relationshipStatus?: string;
    referralSource?: string;
    whyThisTherapist?: string;
  };
  presentingProblem: {
    mainProblems?: string;
    currentSeverity?: string;
    therapyGoals?: string;
    /** Optional future — only if present in payload */
    futureDesiredState?: string;
  };
  goals: {
    clientStatedGoals?: string;
  };
  medicalHistory: {
    physicalHealthRating?: string;
    diagnosedHealthConditions?: string;
    medication?: string;
    currentInvestigations?: string;
    chronicPain?: string;
  };
  psychologicalHistory: {
    previousMentalHealthTreatment?: string;
    previousTherapy?: string;
    psychiatricMedication?: string;
    familyMentalHealthAddictionDvHistory?: string;
  };
  lifestyleAndSymptoms: {
    sleepProblems?: string;
    sleepRating?: string;
    exercise?: string;
    foodAppetiteWeightBodyImage?: string;
    depressionGriefSadness?: string;
    anxietyPanicPhobias?: string;
    alcoholRecreationalDrugUse?: string;
    romanticRelationship?: string;
  };
  psychosocialFactors: {
    household?: string;
    familyRelationshipRating?: string;
    familyConflict?: string;
    socialNetwork?: string;
    socialising?: string;
    occupation?: string;
    workEnjoymentStress?: string;
    religionSpirituality?: string;
  };
  developmentalHistory: {
    childhood?: string;
    schoolExperience?: string;
  };
  traumaHistory: {
    trauma?: string;
    childhoodAdolescentAbuse?: string;
  };
  identityAndSelfDescription: {
    fiveWordsDescribingSelf?: string;
    mostImportantThingInLife?: string;
    significantAchievement?: string;
  };
  strengths: {
    strengths?: string;
  };
  vulnerabilities: {
    weaknesses?: string;
  };
  formVersion: string;
  updatedAt: string;
}

export function emptyStructuredIntake(formVersion = PATHFINDER_INTAKE_FORM_VERSION): StructuredIntake {
  return {
    personalInformation: {},
    referralInformation: {},
    presentingProblem: {},
    goals: {},
    medicalHistory: {},
    psychologicalHistory: {},
    lifestyleAndSymptoms: {},
    psychosocialFactors: {},
    developmentalHistory: {},
    traumaHistory: {},
    identityAndSelfDescription: {},
    strengths: {},
    vulnerabilities: {},
    formVersion,
    updatedAt: new Date().toISOString(),
  };
}

export function answersToStructuredIntake(
  answers: IntakeAnswerMap,
  formVersion: string = PATHFINDER_INTAKE_FORM_VERSION,
): StructuredIntake {
  const g = (id: string) => answers[id]?.trim() || undefined;
  return {
    personalInformation: {
      fullName: g('fullName'),
      preferredName: g('preferredName'),
      pronouns: g('pronouns'),
      dateOfBirth: g('dateOfBirth'),
      currentAge: g('currentAge'),
      homeAddress: g('homeAddress'),
      telephone: g('telephone'),
      permissionCallLeaveMessage: g('permissionCallLeaveMessage'),
      email: g('email'),
      permissionEmail: g('permissionEmail'),
      veteranStatus: g('veteranStatus'),
      rank: g('rank'),
      unit: g('unit'),
      datesServed: g('datesServed'),
      dischargeReason: g('dischargeReason'),
      operationalTours: g('operationalTours'),
    },
    referralInformation: {
      gpPractice: g('gpPractice'),
      relationshipStatus: g('relationshipStatus'),
      referralSource: g('referralSource'),
      whyThisTherapist: g('whyThisTherapist'),
    },
    presentingProblem: {
      mainProblems: g('mainProblems'),
      currentSeverity: g('currentSeverity'),
      therapyGoals: g('therapyGoals'),
      futureDesiredState: g('futureDesiredState'),
    },
    goals: {
      clientStatedGoals: g('therapyGoals'),
    },
    medicalHistory: {
      physicalHealthRating: g('physicalHealthRating'),
      diagnosedHealthConditions: g('diagnosedHealthConditions'),
      medication: g('medication'),
      currentInvestigations: g('currentInvestigations'),
      chronicPain: g('chronicPain'),
    },
    psychologicalHistory: {
      previousMentalHealthTreatment: g('previousMentalHealthTreatment'),
      previousTherapy: g('previousTherapy'),
      psychiatricMedication: g('psychiatricMedication'),
      familyMentalHealthAddictionDvHistory: g('familyMentalHealthAddictionDvHistory'),
    },
    lifestyleAndSymptoms: {
      sleepProblems: g('sleepProblems'),
      sleepRating: g('sleepRating'),
      exercise: g('exercise'),
      foodAppetiteWeightBodyImage: g('foodAppetiteWeightBodyImage'),
      depressionGriefSadness: g('depressionGriefSadness'),
      anxietyPanicPhobias: g('anxietyPanicPhobias'),
      alcoholRecreationalDrugUse: g('alcoholRecreationalDrugUse'),
      romanticRelationship: g('romanticRelationship'),
    },
    psychosocialFactors: {
      household: g('household'),
      familyRelationshipRating: g('familyRelationshipRating'),
      familyConflict: g('familyConflict'),
      socialNetwork: g('socialNetwork'),
      socialising: g('socialising'),
      occupation: g('occupation'),
      workEnjoymentStress: g('workEnjoymentStress'),
      religionSpirituality: g('religionSpirituality'),
    },
    developmentalHistory: {
      childhood: g('childhood'),
      schoolExperience: g('schoolExperience'),
    },
    traumaHistory: {
      trauma: g('trauma'),
      childhoodAdolescentAbuse: g('childhoodAdolescentAbuse'),
    },
    identityAndSelfDescription: {
      fiveWordsDescribingSelf: g('fiveWordsDescribingSelf'),
      mostImportantThingInLife: g('mostImportantThingInLife'),
      significantAchievement: g('significantAchievement'),
    },
    strengths: {
      strengths: g('strengths'),
    },
    vulnerabilities: {
      weaknesses: g('weaknesses'),
    },
    formVersion,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parse pasted legacy intake text into answer map.
 * Only extracts answers for known questions — does not invent missing answers.
 */
export function parsePastedIntakeToAnswers(text: string): IntakeAnswerMap {
  const answers: IntakeAnswerMap = {};
  const lines = text.split(/\r?\n/);
  for (const q of PATHFINDER_INTAKE_QUESTIONS) {
    if (q.optionalFuture) continue;
    const re = new RegExp(
      `(?:^|\\n)\\s*${escapeReg(q.label)}\\s*[:\\-–]?\\s*([^\\n]+)`,
      'i',
    );
    const m = text.match(re);
    if (m?.[1]?.trim()) answers[q.id] = m[1].trim();
  }
  // Free-form: if nothing matched, keep whole text under mainProblems for structuring later
  if (Object.keys(answers).length === 0 && text.trim()) {
    answers.mainProblems = text.trim();
  }
  void lines;
  return answers;
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function questionById(id: string): IntakeFormQuestion | undefined {
  return PATHFINDER_INTAKE_QUESTIONS.find((q) => q.id === id);
}

export function structuredIntakeToDisplayText(s: StructuredIntake): string {
  const parts: string[] = [];
  const push = (title: string, obj: Record<string, string | undefined>) => {
    const rows = Object.entries(obj).filter(([, v]) => v?.trim());
    if (!rows.length) return;
    parts.push(title);
    for (const [k, v] of rows) parts.push(`${k}: ${v}`);
    parts.push('');
  };
  push('Personal Information', s.personalInformation);
  push('General / Referral', s.referralInformation);
  push('Presenting Problem', s.presentingProblem);
  push('Medical History', s.medicalHistory);
  push('Psychological History', s.psychologicalHistory);
  push('Lifestyle & Symptoms', s.lifestyleAndSymptoms);
  push('Psychosocial', s.psychosocialFactors);
  push('Developmental', s.developmentalHistory);
  push('Trauma History', s.traumaHistory);
  push('Identity', s.identityAndSelfDescription);
  push('Strengths', s.strengths);
  push('Vulnerabilities', s.vulnerabilities);
  return parts.join('\n');
}
