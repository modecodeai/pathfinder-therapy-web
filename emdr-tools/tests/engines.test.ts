import { describe, expect, it } from 'vitest';
import { easeInOutSine, phaseAt } from '../src/lib/blsEngine';
import { formatTime, SetController } from '../src/lib/setController';
import { clampSpeed, createDefaultSnapshot, SPEED_MAX_HZ, SPEED_MIN_HZ } from '../src/lib/types';
import { decodeMsg, encodeMsg, generateRoomId, generateSecret } from '../src/lib/roomProtocol';

describe('clampSpeed', () => {
  it('clamps and steps to 0.1 Hz', () => {
    expect(clampSpeed(0)).toBe(SPEED_MIN_HZ);
    expect(clampSpeed(9)).toBe(SPEED_MAX_HZ);
    expect(clampSpeed(0.84)).toBe(0.8);
    expect(clampSpeed(0.86)).toBe(0.9);
  });
});

describe('phaseAt', () => {
  it('advances side and pass count from elapsed time', () => {
    expect(phaseAt(0, 1).side).toBe('R');
    expect(phaseAt(0.4, 1).side).toBe('R');
    expect(phaseAt(0.6, 1).side).toBe('L');
    expect(phaseAt(1.1, 1).passes).toBe(1);
  });
});

describe('easeInOutSine', () => {
  it('starts and ends at extremes', () => {
    expect(easeInOutSine(0)).toBeCloseTo(0, 10);
    expect(easeInOutSine(1)).toBeCloseTo(1, 10);
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 5);
  });
});

describe('SetController', () => {
  it('completes on pass target', () => {
    let done = false;
    let passes = 0;
    const c = new SetController({
      getMode: () => 'passes',
      getPassesTarget: () => 3,
      getTimedSeconds: () => 30,
      getElapsedMs: () => 0,
      getPasses: () => passes,
      onSetComplete: () => {
        done = true;
      },
    });
    passes = 2;
    c.check();
    expect(done).toBe(false);
    passes = 3;
    c.check();
    expect(done).toBe(true);
  });

  it('completes on timed mode', () => {
    let done = false;
    let elapsed = 0;
    const c = new SetController({
      getMode: () => 'timed',
      getPassesTarget: () => 24,
      getTimedSeconds: () => 10,
      getElapsedMs: () => elapsed,
      getPasses: () => 0,
      onSetComplete: () => {
        done = true;
      },
    });
    elapsed = 9999;
    c.check();
    expect(done).toBe(false);
    elapsed = 10000;
    c.check();
    expect(done).toBe(true);
  });
});

describe('formatTime', () => {
  it('formats mm:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65000)).toBe('1:05');
  });
});

describe('room protocol helpers', () => {
  it('round-trips messages and generates ids', () => {
    const msg = { type: 'ping' as const };
    expect(decodeMsg(encodeMsg(msg))).toEqual(msg);
    expect(generateRoomId(7)).toHaveLength(7);
    expect(generateSecret(8)).toHaveLength(16);
  });

  it('default snapshot has no clinical fields', () => {
    const snap = createDefaultSnapshot();
    expect(snap).not.toHaveProperty('clientName');
    expect(snap).not.toHaveProperty('notes');
    expect(snap).not.toHaveProperty('sud');
  });
});
