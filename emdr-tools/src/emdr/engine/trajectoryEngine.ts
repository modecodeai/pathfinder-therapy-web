import type { BLSTrajectory, MidlineDirection } from '../types/emdr';

export interface Point {
  x: number; // 0–1 normalised
  y: number; // 0–1 normalised
}

/**
 * progress 0…1 within one full pass (complete back-and-forth / one oscillation).
 * For horizontal: 0 = left, 0.5 = right, 1 = left.
 */
export function getTrajectoryPosition(
  progress: number,
  trajectory: BLSTrajectory,
  opts?: {
    travelWidth?: number;
    verticalPosition?: number;
    midline?: MidlineDirection;
  },
): Point {
  const t = ((progress % 1) + 1) % 1;
  const travel = Math.min(1, Math.max(0.3, opts?.travelWidth ?? 0.85));
  const margin = (1 - travel) / 2;
  const yBase = opts?.verticalPosition ?? 0.5;

  if (trajectory === 'infinity') {
    return infinityPoint(t, opts?.midline ?? 'up', travel);
  }

  // Round-trip: 0→0.5 go out, 0.5→1 return
  const goingOut = t < 0.5;
  const local = goingOut ? t * 2 : (t - 0.5) * 2;
  const eased = easeInOutSine(local);
  const p = goingOut ? eased : 1 - eased;

  if (trajectory === 'blink') {
    return { x: goingOut ? 1 - margin : margin, y: yBase };
  }

  if (trajectory === 'horizontal') {
    return { x: margin + p * (1 - 2 * margin), y: yBase };
  }

  if (trajectory === 'vertical') {
    return { x: 0.5, y: margin + p * (1 - 2 * margin) };
  }

  if (trajectory === 'diagonal-up') {
    // ↗ then ↙
    return {
      x: margin + p * (1 - 2 * margin),
      y: 1 - margin - p * (1 - 2 * margin),
    };
  }

  // diagonal-down ↘ then ↖
  return {
    x: margin + p * (1 - 2 * margin),
    y: margin + p * (1 - 2 * margin),
  };
}

/**
 * Bernoulli lemniscate, normalised into travel box.
 * Midline direction: 'up' crosses centre travelling upward; 'down' downward.
 */
export function infinityPoint(
  progress: number,
  midline: MidlineDirection,
  travel = 0.85,
): Point {
  // Two lobes: progress 0..1 maps to full ∞ loop
  const dir = midline === 'up' ? 1 : -1;
  const theta = progress * Math.PI * 2 * dir;
  // Lemniscate of Bernoulli (parametric)
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const denom = 1 + sinT * sinT;
  let x = cosT / denom;
  let y = (sinT * cosT) / denom;
  // Normalise approx range [-1,1] → travel box
  const margin = (1 - travel) / 2;
  x = margin + ((x + 1) / 2) * (1 - 2 * margin);
  y = margin + ((y + 1) / 2) * (1 - 2 * margin);
  return { x, y };
}

export function easeInOutSine(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

/**
 * Pass counting: one complete back-and-forth = 1 pass.
 * cycleProgress advances 0→1 per full oscillation.
 */
export function passesFromCycleProgress(cycleProgress: number): number {
  return Math.floor(Math.max(0, cycleProgress));
}

export function cycleProgressFromElapsed(
  elapsedMs: number,
  cycleDurationMs: number,
): number {
  const dur = Math.max(50, cycleDurationMs);
  return Math.max(0, elapsedMs) / dur;
}
