import { useEffect } from 'react';

interface Options {
  enabled?: boolean;
  blsRunning: boolean;
  onToggleBls: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onRecord?: () => void;
  onRecordSud?: () => void;
  onRecordVoc?: () => void;
  onEmergencyStop: () => void;
}

/**
 * Optional keyboard shortcuts for guided practice.
 * Never mandatory — buttons remain available.
 * Skips when focus is in an input/textarea/select/contenteditable.
 */
export function useGuidedKeyboard({
  enabled = true,
  blsRunning,
  onToggleBls,
  onNext,
  onPrev,
  onRecord,
  onRecordSud,
  onRecordVoc,
  onEmergencyStop,
}: Options): void {
  useEffect(() => {
    if (!enabled) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable;

      if (e.key === 'Escape') {
        e.preventDefault();
        onEmergencyStop();
        return;
      }

      if (editing) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        onToggleBls();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext?.();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev?.();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRecord?.();
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onRecordSud?.();
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        onRecordVoc?.();
        return;
      }

      void blsRunning;
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    enabled,
    blsRunning,
    onToggleBls,
    onNext,
    onPrev,
    onRecord,
    onRecordSud,
    onRecordVoc,
    onEmergencyStop,
  ]);
}
