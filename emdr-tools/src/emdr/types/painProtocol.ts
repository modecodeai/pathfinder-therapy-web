/** EMDR Pain Protocol — Mark Grant-informed clinical types (private clinician use). */

export type PainTargetType = 'traumatic-pain' | 'present-pain' | null;

export type PainProtocolStage =
  | 'dashboard'
  | 'orientation'
  | 'target-selection'
  | 'pain-description'
  | 'negative-cognition'
  | 'positive-cognition'
  | 'voc'
  | 'emotion'
  | 'pain-sud'
  | 'sensation-location'
  | 'desensitisation'
  | 'installation-route'
  | 'installation-pc'
  | 'antidote-imagery'
  | 'imaginal-healing'
  | 'voc-review'
  | 'body-scan'
  | 'closure'
  | 're-evaluation'
  | 'between-session'
  | 'help'
  | 'overview'
  | 'script-full'
  | 'script-short';

export type InstallationRoute = 'standard-pc' | 'antidote' | 'both' | null;

export type PainChangeTag =
  | 'smaller'
  | 'softer'
  | 'less-intense'
  | 'moving'
  | 'warmer'
  | 'cooler'
  | 'lighter'
  | 'heavier'
  | 'more-relaxed'
  | 'less-distressing'
  | 'no-clear-change'
  | 'pain-increased'
  | 'other';

export interface ProtocolScriptSection {
  id: string;
  title: string;
  phase: string;
  script: string;
  clinicalNotes?: string[];
  source: string;
  /** Protocol Guidance = source-derived; Practice Tool = Pathfinder convenience */
  guidanceKind: 'protocol' | 'practice-tool';
}

export interface PainAssessmentState {
  targetType: PainTargetType;
  targetDescription: string;
  painImageMetaphor: string;
  painColour: string;
  painShape: string;
  painSize: string;
  painTexture: string;
  painMovement: string;
  additionalDescription: string;
  nc: string;
  pc: string;
  revisedPc: string;
  voc?: number;
  endVoc?: number;
  emotion: string;
  skipEmotion: boolean;
  baselineSud?: number;
  currentSud?: number;
  lowestSud?: number;
  endSud?: number;
  bodyLocations: string[];
  bodyLocationNotes: Record<string, string>;
  sensationNotes: string;
}

export interface AntidoteImageryState {
  sensoryChange: string;
  whatIsThereNow: string;
  howDoesThatFeel: string;
  remindsOf: string;
  imageMetaphor: string;
  associatedWord: string;
  emotionalState: string;
  installationNotes: string;
}

export interface ImaginalHealingState {
  image: string;
  sensations: string;
  emotionalResponse: string;
  associatedWord: string;
  blsDurationNote: string;
  strengthNotes: string;
}

export interface PainReevaluationState {
  painSinceLast: string;
  sleepChanges: string;
  activityChanges: string;
  moodChanges: string;
  anythingDifferent: string;
  newUnusualActivity: string;
  stressChanges: string;
  traumaRelatedChanges: string;
  relationshipFunctioning: string;
  medicationChanges: string;
  medicalChanges: string;
  newPainImage: string;
  currentSud?: number;
  newTargetRequired: boolean | null;
}

export interface PainClosureChecklist {
  painStateReviewed: boolean;
  orientationStable: boolean;
  resourcesReviewed: boolean;
  healingImageReviewed: boolean;
  betweenSessionPlan: boolean;
  medicalEscalationDiscussed: boolean;
}

export interface PainSessionData {
  date: string;
  targetType: 'traumatic-pain' | 'present-pain';
  target: string;
  baselinePainSUD: number;
  endPainSUD: number;
  originalNC?: string;
  originalPC?: string;
  endPC?: string;
  baselineVoC?: number;
  endVoC?: number;
  painDescription?: string;
  painImage?: string;
  painLocation?: string[];
  sleepChange?: string;
  activityChange?: string;
  moodChange?: string;
  antidoteImage?: string;
  antidoteWord?: string;
  blsMode?: string;
  continuousBLS?: boolean;
  blsDuration?: number;
  clinicianNotes?: string;
}

export interface PainWorkspaceState {
  stage: PainProtocolStage;
  completedStages: PainProtocolStage[];
  stageNotes: Partial<Record<PainProtocolStage, string>>;
  assessment: PainAssessmentState;
  antidote: AntidoteImageryState;
  imaginal: ImaginalHealingState;
  reevaluation: PainReevaluationState;
  closure: PainClosureChecklist;
  installationRoute: InstallationRoute;
  clientExactWords: string;
  changeTags: PainChangeTag[];
  plateauFurtherPossible: 'yes' | 'no' | 'unsure' | null;
  whatPreventsZero: string;
  privateNotes: string;
  orientationComplete: boolean;
  pinnedScriptId: string | null;
  sessions: PainSessionData[];
  continuousBlsPreferred: boolean;
  scriptPanelOpen: boolean;
  updatedAt: string;
}

export const PAIN_STAGE_LABELS: Record<PainProtocolStage, string> = {
  dashboard: 'Dashboard',
  orientation: 'Orientation / AIP',
  'target-selection': 'Target Selection',
  'pain-description': 'Pain Description',
  'negative-cognition': 'Negative Cognition',
  'positive-cognition': 'Positive Cognition',
  voc: 'VoC',
  emotion: 'Emotion',
  'pain-sud': 'Pain SUD',
  'sensation-location': 'Sensation / Location',
  desensitisation: 'Desensitisation',
  'installation-route': 'Installation Route',
  'installation-pc': 'PC Installation',
  'antidote-imagery': 'Antidote Imagery',
  'imaginal-healing': 'Imaginal Healing',
  'voc-review': 'VoC Review',
  'body-scan': 'Body Scan',
  closure: 'Closure',
  're-evaluation': 'Re-evaluation',
  'between-session': 'Between-Session BLS',
  help: 'Help & Guidance',
  overview: 'Pain Overview',
  'script-full': 'Full Script',
  'script-short': 'Short Script',
};

/** Navigator stages in Grant protocol order (16 stages) */
export const PAIN_NAVIGATOR_STAGES: PainProtocolStage[] = [
  'orientation',
  'target-selection',
  'pain-description',
  'negative-cognition',
  'positive-cognition',
  'voc',
  'emotion',
  'pain-sud',
  'sensation-location',
  'desensitisation',
  'installation-pc',
  'antidote-imagery',
  'voc-review',
  'body-scan',
  'closure',
  're-evaluation',
];

export const BODY_AREAS = [
  'Head',
  'Jaw',
  'Neck',
  'Shoulders',
  'Chest',
  'Abdomen',
  'Back',
  'Pelvis',
  'Arms',
  'Hands',
  'Legs',
  'Feet',
  'Other',
] as const;

export const PAIN_CHANGE_LABELS: Record<PainChangeTag, string> = {
  smaller: 'Smaller',
  softer: 'Softer',
  'less-intense': 'Less intense',
  moving: 'Moving',
  warmer: 'Warmer',
  cooler: 'Cooler',
  lighter: 'Lighter',
  heavier: 'Heavier',
  'more-relaxed': 'More relaxed',
  'less-distressing': 'Less distressing',
  'no-clear-change': 'No clear change',
  'pain-increased': 'Pain increased',
  other: 'Other',
};

export function createEmptyAssessment(): PainAssessmentState {
  return {
    targetType: null,
    targetDescription: '',
    painImageMetaphor: '',
    painColour: '',
    painShape: '',
    painSize: '',
    painTexture: '',
    painMovement: '',
    additionalDescription: '',
    nc: '',
    pc: '',
    revisedPc: '',
    emotion: '',
    skipEmotion: false,
    bodyLocations: [],
    bodyLocationNotes: {},
    sensationNotes: '',
  };
}

export function createEmptyPainWorkspace(): PainWorkspaceState {
  return {
    stage: 'dashboard',
    completedStages: [],
    stageNotes: {},
    assessment: createEmptyAssessment(),
    antidote: {
      sensoryChange: '',
      whatIsThereNow: '',
      howDoesThatFeel: '',
      remindsOf: '',
      imageMetaphor: '',
      associatedWord: '',
      emotionalState: '',
      installationNotes: '',
    },
    imaginal: {
      image: '',
      sensations: '',
      emotionalResponse: '',
      associatedWord: '',
      blsDurationNote: '',
      strengthNotes: '',
    },
    reevaluation: {
      painSinceLast: '',
      sleepChanges: '',
      activityChanges: '',
      moodChanges: '',
      anythingDifferent: '',
      newUnusualActivity: '',
      stressChanges: '',
      traumaRelatedChanges: '',
      relationshipFunctioning: '',
      medicationChanges: '',
      medicalChanges: '',
      newPainImage: '',
      newTargetRequired: null,
    },
    closure: {
      painStateReviewed: false,
      orientationStable: false,
      resourcesReviewed: false,
      healingImageReviewed: false,
      betweenSessionPlan: false,
      medicalEscalationDiscussed: false,
    },
    installationRoute: null,
    clientExactWords: '',
    changeTags: [],
    plateauFurtherPossible: null,
    whatPreventsZero: '',
    privateNotes: '',
    orientationComplete: false,
    pinnedScriptId: null,
    sessions: [],
    continuousBlsPreferred: true,
    scriptPanelOpen: true,
    updatedAt: new Date().toISOString(),
  };
}
