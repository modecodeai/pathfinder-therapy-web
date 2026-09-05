import { createDefaultRoomState, type RoomState } from '../../types/room';

export interface Preset {
  id: string;
  name: string;
  builtIn?: boolean;
  state: Partial<RoomState>;
}

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'standard',
    name: 'Standard',
    builtIn: true,
    state: {
      visualEnabled: true,
      audioEnabled: false,
      audioOnly: false,
      visualMode: 'horizontal',
      speedHz: 1.4,
      travelWidth: 0.85,
      setMode: 'passes',
      targetPasses: 24,
    },
  },
  {
    id: 'slow-bilateral',
    name: 'Slow Bilateral',
    builtIn: true,
    state: {
      visualEnabled: true,
      audioEnabled: false,
      audioOnly: false,
      visualMode: 'horizontal',
      speedHz: 0.7,
      travelWidth: 0.75,
      setMode: 'manual',
    },
  },
  {
    id: 'auditory',
    name: 'Auditory',
    builtIn: true,
    state: {
      visualEnabled: false,
      audioEnabled: true,
      audioOnly: true,
      speedHz: 1.2,
      setMode: 'manual',
      muteTherapistAudio: false,
    },
  },
];

const CUSTOM_KEY = 'pf-emdr-custom-presets-v1';

export function loadCustomPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Preset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: Preset[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(presets.slice(0, 20)));
}

export function addCustomPreset(name: string, state: RoomState): Preset[] {
  const list = loadCustomPresets();
  list.unshift({
    id: `c_${Date.now().toString(36)}`,
    name: name.trim() || 'Custom',
    state: {
      visualEnabled: state.visualEnabled,
      audioEnabled: state.audioEnabled,
      visualMode: state.visualMode,
      speedHz: state.speedHz,
      stimulusColour: state.stimulusColour,
      backgroundColour: state.backgroundColour,
      stimulusSize: state.stimulusSize,
      travelWidth: state.travelWidth,
      verticalPosition: state.verticalPosition,
      setMode: state.setMode,
      targetPasses: state.targetPasses,
      targetSeconds: state.targetSeconds,
      audioSound: state.audioSound,
      audioVolume: state.audioVolume,
      audioOnly: state.audioOnly,
      syncAudioWithVisual: state.syncAudioWithVisual,
      muteTherapistAudio: state.muteTherapistAudio,
    },
  });
  saveCustomPresets(list);
  return list;
}

export function deleteCustomPreset(id: string): Preset[] {
  const next = loadCustomPresets().filter((p) => p.id !== id);
  saveCustomPresets(next);
  return next;
}

export function applyPreset(preset: Preset, current: RoomState): RoomState {
  return {
    ...current,
    ...preset.state,
    running: false,
    paused: false,
    sequence: current.sequence,
  };
}

export function allPresets(): Preset[] {
  return [...BUILT_IN_PRESETS, ...loadCustomPresets()];
}

export { createDefaultRoomState };
