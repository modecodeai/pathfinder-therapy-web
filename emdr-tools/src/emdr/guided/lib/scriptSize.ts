import type { ScriptSize } from '../types/guidedScript';

const KEY = 'pathfinder.emdr.scriptSize';

export function loadScriptSize(): ScriptSize {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'small' || v === 'medium' || v === 'large' || v === 'xl') return v;
  } catch {
    /* ignore */
  }
  return 'medium';
}

export function saveScriptSize(size: ScriptSize): void {
  try {
    localStorage.setItem(KEY, size);
  } catch {
    /* ignore */
  }
}
