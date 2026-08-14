import type { SetMode } from './types';

export interface SetControllerOptions {
  getMode: () => SetMode;
  getPassesTarget: () => number;
  getTimedSeconds: () => number;
  getElapsedMs: () => number;
  getPasses: () => number;
  onSetComplete: () => void;
}

/**
 * Decides when a bilateral set should auto-stop (passes or timed).
 */
export class SetController {
  private opts: SetControllerOptions;
  private completed = false;

  constructor(opts: SetControllerOptions) {
    this.opts = opts;
  }

  reset(): void {
    this.completed = false;
  }

  /** Call after pass increments or on timer ticks */
  check(): void {
    if (this.completed) return;
    const mode = this.opts.getMode();
    if (mode === 'manual') return;

    if (mode === 'passes') {
      if (this.opts.getPasses() >= this.opts.getPassesTarget()) {
        this.completed = true;
        this.opts.onSetComplete();
      }
      return;
    }

    if (mode === 'timed') {
      if (this.opts.getElapsedMs() >= this.opts.getTimedSeconds() * 1000) {
        this.completed = true;
        this.opts.onSetComplete();
      }
    }
  }
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
