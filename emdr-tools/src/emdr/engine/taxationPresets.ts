import type {
  ActiveTaxationModifiers,
  TaxationConfig,
  TaxationMode,
  TaxationTrajectory,
  VariableSpeedPreset,
  WorkingMemoryLoad,
} from '../types/emdrTaxation';
import {
  trajectoriesFromCustomToggles,
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
      return config.colourNamingMode || config.colourChangeFrequency === 'high'
        ? 'moderate'
        : 'low';
    case 'direction-shift':
      return config.directionShiftRate === 'high' ? 'moderate' : 'low';
    case 'pattern-switch':
      return config.patternSwitchRate === 'high' || config.patternSwitchRate === 'random'
        ? 'moderate'
        : 'low';
    case 'chaos':
      if (config.chaosLevel >= 3) return 'high';
      if (config.chaosLevel === 2) return 'moderate';
      return 'low';
    case 'custom': {
      const intensity = config.customIntensity;
      if (intensity >= 9) return 'high';
      if (intensity >= 5) return 'moderate';
      if (intensity >= 3) return 'low';
      return 'low';
    }
    default:
      return 'low';
  }
}

export function intensityToSpeedPreset(intensity: number): VariableSpeedPreset {
  if (intensity >= 8) return 'high';
  if (intensity >= 5) return 'medium';
  return 'low';
}

/**
 * Resolve composable modifiers from a mode preset or Custom toggles.
 * All visual taxation modes share this shape — Custom exposes it directly.
 */
export function resolveActiveModifiers(config: TaxationConfig): ActiveTaxationModifiers {
  const base: ActiveTaxationModifiers = {
    variableSpeed: false,
    directionShift: false,
    colourShift: false,
    randomColour: false,
    patternSwitch: false,
    intensity: 4,
    changeFrequency: 4,
    trajectories: ['horizontal'],
    directionRate: config.directionShiftRate,
    patternRate: config.patternSwitchRate,
    variableSpeedPreset: config.variableSpeedPreset,
    colourShiftInterval: config.colourShiftInterval,
    colourChangeFrequency: config.colourChangeFrequency,
    colourPalette: [...config.colourPalette],
    reduceVisualVariation: config.reduceVisualVariation,
    disableColourTaxation: config.disableColourTaxation,
    seed: config.seed || 1,
    chaosLevel: config.chaosLevel,
  };

  switch (config.mode) {
    case 'standard':
      return { ...base, intensity: 1, changeFrequency: 1 };
    case 'variable-speed':
      return {
        ...base,
        variableSpeed: true,
        intensity: config.variableSpeedPreset === 'high' ? 7 : config.variableSpeedPreset === 'low' ? 3 : 5,
        changeFrequency: config.variableSpeedPreset === 'high' ? 7 : 5,
      };
    case 'colour-shift':
      return {
        ...base,
        colourShift: true,
        intensity: 3,
        changeFrequency: 4,
      };
    case 'random-colour':
      return {
        ...base,
        randomColour: true,
        intensity: config.colourChangeFrequency === 'high' ? 6 : 4,
        changeFrequency:
          config.colourChangeFrequency === 'high'
            ? 8
            : config.colourChangeFrequency === 'low'
              ? 3
              : 5,
      };
    case 'direction-shift':
      return {
        ...base,
        directionShift: true,
        intensity: config.directionShiftRate === 'high' ? 6 : 4,
        changeFrequency:
          config.directionShiftRate === 'high'
            ? 8
            : config.directionShiftRate === 'low'
              ? 3
              : 5,
        trajectories: ['horizontal'],
      };
    case 'pattern-switch': {
      const trajs =
        config.enabledTrajectories.length > 0
          ? [...config.enabledTrajectories]
          : (['horizontal'] as TaxationTrajectory[]);
      return {
        ...base,
        patternSwitch: trajs.length > 1,
        intensity: config.patternSwitchRate === 'high' ? 7 : 5,
        changeFrequency:
          config.patternSwitchRate === 'high'
            ? 8
            : config.patternSwitchRate === 'low'
              ? 3
              : config.patternSwitchRate === 'random'
                ? 6
                : 5,
        trajectories: trajs,
      };
    }
    case 'chaos': {
      const level = config.reduceVisualVariation ? 1 : config.chaosLevel;
      if (level === 1) {
        return {
          ...base,
          variableSpeed: true,
          randomColour: !config.disableColourTaxation,
          variableSpeedPreset: 'low',
          colourChangeFrequency: 'low',
          intensity: 4,
          changeFrequency: 4,
          chaosLevel: 1,
          trajectories: ['horizontal'],
        };
      }
      if (level === 2) {
        return {
          ...base,
          variableSpeed: true,
          directionShift: true,
          patternSwitch: true,
          randomColour: !config.disableColourTaxation,
          variableSpeedPreset: 'medium',
          directionRate: 'moderate',
          patternRate: 'moderate',
          colourChangeFrequency: 'medium',
          intensity: 6,
          changeFrequency: 6,
          chaosLevel: 2,
          trajectories: ['horizontal', 'diagonal-a', 'vertical', 'wide-arc'],
        };
      }
      return {
        ...base,
        variableSpeed: true,
        directionShift: true,
        patternSwitch: true,
        randomColour: !config.disableColourTaxation,
        variableSpeedPreset: 'high',
        directionRate: 'high',
        patternRate: 'high',
        colourChangeFrequency: 'high',
        intensity: 9,
        changeFrequency: 9,
        chaosLevel: 3,
        trajectories: [
          'horizontal',
          'vertical',
          'diagonal-a',
          'diagonal-b',
          'wide-arc',
          'figure-eight',
        ],
      };
    }
    case 'custom': {
      const t = config.customToggles;
      const trajs = trajectoriesFromCustomToggles(t);
      const intensity = Math.min(10, Math.max(1, config.customIntensity));
      const freq = Math.min(10, Math.max(1, config.customChangeFrequency));
      return {
        ...base,
        variableSpeed: t.variableSpeed || t.randomSpeedChanges,
        directionShift: t.earlyDirectionReversal,
        colourShift: t.colourChanges && !t.randomColour,
        randomColour: t.randomColour,
        patternSwitch: (t.patternSwitching || t.randomPatternSelection) && trajs.length > 1,
        intensity,
        changeFrequency: freq,
        variableSpeedPreset: intensityToSpeedPreset(intensity),
        directionRate: freq >= 8 ? 'high' : freq <= 3 ? 'low' : 'moderate',
        patternRate: freq >= 8 ? 'high' : freq <= 3 ? 'low' : 'moderate',
        colourChangeFrequency: freq >= 8 ? 'high' : freq <= 3 ? 'low' : 'medium',
        trajectories: trajs,
      };
    }
  }
}

export function modeTooltip(mode: TaxationMode): string {
  switch (mode) {
    case 'standard':
      return 'Predictable bilateral visual tracking with no additional visual taxation.';
    case 'variable-speed':
      return 'Introduces unpredictability while preserving bilateral visual tracking, increasing attentional demand.';
    case 'direction-shift':
      return 'Direction Shift introduces occasional unexpected reversals during visual tracking, requiring continual attentional reorientation and increasing visuospatial working-memory demand. Primary clinical stage: Phase 4 — Desensitisation.';
    case 'colour-shift':
      return 'Adds a visual discrimination task that can be combined with therapist-directed colour naming.';
    case 'random-colour':
      return 'Combines eye tracking with an additional colour-recognition and verbal-response task.';
    case 'pattern-switch':
      return 'Pattern Switch periodically changes the visual trajectory, increasing visuospatial tracking demands while the target memory remains activated. Primary clinical stage: Phase 4 — Desensitisation.';
    case 'chaos':
      return 'Combines bounded variations in stimulus movement, colour, speed and/or trajectory to increase attentional demand and reduce predictability. Primary stage: Phase 4 — Desensitisation.';
    case 'custom':
      return 'Clinician-built combination of visual working-memory taxation options. Intensity and change frequency control the engine independently.';
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
  if (config.mode === 'pattern-switch') {
    if (config.patternSwitchRate === 'high' || config.patternSwitchRate === 'random') {
      return { patternSwitchRate: 'moderate' };
    }
    if (config.patternSwitchRate === 'moderate') return { patternSwitchRate: 'low' };
    return { mode: 'variable-speed', variableSpeedPreset: 'medium' };
  }
  if (config.mode === 'direction-shift') {
    if (config.directionShiftRate === 'high') return { directionShiftRate: 'moderate' };
    if (config.directionShiftRate === 'moderate') return { directionShiftRate: 'low' };
    return { mode: 'standard' };
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
    return { mode: 'direction-shift', directionShiftRate: 'moderate' };
  }
  if (config.mode === 'direction-shift') {
    if (config.directionShiftRate === 'low') return { directionShiftRate: 'moderate' };
    if (config.directionShiftRate === 'moderate') return { directionShiftRate: 'high' };
    return { mode: 'pattern-switch', patternSwitchRate: 'moderate' };
  }
  if (config.mode === 'pattern-switch') {
    if (config.patternSwitchRate === 'low') return { patternSwitchRate: 'moderate' };
    if (config.patternSwitchRate === 'moderate') return { patternSwitchRate: 'high' };
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
  if (patch.directionShiftRate !== undefined) {
    out.taxationDirectionShiftRate = patch.directionShiftRate;
  }
  if (patch.patternSwitchRate !== undefined) {
    out.taxationPatternSwitchRate = patch.patternSwitchRate;
  }
  if (patch.enabledTrajectories !== undefined) {
    out.taxationEnabledTrajectories = patch.enabledTrajectories;
  }
  if (patch.chaosLevel !== undefined) out.taxationChaosLevel = patch.chaosLevel;
  if (patch.customToggles !== undefined) out.taxationCustomToggles = patch.customToggles;
  if (patch.customIntensity !== undefined) out.taxationCustomIntensity = patch.customIntensity;
  if (patch.customChangeFrequency !== undefined) {
    out.taxationCustomChangeFrequency = patch.customChangeFrequency;
  }
  if (patch.reduceVisualVariation !== undefined) {
    out.taxationReduceVisualVariation = patch.reduceVisualVariation;
  }
  if (patch.disableColourTaxation !== undefined) {
    out.taxationDisableColour = patch.disableColourTaxation;
  }
  if (patch.seed !== undefined) out.taxationSeed = patch.seed;
  return out;
}

export function shouldUseMotionRuntime(config: TaxationConfig): boolean {
  return config.mode !== 'standard';
}
