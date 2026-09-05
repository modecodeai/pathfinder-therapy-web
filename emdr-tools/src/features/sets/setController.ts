import type { SetMode } from '../../types/room';

export interface SetControllerOptions {
  getMode: () => SetMode;
  getTargetPasses: () => number;
  getTargetSeconds: () => number;
  getElapsedMs: () => number;
  getPasses: () => number;
  onComplete: () => void;
}

export class SetController {
  private completed = false;
  private readonly opts: SetControllerOptions;

  constructor(opts: SetControllerOptions) {
    this.opts = opts;
  }

  reset(): void {
    this.completed = false;
  }

  check(): boolean {
    if (this.completed) return true;
    const mode = this.opts.getMode();
    if (mode === 'manual' || mode === 'continuous') return false;

    if (mode === 'passes') {
      if (this.opts.getPasses() >= this.opts.getTargetPasses()) {
        this.completed = true;
        this.opts.onComplete();
        return true;
      }
      return false;
    }

    if (mode === 'timed') {
      if (this.opts.getElapsedMs() >= this.opts.getTargetSeconds() * 1000) {
        this.completed = true;
        this.opts.onComplete();
        return true;
      }
    }
    return false;
  }
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Elapsed clock helpers for pause/resume tests */
export function computeElapsed(
  accumulatedMs: number,
  runningSince: number | null,
  now: number,
  paused: boolean,
): number {
  if (paused || runningSince === null) return accumulatedMs;
  return accumulatedMs + Math.max(0, now - runningSince);
}
