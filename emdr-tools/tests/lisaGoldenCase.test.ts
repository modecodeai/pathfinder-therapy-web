import { describe, expect, it } from 'vitest';
import {
  LISA_GOLDEN_CONTEXT,
  LISA_GOLDEN_TRANSCRIPT_DEIDENTIFIED,
  LISA_KEY_QUOTES,
} from './fixtures/ta-lisa-golden/lisaGoldenFixture';
import {
  buildLisaExpectedTaAnalysis,
  detectEmdrLeakage,
  scoreLisaTaAnalysis,
} from './fixtures/ta-lisa-golden/lisaScorecard';
import { normaliseTranscriptSpeakers } from '../src/clinical-intelligence/lib/speakerNormalisation';
import { resolveSessionAnalysisPlan, shouldRunEmdrPipeline } from '../src/clinical-intelligence/lib/lensGovernance';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import { validateTaAnalysis } from '../worker/clinical-ai/schemaTa';
import { TA_LENS_SYSTEM_APPEND } from '../worker/clinical-ai/prompts/transactionalAnalysis';

describe('Lisa TA-first golden case', () => {
  it('keeps the de-identified fixture out of production assumptions and embeds key clinical quotes', () => {
    for (const q of LISA_KEY_QUOTES.bePerfect) {
      expect(LISA_GOLDEN_TRANSCRIPT_DEIDENTIFIED).toContain(q);
    }
    for (const q of LISA_KEY_QUOTES.permissions) {
      expect(LISA_GOLDEN_TRANSCRIPT_DEIDENTIFIED).toContain(q);
    }
    expect(LISA_GOLDEN_CONTEXT.primaryTreatmentApproach).toBe('transactional-analysis');
    expect(LISA_GOLDEN_CONTEXT.emdrActive).toBe(false);
  });

  it('normalises speakers conservatively without inventing participants', () => {
    const result = normaliseTranscriptSpeakers(LISA_GOLDEN_TRANSCRIPT_DEIDENTIFIED, {
      therapistNames: ['Brent'],
      clientNames: ['Lisa'],
    });
    expect(result.originalTranscript).toBe(LISA_GOLDEN_TRANSCRIPT_DEIDENTIFIED);

    const brent = result.speakerMap.find((s) => s.rawLabel === 'Brent');
    expect(brent?.normalisedRole).toBe('therapist');
    expect(brent?.confidence).toBe('high');

    const speaker1 = result.speakerMap.find((s) => s.rawLabel === 'Speaker 1');
    expect(speaker1?.normalisedRole).toBe('client');
    expect(speaker1?.confidence).toBe('high');

    const ashley = result.speakerMap.find((s) => s.rawLabel === 'Ashley');
    expect(ashley?.normalisedRole).toBe('client');
    expect(ashley?.confidence).toBe('uncertain');

    const speaker4 = result.speakerMap.find((s) => s.rawLabel === 'Speaker 4');
    expect(speaker4?.confidence).toBe('uncertain');

    // No extra invented people beyond labelled speakers
    expect(result.speakerMap.map((s) => s.rawLabel).sort()).toEqual(
      ['Ashley', 'Brent', 'Speaker 1', 'Speaker 4'].sort(),
    );
  });

  it('routes TA-primary primary-lens-only without EMDR pipeline', () => {
    const client = emptyClientRecord('lisa', 't1', 'Lisa', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'transactional-analysis';
    const plan = resolveSessionAnalysisPlan({
      client,
      reasoningMode: 'primary-lens-only',
    });
    expect(plan.runTa).toBe(true);
    expect(plan.runEmdr).toBe(false);
    expect(
      shouldRunEmdrPipeline({
        reasoningMode: 'primary-lens-only',
        primaryApproach: 'transactional-analysis',
        clinicalLens: 'transactional-analysis',
      }),
    ).toBe(false);
  });

  it('passes the Lisa quality scorecard on the expected TA analysis', () => {
    const analysis = buildLisaExpectedTaAnalysis();
    const validated = validateTaAnalysis(analysis);
    const score = scoreLisaTaAnalysis(validated);
    if (!score.pass) {
      // eslint-disable-next-line no-console
      console.error(score.checks.filter((c) => !c.pass));
    }
    expect(score.pass).toBe(true);
    expect(validated.drivers.find((d) => d.driver === 'be-perfect')?.evidenceStrength).toBe(
      'strong',
    );
    expect(
      validated.injunctionHypotheses.find((i) => i.injunction === 'dont-feel')?.hypothesisLabel,
    ).toBe('Possible injunction hypothesis');
  });

  it('FAILS EMDR leakage regression when AIP constructs are injected', () => {
    const dirty = {
      ...buildLisaExpectedTaAnalysis(),
      themes: [{ theme: 'responsibility-defectiveness', primary: true }],
      negativeCognitions: [{ value: 'I am not good enough' }],
    };
    const leaks = detectEmdrLeakage(dirty);
    expect(leaks.length).toBeGreaterThan(0);
    expect(leaks.some((l) => l.includes('themes') || l.includes('negativeCognitions'))).toBe(true);
  });

  it('FAILS scorecard when grief is erased and fact-claims appear', () => {
    const bad = buildLisaExpectedTaAnalysis();
    bad.summary.value = 'Client has Be Perfect driver and Don\'t Feel injunction.';
    bad.summary.evidence = [];
    const score = scoreLisaTaAnalysis(bad);
    expect(score.checks.find((c) => c.id === 'no-fact-claims')?.pass).toBe(false);
  });

  it('documents TA client-language-first principle in the prompt', () => {
    expect(TA_LENS_SYSTEM_APPEND).toMatch(/client's words remain primary/i);
    expect(TA_LENS_SYSTEM_APPEND).toMatch(/Protective function/i);
    expect(TA_LENS_SYSTEM_APPEND).toMatch(/Do not over-theorise grief/i);
    expect(TA_LENS_SYSTEM_APPEND).toMatch(/NEVER invent EMDR/);
  });

  it('integrated complementary lenses stay suggestions without EMDR formulation fields', () => {
    const analysis = buildLisaExpectedTaAnalysis();
    analysis.reasoningMode = 'integrated';
    analysis.lensConsiderations = [
      {
        id: 'lc1',
        lens: 'gestalt',
        relevance: 'potentially-relevant',
        reason: 'Difficulty staying with present emotional experience; unfinished business',
        label: 'Possible complementary clinical lens',
      },
      {
        id: 'lc2',
        lens: 'attachment',
        relevance: 'potentially-relevant',
        reason: 'Emotional room; being useful versus being known',
        label: 'Possible complementary clinical lens',
      },
      {
        id: 'lc3',
        lens: 'emdr',
        relevance: 'limited-current-evidence',
        reason: 'Discrete earlier experiences may later warrant trauma-processing consideration',
        label: 'Possible complementary clinical lens',
      },
    ];
    const validated = validateTaAnalysis(analysis);
    expect(validated.lensConsiderations?.every((c) => c.label === 'Possible complementary clinical lens')).toBe(
      true,
    );
    expect(detectEmdrLeakage(validated)).toEqual([]);
    expect((validated as { targetCandidates?: unknown }).targetCandidates).toBeUndefined();
  });
});
