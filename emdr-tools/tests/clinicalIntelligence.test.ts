import { describe, expect, it } from 'vitest';
import { validateTranscriptAnalysis } from '../worker/clinical-ai/schema';
import { validatePhase3Analysis, validatePhase4Analysis } from '../worker/clinical-ai/schemaPhase34';
import {
  applyApprovedFindings,
  applyPhase3ToTarget,
  draftFromPhase3,
  emptyClientRecord,
} from '../worker/clinical-ai/applyFindings';
import { applySegmentDeltas } from '../worker/clinical-ai/segmentDiff';
import type {
  Phase3AssessmentAnalysis,
  Phase4DesensitisationAnalysis,
  TranscriptAnalysis,
} from '../src/clinical-intelligence/types';
import {
  SYNTHETIC_PHASE3_TRANSCRIPT,
  SYNTHETIC_PHASE4_TRANSCRIPT,
  SYNTHETIC_TEST_TRANSCRIPT,
} from '../src/clinical-intelligence/lib/api';

function sampleAnalysis(): TranscriptAnalysis {
  const ev = [{ excerpt: 'nothing I did was ever good enough', speaker: 'client' as const, startOffset: null as unknown as undefined, endOffset: undefined }];
  const base = {
    evidenceLevel: 'suggested' as const,
    confidence: 'high' as const,
    evidence: [{ excerpt: 'anxious when my manager comments', speaker: 'client' as const }],
    reviewStatus: 'approved' as const,
  };
  return {
    analysisKind: 'phase1-history',
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

  it('allows approving multiple new themes together without false conflict', () => {
    const client = emptyClientRecord('c1', 't1', 'Test', new Date().toISOString());
    const analysis = sampleAnalysis();
    analysis.themes.push({
      id: 'th2',
      theme: 'power-control',
      confidence: 'low',
      evidenceLevel: 'unknown',
      reasoning: 'Weak / not dominant',
      evidence: [],
      relatedMemories: [],
      relatedTriggers: [],
      possibleCognitions: [],
      reviewStatus: 'approved',
    });
    const { conflictsRemaining, client: next } = applyApprovedFindings(client, analysis, 'ai1', {
      nowIso: new Date().toISOString(),
    });
    expect(conflictsRemaining).toEqual([]);
    expect(next.themes.length).toBeGreaterThanOrEqual(2);
    expect(next.themes.filter((t) => t.primary).length).toBe(1);
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

  it('Phase 3 synthetic includes explicit VoC and SUD numbers', () => {
    expect(SYNTHETIC_PHASE3_TRANSCRIPT).toMatch(/About a 3/);
    expect(SYNTHETIC_PHASE3_TRANSCRIPT).toMatch(/A 7/);
    expect(SYNTHETIC_PHASE3_TRANSCRIPT).toMatch(/not good enough/i);
    expect(SYNTHETIC_PHASE3_TRANSCRIPT).toMatch(/I am good enough/i);
  });

  it('Phase 4 synthetic preserves processing sequence cues without declaring resolution', () => {
    expect(SYNTHETIC_PHASE4_TRANSCRIPT).toMatch(/Go with that/);
    expect(SYNTHETIC_PHASE4_TRANSCRIPT).toMatch(/Maybe a 5/);
    expect(SYNTHETIC_PHASE4_TRANSCRIPT.toLowerCase()).not.toMatch(/resolved/);
  });
});

function samplePhase3(): Phase3AssessmentAnalysis {
  const base = {
    evidenceLevel: 'explicit' as const,
    confidence: 'high' as const,
    evidence: [{ excerpt: 'About a 3', speaker: 'client' as const }],
    reviewStatus: 'approved' as const,
  };
  return {
    analysisKind: 'phase3-assessment',
    summary: { id: 's', value: 'School report target assessed', ...base },
    target: { id: 't', value: 'School report age 10', ...base },
    worstPart: { id: 'w', value: "Mum's disappointed face", ...base },
    image: { id: 'i', value: "Mum opening the report", ...base },
    negativeCognition: {
      id: 'nc',
      value: "I'm not good enough",
      kind: 'explicit',
      polarity: 'negative',
      ...base,
    },
    positiveCognition: {
      id: 'pc',
      value: 'I am good enough',
      kind: 'explicit',
      polarity: 'positive',
      ...base,
    },
    voc: { id: 'v', value: 'VoC 3', ...base },
    vocNumeric: 3,
    emotion: { id: 'e', value: 'Shame', ...base },
    sud: { id: 'su', value: 'SUD 7', ...base },
    sudNumeric: 7,
    bodyLocation: { id: 'b', value: 'Chest', ...base },
    unansweredQuestions: [],
    clarificationSuggestions: [],
  };
}

function samplePhase4(): Phase4DesensitisationAnalysis {
  const base = {
    evidenceLevel: 'explicit' as const,
    confidence: 'moderate' as const,
    evidence: [{ excerpt: 'hotter in my chest', speaker: 'client' as const }],
    reviewStatus: 'approved' as const,
  };
  return {
    analysisKind: 'phase4-desensitisation',
    summary: { id: 's', value: 'Processing mid-channel', ...base },
    sequence: [
      {
        id: 'st1',
        order: 1,
        sequenceLabel: 'Set 1',
        timestamp: null,
        category: 'body',
        value: 'Chest hotter',
        ...base,
      },
      {
        id: 'st2',
        order: 2,
        sequenceLabel: 'Later association',
        timestamp: null,
        category: 'new-memory',
        value: 'Told off in class',
        ...base,
      },
    ],
    associations: [{ id: 'a1', value: 'Classroom telling-off', ...base }],
    newMemories: [],
    adaptiveInformation: [{ id: 'ad1', value: 'She was stressed — not only about me', ...base }],
    sudChanges: [{ id: 'sc1', value: 'SUD around 5', ...base }],
    feederMemories: [],
    blockingBeliefs: [{ id: 'bb1', value: 'I have to be perfect or people will leave', ...base }],
    therapistInterventions: [{ id: 'ti1', value: 'Go with that', ...base }],
    imageThoughtEmotionBodyChanges: [{ id: 'ch1', value: "Mum's face softer", ...base }],
    resolutionStatus: 'in-progress',
    unansweredQuestions: [],
    clarificationSuggestions: [],
  };
}

describe('phase 3 assessment', () => {
  it('validates Phase 3 and never keeps inferred numeric VoC/SUD', () => {
    const ok = validatePhase3Analysis(samplePhase3());
    expect(ok.ok).toBe(true);
    const bad = validatePhase3Analysis({
      ...samplePhase3(),
      voc: {
        id: 'v',
        value: 'seems high',
        evidenceLevel: 'inferred',
        confidence: 'low',
        evidence: [],
        reviewStatus: 'pending',
      },
      vocNumeric: 6,
      sud: null,
      sudNumeric: 4,
    });
    expect(bad.ok).toBe(true);
    if (bad.ok) {
      expect(bad.value.vocNumeric).toBeNull();
      expect(bad.value.sudNumeric).toBeNull();
    }
  });

  it('Apply to Target Assessment writes activeTarget without inventing missing numbers', () => {
    const client = emptyClientRecord('c1', 't1', 'Test', new Date().toISOString());
    const analysis = samplePhase3();
    analysis.voc = null;
    analysis.vocNumeric = null;
    analysis.unansweredQuestions = ['VoC not established'];
    const { client: next, draft } = applyPhase3ToTarget(client, analysis, 'ai3', new Date().toISOString());
    expect(next.activeTarget?.headline).toMatch(/school/i);
    expect(next.activeTarget?.nc).toMatch(/not good enough/i);
    expect(next.activeTarget?.sud).toBe(7);
    expect(next.activeTarget?.voc).toBeNull();
    expect(draft.unanswered.some((q) => /voc/i.test(q))).toBe(true);
    expect(draftFromPhase3(analysis).voc).toBeNull();
  });
});

describe('phase 4 desensitisation', () => {
  it('validates ordered sequence and never claims resolution', () => {
    const result = validatePhase4Analysis(samplePhase4());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.resolutionStatus).not.toBe('complete' as never);
      expect(result.value.sequence[0].timestamp).toBeNull();
    }
  });

  it('applies approved sequence to processingNotes without resolving target', () => {
    const client = emptyClientRecord('c1', 't1', 'Test', new Date().toISOString());
    client.activeTarget = { headline: 'School', sud: 7, voc: 3 };
    const { client: next } = applyApprovedFindings(client, samplePhase4(), 'ai4', {
      nowIso: new Date().toISOString(),
    });
    expect(next.processingNotes?.length).toBeGreaterThan(0);
    expect(next.activeTarget?.sud).toBe(7);
  });

  it('segment diff marks already-known vs new sequence steps', () => {
    const prior = samplePhase4();
    const incoming = samplePhase4();
    incoming.sequence = [
      { ...prior.sequence[0], id: 'new1', value: 'Chest hotter' },
      {
        id: 'new2',
        order: 3,
        sequenceLabel: 'Set 3',
        timestamp: null,
        category: 'adaptive',
        value: 'Fresh adaptive channel',
        evidenceLevel: 'suggested',
        confidence: 'moderate',
        evidence: [],
        reviewStatus: 'pending',
      },
    ];
    const tagged = applySegmentDeltas(incoming, prior);
    expect(tagged.analysisKind).toBe('phase4-desensitisation');
    if (tagged.analysisKind === 'phase4-desensitisation') {
      expect(tagged.sequence[0].findingDelta).toBe('already-known');
      expect(tagged.sequence[1].findingDelta).toBe('new');
    }
  });
});
