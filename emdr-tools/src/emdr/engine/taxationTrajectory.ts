/**
 * Trajectory helpers for Pattern Switch / Chaos (Stage 2).
 * Stage 1 keeps movement on the existing BlsEngine trajectory path.
 */

import type { TaxationTrajectory } from '../types/emdrTaxation';
import type { BLSTrajectory } from '../types/emdr';

export function taxationTrajectoryToBls(t: TaxationTrajectory): BLSTrajectory {
  switch (t) {
    case 'horizontal':
      return 'horizontal';
    case 'vertical':
      return 'vertical';
    case 'diagonal-a':
      return 'diagonal-up';
    case 'diagonal-b':
      return 'diagonal-down';
    case 'figure-eight':
      return 'infinity';
    case 'wide-arc':
      // Approximate with diagonal until dedicated arc path lands in Stage 2
      return 'diagonal-up';
  }
}

export function isConventionalBilateral(traj: BLSTrajectory): boolean {
  return traj === 'horizontal';
}
