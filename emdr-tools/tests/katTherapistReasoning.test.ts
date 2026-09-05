import { describe, expect, it } from 'vitest';
import {
  KAT_GOLDEN_CONTEXT,
  KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED,
  KAT_KEY_OBSERVATIONS,
  KAT_RISK_PHRASES,
} from './fixtures/ta-kat-golden/katGoldenFixture';
import {
  buildKatExpectedProcessFormulation,
  detectEmdrLeakageKat,
  scoreKatReasoning,
} from './fixtures/ta-kat-golden/katScorecard';
import { segmentTranscriptSession, detectRiskLanguage } from '../src/clinical-intelligence/lib/sessionSegmentation';
import { resolveSessionAnalysisPlan } from '../src/clinical-intelligence/lib/lensGovernance';
import {
  DEFAULT_REASONING_SEQUENCE,
  emptyTherapistReasoningProfile,
} from '../src/clinical-intelligence/therapistReasoning';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import { buildLisaExpectedTaAnalysis } from './fixtures/ta-lisa-golden/lisaScorecard';
import { CORE_SYSTEM_PROMPT } from '../worker/clinical-ai/prompts/core';

describe('Kat therapist-reasoning golden case', () => {
  it('embeds key observations and risk phrases in the de-identified fixture', () => {
    expect(KAT_GOLDEN_CONTEXT.primaryTreatmentApproach).toBe('transactional-analysis');
    expect(KAT_GOLDEN_CONTEXT.emdrActive).toBe(false);
    for (const q of KAT_KEY_OBSERVATIONS) {
      expect(KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED.toLowerCase()).toContain(q.toLowerCase());
    }
    for (const r of KAT_RISK_PHRASES) {
      expect(KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED).toContain(r);
    }
  });

  it('segments session vs navigation / post-session without mutating raw transcript', () => {
    const seg = segmentTranscriptSession(KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED, {
      clinicalEndTimestamp: '01:17:33',
    });
    expect(seg.originalTranscript).toBe(KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED);
    expect(seg.sessionOnlyText).toContain('I feel cornered');
    expect(seg.sessionOnlyText).not.toMatch(/Continue straight for 200 metres/i);
    expect(seg.sessionOnlyText).not.toMatch(/ChatGPT/i);
    expect(seg.segments.some((s) => s.kind === 'non-session-audio' || s.kind === 'post-session')).toBe(
      true,
    );
    expect(
      seg.segments
        .filter((s) => s.kind !== 'session')
        .every((s) => s.excludeFromClinicalAnalysisSuggested),
    ).toBe(true);
  });

  it('flags risk language without inventing severity', () => {
    const risks = detectRiskLanguage(KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED);
    expect(risks.some((r) => r.kind === 'self-harm')).toBe(true);
    expect(risks.some((r) => r.kind === 'not-wanting-to-live')).toBe(true);
  });

  it('passes Kat process scorecard', () => {
    const process = buildKatExpectedProcessFormulation();
    const seg = segmentTranscriptSession(KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED);
    const ta = buildLisaExpectedTaAnalysis();
    ta.primaryApproach = 'transactional-analysis';
    ta.reasoningMode = 'primary-lens-only';
    // Re-tag as Kat-shaped TA without EMDR fields
    const score = scoreKatReasoning({
      process,
      ta,
      sessionOnlyText: seg.sessionOnlyText,
      rawTranscript: KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED,
    });
    if (!score.pass) {
      // eslint-disable-next-line no-console
      console.error(score.checks.filter((c) => !c.pass));
    }
    expect(score.pass).toBe(true);
  });

  it('FAILS when EMDR constructs leak into TA analysis', () => {
    const dirty = {
      ...buildLisaExpectedTaAnalysis(),
      themes: [{ theme: 'responsibility-defectiveness' }],
      negativeCognitions: [{ value: 'I am powerless' }],
    };
    expect(detectEmdrLeakageKat(dirty).length).toBeGreaterThan(0);
  });

  it('FAILS when theory appears without observations or protective function is skipped', () => {
    const process = buildKatExpectedProcessFormulation();
    process.observations = [];
    process.protectiveFunctions = [];
    const seg = segmentTranscriptSession(KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED);
    const score = scoreKatReasoning({
      process,
      sessionOnlyText: seg.sessionOnlyText,
      rawTranscript: KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED,
    });
    expect(score.checks.find((c) => c.id === 'observations-before-theory')?.pass).toBe(false);
    expect(score.checks.find((c) => c.id === 'protective-function-present')?.pass).toBe(false);
  });

  it('routes Kat TA-primary without auto EMDR', () => {
    const client = emptyClientRecord('kat', 't1', 'Kat', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'transactional-analysis';
    const plan = resolveSessionAnalysisPlan({
      client,
      reasoningMode: 'primary-lens-only',
    });
    expect(plan.runTa).toBe(true);
    expect(plan.runEmdr).toBe(false);
  });

  it('keeps therapist reasoning profile disabled by default (no silent learning)', () => {
    const profile = emptyTherapistReasoningProfile('therapist_1');
    expect(profile.enabled).toBe(false);
    expect(profile.preferredSequence).toEqual(DEFAULT_REASONING_SEQUENCE);
    expect(profile.sourceSessionIds).toEqual([]);
  });

  it('documents reasoning and therapist-style principles in core prompt', () => {
    expect(CORE_SYSTEM_PROMPT).toMatch(/PATHFINDER REASONING PRINCIPLE/);
    expect(CORE_SYSTEM_PROMPT).toMatch(/PATHFINDER THERAPIST STYLE PRINCIPLE/);
    expect(CORE_SYSTEM_PROMPT).toMatch(/OBSERVE/);
    expect(CORE_SYSTEM_PROMPT).toMatch(/ASK PROTECTIVE FUNCTION/);
    expect(CORE_SYSTEM_PROMPT).toMatch(/preference layer, not a source of clinical truth/);
  });
});
