import { describe, expect, it } from 'vitest';
import { passesFromElapsed, sideFromElapsed, easeInOutSine } from '../src/features/visual/blsEngine';
import { computeElapsed, formatTime, SetController } from '../src/features/sets/setController';
import {
  clampSpeed,
  createDefaultRoomState,
  DEFAULT_SPEED_HZ,
  SPEED_MAX_HZ,
  SPEED_MIN_HZ,
} from '../src/types/room';
import {
  generateRoomId,
  generateTherapistSecret,
  sanitizePartialRoomState,
  validateTherapistCommand,
} from '../src/features/remote/protocol';

describe('clampSpeed / timing', () => {
  it('defaults to 1.4 Hz and clamps to 0.2–2.5 step 0.1', () => {
    expect(DEFAULT_SPEED_HZ).toBe(1.4);
    expect(clampSpeed(0)).toBe(SPEED_MIN_HZ);
    expect(clampSpeed(9)).toBe(SPEED_MAX_HZ);
    expect(clampSpeed(1.44)).toBe(1.4);
    expect(clampSpeed(1.46)).toBe(1.5);
  });

  it('converts elapsed time to pass count at Hz', () => {
    expect(passesFromElapsed(0, 1.4)).toBe(0);
    expect(passesFromElapsed(1000, 1)).toBe(1);
    expect(passesFromElapsed(2000, 1.4)).toBe(2);
  });
});

describe('pass counting / sides', () => {
  it('alternates L/R by pass index', () => {
    expect(sideFromElapsed(0, 1)).toBe('R');
    expect(sideFromElapsed(1000, 1)).toBe('L');
    expect(sideFromElapsed(2000, 1)).toBe('R');
  });
});

describe('SetController', () => {
  it('completes pass sets', () => {
    let done = false;
    let passes = 0;
    const c = new SetController({
      getMode: () => 'passes',
      getTargetPasses: () => 24,
      getTargetSeconds: () => 30,
      getElapsedMs: () => 0,
      getPasses: () => passes,
      onComplete: () => {
        done = true;
      },
    });
    passes = 23;
    c.check();
    expect(done).toBe(false);
    passes = 24;
    c.check();
    expect(done).toBe(true);
  });

  it('completes timed sets', () => {
    let done = false;
    let elapsed = 0;
    const c = new SetController({
      getMode: () => 'timed',
      getTargetPasses: () => 24,
      getTargetSeconds: () => 30,
      getElapsedMs: () => elapsed,
      getPasses: () => 0,
      onComplete: () => {
        done = true;
      },
    });
    elapsed = 29999;
    c.check();
    expect(done).toBe(false);
    elapsed = 30000;
    c.check();
    expect(done).toBe(true);
  });

  it('manual mode never auto-completes', () => {
    let done = false;
    const c = new SetController({
      getMode: () => 'manual',
      getTargetPasses: () => 1,
      getTargetSeconds: () => 1,
      getElapsedMs: () => 999999,
      getPasses: () => 999,
      onComplete: () => {
        done = true;
      },
    });
    c.check();
    expect(done).toBe(false);
  });
});

describe('pause/resume elapsed', () => {
  it('freezes elapsed while paused', () => {
    expect(computeElapsed(5000, 1000, 3000, true)).toBe(5000);
    expect(computeElapsed(5000, 1000, 3000, false)).toBe(7000);
  });
});

describe('stop/reset formatting', () => {
  it('formats time and default state has no clinical fields', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65000)).toBe('1:05');
    const s = createDefaultRoomState();
    expect(s).not.toHaveProperty('clientName');
    expect(s).not.toHaveProperty('sud');
    expect(s).not.toHaveProperty('notes');
  });
});

describe('remote message validation', () => {
  it('accepts valid therapist commands and rejects junk', () => {
    expect(validateTherapistCommand({ type: 'PAUSE', sequence: 1 })).toEqual({
      type: 'PAUSE',
      sequence: 1,
    });
    expect(validateTherapistCommand({ type: 'START', sequence: 2 })).toBeNull();
    expect(
      validateTherapistCommand({ type: 'START', sequence: 2, startAt: 123 }),
    ).toEqual({ type: 'START', sequence: 2, startAt: 123 });
    expect(validateTherapistCommand({ type: 'HELLO', role: 'client' })).toBeNull();
    expect(validateTherapistCommand(null)).toBeNull();
  });

  it('sanitizes settings and drops unknown / unsafe fields', () => {
    const partial = sanitizePartialRoomState({
      speedHz: 1.4,
      stimulusColour: '#14B8A6',
      clientName: 'secret',
      notes: 'nope',
      visualMode: 'horizontal',
      visualModeHack: 'x',
    } as Record<string, unknown>);
    expect(partial.speedHz).toBe(1.4);
    expect(partial.stimulusColour).toBe('#14B8A6');
    expect(partial).not.toHaveProperty('clientName');
    expect(partial).not.toHaveProperty('notes');
  });

  it('sequence handling prefers newer commands', () => {
    const older = validateTherapistCommand({ type: 'STOP', sequence: 1 });
    const newer = validateTherapistCommand({ type: 'STOP', sequence: 5 });
    expect(older!.sequence).toBeLessThan(newer!.sequence);
  });
});

describe('permissions helpers', () => {
  it('room ids are friendly and secrets are long', () => {
    const id = generateRoomId();
    expect(id).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(generateTherapistSecret().length).toBeGreaterThanOrEqual(32);
  });
});

describe('ease', () => {
  it('eases endpoints', () => {
    expect(easeInOutSine(0)).toBeCloseTo(0, 10);
    expect(easeInOutSine(1)).toBeCloseTo(1, 10);
  });
});
