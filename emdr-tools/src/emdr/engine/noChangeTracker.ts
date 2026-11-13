import type { SetResponse } from '../types/emdr';

/** Passive no-change tracking — reminder only, never auto-intervenes. */
export function nextNoChangeCount(
  current: number,
  response: SetResponse | undefined,
): number {
  if (response === 'no-change') return current + 1;
  if (response === undefined) return current;
  return 0;
}

export function shouldShowNoChangeReminder(consecutiveNoChangeSets: number): boolean {
  return consecutiveNoChangeSets >= 2;
}

export const NO_CHANGE_REMINDER =
  'No change has been recorded across two consecutive sets. Consider reassessing the channel/target according to your clinical protocol.';
