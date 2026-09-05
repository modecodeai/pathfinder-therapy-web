/** Clinical EMDR types — therapist-controlled; software does not decide treatment. */

export type EMDRPhase =
  | 'history'
  | 'preparation'
  | 'assessment'
  | 'desensitisation'
  | 'installation'
  | 'body-scan'
  | 'closure'
  | 'reevaluation'
  | 'future-template';

export type BLSTrajectory =
  | 'horizontal'
  | 'diagonal-up'
  | 'diagonal-down'
  | 'vertical'
  | 'blink'
  | 'infinity';

export type BLSMode =
  | 'manual'
  | 'resource'
  | 'reprocessing'
  | 'positive-strengthening'
  | 'de-arousal'
  | 'future-template';

export type SpeedPresetId = 'very-slow' | 'slow' | 'moderate' | 'fast' | 'custom';

export type MidlineDirection = 'up' | 'down';

export type SetResponse =
  | 'change'
  | 'no-change'
  | 'positive'
  | 'distress'
  | 'pause'
  | 'return-to-target'
  | 'other';

export type AccountTier =
  | 'therapist-free'
  | 'practice'
  | 'practice-pro'
  | 'organisation';

export type EmdrTrainingStatus =
  | 'emdr-trained'
  | 'in-training'
  | 'consultant-trainer'
  | 'mental-health'
  | 'other';

export interface SpeedPreset {
  id: SpeedPresetId;
  label: string;
  /** Duration of one full pass (L→R→L) in ms */
  cycleDurationMs: number;
}

export interface BLSSetRecord {
  id: string;
  phase: EMDRPhase;
  mode: BLSMode;
  trajectory: BLSTrajectory;
  speed: number;
  speedLabel?: SpeedPresetId;
  targetPasses?: number;
  completedPasses: number;
  targetDurationSeconds?: number;
  completedDurationSeconds: number;
  continuous: boolean;
  modality?: 'visual' | 'auditory' | 'tactile';
  response?: SetResponse;
  sud?: number;
  voc?: number;
  note?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AssessmentTarget {
  title?: string;
  memory?: string;
  image?: string;
  negativeCognition?: string;
  positiveCognition?: string;
  initialVOC?: number;
  currentVOC?: number;
  initialSUD?: number;
  currentSUD?: number;
  emotion?: string;
  bodyLocation?: string;
  ecologicalVOC?: boolean;
}

export interface CompanionSessionState {
  id: string;
  referenceLabel: string;
  phase: EMDRPhase;
  target: AssessmentTarget;
  sets: BLSSetRecord[];
  consecutiveNoChangeSets: number;
  sessionStartedAt: string;
  totalProcessingMs: number;
}

export const SPEED_PRESETS: SpeedPreset[] = [
  { id: 'very-slow', label: 'Very slow', cycleDurationMs: 4000 },
  { id: 'slow', label: 'Slow', cycleDurationMs: 2200 },
  { id: 'moderate', label: 'Moderate', cycleDurationMs: 1400 },
  { id: 'fast', label: 'Faster', cycleDurationMs: 900 },
];

export const PHASE_LABELS: Record<EMDRPhase, string> = {
  history: '1 History',
  preparation: '2 Preparation',
  assessment: '3 Assessment',
  desensitisation: '4 Desensitisation',
  installation: '5 Installation',
  'body-scan': '6 Body Scan',
  closure: '7 Closure',
  reevaluation: '8 Reevaluation',
  'future-template': 'Future Template',
};
