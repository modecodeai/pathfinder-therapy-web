import { describe, expect, it, beforeEach } from 'vitest';
import {
  extractAppearance,
  phaseTimingPatch,
  roomStateToConfig,
  configToRoomPatch,
} from '../src/emdr/bls/config';
import { EMDR_PHASE_PRESETS } from '../src/emdr/config/phasePresets';
import {
  addSavedPreset,
  handoffToSession,
  consumeSessionHandoff,
  resolveInitialBlsState,
  saveTherapistDefault,
  loadTherapistDefault,
} from '../src/emdr/bls/persistence';
import { createDefaultRoomState, withSpeed01 } from '../src/types/room';
import { passesFromElapsed } from '../src/features/visual/blsEngine';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    key: (i) => [...store.keys()][i] ?? null,
  };
}

function installMemoryStorage() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createMemoryStorage(),
    configurable: true,
  });
}

describe('shared BLS configuration', () => {
  it('round-trips RoomState ↔ BLSConfiguration appearance', () => {
    const state = {
      ...createDefaultRoomState(),
      stimulusColour: '#14B8A6',
      backgroundColour: '#242628',
      stimulusSize: 20,
      travelWidth: 0.9,
      visualMode: 'horizontal' as const,
      ...withSpeed01(createDefaultRoomState(), 0.5),
    };
    const config = roomStateToConfig(state);
    expect(config.stimulus.colour).toBe('#14B8A6');
    expect(config.stimulus.size).toBe(20);
    expect(config.stimulus.travelWidth).toBe(0.9);
    const patch = configToRoomPatch(config);
    expect(patch.stimulusColour).toBe('#14B8A6');
    expect(patch.stimulusSize).toBe(20);
  });

  it('phase timing preserves therapist appearance', () => {
    const therapist = {
      ...createDefaultRoomState(),
      stimulusColour: '#14B8A6',
      backgroundColour: '#242628',
      stimulusSize: 20,
      travelWidth: 0.9,
      visualMode: 'horizontal' as const,
      ...withSpeed01(createDefaultRoomState(), 0.4),
    };
    const prep = phaseTimingPatch(EMDR_PHASE_PRESETS.preparation, therapist);
    expect(prep.stimulusColour).toBe('#14B8A6');
    expect(prep.stimulusSize).toBe(20);
    expect(prep.travelWidth).toBe(0.9);
    expect(prep.targetPasses).toBe(8);
    expect(prep.visualMode).toBe('horizontal');

    const des = phaseTimingPatch(EMDR_PHASE_PRESETS.desensitisation, {
      ...therapist,
      ...prep,
    } as typeof therapist);
    expect(des.stimulusSize).toBe(20);
    expect(des.targetPasses).toBe(30);
    expect(des.stimulusColour).toBe('#14B8A6');

    const closure = phaseTimingPatch(EMDR_PHASE_PRESETS.closure, {
      ...therapist,
      stimulusSize: 28,
    });
    expect(closure.visualMode).toBe('infinity');
    expect(closure.stimulusSize).toBe(28);
    expect(closure.targetSeconds).toBe(15);
  });

  it('extractAppearance isolates visual design', () => {
    const a = extractAppearance({
      ...createDefaultRoomState(),
      stimulusSize: 28,
      targetPasses: 99,
    });
    expect(a.stimulusSize).toBe(28);
    expect((a as { targetPasses?: number }).targetPasses).toBeUndefined();
  });
});

describe('BLS persistence layers', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('saves therapist default and resolves initial state', () => {
    const custom = {
      ...createDefaultRoomState(),
      stimulusSize: 20,
      travelWidth: 0.9,
      stimulusColour: '#14B8A6',
    };
    saveTherapistDefault(custom);
    const loaded = loadTherapistDefault();
    expect(loaded?.stimulusSize).toBe(20);
    expect(resolveInitialBlsState(null).stimulusSize).toBe(20);
  });

  it('Studio handoff takes priority over therapist default', () => {
    saveTherapistDefault({ ...createDefaultRoomState(), stimulusSize: 14 });
    handoffToSession({ ...createDefaultRoomState(), stimulusSize: 28, travelWidth: 0.9 });
    const resolved = resolveInitialBlsState(null);
    expect(resolved.stimulusSize).toBe(28);
    expect(consumeSessionHandoff()).toBeNull();
  });

  it('saved presets store full configuration including speed01', () => {
    const state = {
      ...createDefaultRoomState(),
      stimulusSize: 20,
      ...withSpeed01(createDefaultRoomState(), 0.55),
      midlineDirection: 'down' as const,
      continuous: false,
    };
    const list = addSavedPreset('My Standard Visual', state);
    expect(list[0].name).toBe('My Standard Visual');
    expect(list[0].configuration.stimulusSize).toBe(20);
    expect(list[0].configuration.speed01).toBeCloseTo(0.55, 2);
    expect(list[0].configuration.midlineDirection).toBe('down');
  });
});

describe('mandatory journey invariants', () => {
  it('pass definition remains full oscillation', () => {
    expect(passesFromElapsed(0, 1000)).toBe(0);
    expect(passesFromElapsed(999, 1000)).toBe(0);
    expect(passesFromElapsed(1000, 1000)).toBe(1);
  });

  it('size change patch does not clear timing fields', () => {
    const base = {
      ...createDefaultRoomState(),
      targetPasses: 30,
      stimulusSize: 20,
    };
    const next = { ...base, stimulusSize: 28 };
    expect(next.targetPasses).toBe(30);
    expect(next.stimulusSize).toBe(28);
  });
});
