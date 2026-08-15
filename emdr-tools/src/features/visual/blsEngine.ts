import type { BLSTrajectory, MidlineDirection } from '../../emdr/types/emdr';
import {
  cycleProgressFromElapsed,
  getTrajectoryPosition,
  passesFromCycleProgress,
} from '../../emdr/engine/trajectoryEngine';
import type { Side } from '../../types/room';

export interface BlsFrame {
  x: number;
  y: number;
  side: Side;
  visible: boolean;
}

export interface BlsEngineOptions {
  canvas: HTMLCanvasElement;
  /** Duration of one full pass (L→R→L) in ms */
  getCycleDurationMs: () => number;
  getTrajectory: () => BLSTrajectory;
  getColour: () => string;
  getBackground: () => string;
  getSizePx: () => number;
  getTravelWidth: () => number;
  getVerticalPosition: () => number;
  getVisualEnabled: () => boolean;
  getMidline?: () => MidlineDirection;
  getElapsedMs: () => number;
  isAnimating: () => boolean;
  /**
   * Optional: remap wall-clock elapsed → effective elapsed for variable-speed taxation.
   * When omitted or returning the same value, Standard behaviour is unchanged.
   */
  mapElapsedMs?: (wallElapsedMs: number) => number;
  /** Optional colour override (colour taxation). Falls back to getColour(). */
  getEffectiveColour?: () => string;
  /** Fires once per completed full pass (back-and-forth) */
  onPass?: (completedPasses: number) => void;
  /** Side cue for audio — approx half-pass */
  onSide?: (side: Side) => void;
  /** Fires when taxation colour changes (clinician prompt — not drawn on canvas) */
  onColourChange?: (colour: string, passFloor: number) => void;
}

/**
 * Canvas BLS via requestAnimationFrame.
 * One pass = one complete back-and-forth (LEFT→RIGHT→LEFT).
 */
export class BlsEngine {
  private raf = 0;
  private started = false;
  private lastPassFloor = 0;
  private lastSide: Side | null = null;
  private lastColourKey: string | null = null;
  private readonly opts: BlsEngineOptions;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(opts: BlsEngineOptions) {
    this.opts = opts;
    const ctx = opts.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
  }

  startLoop(): void {
    if (this.started) return;
    this.started = true;
    this.resize();
    const loop = () => {
      this.tick();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    this.started = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.drawIdle();
  }

  resetSideTracking(): void {
    this.lastPassFloor = 0;
    this.lastSide = null;
    this.lastColourKey = null;
  }

  resize(): void {
    const canvas = this.opts.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  private tick(): void {
    this.resize();
    if (!this.opts.isAnimating()) {
      this.drawIdle();
      return;
    }

    const cycleDur = this.opts.getCycleDurationMs();
    const wallElapsed = this.opts.getElapsedMs();
    const elapsed = this.opts.mapElapsedMs
      ? this.opts.mapElapsedMs(wallElapsed)
      : wallElapsed;
    const cycleProgress = cycleProgressFromElapsed(elapsed, cycleDur);
    const passFloor = passesFromCycleProgress(cycleProgress);
    const frac = cycleProgress - passFloor;

    if (passFloor > this.lastPassFloor) {
      this.lastPassFloor = passFloor;
      this.opts.onPass?.(passFloor);
    }

    // Audio side cue: first half → R, second half → L (approx)
    const side: Side = frac < 0.5 ? 'R' : 'L';
    if (this.lastSide !== side) {
      this.lastSide = side;
      this.opts.onSide?.(side);
    }

    const colour = this.opts.getEffectiveColour?.() ?? this.opts.getColour();
    if (this.lastColourKey !== colour) {
      const prev = this.lastColourKey;
      this.lastColourKey = colour;
      if (prev != null) this.opts.onColourChange?.(colour, passFloor);
    }

    const traj = this.opts.getTrajectory();
    const pt = getTrajectoryPosition(frac, traj, {
      travelWidth: this.opts.getTravelWidth(),
      verticalPosition: this.opts.getVerticalPosition(),
      midline: this.opts.getMidline?.() ?? 'up',
    });

    const frame: BlsFrame = {
      x: pt.x * this.opts.canvas.width,
      y: pt.y * this.opts.canvas.height,
      side,
      visible: this.opts.getVisualEnabled(),
    };
    this.paint(frame, colour);
  }

  private paint(frame: BlsFrame, colour: string): void {
    const { canvas, ctx } = { canvas: this.opts.canvas, ctx: this.ctx };
    ctx.fillStyle = this.opts.getBackground();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!frame.visible) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.opts.getSizePx() * dpr;
    ctx.beginPath();
    ctx.fillStyle = colour;
    ctx.arc(frame.x, frame.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawIdle(): void {
    const canvas = this.opts.canvas;
    this.ctx.fillStyle = this.opts.getBackground();
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!this.opts.getVisualEnabled()) return;

    // After a set (or while stopped), always rest the stimulus at centre —
    // not at the trajectory start (typically the left edge).
    const x = 0.5;
    const y = this.opts.getVerticalPosition();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.opts.getSizePx() * dpr;
    this.ctx.beginPath();
    this.ctx.fillStyle = this.opts.getEffectiveColour?.() ?? this.opts.getColour();
    this.ctx.arc(x * canvas.width, y * canvas.height, r, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

// Re-export helpers used by tests / audio-only
export { easeInOutSine } from '../../emdr/engine/trajectoryEngine';

export function passesFromElapsed(elapsedMs: number, cycleDurationMs: number): number {
  return passesFromCycleProgress(cycleProgressFromElapsed(elapsedMs, cycleDurationMs));
}

export function sideFromElapsed(elapsedMs: number, cycleDurationMs: number): Side {
  const frac = cycleProgressFromElapsed(elapsedMs, cycleDurationMs) % 1;
  return frac < 0.5 ? 'R' : 'L';
}
