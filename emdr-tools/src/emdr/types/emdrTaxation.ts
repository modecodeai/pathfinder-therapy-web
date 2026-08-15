/**
 * Working Memory Taxation — EMDR 2.0-informed clinician tools.
 * Not a replacement for standard EMDR; not an independently validated protocol.
 */

export type TaxationMode =
  | 'standard'
  | 'variable-speed'
  | 'direction-shift'
  | 'colour-shift'
  | 'random-colour'
  | 'pattern-switch'
  | 'chaos'
  | 'custom';

/** Interface estimate of relative task complexity — not a physiological measure. */
export type WorkingMemoryLoad = 'standard' | 'low' | 'moderate' | 'high';

export type VariableSpeedPreset = 'low' | 'medium' | 'high';
export type ColourShiftInterval = 2 | 4 | 6 | 'random';
export type ColourChangeFrequency = 'low' | 'medium' | 'high';
export type DirectionShiftRate = 'rare' | 'moderate' | 'frequent';
export type PatternSwitchRate = 'every-2-5' | 'every-5-10' | 'random';
export type ChaosLevel = 1 | 2 | 3;

export type TaxationTrajectory =
  | 'horizontal'
  | 'diagonal-a'
  | 'diagonal-b'
  | 'vertical'
  | 'wide-arc'
  | 'figure-eight';

export interface CustomTaxationToggles {
  variableSpeed: boolean;
  earlyDirectionReversal: boolean;
  colourChanges: boolean;
  randomColours: boolean;
  variableTrajectory: boolean;
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
  figureEight: boolean;
}

/** Operational taxation config synced for client display (visual params only). */
export interface TaxationConfig {
  mode: TaxationMode;
  variableSpeedPreset: VariableSpeedPreset;
  colourShiftInterval: ColourShiftInterval;
  colourPalette: string[];
  colourChangeFrequency: ColourChangeFrequency;
  colourNamingMode: boolean;
  directionShiftRate: DirectionShiftRate;
  patternSwitchRate: PatternSwitchRate;
  enabledTrajectories: TaxationTrajectory[];
  chaosLevel: ChaosLevel;
  customToggles: CustomTaxationToggles;
  customIntensity: number;
  customChangeFrequency: number;
  reduceVisualVariation: boolean;
  disableColourTaxation: boolean;
  /** Deterministic seed for this set — regenerated on start when mode ≠ standard */
  seed: number;
}

export interface TaxationRuntimeSnapshot {
  mode: TaxationMode;
  load: WorkingMemoryLoad;
  speedScale: number;
  colour: string | null;
  colourChanged: boolean;
  stimulusLabel: 'bilateral-visual' | 'visual-working-memory-taxation';
}

export interface SetTaxationLog {
  taxationMode: TaxationMode;
  taxationLevel: WorkingMemoryLoad;
  stimulusSpeed: number;
  speedVariation: VariableSpeedPreset | null;
  trajectory: string;
  trajectoryVariation: boolean;
  colourMode: 'fixed' | 'shift' | 'random' | 'disabled';
  colourChangeFrequency: ColourChangeFrequency | ColourShiftInterval | null;
  directionReversals: boolean;
  secondaryTaskType: string | null;
  secondaryTaskPrompt: string | null;
  setDuration: number;
  emdrPhase: string | null;
}

export const TAXATION_MODE_LABELS: Record<TaxationMode, string> = {
  standard: 'Standard',
  'variable-speed': 'Variable Speed',
  'direction-shift': 'Direction Shift',
  'colour-shift': 'Colour Shift',
  'random-colour': 'Random Colour',
  'pattern-switch': 'Pattern Switch',
  chaos: 'Chaos',
  custom: 'Custom',
};

export const WORKING_MEMORY_LOAD_LABELS: Record<WorkingMemoryLoad, string> = {
  standard: 'Standard',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export const DEFAULT_TAXATION_PALETTE = [
  '#FFFFFF',
  '#3B82F6',
  '#22C55E',
  '#EAB308',
  '#8B5CF6',
  '#14B8A6',
  '#F97316',
] as const;

export const DEFAULT_CUSTOM_TOGGLES: CustomTaxationToggles = {
  variableSpeed: false,
  earlyDirectionReversal: false,
  colourChanges: false,
  randomColours: false,
  variableTrajectory: false,
  horizontal: true,
  vertical: false,
  diagonal: false,
  figureEight: false,
};

export function createDefaultTaxationConfig(): TaxationConfig {
  return {
    mode: 'standard',
    variableSpeedPreset: 'medium',
    colourShiftInterval: 4,
    colourPalette: [...DEFAULT_TAXATION_PALETTE],
    colourChangeFrequency: 'medium',
    colourNamingMode: false,
    directionShiftRate: 'moderate',
    patternSwitchRate: 'every-5-10',
    enabledTrajectories: ['horizontal'],
    chaosLevel: 1,
    customToggles: { ...DEFAULT_CUSTOM_TOGGLES },
    customIntensity: 4,
    customChangeFrequency: 4,
    reduceVisualVariation: false,
    disableColourTaxation: false,
    seed: 1,
  };
}
