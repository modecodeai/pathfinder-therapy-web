/**
 * Canonical BLS configuration — shared by Studio, Session Companion, and Remote.
 * RoomState remains the runtime wire format (config + running/paused/sequence).
 */

import type { BLSTrajectory, MidlineDirection } from '../types/emdr';
import {
  createDefaultRoomState,
  cycleMsToHz,
  cycleMsToSpeed01,
  presetCycleMs,
  withSpeed01,
  type AudioSound,
  type RoomState,
  type SetMode,
} from '../../types/room';
import type { PhasePreset } from '../config/phasePresets';

export type VerticalPositionLabel = 'top' | 'centre' | 'bottom';

export interface BLSConfiguration {
  modality: {
    visual: boolean;
    audio: boolean;
  };
  trajectory: BLSTrajectory;
  stimulus: {
    colour: string;
    size: number;
    travelWidth: number;
    verticalPosition: VerticalPositionLabel;
  };
  background: {
    colour: string;
  };
  timing: {
    speed01: number;
    mode: 'passes' | 'time' | 'continuous' | 'manual';
    passes?: number;
    durationSeconds?: number;
  };
  audio: {
    enabled: boolean;
    soundId: AudioSound;
    volume: number;
    therapistMuted: boolean;
    syncWithVisual: boolean;
    audioOnly: boolean;
  };
  infinity: {
    midlineDirection: MidlineDirection;
  };
}

/** Appearance fields that phase timing presets must not overwrite */
export type BlsAppearancePatch = Pick<
  RoomState,
  | 'stimulusColour'
  | 'backgroundColour'
  | 'stimulusSize'
  | 'travelWidth'
  | 'verticalPosition'
  | 'visualEnabled'
  | 'audioEnabled'
  | 'audioSound'
  | 'audioVolume'
  | 'muteTherapistAudio'
  | 'syncAudioWithVisual'
  | 'audioOnly'
>;

export function verticalPositionToLabel(v: number): VerticalPositionLabel {
  if (v <= 0.3) return 'top';
  if (v >= 0.7) return 'bottom';
  return 'centre';
}

export function verticalLabelToNumber(label: VerticalPositionLabel): number {
  if (label === 'top') return 0.15;
  if (label === 'bottom') return 0.85;
  return 0.5;
}

export function roomStateToConfig(state: RoomState): BLSConfiguration {
  const mode: BLSConfiguration['timing']['mode'] =
    state.continuous || state.setMode === 'continuous'
      ? 'continuous'
      : state.setMode === 'timed'
        ? 'time'
        : state.setMode === 'manual'
          ? 'manual'
          : 'passes';

  return {
    modality: {
      visual: state.visualEnabled && !state.audioOnly,
      audio: state.audioEnabled,
    },
    trajectory: state.visualMode,
    stimulus: {
      colour: state.stimulusColour,
      size: state.stimulusSize,
      travelWidth: state.travelWidth,
      verticalPosition: verticalPositionToLabel(state.verticalPosition),
    },
    background: { colour: state.backgroundColour },
    timing: {
      speed01: state.speed01,
      mode,
      passes: state.targetPasses,
      durationSeconds: state.targetSeconds,
    },
    audio: {
      enabled: state.audioEnabled,
      soundId: state.audioSound,
      volume: state.audioVolume,
      therapistMuted: state.muteTherapistAudio,
      syncWithVisual: state.syncAudioWithVisual,
      audioOnly: state.audioOnly,
    },
    infinity: { midlineDirection: state.midlineDirection },
  };
}

export function configToRoomPatch(config: BLSConfiguration): Partial<RoomState> {
  const setMode: SetMode =
    config.timing.mode === 'continuous'
      ? 'continuous'
      : config.timing.mode === 'time'
        ? 'timed'
        : config.timing.mode === 'manual'
          ? 'manual'
          : 'passes';

  const speed = withSpeed01(createDefaultRoomState(), config.timing.speed01);

  return {
    visualEnabled: config.modality.visual || (!config.audio.audioOnly && config.modality.visual),
    audioEnabled: config.audio.enabled,
    audioOnly: config.audio.audioOnly,
    visualMode: config.trajectory,
    ...speed,
    stimulusColour: config.stimulus.colour,
    backgroundColour: config.background.colour,
    stimulusSize: config.stimulus.size,
    travelWidth: config.stimulus.travelWidth,
    verticalPosition: verticalLabelToNumber(config.stimulus.verticalPosition),
    midlineDirection: config.infinity.midlineDirection,
    setMode,
    continuous: config.timing.mode === 'continuous',
    targetPasses: config.timing.passes,
    targetSeconds: config.timing.durationSeconds,
    audioSound: config.audio.soundId,
    audioVolume: config.audio.volume,
    muteTherapistAudio: config.audio.therapistMuted,
    syncAudioWithVisual: config.audio.syncWithVisual,
  };
}

export function extractAppearance(state: RoomState): BlsAppearancePatch {
  return {
    stimulusColour: state.stimulusColour,
    backgroundColour: state.backgroundColour,
    stimulusSize: state.stimulusSize,
    travelWidth: state.travelWidth,
    verticalPosition: state.verticalPosition,
    visualEnabled: state.visualEnabled,
    audioEnabled: state.audioEnabled,
    audioSound: state.audioSound,
    audioVolume: state.audioVolume,
    muteTherapistAudio: state.muteTherapistAudio,
    syncAudioWithVisual: state.syncAudioWithVisual,
    audioOnly: state.audioOnly,
  };
}

/**
 * Phase presets apply timing (and trajectory only when clinically required, e.g. Infinity closure).
 * Appearance from therapist preference is always preserved.
 */
export function phaseTimingPatch(
  preset: PhasePreset,
  current: RoomState,
  opts?: { forceTrajectory?: boolean },
): Partial<RoomState> {
  const cycle = presetCycleMs(preset.speedPreset);
  const speed01 = cycleMsToSpeed01(cycle);
  const appearance = extractAppearance(current);

  const changeTrajectory =
    opts?.forceTrajectory ||
    preset.trajectory === 'infinity' ||
    preset.mode === 'de-arousal';

  const continuous = !!preset.continuous;
  const setMode: SetMode = continuous
    ? 'continuous'
    : preset.durationSeconds
      ? 'timed'
      : preset.passes
        ? 'passes'
        : current.setMode;

  return {
    ...appearance,
    visualMode: changeTrajectory ? preset.trajectory : current.visualMode,
    speed01,
    cycleDurationMs: cycle,
    speedHz: cycleMsToHz(cycle),
    setMode,
    continuous,
    targetPasses: preset.passes ?? current.targetPasses,
    targetSeconds: preset.durationSeconds ?? current.targetSeconds,
    visualEnabled: preset.blsActive ? true : appearance.visualEnabled,
    running: false,
    paused: false,
  };
}

export function createSystemDefaultRoomState(): RoomState {
  return createDefaultRoomState();
}

/** Safe live edits while BLS is running */
export const LIVE_SAFE_KEYS: (keyof RoomState)[] = [
  'speed01',
  'cycleDurationMs',
  'speedHz',
  'stimulusColour',
  'backgroundColour',
  'stimulusSize',
  'travelWidth',
  'verticalPosition',
  'audioVolume',
  'muteTherapistAudio',
  'audioSound',
  'audioEnabled',
];

export function isLiveSafeKey(key: keyof RoomState): boolean {
  return LIVE_SAFE_KEYS.includes(key);
}
