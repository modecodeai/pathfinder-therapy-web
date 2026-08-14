import { describe, expect, it } from 'vitest';
import {
  cycleProgressFromElapsed,
  getTrajectoryPosition,
  infinityPoint,
  passesFromCycleProgress,
} from '../src/emdr/engine/trajectoryEngine';
import {
  nextNoChangeCount,
  shouldShowNoChangeReminder,
} from '../src/emdr/engine/noChangeTracker';
import { EMDR_PHASE_PRESETS } from '../src/emdr/config/phasePresets';
import { passesFromElapsed, sideFromElapsed } from '../src/features/visual/blsEngine';
import { computeElapsed, formatTime, SetController } from '../src/features/sets/setController';
import { createDefaultRoomState, speed01ToCycleMs } from '../src/types/room';
import { validateTherapistCommand } from '../src/features/remote/protocol';

describe('pass counting — full back-and-forth = 1 pass', () => {
  it('LEFT→RIGHT→LEFT equals exactly one pass', () => {
    const cycleMs = 1000;
    // At t=0: start of pass 0
    expect(passesFromElapsed(0, cycleMs)).toBe(0);
    // Mid-pass (at right): still 0 completed
    expect(passesFromElapsed(499, cycleMs)).toBe(0);
    // Full cycle complete
    expect(passesFromElapsed(1000, cycleMs)).toBe(1);
    expect(passesFromElapsed(2000, cycleMs)).toBe(2);
  });

  it('set of 30 passes completes at exactly 30', () => {
    let done = false;
    let passes = 0;
    const c = new SetController({
      getMode: () => 'passes',
      getTargetPasses: () => 30,
      getTargetSeconds: () => 999,
      getElapsedMs: () => 0,
      getPasses: () => passes,
      onComplete: () => {
        done = true;
      },
    });
    passes = 29;
    c.check();
    expect(done).toBe(false);
    passes = 30;
    c.check();
    expect(done).toBe(true);
  });

  it('cycle helpers stay consistent', () => {
    expect(passesFromCycleProgress(0.99)).toBe(0);
    expect(passesFromCycleProgress(1)).toBe(1);
    expect(cycleProgressFromElapsed(2000, 1000)).toBe(2);
  });
});

describe('pause/resume elapsed', () => {
  it('does not lose accumulated time while paused', () => {
    expect(computeElapsed(5000, 1000, 3000, true)).toBe(5000);
    expect(computeElapsed(5000, 1000, 3000, false)).toBe(7000);
  });
});

describe('stop/reset', () => {
  it('formats time and default room has no clinical identity fields', () => {
    expect(formatTime(0)).toBe('0:00');
    const s = createDefaultRoomState();
    expect(s).not.toHaveProperty('clientName');
    expect(s.visualMode).toBe('horizontal');
    expect(s.cycleDurationMs).toBeGreaterThan(0);
  });
});

describe('no-change tracking', () => {
  it('increments on no-change and resets otherwise', () => {
    expect(nextNoChangeCount(0, 'no-change')).toBe(1);
    expect(nextNoChangeCount(1, 'no-change')).toBe(2);
    expect(shouldShowNoChangeReminder(2)).toBe(true);
    expect(nextNoChangeCount(2, 'change')).toBe(0);
    expect(shouldShowNoChangeReminder(0)).toBe(false);
  });
});

describe('infinity trajectory', () => {
  it('returns normalised points and reverses with midline', () => {
    const a = infinityPoint(0.1, 'up');
    const b = infinityPoint(0.1, 'down');
    expect(a.x).toBeGreaterThanOrEqual(0);
    expect(a.x).toBeLessThanOrEqual(1);
    expect(a.y).toBeGreaterThanOrEqual(0);
    expect(a.y).toBeLessThanOrEqual(1);
    expect(a.y).not.toBe(b.y);
  });

  it('getTrajectoryPosition supports infinity', () => {
    const p = getTrajectoryPosition(0.25, 'infinity', { midline: 'up' });
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThanOrEqual(1);
  });
});

describe('phase presets', () => {
  it('loads clinical starting points without claiming mandates', () => {
    expect(EMDR_PHASE_PRESETS.preparation.speedPreset).toBe('slow');
    expect(EMDR_PHASE_PRESETS.preparation.passes).toBe(8);
    expect(EMDR_PHASE_PRESETS.desensitisation.speedPreset).toBe('fast');
    expect(EMDR_PHASE_PRESETS.desensitisation.passes).toBe(30);
    expect(EMDR_PHASE_PRESETS.closure.trajectory).toBe('infinity');
    expect(EMDR_PHASE_PRESETS.closure.durationSeconds).toBe(15);
    expect(EMDR_PHASE_PRESETS.history.blsActive).toBe(false);
    expect(EMDR_PHASE_PRESETS.assessment.blsActive).toBe(false);
  });
});

describe('speed architecture', () => {
  it('maps slower→faster without exposing Hz as clinical truth', () => {
    expect(speed01ToCycleMs(0)).toBeGreaterThan(speed01ToCycleMs(1));
  });

  it('audio side alternates across a full pass', () => {
    expect(sideFromElapsed(100, 1000)).toBe('R');
    expect(sideFromElapsed(600, 1000)).toBe('L');
  });
});

describe('remote validation', () => {
  it('validates therapist commands', () => {
    expect(validateTherapistCommand({ type: 'STOP', sequence: 3 })).toEqual({
      type: 'STOP',
      sequence: 3,
    });
    expect(validateTherapistCommand({ type: 'START', sequence: 1 })).toBeNull();
  });
});
