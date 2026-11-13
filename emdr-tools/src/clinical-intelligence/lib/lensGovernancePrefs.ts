/** Browser-only therapist preferences for clinical reasoning defaults. */

export type TherapistDefaultReasoning =
  | 'use-client-primary'
  | 'integrated'
  | 'core-only';

const PREF_KEY = 'pathfinder.defaultReasoningMode';

type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function getTherapistDefaultReasoningMode(): TherapistDefaultReasoning {
  try {
    const store = (globalThis as { localStorage?: BrowserStorage }).localStorage;
    if (!store) return 'use-client-primary';
    const v = store.getItem(PREF_KEY);
    if (v === 'integrated' || v === 'core-only' || v === 'use-client-primary') return v;
  } catch {
    /* ignore */
  }
  return 'use-client-primary';
}

export function setTherapistDefaultReasoningMode(mode: TherapistDefaultReasoning): void {
  try {
    const store = (globalThis as { localStorage?: BrowserStorage }).localStorage;
    if (!store) return;
    store.setItem(PREF_KEY, mode);
  } catch {
    /* ignore */
  }
}
