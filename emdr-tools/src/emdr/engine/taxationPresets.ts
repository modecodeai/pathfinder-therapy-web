import type {
  TaxationConfig,
  TaxationMode,
  WorkingMemoryLoad,
} from '../types/emdrTaxation';

/** Relative interface estimate — not a client physiological measurement. */
export function estimateWorkingMemoryLoad(config: TaxationConfig): WorkingMemoryLoad {
  if (config.mode === 'standard') return 'standard';

  if (config.reduceVisualVariation) {
    if (config.mode === 'chaos') return 'low';
    return config.mode === 'variable-speed' || config.mode === 'colour-shift'
      ? 'low'
      : 'moderate';
  }

  switch (config.mode) {
    case 'variable-speed':
      return config.variableSpeedPreset === 'high' ? 'moderate' : 'low';
    case 'colour-shift':
      return 'low';
    case 'random-colour':
      return config.colourNamingMode
        ? config.colourChangeFrequency === 'high'
          ? 'moderate'
          : 'low'
        : config.colourChangeFrequency === 'high'
          ? 'moderate'
          : 'low';
    case 'direction-shift':
      return config.directionShiftRate === 'frequent' ? 'moderate' : 'low';
    case 'pattern-switch':
      return 'moderate';
    case 'chaos':
      if (config.chaosLevel >= 3) return 'high';
      if (config.chaosLevel === 2) return 'moderate';
      return 'low';
    case 'custom': {
      const n =
        Number(config.customToggles.variableSpeed) +
        Number(config.customToggles.earlyDirectionReversal) +
        Number(config.customToggles.colourChanges || config.customToggles.randomColours) +
        Number(config.customToggles.variableTrajectory) +
        Number(config.customIntensity >= 7);
      if (config.customIntensity >= 9 || n >= 4) return 'high';
      if (config.customIntensity >= 4 || n >= 2) return 'moderate';
      return 'low';
    }
    default:
      return 'low';
  }
}

export function modeTooltip(mode: TaxationMode): string {
  switch (mode) {
    case 'standard':
      return 'Predictable bilateral visual tracking with no additional visual taxation.';
    case 'variable-speed':
      return 'Introduces unpredictability while preserving bilateral visual tracking, increasing attentional demand.';
    case 'direction-shift':
      return 'Requires continual visual reorientation rather than fully predictable tracking.';
    case 'colour-shift':
      return 'Adds a visual discrimination task that can be combined with therapist-directed colour naming.';
    case 'random-colour':
      return 'Combines eye tracking with an additional colour-recognition and verbal-response task.';
    case 'pattern-switch':
      return 'Changes visuospatial tracking demands by varying the trajectory of the stimulus.';
    case 'chaos':
      return 'Combines bounded variations in stimulus movement, colour, speed and/or trajectory to increase attentional demand and reduce predictability. Primary stage: Phase 4 — Desensitisation.';
    case 'custom':
      return 'Clinician-built combination of visual working-memory taxation options.';
  }
}

export function reduceTaxationOneStep(config: TaxationConfig): Partial<TaxationConfig> {
  if (config.mode === 'standard') return {};
  if (config.mode === 'chaos') {
    if (config.chaosLevel > 1) return { chaosLevel: (config.chaosLevel - 1) as 1 | 2 | 3 };
    return { mode: 'variable-speed', variableSpeedPreset: 'low' };
  }
  if (config.mode === 'random-colour') {
    if (config.colourChangeFrequency === 'high') return { colourChangeFrequency: 'medium' };
    if (config.colourChangeFrequency === 'medium') return { colourChangeFrequency: 'low' };
    return { mode: 'colour-shift' };
  }
  if (config.mode === 'variable-speed') {
    if (config.variableSpeedPreset === 'high') return { variableSpeedPreset: 'medium' };
    if (config.variableSpeedPreset === 'medium') return { variableSpeedPreset: 'low' };
    return { mode: 'standard' };
  }
  if (config.mode === 'pattern-switch' || config.mode === 'direction-shift') {
    return { mode: 'variable-speed', variableSpeedPreset: 'medium' };
  }
  if (config.mode === 'colour-shift') return { mode: 'standard' };
  if (config.mode === 'custom') {
    return { customIntensity: Math.max(1, config.customIntensity - 2) };
  }
  return { mode: 'standard' };
}

export function increaseTaxationOneStep(config: TaxationConfig): Partial<TaxationConfig> {
  if (config.mode === 'standard') return { mode: 'variable-speed', variableSpeedPreset: 'low' };
  if (config.mode === 'variable-speed') {
    if (config.variableSpeedPreset === 'low') return { variableSpeedPreset: 'medium' };
    if (config.variableSpeedPreset === 'medium') return { variableSpeedPreset: 'high' };
    return { mode: 'colour-shift' };
  }
  if (config.mode === 'colour-shift') return { mode: 'random-colour', colourNamingMode: true };
  if (config.mode === 'random-colour') {
    if (config.colourChangeFrequency === 'low') return { colourChangeFrequency: 'medium' };
    if (config.colourChangeFrequency === 'medium') return { colourChangeFrequency: 'high' };
    return { mode: 'chaos', chaosLevel: 1 };
  }
  if (config.mode === 'chaos') {
    if (config.chaosLevel < 3) return { chaosLevel: (config.chaosLevel + 1) as 1 | 2 | 3 };
    return {};
  }
  if (config.mode === 'custom') {
    return { customIntensity: Math.min(10, config.customIntensity + 2) };
  }
  return { mode: 'chaos', chaosLevel: 1 };
}

/** Map TaxationConfig patch → RoomState patch */
export function taxationConfigPatchToRoom(
  patch: Partial<TaxationConfig>,
): Partial<import('../../types/room').RoomState> {
  const out: Partial<import('../../types/room').RoomState> = {};
  if (patch.mode !== undefined) out.taxationMode = patch.mode;
  if (patch.variableSpeedPreset !== undefined) {
    out.taxationVariableSpeedPreset = patch.variableSpeedPreset;
  }
  if (patch.colourShiftInterval !== undefined) {
    out.taxationColourShiftInterval = patch.colourShiftInterval;
  }
  if (patch.colourPalette !== undefined) out.taxationColourPalette = patch.colourPalette;
  if (patch.colourChangeFrequency !== undefined) {
    out.taxationColourChangeFrequency = patch.colourChangeFrequency;
  }
  if (patch.colourNamingMode !== undefined) {
    out.taxationColourNamingMode = patch.colourNamingMode;
  }
  if (patch.chaosLevel !== undefined) out.taxationChaosLevel = patch.chaosLevel;
  if (patch.reduceVisualVariation !== undefined) {
    out.taxationReduceVisualVariation = patch.reduceVisualVariation;
  }
  if (patch.disableColourTaxation !== undefined) {
    out.taxationDisableColour = patch.disableColourTaxation;
  }
  if (patch.seed !== undefined) out.taxationSeed = patch.seed;
  return out;
}
