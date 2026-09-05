import type { Side, VisualMode } from '../../types/room';

export interface BlsFrame {
  x: number;
  y: number;
  side: Side;
  visible: boolean;
}

export interface BlsEngineOptions {
  canvas: HTMLCanvasElement;
  getSpeedHz: () => number;
  getMode: () => VisualMode;
  getColour: () => string;
  getBackground: () => string;
  /** Radius in CSS pixels */
  getSizePx: () => number;
  getTravelWidth: () => number;
  /** 0 top – 1 bottom */
  getVerticalPosition: () => number;
  getVisualEnabled: () => boolean;
  /** Logical elapsed ms used for phase when running */
  getElapsedMs: () => number;
  isAnimating: () => boolean;
  /** Called when a pass completes (one edge-to-edge traversal) */
  onPass?: (sideArrived: Side) => void;
  onSide?: (side: Side) => void;
}

/**
 * Canvas BLS driven by requestAnimationFrame.
 * Position from elapsed time + Hz — not React state per frame.
 *
 * One pass = one full traversal from one edge to the opposite edge.
 * At speedHz, passes per second ≈ speedHz (each half-cycle is one pass).
 */
export class BlsEngine {
  private raf = 0;
  private started = false;
  private lastSide: Side | null = null;
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
    this.lastSide = null;
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
    const animating = this.opts.isAnimating();
    const visualOn = this.opts.getVisualEnabled();

    if (!animating) {
      this.drawIdle();
      return;
    }

    const hz = Math.max(0.05, this.opts.getSpeedHz());
    const elapsedSec = Math.max(0, this.opts.getElapsedMs() / 1000);
    // Each pass = half cycle (edge to edge). Full L-R-L = 2 passes = 1/hz seconds? 
    // Spec: pass = one edge-to-edge. At 1 Hz → 1 pass/sec.
    const passFloat = elapsedSec * hz;
    const passIndex = Math.floor(passFloat);
    const t = passFloat - passIndex; // 0..1 within current pass
    const goingRight = passIndex % 2 === 0;
    const side: Side = goingRight ? 'R' : 'L';

    if (this.lastSide !== null && side !== this.lastSide) {
      this.opts.onPass?.(side);
      this.opts.onSide?.(side);
    } else if (this.lastSide === null) {
      this.opts.onSide?.(side);
    }
    this.lastSide = side;

    const frame = this.computeFrame(side, easeInOutSine(t), goingRight, visualOn);
    this.paint(frame);
  }

  private computeFrame(
    side: Side,
    ease: number,
    goingRight: boolean,
    visualOn: boolean,
  ): BlsFrame {
    const mode = this.opts.getMode();
    const travel = Math.min(1, Math.max(0.3, this.opts.getTravelWidth()));
    const canvas = this.opts.canvas;
    const w = canvas.width;
    const h = canvas.height;
    const marginX = ((1 - travel) / 2) * w;
    const marginY = ((1 - travel) / 2) * h;
    const yBase = marginY + this.opts.getVerticalPosition() * (h - 2 * marginY);

    let x = w / 2;
    let y = yBase;

    if (mode === 'blink') {
      x = side === 'R' ? w - marginX : marginX;
      y = yBase;
    } else if (mode === 'horizontal') {
      const p = goingRight ? ease : 1 - ease;
      // When going to L (odd passes), animate from right to left
      const prog = goingRight ? ease : ease;
      x = goingRight
        ? marginX + prog * (w - 2 * marginX)
        : w - marginX - prog * (w - 2 * marginX);
      y = yBase;
      void p;
    } else if (mode === 'vertical') {
      const goingDown = goingRight;
      const prog = ease;
      y = goingDown
        ? marginY + prog * (h - 2 * marginY)
        : h - marginY - prog * (h - 2 * marginY);
      x = w / 2;
    } else if (mode === 'diagonal-up') {
      const prog = ease;
      if (goingRight) {
        x = marginX + prog * (w - 2 * marginX);
        y = h - marginY - prog * (h - 2 * marginY);
      } else {
        x = w - marginX - prog * (w - 2 * marginX);
        y = marginY + prog * (h - 2 * marginY);
      }
    } else {
      // diagonal-down
      const prog = ease;
      if (goingRight) {
        x = marginX + prog * (w - 2 * marginX);
        y = marginY + prog * (h - 2 * marginY);
      } else {
        x = w - marginX - prog * (w - 2 * marginX);
        y = h - marginY - prog * (h - 2 * marginY);
      }
    }

    return { x, y, side, visible: visualOn };
  }

  private paint(frame: BlsFrame): void {
    const { canvas, ctx } = { canvas: this.opts.canvas, ctx: this.ctx };
    ctx.fillStyle = this.opts.getBackground();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!frame.visible) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.opts.getSizePx() * dpr;
    ctx.beginPath();
    ctx.fillStyle = this.opts.getColour();
    ctx.arc(frame.x, frame.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawIdle(): void {
    const canvas = this.opts.canvas;
    this.ctx.fillStyle = this.opts.getBackground();
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!this.opts.getVisualEnabled()) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.opts.getSizePx() * dpr;
    const marginY = ((1 - this.opts.getTravelWidth()) / 2) * canvas.height;
    const y =
      marginY + this.opts.getVerticalPosition() * (canvas.height - 2 * marginY);
    this.ctx.beginPath();
    this.ctx.globalAlpha = this.opts.isAnimating() ? 1 : 0.85;
    this.ctx.fillStyle = this.opts.getColour();
    this.ctx.arc(canvas.width / 2, y, r, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }
}

export function easeInOutSine(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

/** Pure helpers for tests */
export function passesFromElapsed(elapsedMs: number, hz: number): number {
  return Math.floor(Math.max(0, elapsedMs / 1000) * Math.max(0.05, hz));
}

export function sideFromElapsed(elapsedMs: number, hz: number): Side {
  const passIndex = passesFromElapsed(elapsedMs, hz);
  return passIndex % 2 === 0 ? 'R' : 'L';
}
