/**
 * Therapist BLS defaults, Studio→Session handoff, and saved presets.
 * Clinical session data stays in companion sessionStorage separately.
 */

import {
  createDefaultRoomState,
  withSpeed01,
  type RoomState,
} from '../../types/room';
import { extractAppearance } from './config';

const DEFAULT_KEY = 'pf-emdr-therapist-default-bls-v1';
const HANDOFF_KEY = 'pf-emdr-session-handoff-v1';
const PRESETS_KEY = 'pf-emdr-custom-presets-v1';

export interface SavedBLSPreset {
  id: string;
  name: string;
  builtIn?: boolean;
  /** Full configuration snapshot (RoomState fields minus runtime) */
  configuration: Partial<RoomState>;
  updatedAt: string;
}

function stripRuntime(state: RoomState): Partial<RoomState> {
  const {
    running: _r,
    paused: _p,
    sequence: _s,
    ...rest
  } = state;
  void _r;
  void _p;
  void _s;
  return { ...rest };
}

function hydratePartial(partial: Partial<RoomState>): RoomState {
  const base = createDefaultRoomState();
  let next: RoomState = { ...base, ...partial, running: false, paused: false, sequence: 0 };
  if (partial.speed01 !== undefined) {
    next = { ...next, ...withSpeed01(next, partial.speed01) };
  } else if (partial.cycleDurationMs !== undefined) {
    next = {
      ...next,
      ...withSpeed01(next, (5000 - partial.cycleDurationMs) / (5000 - 550)),
    };
  } else if (partial.speedHz !== undefined) {
    const ms = Math.round(1000 / Math.max(0.05, partial.speedHz));
    next = { ...next, ...withSpeed01(next, (5000 - ms) / (5000 - 550)) };
  }
  return next;
}

export function saveTherapistDefault(state: RoomState): void {
  localStorage.setItem(DEFAULT_KEY, JSON.stringify(stripRuntime(state)));
}

export function loadTherapistDefault(): RoomState | null {
  try {
    const raw = localStorage.getItem(DEFAULT_KEY);
    if (!raw) return null;
    return hydratePartial(JSON.parse(raw) as Partial<RoomState>);
  } catch {
    return null;
  }
}

/** Studio → Session Companion: consume once when opening a new session */
export function handoffToSession(state: RoomState): void {
  sessionStorage.setItem(
    HANDOFF_KEY,
    JSON.stringify({ at: Date.now(), configuration: stripRuntime(state) }),
  );
}

export function consumeSessionHandoff(): RoomState | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(HANDOFF_KEY);
    const parsed = JSON.parse(raw) as { configuration?: Partial<RoomState> };
    if (!parsed.configuration) return null;
    return hydratePartial(parsed.configuration);
  } catch {
    return null;
  }
}

/**
 * Priority when opening EMDR session BLS:
 * 1. resumed companion already has blsConfig in storage (caller handles)
 * 2. Studio handoff
 * 3. therapist default
 * 4. system default
 */
export function resolveInitialBlsState(resumedBls?: Partial<RoomState> | null): RoomState {
  if (resumedBls && Object.keys(resumedBls).length > 0) {
    return hydratePartial(resumedBls);
  }
  const handoff = consumeSessionHandoff();
  if (handoff) return handoff;
  const therapistDefault = loadTherapistDefault();
  if (therapistDefault) return therapistDefault;
  return createDefaultRoomState();
}

export function loadSavedPresets(): SavedBLSPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedBLSPreset[] | Array<{ id: string; name: string; builtIn?: boolean; state: Partial<RoomState> }>;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => {
      if ('configuration' in p && p.configuration) {
        return p as SavedBLSPreset;
      }
      const legacy = p as { id: string; name: string; builtIn?: boolean; state: Partial<RoomState> };
      return {
        id: legacy.id,
        name: legacy.name,
        builtIn: legacy.builtIn,
        configuration: legacy.state,
        updatedAt: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export function saveSavedPresets(presets: SavedBLSPreset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, 40)));
}

export function addSavedPreset(name: string, state: RoomState): SavedBLSPreset[] {
  const list = loadSavedPresets().filter((p) => !p.builtIn);
  list.unshift({
    id: `c_${Date.now().toString(36)}`,
    name: name.trim() || 'Custom',
    configuration: stripRuntime(state),
    updatedAt: new Date().toISOString(),
  });
  saveSavedPresets(list);
  return list;
}

export function updateSavedPreset(id: string, state: RoomState): SavedBLSPreset[] {
  const list = loadSavedPresets().map((p) =>
    p.id === id
      ? { ...p, configuration: stripRuntime(state), updatedAt: new Date().toISOString() }
      : p,
  );
  saveSavedPresets(list.filter((p) => !p.builtIn));
  return loadSavedPresets();
}

export function renameSavedPreset(id: string, name: string): SavedBLSPreset[] {
  const list = loadSavedPresets().map((p) =>
    p.id === id ? { ...p, name: name.trim() || p.name } : p,
  );
  saveSavedPresets(list.filter((p) => !p.builtIn));
  return loadSavedPresets();
}

export function deleteSavedPreset(id: string): SavedBLSPreset[] {
  const next = loadSavedPresets().filter((p) => p.id !== id);
  saveSavedPresets(next);
  return next;
}

export function applySavedPreset(preset: SavedBLSPreset, current: RoomState): RoomState {
  return {
    ...current,
    ...hydratePartial(preset.configuration),
    running: false,
    paused: false,
    sequence: current.sequence,
  };
}

export const SYSTEM_PRESETS: SavedBLSPreset[] = [
  {
    id: 'sys-standard-visual',
    name: 'Standard Visual',
    builtIn: true,
    updatedAt: '2026-08-14',
    configuration: {
      visualEnabled: true,
      audioEnabled: false,
      audioOnly: false,
      visualMode: 'horizontal',
      stimulusColour: '#14B8A6',
      backgroundColour: '#242628',
      stimulusSize: 20,
      travelWidth: 0.9,
      verticalPosition: 0.5,
      ...withSpeed01(createDefaultRoomState(), 0.55),
      setMode: 'passes',
      targetPasses: 30,
      continuous: false,
    },
  },
  {
    id: 'sys-slow-resource',
    name: 'Slow Resource',
    builtIn: true,
    updatedAt: '2026-08-14',
    configuration: {
      visualMode: 'horizontal',
      ...withSpeed01(createDefaultRoomState(), 0.25),
      setMode: 'passes',
      targetPasses: 8,
      continuous: false,
      audioEnabled: false,
    },
  },
  {
    id: 'sys-infinity-closure',
    name: 'Infinity Closure',
    builtIn: true,
    updatedAt: '2026-08-14',
    configuration: {
      visualMode: 'infinity',
      ...withSpeed01(createDefaultRoomState(), 0.05),
      setMode: 'timed',
      targetSeconds: 15,
      continuous: false,
      midlineDirection: 'up',
    },
  },
];

export function allBlsPresets(): SavedBLSPreset[] {
  return [...SYSTEM_PRESETS, ...loadSavedPresets()];
}

/** Merge appearance from therapist default onto a room state */
export function applyTherapistAppearance(state: RoomState): RoomState {
  const d = loadTherapistDefault();
  if (!d) return state;
  return { ...state, ...extractAppearance(d) };
}
