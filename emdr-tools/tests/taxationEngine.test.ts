import { describe, expect, it } from 'vitest';
import {
  createDefaultTaxationConfig,
} from '../src/emdr/types/emdrTaxation';
import {
  estimateWorkingMemoryLoad,
  reduceTaxationOneStep,
  taxationConfigPatchToRoom,
} from '../src/emdr/engine/taxationPresets';
import {
  resolveEffectiveElapsed,
  resolveTaxationColour,
  resolveSpeedScale,
} from '../src/emdr/engine/taxationEngine';
import { createDefaultRoomState, roomStateToTaxationConfig } from '../src/types/room';
import { passesFromElapsed } from '../src/features/visual/blsEngine';
import { generateTask, makeEasier, makeHarder } from '../src/emdr/engine/cognitiveTasks';
import { getScriptById } from '../src/emdr/help/library';

describe('Working Memory Taxation — Standard path unchanged', () => {
  it('default room taxation mode is standard', () => {
    const s = createDefaultRoomState();
    expect(s.taxationMode).toBe('standard');
    expect(roomStateToTaxationConfig(s).mode).toBe('standard');
  });

  it('resolveEffectiveElapsed is identity in standard mode', () => {
    const cfg = createDefaultTaxationConfig();
    expect(resolveEffectiveElapsed(cfg, 0)).toBe(0);
    expect(resolveEffectiveElapsed(cfg, 1234)).toBe(1234);
    expect(resolveEffectiveElapsed(cfg, 5000)).toBe(5000);
  });

  it('pass counting helpers still match fixed cycle duration', () => {
    const cycleMs = 1000;
    expect(passesFromElapsed(0, cycleMs)).toBe(0);
    expect(passesFromElapsed(999, cycleMs)).toBe(0);
    expect(passesFromElapsed(1000, cycleMs)).toBe(1);
  });

  it('standard mode keeps base colour', () => {
    const cfg = createDefaultTaxationConfig();
    const r = resolveTaxationColour(cfg, '#14B8A6', 12);
    expect(r.colour).toBe('#14B8A6');
    expect(r.changed).toBe(false);
  });
});

describe('Variable speed taxation', () => {
  it('produces eased non-identity elapsed while staying bounded', () => {
    const cfg = {
      ...createDefaultTaxationConfig(),
      mode: 'variable-speed' as const,
      variableSpeedPreset: 'medium' as const,
      seed: 42,
    };
    const e1 = resolveEffectiveElapsed(cfg, 2000);
    const e2 = resolveEffectiveElapsed(cfg, 4000);
    expect(e1).toBeGreaterThan(0);
    expect(e2).toBeGreaterThan(e1);
    // Bounded: not wildly faster than 2x wall over this window
    expect(e2).toBeLessThan(4000 * 2);
    const scale = resolveSpeedScale(cfg, 1500);
    expect(scale).toBeGreaterThanOrEqual(0.5);
    expect(scale).toBeLessThanOrEqual(1.6);
  });

  it('is deterministic for the same seed', () => {
    const cfg = {
      ...createDefaultTaxationConfig(),
      mode: 'variable-speed' as const,
      seed: 99,
    };
    expect(resolveEffectiveElapsed(cfg, 3000)).toBe(resolveEffectiveElapsed(cfg, 3000));
  });
});

describe('Colour taxation', () => {
  it('colour-shift rotates deterministically', () => {
    const cfg = {
      ...createDefaultTaxationConfig(),
      mode: 'colour-shift' as const,
      colourShiftInterval: 2 as const,
      colourPalette: ['#FFFFFF', '#3B82F6', '#22C55E'],
      seed: 7,
    };
    const a = resolveTaxationColour(cfg, '#14B8A6', 0);
    const b = resolveTaxationColour(cfg, '#14B8A6', 2);
    const b2 = resolveTaxationColour(cfg, '#14B8A6', 2);
    expect(b.colour).toBe(b2.colour);
    expect(['#FFFFFF', '#3B82F6', '#22C55E']).toContain(a.colour);
    expect(b.colour).not.toBe(a.colour);
  });

  it('disable colour taxation keeps base colour', () => {
    const cfg = {
      ...createDefaultTaxationConfig(),
      mode: 'random-colour' as const,
      disableColourTaxation: true,
      seed: 3,
    };
    expect(resolveTaxationColour(cfg, '#14B8A6', 10).colour).toBe('#14B8A6');
  });
});

describe('Working memory load indicator', () => {
  it('standard → standard; chaos 3 → high', () => {
    expect(estimateWorkingMemoryLoad(createDefaultTaxationConfig())).toBe('standard');
    expect(
      estimateWorkingMemoryLoad({
        ...createDefaultTaxationConfig(),
        mode: 'chaos',
        chaosLevel: 3,
      }),
    ).toBe('high');
  });

  it('maps reduce/increase patches onto RoomState keys', () => {
    const cfg = {
      ...createDefaultTaxationConfig(),
      mode: 'variable-speed' as const,
      variableSpeedPreset: 'high' as const,
    };
    const patch = taxationConfigPatchToRoom(reduceTaxationOneStep(cfg));
    expect(patch.taxationVariableSpeedPreset).toBe('medium');
  });
});

describe('Cognitive tasks & help', () => {
  it('generate / easier / harder stay coherent', () => {
    const t = generateTask('numerical');
    expect(t.modality).toBe('numerical');
    const harder = makeHarder(t);
    expect(harder.difficulty).toBeGreaterThanOrEqual(t.difficulty);
    const easier = makeEasier(harder);
    expect(easier.difficulty).toBeLessThanOrEqual(harder.difficulty);
  });

  it('help articles exist', () => {
    expect(getScriptById('wmt-overview')?.title).toMatch(/Working Memory Taxation/);
    expect(getScriptById('wmt-phase-guide')).toBeTruthy();
  });
});
