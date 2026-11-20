import { describe, expect, it } from 'vitest';
import {
  ALL_SCRIPTS,
  SCRIPT_BLS_GUIDANCE,
  clinicalPresetToPhase,
  getScriptById,
  resolveBlsGuidance,
} from '../src/emdr/help/library';
import { phaseTimingPatch } from '../src/emdr/bls/config';
import { createDefaultRoomState } from '../src/types/room';
import { EMDR_PHASE_PRESETS } from '../src/emdr/config/phasePresets';

describe('BLS Guidance in Therapist Scripts', () => {
  it('1. Phase 1 shows BLS not routinely required', () => {
    const g = getScriptById('phase1-presenting-issue')!.blsGuidance!;
    expect(g.status).toBe('not-yet');
    expect(g.title.toLowerCase()).toMatch(/not routinely|history/);
  });

  it('2–3. Safe/Calm Place optional + omit caution', () => {
    const g = getScriptById('phase2-safe-calm-place')!.blsGuidance!;
    expect(g.status).toBe('optional');
    expect(g.caution?.toLowerCase()).toMatch(/omitting|omit|stop/);
    expect(g.presetId).toBe('resource');
  });

  it('4. Phase 3 says BLS not yet', () => {
    expect(getScriptById('phase3-assessment-sequence')!.blsGuidance!.status).toBe('not-yet');
  });

  it('5. Phase 4 activation shows BLS use', () => {
    const g = resolveBlsGuidance('phase4-change-path', SCRIPT_BLS_GUIDANCE['phase4-change-path'], {
      phase: 'desensitisation',
    });
    expect(g?.status).toBe('use');
    expect(g?.presetId).toBe('desensitisation');
  });

  it('6. After set → paused-between-sets', () => {
    const g = resolveBlsGuidance(
      'phase4-processing-checkin',
      SCRIPT_BLS_GUIDANCE['phase4-processing-checkin'],
      { phase: 'desensitisation', awaitingFeedback: true },
    );
    expect(g?.status).toBe('paused-between-sets');
  });

  it('7. Change response offers next set (USE)', () => {
    const g = resolveBlsGuidance('phase4-processing-checkin', undefined, {
      phase: 'desensitisation',
      awaitingFeedback: true,
      lastResponse: 'change',
    });
    expect(g?.status).toBe('use');
    expect(g?.action?.label?.toLowerCase()).toMatch(/desensitisation|load/);
  });

  it('8. Two no-change sets prompt reassessment', () => {
    const g = resolveBlsGuidance('phase4-no-change-twice', undefined, {
      phase: 'desensitisation',
      awaitingFeedback: true,
      consecutiveNoChange: 2,
      lastResponse: 'no-change',
    });
    expect(g?.status).toBe('pause-reassess');
  });

  it('9. Installation displays BLS use', () => {
    expect(getScriptById('phase5-installation')!.blsGuidance!.status).toBe('use');
  });

  it('10. Body Scan clear does not suggest unnecessary BLS', () => {
    const g = resolveBlsGuidance('phase6-body-scan', undefined, {
      phase: 'body-scan',
      bodyScanFinding: 'clear',
    });
    expect(g?.status).toBe('not-required');
  });

  it('11. Body Scan residual offers BLS', () => {
    const g = resolveBlsGuidance('phase6-body-scan', undefined, {
      phase: 'body-scan',
      bodyScanFinding: 'disturbing',
    });
    expect(g?.status).toBe('use');
  });

  it('12. Completed closure does not automatically suggest BLS', () => {
    expect(getScriptById('phase7-completed-closure')!.blsGuidance!.status).toBe('not-required');
  });

  it('13. Incomplete closure offers resource/de-arousal choices', () => {
    const g = getScriptById('phase7-incomplete-closure')!.blsGuidance!;
    expect(g.status).toBe('optional');
    expect(g.action?.presetId === 'infinity' || g.rationale?.toLowerCase().includes('resource')).toBe(
      true,
    );
  });

  it('14. Infinity loads very slow 10–20 second guidance', () => {
    const g = getScriptById('infinity-figure-eight')!.blsGuidance!;
    expect(g.suggestedPreset?.toLowerCase()).toMatch(/10|15|20|slow/);
    expect(g.presetId).toBe('infinity');
  });

  it('15. Reevaluation first occurs without BLS', () => {
    expect(getScriptById('phase8-global-reevaluation')!.blsGuidance!.status).toBe('not-yet');
    expect(getScriptById('phase8-target-reevaluation')!.blsGuidance!.status).toBe('not-yet');
  });

  it('16. Positive strengthening offers slower continuous path via reevaluation preset', () => {
    const mapped = clinicalPresetToPhase('positive-strengthening');
    expect(mapped.phasePreset?.continuous).toBe(true);
    expect(mapped.phasePreset?.speedPreset).toBe('slow');
  });

  it('17. Resume incomplete target requires reactivation before BLS', () => {
    const g = getScriptById('phase8-target-reevaluation')!.blsGuidance!;
    expect(g.status).toBe('not-yet');
    expect(g.instructions?.some((i) => i.toLowerCase().includes('reassess'))).toBe(true);
  });

  it('18. Future Template offers faster BLS only after preparation (status not-yet + preset)', () => {
    const g = getScriptById('future-template-sequence')!.blsGuidance!;
    expect(g.status).toBe('not-yet');
    expect(g.presetId).toBe('future-template');
    expect(g.rationale?.toLowerCase()).toMatch(/before|first|only then/);
  });

  it('19. No guidance action auto-starts — Load only returns timing patch', () => {
    const state = {
      ...createDefaultRoomState(),
      stimulusColour: '#14B8A6',
      stimulusSize: 20,
      running: false,
    };
    const { phasePreset } = clinicalPresetToPhase('desensitisation');
    const patch = phaseTimingPatch(phasePreset!, state);
    expect(patch.running).toBe(false);
    expect(patch.stimulusSize).toBe(20);
    expect(patch.stimulusColour).toBe('#14B8A6');
  });

  it('20. Clinical appearance survives script-loaded timing presets', () => {
    const therapist = {
      ...createDefaultRoomState(),
      stimulusColour: '#14B8A6',
      backgroundColour: '#242628',
      stimulusSize: 28,
      travelWidth: 0.9,
    };
    for (const id of ['resource', 'desensitisation', 'installation', 'infinity'] as const) {
      const { phasePreset, infinity } = clinicalPresetToPhase(id);
      const patch = phaseTimingPatch(phasePreset!, therapist, { forceTrajectory: !!infinity });
      expect(patch.stimulusSize, id).toBe(28);
      expect(patch.stimulusColour, id).toBe('#14B8A6');
      expect(patch.travelWidth, id).toBe(0.9);
    }
  });

  it('every library script has BLS guidance attached', () => {
    const missing = ALL_SCRIPTS.filter((s) => !s.blsGuidance).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it('Safe/Calm negative response → do-not-continue', () => {
    const g = resolveBlsGuidance('phase2-safe-calm-place', undefined, {
      resourceResponse: 'negative',
    });
    expect(g?.status).toBe('do-not-continue');
  });

  it('Floatback remains not-yet', () => {
    expect(getScriptById('phase1-floatback')!.blsGuidance!.status).toBe('not-yet');
  });

  it('phase presets for desensitisation still ~30 passes', () => {
    expect(EMDR_PHASE_PRESETS.desensitisation.passes).toBe(30);
  });
});
