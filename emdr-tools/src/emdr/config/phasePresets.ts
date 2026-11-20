import type { BLSMode, BLSTrajectory, EMDRPhase, SpeedPresetId } from '../types/emdr';

export interface PhasePreset {
  phase: EMDRPhase;
  mode: BLSMode;
  trajectory: BLSTrajectory;
  speedPreset: SpeedPresetId;
  /** Suggested starting passes (undefined = timed/continuous) */
  passes?: number;
  suggestedPassRange?: [number, number];
  durationSeconds?: number;
  continuous?: boolean;
  blsActive: boolean;
  why: string;
}

/**
 * Suggested starting points — therapists must customise clinically.
 * Derived as application presets from training reference material; not compulsory parameters.
 */
export const EMDR_PHASE_PRESETS: Record<EMDRPhase, PhasePreset> = {
  history: {
    phase: 'history',
    mode: 'manual',
    trajectory: 'horizontal',
    speedPreset: 'moderate',
    blsActive: false,
    why: 'BLS is not normally required during history taking. Open BLS Studio manually if needed.',
  },
  preparation: {
    phase: 'preparation',
    mode: 'resource',
    trajectory: 'horizontal',
    speedPreset: 'slow',
    passes: 8,
    suggestedPassRange: [6, 10],
    blsActive: true,
    why: 'Suggested starting range: approximately 6–10 slower passes for stabilisation/resourcing. Adjust to the client.',
  },
  assessment: {
    phase: 'assessment',
    mode: 'manual',
    trajectory: 'horizontal',
    speedPreset: 'moderate',
    blsActive: false,
    why: 'Assessment records target material. Stimulation does not start automatically — use Begin Reprocessing to enter Phase 4.',
  },
  desensitisation: {
    phase: 'desensitisation',
    mode: 'reprocessing',
    trajectory: 'horizontal',
    speedPreset: 'fast',
    passes: 30,
    suggestedPassRange: [20, 36],
    blsActive: true,
    why: 'This preset begins with faster bilateral stimulation and a typical reprocessing set length. Adjust speed and duration according to the client’s response and tolerance.',
  },
  installation: {
    phase: 'installation',
    mode: 'positive-strengthening',
    trajectory: 'horizontal',
    speedPreset: 'fast',
    passes: 30,
    suggestedPassRange: [20, 36],
    blsActive: true,
    why: 'Installation uses reprocessing-style BLS while strengthening the positive cognition. Track VOC; do not assume completion at 7.',
  },
  'body-scan': {
    phase: 'body-scan',
    mode: 'reprocessing',
    trajectory: 'horizontal',
    speedPreset: 'fast',
    passes: 30,
    blsActive: true,
    why: 'Body scan may use standard reprocessing BLS if residual disturbance is present. Therapist decides whether further sets are indicated.',
  },
  closure: {
    phase: 'closure',
    mode: 'de-arousal',
    trajectory: 'infinity',
    speedPreset: 'very-slow',
    durationSeconds: 15,
    blsActive: true,
    why: 'Closure supports grounding and incomplete-session ending. Slow figure-eight movement is available for de-arousal when clinically appropriate.',
  },
  reevaluation: {
    phase: 'reevaluation',
    mode: 'positive-strengthening',
    trajectory: 'horizontal',
    speedPreset: 'slow',
    continuous: true,
    blsActive: true,
    why: 'When strengthening positive material, slower continuous BLS may be used. BLS is optional.',
  },
  'future-template': {
    phase: 'future-template',
    mode: 'future-template',
    trajectory: 'horizontal',
    speedPreset: 'fast',
    continuous: true,
    blsActive: true,
    why: 'Future Template supports rehearsal of a desired future response with therapist-controlled faster/custom BLS.',
  },
};

export const CLOSURE_INFINITY_PRESET = {
  mode: 'de-arousal' as const,
  trajectory: 'infinity' as const,
  speedPreset: 'very-slow' as const,
  durationSeconds: 15,
  continuous: false,
  why: 'Slow figure-eight movement may be used clinically for de-arousal and incomplete-session closure. Adjust direction and speed according to the client’s response.',
};
