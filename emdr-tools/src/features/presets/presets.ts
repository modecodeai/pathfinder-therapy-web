import {
  addCustomPreset,
  allPresets,
  applyPreset,
  deleteCustomPreset,
  type Preset,
} from './presetsLegacy';
import {
  addSavedPreset,
  allBlsPresets,
  applySavedPreset,
  deleteSavedPreset,
  type SavedBLSPreset,
} from '../../emdr/bls/persistence';
import type { RoomState } from '../../types/room';

/** @deprecated Prefer SavedBLSPreset — kept for ToolsPage migration */
export type { Preset };
export {
  addCustomPreset,
  allPresets,
  applyPreset,
  deleteCustomPreset,
};

export function saveCurrentAsPreset(name: string, state: RoomState): SavedBLSPreset[] {
  addSavedPreset(name, state);
  return allBlsPresets().filter((p) => !p.builtIn);
}

export {
  addSavedPreset,
  allBlsPresets,
  applySavedPreset,
  deleteSavedPreset,
  type SavedBLSPreset,
};
