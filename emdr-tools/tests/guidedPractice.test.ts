import { describe, expect, it } from 'vitest';
import { parsePlainScriptToSteps } from '../src/emdr/guided/lib/parseScriptSteps';
import { applyBlsPreset, BLS_PRESETS } from '../src/emdr/guided/lib/blsPresets';
import { createDefaultRoomState } from '../src/types/room';
import { searchCognitions } from '../src/emdr/data/scripts/cognitions';
import { SAFE_CALM_STEPS } from '../src/emdr/data/scripts/safeCalm';
import { EMD_STEPS } from '../src/emdr/data/scripts/emd';
import { PHASE3_ASSESSMENT_STEPS } from '../src/emdr/data/scripts/standardPhases';

describe('guided practice script model', () => {
  it('parses plain protocol text into typed steps', () => {
    const steps = parsePlainScriptToSteps(
      [
        'What picture represents the worst part?',
        'Pause for response.',
        'Start bilateral stimulation.',
        'If positive: "Go with that."',
        'Warning: Stop BLS if intolerable.',
      ].join('\n'),
      { protocol: 'test', phase: '4', section: 'desens' },
    );
    expect(steps.map((s) => s.type)).toEqual([
      'say',
      'clinician-note',
      'bls-action',
      'decision',
      'warning',
    ]);
  });

  it('exposes shared BLS presets including pain and safe/calm', () => {
    const state = createDefaultRoomState();
    expect(Object.keys(BLS_PRESETS)).toContain('grantPainAuditory');
    expect(Object.keys(BLS_PRESETS)).toContain('safeCalm');
    expect(Object.keys(BLS_PRESETS)).toContain('emdShortSet');
    const pain = applyBlsPreset('grantPainAuditory', state);
    expect(pain.audioEnabled).toBe(true);
    expect(pain.continuous).toBe(true);
    expect(pain.taxationMode).toBe('standard');
    const calm = applyBlsPreset('safeCalm', state);
    expect(calm.setMode).toBe('passes');
    expect(calm.targetPasses).toBe(10);
  });

  it('searches NC/PC helper without auto-selecting', () => {
    const hits = searchCognitions('not good enough');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.nc.toLowerCase()).toContain('good enough');
  });

  it('ships structured Safe/Calm, EMD, and Phase 3 scripts with source metadata', () => {
    expect(SAFE_CALM_STEPS.some((s) => s.type === 'bls-action')).toBe(true);
    expect(SAFE_CALM_STEPS[0]?.source?.title).toBeTruthy();
    expect(EMD_STEPS.some((s) => s.blsPreset === 'emdShortSet')).toBe(true);
    expect(PHASE3_ASSESSMENT_STEPS.some((s) => s.fieldKey === 'nc')).toBe(true);
  });
});
