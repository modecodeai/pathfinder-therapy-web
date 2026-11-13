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
/** Direction Shift reversal frequency */
export type DirectionShiftRate = 'low' | 'moderate' | 'high';
/** Pattern Switch change frequency */
export type PatternSwitchRate = 'low' | 'moderate' | 'high' | 'random';
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
  randomSpeedChanges: boolean;
  earlyDirectionReversal: boolean;
  colourChanges: boolean;
  randomColour: boolean;
  patternSwitching: boolean;
  randomPatternSelection: boolean;
  horizontal: boolean;
  vertical: boolean;
  diagonalA: boolean;
  diagonalB: boolean;
  wideArc: boolean;
  figureEight: boolean;
  showCognitivePrompts: boolean;
  colourNaming: boolean;
  numberTask: boolean;
  verbalTask: boolean;
  cognitiveSwitching: boolean;
}

/**
 * Resolved modifier flags used by the shared taxation motion engine.
 * Mode presets populate this; Custom exposes it directly.
 */
export interface ActiveTaxationModifiers {
  variableSpeed: boolean;
  directionShift: boolean;
  colourShift: boolean;
  randomColour: boolean;
  patternSwitch: boolean;
  intensity: number;
  changeFrequency: number;
  trajectories: TaxationTrajectory[];
  directionRate: DirectionShiftRate;
  patternRate: PatternSwitchRate;
  variableSpeedPreset: VariableSpeedPreset;
  colourShiftInterval: ColourShiftInterval;
  colourChangeFrequency: ColourChangeFrequency;
  colourPalette: string[];
  reduceVisualVariation: boolean;
  disableColourTaxation: boolean;
  seed: number;
  chaosLevel: ChaosLevel;
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
  trajectory: TaxationTrajectory;
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

export const TAXATION_MODE_ORDER: TaxationMode[] = [
  'standard',
  'variable-speed',
  'colour-shift',
  'random-colour',
  'direction-shift',
  'pattern-switch',
  'chaos',
  'custom',
];

export const WORKING_MEMORY_LOAD_LABELS: Record<WorkingMemoryLoad, string> = {
  standard: 'Standard',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export const TRAJECTORY_LABELS: Record<TaxationTrajectory, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
  'diagonal-a': 'Diagonal A',
  'diagonal-b': 'Diagonal B',
  'wide-arc': 'Wide Arc',
  'figure-eight': 'Figure Eight',
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
  randomSpeedChanges: false,
  earlyDirectionReversal: false,
  colourChanges: false,
  randomColour: false,
  patternSwitching: false,
  randomPatternSelection: false,
  horizontal: true,
  vertical: false,
  diagonalA: false,
  diagonalB: false,
  wideArc: false,
  figureEight: false,
  showCognitivePrompts: true,
  colourNaming: false,
  numberTask: false,
  verbalTask: false,
  cognitiveSwitching: false,
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
    patternSwitchRate: 'moderate',
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

export function trajectoriesFromCustomToggles(
  t: CustomTaxationToggles,
): TaxationTrajectory[] {
  const list: TaxationTrajectory[] = [];
  if (t.horizontal) list.push('horizontal');
  if (t.vertical) list.push('vertical');
  if (t.diagonalA) list.push('diagonal-a');
  if (t.diagonalB) list.push('diagonal-b');
  if (t.wideArc) list.push('wide-arc');
  if (t.figureEight) list.push('figure-eight');
  return list.length ? list : ['horizontal'];
}
