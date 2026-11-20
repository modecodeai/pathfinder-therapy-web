import { createDefaultRoomState, type RoomState } from '../../types/room';
import {
  addSavedPreset,
  allBlsPresets,
  applySavedPreset,
  deleteSavedPreset,
  loadSavedPresets,
  type SavedBLSPreset,
} from '../../emdr/bls/persistence';

/** Legacy Preset shape used by older Studio code */
export interface Preset {
  id: string;
  name: string;
  builtIn?: boolean;
  state: Partial<RoomState>;
}

function toLegacy(p: SavedBLSPreset): Preset {
  return { id: p.id, name: p.name, builtIn: p.builtIn, state: p.configuration };
}

export const BUILT_IN_PRESETS: Preset[] = allBlsPresets()
  .filter((p) => p.builtIn)
  .map(toLegacy);

export function loadCustomPresets(): Preset[] {
  return loadSavedPresets().map(toLegacy);
}

export function addCustomPreset(name: string, state: RoomState): Preset[] {
  addSavedPreset(name, state);
  return loadCustomPresets();
}

export function deleteCustomPreset(id: string): Preset[] {
  deleteSavedPreset(id);
  return loadCustomPresets();
}

export function applyPreset(preset: Preset, current: RoomState): RoomState {
  return applySavedPreset(
    {
      id: preset.id,
      name: preset.name,
      builtIn: preset.builtIn,
      configuration: preset.state,
      updatedAt: new Date().toISOString(),
    },
    current,
  );
}

export function allPresets(): Preset[] {
  return allBlsPresets().map(toLegacy);
}

export { createDefaultRoomState };
