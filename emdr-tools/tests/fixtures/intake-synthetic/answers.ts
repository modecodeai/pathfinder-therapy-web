/**
 * Synthetic Pathfinder Client Intake Form answers — de-identified fixture only.
 * Never place real client data in source.
 */

import type { IntakeAnswerMap } from '../../src/clinical-intelligence/lib/pathfinderIntakeForm';

export const SYNTHETIC_INTAKE_BASE: IntakeAnswerMap = {
  fullName: 'Synthetic Client',
  preferredName: 'Sam',
  pronouns: 'they/them',
  dateOfBirth: '1990-01-15',
  currentAge: '36',
  email: 'synthetic.client@example.test',
  telephone: '+351900000000',
  permissionEmail: 'Yes',
  permissionCallLeaveMessage: 'No',
  veteranStatus: 'No',
  gpPractice: 'Example GP Practice',
  relationshipStatus: 'Partnered',
  referralSource: 'Self-referral',
  whyThisTherapist: 'Recommended by a friend',
  mainProblems: 'I feel overwhelmed and shut down when people argue. Anxiety before work.',
  currentSeverity: '7',
  therapyGoals: 'I want to feel calmer in conflict and sleep better.',
  physicalHealthRating: '7',
  diagnosedHealthConditions: 'None reported',
  medication: 'None',
  chronicPain: 'No',
  previousMentalHealthTreatment: 'Brief counselling two years ago',
  previousTherapy: 'Six sessions of counselling',
  sleepProblems: 'Poor sleep — wake at 3am worrying',
  sleepRating: '4',
  exercise: 'Walks twice a week',
  depressionGriefSadness: 'Low mood some evenings',
  anxietyPanicPhobias: 'Anxiety before meetings; occasional panic sensations',
  alcoholRecreationalDrugUse: 'Social drinking only',
  romanticRelationship: 'Supportive partner',
  household: 'Lives with partner',
  familyConflict: 'Occasional tension with parents',
  socialNetwork: 'A few close friends',
  occupation: 'Office work',
  workEnjoymentStress: 'Stressful deadlines',
  childhood: 'Difficult childhood — criticism at home',
  schoolExperience: 'Anxious at school',
  trauma: '',
  childhoodAdolescentAbuse: '',
  fiveWordsDescribingSelf: 'Thoughtful, anxious, loyal, creative, tired',
  mostImportantThingInLife: 'My relationships',
  significantAchievement: 'Completed a degree while working',
  strengths: 'Supportive partner; humour; persistence',
  weaknesses: 'Overthinking',
};

export const SYNTHETIC_INTAKE_WITH_TRAUMA: IntakeAnswerMap = {
  ...SYNTHETIC_INTAKE_BASE,
  trauma: 'Car accident five years ago — still avoid motorways',
  childhoodAdolescentAbuse: 'Emotional abuse in adolescence',
};

export const SYNTHETIC_INTAKE_WITH_PAIN: IntakeAnswerMap = {
  ...SYNTHETIC_INTAKE_BASE,
  chronicPain: 'YES — lower back pain for three years',
};

export const SYNTHETIC_INTAKE_WITH_RISK: IntakeAnswerMap = {
  ...SYNTHETIC_INTAKE_BASE,
  depressionGriefSadness: 'History of self-harm as a teenager; not currently',
};

export const SYNTHETIC_INTAKE_PASTE_TEXT = `
Full name: Synthetic Client
Preferred name: Sam
Main problems to resolve: Anxiety and poor sleep; I feel overwhelmed and shut down when people argue.
Therapy goals: Feel calmer and sleep better
Anxiety / panic / phobias: Anxiety before work meetings
Sleep problems: Poor sleep
Romantic relationship: Supportive partner
Childhood: Difficult childhood
Strengths: Supportive partner
`.trim();
