import { describe, expect, it } from 'vitest';
import { validateTranscriptAnalysis } from '../worker/clinical-ai/schema';
import { applyApprovedFindings, emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import type { TranscriptAnalysis } from '../src/clinical-intelligence/types';
import { SYNTHETIC_TEST_TRANSCRIPT } from '../src/clinical-intelligence/lib/api';

function sampleAnalysis(): TranscriptAnalysis {
  const ev = [{ excerpt: 'nothing I did was ever good enough', speaker: 'client' as const, startOffset: null as unknown as undefined, endOffset: undefined }];
  const base = {
    evidenceLevel: 'suggested' as const,
    confidence: 'high' as const,
    evidence: [{ excerpt: 'anxious when my manager comments', speaker: 'client' as const }],
    reviewStatus: 'approved' as const,
  };
  return {
    summary: { id: 's1', value: 'Work anxiety linked to school criticism', ...base },
    presentingProblems: [{ id: 'p1', value: 'Work-related anxiety around criticism', ...base }],
    symptoms: [{ id: 'sy1', value: 'Anxiety', ...base }],
    recentExamples: [{ id: 'r1', value: 'Manager comments on work', ...base }],
    triggers: [{ id: 't1', value: 'Manager commenting on work', relatedMemories: ['m1'], ...base }],
    memories: [
      {
        id: 'm1',
        headline: 'School reports / maternal criticism',
        approximateAge: 10,
        description: 'Focus on the one B',
        possibleThemes: ['responsibility-defectiveness'],
        possibleTouchstoneCandidate: true,
        evidenceLevel: 'explicit',
        confidence: 'high',
        evidence: ev,
        reviewStatus: 'approved',
      },
    ],
    associativeLinks: [
      {
        id: 'al1',
        value: 'Manager criticism in the present links to maternal school-report criticism around age 10',
        ...base,
        evidence: ev,
      },
    ],
    themes: [
      {
        id: 'th1',
        theme: 'responsibility-defectiveness',
        confidence: 'high',
        evidenceLevel: 'suggested',
        reasoning: 'Not good enough language',
        evidence: ev,
        relatedMemories: ['m1'],
        relatedTriggers: ['t1'],
        possibleCognitions: ['I am not good enough'],
        reviewStatus: 'approved',
      },
    ],
    negativeCognitions: [
      {
        id: 'nc1',
        value: 'I am not good enough',
        kind: 'suggested',
        polarity: 'negative',
        ...base,
        evidence: ev,
      },
    ],
    positiveCognitions: [],
    internalResources: [{ id: 'ir1', value: 'Running', ...base }],
    externalResources: [{ id: 'er1', value: 'Supportive wife', ...base }],
    targetCandidates: [
      {
        id: 'tc1',
        value: 'School-report memory',
        relatedMemoryId: 'm1',
        approximateAge: 10,
        possibleThemes: ['responsibility-defectiveness'],
        ...base,
      },
    ],
    clinicalConsiderations: [],
    unansweredQuestions: [
      'Target image not established',
      'Positive Cognition not established',
      'VOC not established',
      'SUD not established',
      'Body sensation not established',
    ],
    clarificationSuggestions: ['Clarify which school memory feels most disturbing now.'],
  };
}

describe('clinical intelligence schema', () => {
  it('validates a well-formed analysis object', () => {
    const result = validateTranscriptAnalysis(sampleAnalysis());
    expect(result.ok).toBe(true);
  });

  it('rejects missing arrays', () => {
    const result = validateTranscriptAnalysis({ summary: { id: 'x' } });
    expect(result.ok).toBe(false);
  });
});

describe('applyApprovedFindings', () => {
  it('applies approved findings without inventing PC/VOC', () => {
    const client = emptyClientRecord('c1', 't1', 'Test', new Date().toISOString());
    const { client: next, conflictsRemaining } = applyApprovedFindings(client, sampleAnalysis(), 'ai1', {
      nowIso: new Date().toISOString(),
    });
    expect(conflictsRemaining).toEqual([]);
    expect(next.presentingProblem).toMatch(/anxiety/i);
    expect(next.triggers[0]?.text).toMatch(/manager/i);
    expect(next.memories[0]?.approximateAge).toBe(10);
    expect(next.themes[0]?.theme).toBe('responsibility-defectiveness');
    expect(next.approvedNc).toMatch(/not good enough/i);
    expect(next.approvedPc).toBeUndefined();
    expect(next.resources.some((r) => /wife/i.test(r.text))).toBe(true);
    expect(next.resources.some((r) => /running/i.test(r.text))).toBe(true);
    expect(next.targetCandidates[0]?.headline).toMatch(/school/i);
    expect(next.activeTarget).toBeUndefined();
  });

  it('does not silently replace an existing primary theme', () => {
    const client = emptyClientRecord('c1', 't1', 'Test', new Date().toISOString());
    client.themes = [
      {
        theme: 'safety-vulnerability',
        primary: true,
        approvedAt: new Date().toISOString(),
      },
    ];
    const analysis = sampleAnalysis();
    const { conflictsRemaining } = applyApprovedFindings(client, analysis, 'ai1', {
      nowIso: new Date().toISOString(),
    });
    expect(conflictsRemaining.some((c) => /conflict/i.test(c))).toBe(true);
  });
});

describe('synthetic transcript fixture', () => {
  it('contains expected clinical anchors and omits Phase 3 markers', () => {
    expect(SYNTHETIC_TEST_TRANSCRIPT).toMatch(/manager comments/i);
    expect(SYNTHETIC_TEST_TRANSCRIPT).toMatch(/School reports/i);
    expect(SYNTHETIC_TEST_TRANSCRIPT).toMatch(/ever good enough/i);
    expect(SYNTHETIC_TEST_TRANSCRIPT).toMatch(/wife/i);
    expect(SYNTHETIC_TEST_TRANSCRIPT).toMatch(/Running/i);
    expect(SYNTHETIC_TEST_TRANSCRIPT.toLowerCase()).not.toMatch(/\bvoc\b/);
    expect(SYNTHETIC_TEST_TRANSCRIPT.toLowerCase()).not.toMatch(/\bsud\b/);
  });
});
