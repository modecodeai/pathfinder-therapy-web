/** Operational BLS state — remote sync + studio. Clinical notes live in companion only. */

import type { BLSTrajectory, MidlineDirection } from '../emdr/types/emdr';
import { SPEED_PRESETS } from '../emdr/types/emdr';
import {
  createDefaultTaxationConfig,
  type ColourChangeFrequency,
  type ColourShiftInterval,
  type ChaosLevel,
  type CustomTaxationToggles,
  type DirectionShiftRate,
  type PatternSwitchRate,
  type TaxationMode,
  type TaxationTrajectory,
  type VariableSpeedPreset,
} from '../emdr/types/emdrTaxation';

export type VisualMode = BLSTrajectory;
export type SetMode = 'manual' | 'passes' | 'timed' | 'continuous';
export type AudioSound = 'soft-click' | 'soft-tone' | 'pulse';
export type SessionMode = 'in-person' | 'remote';
export type Side = 'L' | 'R';

export interface RoomState {
  visualEnabled: boolean;
  audioEnabled: boolean;
  visualMode: VisualMode;
  /**
   * Legacy/remote field: full passes per second.
   * Preferred control is cycleDurationMs / speed01.
   */
  speedHz: number;
  /** Duration of one full pass (L→R→L) in ms */
  cycleDurationMs: number;
  /** 0 = slower, 1 = faster — primary clinical speed UI */
  speed01: number;
  stimulusColour: string;
  backgroundColour: string;
  stimulusSize: number;
  travelWidth: number;
  verticalPosition: number;
  midlineDirection: MidlineDirection;
  running: boolean;
  paused: boolean;
  setMode: SetMode;
  targetPasses?: number;
  targetSeconds?: number;
  continuous: boolean;
  audioSound: AudioSound;
  audioVolume: number;
  audioOnly: boolean;
  syncAudioWithVisual: boolean;
  muteTherapistAudio: boolean;
  sequence: number;
  /** Working Memory Taxation — visual config only (no clinical notes). */
  taxationMode: TaxationMode;
  taxationVariableSpeedPreset: VariableSpeedPreset;
  taxationColourShiftInterval: ColourShiftInterval;
  taxationColourPalette: string[];
  taxationColourChangeFrequency: ColourChangeFrequency;
  taxationColourNamingMode: boolean;
  taxationDirectionShiftRate: DirectionShiftRate;
  taxationPatternSwitchRate: PatternSwitchRate;
  taxationEnabledTrajectories: TaxationTrajectory[];
  taxationChaosLevel: ChaosLevel;
  taxationCustomToggles: CustomTaxationToggles;
  taxationCustomIntensity: number;
  taxationCustomChangeFrequency: number;
  taxationReduceVisualVariation: boolean;
  taxationDisableColour: boolean;
  /** Deterministic seed for taxation randomisation within a set */
  taxationSeed: number;
}

export interface LocalMetrics {
  timeMs: number;
  passes: number;
  sets: number;
}

export const SPEED_MIN_HZ = 0.15;
export const SPEED_MAX_HZ = 1.8;
export const SPEED_STEP_HZ = 0.05;
export const DEFAULT_SPEED_HZ = 0.7;

export const CYCLE_MIN_MS = 550;
export const CYCLE_MAX_MS = 5000;

export const SIZE_MIN = 8;
export const SIZE_MAX = 40;
export const DEFAULT_SIZE = 14;

export const TRAVEL_MIN = 0.3;
export const TRAVEL_MAX = 1;
export const DEFAULT_TRAVEL = 0.85;

export const PASS_PRESETS = [6, 8, 10, 12, 18, 20, 24, 30, 36] as const;
export const TIME_PRESETS = [10, 15, 20, 30, 45, 60] as const;

export const STIMULUS_COLOURS = [
  { id: 'teal', value: '#14B8A6' },
  { id: 'white', value: '#FFFFFF' },
  { id: 'red', value: '#EF4444' },
  { id: 'green', value: '#22C55E' },
  { id: 'yellow', value: '#EAB308' },
  { id: 'orange', value: '#F97316' },
  { id: 'blue', value: '#3B82F6' },
  { id: 'violet', value: '#8B5CF6' },
] as const;

export const BACKGROUND_COLOURS = [
  { id: 'charcoal', value: '#242628' },
  { id: 'black', value: '#000000' },
  { id: 'white', value: '#FFFFFF' },
  { id: 'light-grey', value: '#D1D5DB' },
] as const;

export function speed01ToCycleMs(speed01: number): number {
  const s = Math.min(1, Math.max(0, speed01));
  return Math.round(CYCLE_MAX_MS + (CYCLE_MIN_MS - CYCLE_MAX_MS) * s);
}

export function cycleMsToSpeed01(ms: number): number {
  const clamped = Math.min(CYCLE_MAX_MS, Math.max(CYCLE_MIN_MS, ms));
  return (CYCLE_MAX_MS - clamped) / (CYCLE_MAX_MS - CYCLE_MIN_MS);
}

export function cycleMsToHz(ms: number): number {
  return Number((1000 / Math.max(50, ms)).toFixed(2));
}

export function hzToCycleMs(hz: number): number {
  return Math.round(1000 / Math.max(0.05, hz));
}

export function presetCycleMs(id: string): number {
  const p = SPEED_PRESETS.find((x) => x.id === id);
  return p?.cycleDurationMs ?? 1400;
}

export function createDefaultRoomState(): RoomState {
  const cycleDurationMs = presetCycleMs('moderate');
  const tax = createDefaultTaxationConfig();
  return {
    visualEnabled: true,
    audioEnabled: false,
    visualMode: 'horizontal',
    speedHz: cycleMsToHz(cycleDurationMs),
    cycleDurationMs,
    speed01: cycleMsToSpeed01(cycleDurationMs),
    stimulusColour: '#14B8A6',
    backgroundColour: '#242628',
    stimulusSize: DEFAULT_SIZE,
    travelWidth: DEFAULT_TRAVEL,
    verticalPosition: 0.5,
    midlineDirection: 'up',
    running: false,
    paused: false,
    setMode: 'passes',
    targetPasses: 30,
    targetSeconds: 15,
    continuous: false,
    audioSound: 'soft-click',
    audioVolume: 0.45,
    audioOnly: false,
    syncAudioWithVisual: true,
    muteTherapistAudio: true,
    sequence: 0,
    taxationMode: tax.mode,
    taxationVariableSpeedPreset: tax.variableSpeedPreset,
    taxationColourShiftInterval: tax.colourShiftInterval,
    taxationColourPalette: [...tax.colourPalette],
    taxationColourChangeFrequency: tax.colourChangeFrequency,
    taxationColourNamingMode: tax.colourNamingMode,
    taxationDirectionShiftRate: tax.directionShiftRate,
    taxationPatternSwitchRate: tax.patternSwitchRate,
    taxationEnabledTrajectories: [...tax.enabledTrajectories],
    taxationChaosLevel: tax.chaosLevel,
    taxationCustomToggles: { ...tax.customToggles },
    taxationCustomIntensity: tax.customIntensity,
    taxationCustomChangeFrequency: tax.customChangeFrequency,
    taxationReduceVisualVariation: tax.reduceVisualVariation,
    taxationDisableColour: tax.disableColourTaxation,
    taxationSeed: tax.seed,
  };
}

/** Map RoomState taxation fields → TaxationConfig */
export function roomStateToTaxationConfig(state: RoomState) {
  const base = createDefaultTaxationConfig();
  const dirRaw = state.taxationDirectionShiftRate as string | undefined;
  const directionShiftRate =
    dirRaw === 'rare' || dirRaw === 'low'
      ? 'low'
      : dirRaw === 'frequent' || dirRaw === 'high'
        ? 'high'
        : dirRaw === 'moderate'
          ? 'moderate'
          : base.directionShiftRate;
  const patRaw = state.taxationPatternSwitchRate as string | undefined;
  const patternSwitchRate =
    patRaw === 'every-2-5' || patRaw === 'high'
      ? 'high'
      : patRaw === 'every-5-10' || patRaw === 'moderate'
        ? 'moderate'
        : patRaw === 'low'
          ? 'low'
          : patRaw === 'random'
            ? 'random'
            : base.patternSwitchRate;
  return {
    ...base,
    mode: state.taxationMode ?? 'standard',
    variableSpeedPreset: state.taxationVariableSpeedPreset ?? base.variableSpeedPreset,
    colourShiftInterval: state.taxationColourShiftInterval ?? base.colourShiftInterval,
    colourPalette: state.taxationColourPalette?.length
      ? [...state.taxationColourPalette]
      : [...base.colourPalette],
    colourChangeFrequency:
      state.taxationColourChangeFrequency ?? base.colourChangeFrequency,
    colourNamingMode:
      !!state.taxationColourNamingMode ||
      !!state.taxationCustomToggles?.colourNaming,
    directionShiftRate,
    patternSwitchRate,
    enabledTrajectories: state.taxationEnabledTrajectories?.length
      ? [...state.taxationEnabledTrajectories]
      : [...base.enabledTrajectories],
    chaosLevel: state.taxationChaosLevel ?? 1,
    customToggles: { ...base.customToggles, ...(state.taxationCustomToggles ?? {}) },
    customIntensity: state.taxationCustomIntensity ?? base.customIntensity,
    customChangeFrequency:
      state.taxationCustomChangeFrequency ?? base.customChangeFrequency,
    reduceVisualVariation: !!state.taxationReduceVisualVariation,
    disableColourTaxation: !!state.taxationDisableColour,
    seed: state.taxationSeed || 1,
  };
}

export function createEmptyMetrics(): LocalMetrics {
  return { timeMs: 0, passes: 0, sets: 0 };
}

export function clampSpeed(hz: number): number {
  const stepped = Math.round(hz / SPEED_STEP_HZ) * SPEED_STEP_HZ;
  return Math.min(SPEED_MAX_HZ, Math.max(SPEED_MIN_HZ, Number(stepped.toFixed(2))));
}

export function clampSize(px: number): number {
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(px)));
}

export function clampTravel(t: number): number {
  return Math.min(TRAVEL_MAX, Math.max(TRAVEL_MIN, Number(t.toFixed(2))));
}

/** Apply speed01 and keep hz/cycle in sync */
export function withSpeed01(_state: RoomState, speed01: number): Partial<RoomState> {
  const cycleDurationMs = speed01ToCycleMs(speed01);
  return {
    speed01,
    cycleDurationMs,
    speedHz: cycleMsToHz(cycleDurationMs),
  };
}
