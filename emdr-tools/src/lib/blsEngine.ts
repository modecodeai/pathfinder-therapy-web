import type { BlsMode, Side, VerticalPosition } from './types';

export interface BlsFrame {
  x: number;
  y: number;
  side: Side;
  /** 0–1 progress within the current half-cycle */
  t: number;
  visible: boolean;
}

export interface BlsEngineOptions {
  canvas: HTMLCanvasElement;
  getSpeedHz: () => number;
  getMode: () => BlsMode;
  getColor: () => string;
  getBackground: () => string;
  getSize: () => number;
  getTravelWidth: () => number;
  getVerticalPosition: () => VerticalPosition;
  getEnabled: () => boolean;
  /** Phase origin in performance.now() space when running */
  getPhaseOriginMs: () => number;
  isRunning: () => boolean;
  isPaused: () => boolean;
  onSideChange?: (side: Side, passCompleted: boolean) => void;
  onFrame?: (frame: BlsFrame) => void;
}

/**
 * Canvas bilateral stimulation driven by requestAnimationFrame.
 * Position is computed from wall-clock phase — not React state.
 */
export class BlsEngine {
  private raf = 0;
  private lastSide: Side = 'L';
  private started = false;
  private readonly opts: BlsEngineOptions;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(opts: BlsEngineOptions) {
    this.opts = opts;
    const ctx = opts.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.resize();
    const loop = () => {
      this.tick();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.started = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.drawIdle();
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
    const running = this.opts.isRunning() && !this.opts.isPaused();
    if (!running || !this.opts.getEnabled()) {
      this.drawIdle(running);
      return;
    }

    const hz = Math.max(0.05, this.opts.getSpeedHz());
    const now = performance.now();
    const origin = this.opts.getPhaseOriginMs() || now;
    const elapsedSec = Math.max(0, (now - origin) / 1000);
    // One full L→R→L cycle = 1 / hz seconds (two half-passes)
    const cycle = elapsedSec * hz;
    const half = cycle % 1; // 0..1 within full round trip
    const goingRight = half < 0.5;
    const t = goingRight ? half * 2 : (half - 0.5) * 2;
    const side: Side = goingRight ? 'R' : 'L';
    const passCompleted = side !== this.lastSide && side === 'L';
    if (side !== this.lastSide) {
      this.opts.onSideChange?.(side, passCompleted);
      this.lastSide = side;
    }

    const frame = this.computeFrame(side, goingRight ? t : 1 - t, true);
    this.opts.onFrame?.(frame);
    this.paint(frame);
  }

  private computeFrame(side: Side, linearT: number, visible: boolean): BlsFrame {
    const mode = this.opts.getMode();
    const travel = Math.min(1, Math.max(0.25, this.opts.getTravelWidth()));
    const ease = easeInOutSine(linearT);
    const canvas = this.opts.canvas;
    const w = canvas.width;
    const h = canvas.height;
    const marginX = ((1 - travel) / 2) * w;
    const marginY = ((1 - travel) / 2) * h;
    const yBase = verticalY(this.opts.getVerticalPosition(), h, marginY);

    let x = w / 2;
    let y = yBase;
    let show = visible;

    if (mode === 'blink') {
      x = side === 'L' ? marginX : w - marginX;
      y = yBase;
      show = true;
    } else if (mode === 'horizontal') {
      const goingRight = side === 'R';
      const p = goingRight ? ease : 1 - ease;
      x = marginX + p * (w - 2 * marginX);
      y = yBase;
    } else if (mode === 'vertical') {
      x = w / 2;
      const goingDown = side === 'R';
      const p = goingDown ? ease : 1 - ease;
      y = marginY + p * (h - 2 * marginY);
    } else if (mode === 'diagonal-up') {
      const goingRight = side === 'R';
      const p = goingRight ? ease : 1 - ease;
      x = marginX + p * (w - 2 * marginX);
      y = h - marginY - p * (h - 2 * marginY);
    } else {
      // diagonal-down
      const goingRight = side === 'R';
      const p = goingRight ? ease : 1 - ease;
      x = marginX + p * (w - 2 * marginX);
      y = marginY + p * (h - 2 * marginY);
    }

    return { x, y, side, t: linearT, visible: show };
  }

  private paint(frame: BlsFrame): void {
    const { canvas, ctx } = { canvas: this.opts.canvas, ctx: this.ctx };
    ctx.fillStyle = this.opts.getBackground();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!frame.visible || !this.opts.getEnabled()) return;

    const base = Math.min(canvas.width, canvas.height) * 0.035;
    const r = base * this.opts.getSize();
    ctx.beginPath();
    ctx.fillStyle = this.opts.getColor();
    ctx.arc(frame.x, frame.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawIdle(dim = false): void {
    const canvas = this.opts.canvas;
    this.ctx.fillStyle = this.opts.getBackground();
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!this.opts.getEnabled()) return;
    const y = verticalY(this.opts.getVerticalPosition(), canvas.height, canvas.height * 0.1);
    const base = Math.min(canvas.width, canvas.height) * 0.035;
    const r = base * this.opts.getSize();
    this.ctx.beginPath();
    this.ctx.fillStyle = dim ? this.opts.getColor() : this.opts.getColor();
    this.ctx.globalAlpha = this.opts.isPaused() ? 0.55 : 1;
    this.ctx.arc(canvas.width / 2, y, r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  /** Reset side tracker when a new set starts */
  resetPhaseTracking(): void {
    this.lastSide = 'L';
  }
}

function verticalY(pos: VerticalPosition, h: number, margin: number): number {
  if (pos === 'top') return margin + h * 0.12;
  if (pos === 'bottom') return h - margin - h * 0.12;
  return h / 2;
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/** Pure helper for tests: map elapsed seconds + hz → side and pass index */
export function phaseAt(elapsedSec: number, hz: number): { side: Side; passes: number; half: number } {
  const cycle = Math.max(0, elapsedSec) * Math.max(0.05, hz);
  const passes = Math.floor(cycle);
  const half = cycle % 1;
  const side: Side = half < 0.5 ? 'R' : 'L';
  return { side, passes, half };
}
