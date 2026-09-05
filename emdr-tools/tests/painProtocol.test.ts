import { describe, expect, it } from 'vitest';
import { createEmptyPainWorkspace, PAIN_NAVIGATOR_STAGES } from '../src/emdr/types/painProtocol';
import { GRANT_PAIN_FULL } from '../src/emdr/data/protocols/grant-pain-full';
import { GRANT_PAIN_SHORT } from '../src/emdr/data/protocols/grant-pain-short';
import { GRANT_PAIN_VARIATIONS } from '../src/emdr/data/protocols/grant-pain-variations';
import {
  grantPainDefaultPatch,
  painVisualBlsPatch,
} from '../src/emdr/lib/emdr-pain/painBlsPresets';
import { createDefaultRoomState } from '../src/types/room';
import { getScriptById } from '../src/emdr/help/library';
import { buildSessionRecord, markStageComplete } from '../src/emdr/lib/emdr-pain/painHelpers';

describe('EMDR Pain Protocol data', () => {
  it('full and short protocols remain separate corpora', () => {
    expect(GRANT_PAIN_FULL.length).toBeGreaterThan(10);
    expect(GRANT_PAIN_SHORT.length).toBeGreaterThan(8);
    expect(GRANT_PAIN_FULL[0]?.id).not.toBe(GRANT_PAIN_SHORT[0]?.id);
    expect(GRANT_PAIN_FULL.some((s) => s.script.includes('locked'))).toBe(true);
  });

  it('variations include present pain and continuous BLS', () => {
    const titles = GRANT_PAIN_VARIATIONS.map((v) => v.title).join(' ');
    expect(titles).toMatch(/Present pain/i);
    expect(titles).toMatch(/Continuous BLS/i);
    expect(titles).toMatch(/Auditory BLS/i);
    expect(titles).toMatch(/Self-use/i);
  });

  it('navigator has 16 clinical stages', () => {
    expect(PAIN_NAVIGATOR_STAGES).toHaveLength(16);
    expect(PAIN_NAVIGATOR_STAGES[0]).toBe('orientation');
    expect(PAIN_NAVIGATOR_STAGES.at(-1)).toBe('re-evaluation');
  });

  it('Grant Pain Default sets auditory continuous without taxation', () => {
    const patch = grantPainDefaultPatch(createDefaultRoomState());
    expect(patch.audioEnabled).toBe(true);
    expect(patch.audioOnly).toBe(true);
    expect(patch.continuous).toBe(true);
    expect(patch.taxationMode).toBe('standard');
    expect(patch.visualEnabled).toBe(false);
  });

  it('Pain Visual BLS keeps taxation off', () => {
    const patch = painVisualBlsPatch(createDefaultRoomState());
    expect(patch.visualEnabled).toBe(true);
    expect(patch.taxationMode).toBe('standard');
  });

  it('session record builds from assessment', () => {
    let ws = createEmptyPainWorkspace();
    ws = {
      ...ws,
      assessment: {
        ...ws.assessment,
        targetType: 'present-pain',
        targetDescription: 'Lower back ache',
        baselineSud: 7,
        currentSud: 3,
        endSud: 3,
        nc: 'I am helpless',
        pc: 'I can cope',
      },
    };
    const rec = buildSessionRecord(ws);
    expect(rec?.baselinePainSUD).toBe(7);
    expect(rec?.endPainSUD).toBe(3);
    expect(rec?.targetType).toBe('present-pain');
  });

  it('markStageComplete is idempotent', () => {
    const ws = createEmptyPainWorkspace();
    const a = markStageComplete(ws, 'orientation');
    const b = markStageComplete(a, 'orientation');
    expect(a.completedStages).toEqual(['orientation']);
    expect(b.completedStages).toEqual(['orientation']);
  });

  it('library exposes pain scripts', () => {
    expect(getScriptById('pain-protocol-full')?.title).toMatch(/Pain Protocol/);
    expect(getScriptById('pain-protocol-short')).toBeTruthy();
  });

  it('has no coming-soon in protocol stage list', () => {
    for (const s of PAIN_NAVIGATOR_STAGES) {
      expect(s).not.toMatch(/coming/i);
    }
  });
});
