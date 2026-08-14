import type { SessionSnapshot } from './types';
import { createDefaultSnapshot } from './types';

const KEY = 'pathfinder-emdr-presets-v1';

export interface Preset {
  id: string;
  name: string;
  createdAt: number;
  snapshot: Pick<SessionSnapshot, 'speedHz' | 'visual' | 'audio' | 'set'>;
}

export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Preset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]): void {
  localStorage.setItem(KEY, JSON.stringify(presets.slice(0, 24)));
}

export function upsertPreset(name: string, snapshot: SessionSnapshot): Preset[] {
  const presets = loadPresets();
  const id = `p_${Date.now().toString(36)}`;
  presets.unshift({
    id,
    name: name.trim() || 'Untitled preset',
    createdAt: Date.now(),
    snapshot: {
      speedHz: snapshot.speedHz,
      visual: { ...snapshot.visual },
      audio: { ...snapshot.audio },
      set: { ...snapshot.set },
    },
  });
  savePresets(presets);
  return presets;
}

export function deletePreset(id: string): Preset[] {
  const next = loadPresets().filter((p) => p.id !== id);
  savePresets(next);
  return next;
}

export function applyPreset(preset: Preset, current: SessionSnapshot): SessionSnapshot {
  return {
    ...current,
    speedHz: preset.snapshot.speedHz,
    visual: { ...preset.snapshot.visual },
    audio: { ...preset.snapshot.audio },
    set: { ...preset.snapshot.set },
  };
}

export function emptyWorkingSnapshot(): SessionSnapshot {
  return createDefaultSnapshot();
}
