import { easeInOutSine, type Point } from './trajectoryEngine';
import type { MidlineDirection } from '../types/emdr';
import type { TaxationTrajectory } from '../types/emdrTaxation';
import { infinityPoint } from './trajectoryEngine';

/** Map taxation trajectory → normalised point for one-way parameter u ∈ [0,1]. */
export function taxationPointAt(
  traj: TaxationTrajectory,
  uRaw: number,
  opts: {
    travelWidth: number;
    verticalPosition: number;
    midline: MidlineDirection;
  },
): Point {
  const u = Math.min(1, Math.max(0, uRaw));
  const travel = Math.min(1, Math.max(0.3, opts.travelWidth));
  const margin = (1 - travel) / 2;
  const yBase = opts.verticalPosition;
  const p = easeInOutSine(u);

  switch (traj) {
    case 'horizontal':
      return { x: margin + p * (1 - 2 * margin), y: yBase };
    case 'vertical':
      return { x: 0.5, y: margin + p * (1 - 2 * margin) };
    case 'diagonal-a':
      // Bottom-left ↔ Top-right
      return {
        x: margin + p * (1 - 2 * margin),
        y: 1 - margin - p * (1 - 2 * margin),
      };
    case 'diagonal-b':
      // Top-left ↔ Bottom-right
      return {
        x: margin + p * (1 - 2 * margin),
        y: margin + p * (1 - 2 * margin),
      };
    case 'wide-arc': {
      const amp = 0.22 * travel;
      return {
        x: margin + p * (1 - 2 * margin),
        y: Math.min(1 - margin, Math.max(margin, yBase - amp * Math.sin(Math.PI * p))),
      };
    }
    case 'figure-eight':
      return infinityPoint(u, opts.midline, travel);
  }
}

export function taxationTrajectoryToBlsMode(
  t: TaxationTrajectory,
): 'horizontal' | 'vertical' | 'diagonal-up' | 'diagonal-down' | 'infinity' {
  switch (t) {
    case 'horizontal':
      return 'horizontal';
    case 'vertical':
      return 'vertical';
    case 'diagonal-a':
      return 'diagonal-up';
    case 'diagonal-b':
      return 'diagonal-down';
    case 'wide-arc':
      return 'horizontal';
    case 'figure-eight':
      return 'infinity';
  }
}

export function isConventionalBilateral(traj: TaxationTrajectory): boolean {
  return traj === 'horizontal';
}
