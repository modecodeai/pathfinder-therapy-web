import { describe, expect, it } from 'vitest';
import {
  buildAipFormulation,
  buildThemeSummary,
  computeSessionChange,
  confidenceToEvidenceStrength,
} from '../src/clinical-intelligence/lib/formulation';
import {
  applyApprovedFindings,
  applyPhase3ToTarget,
  emptyClientRecord,
} from '../worker/clinical-ai/applyFindings';
import type {
  Phase3AssessmentAnalysis,
  Phase4DesensitisationAnalysis,
  TranscriptAnalysis,
} from '../src/clinical-intelligence/types';

function phase1Approved(): TranscriptAnalysis {
  const base = {
    evidenceLevel: 'suggested' as const,
    confidence: 'high' as const,
    evidence: [{ excerpt: 'nothing I did was ever good enough', speaker: 'client' as const }],
    reviewStatus: 'approved' as const,
  };
  return {
    analysisKind: 'phase1-history',
    summary: { id: 's1', value: 'Work anxiety linked to school criticism', ...base },
    presentingProblems: [{ id: 'p1', value: 'Work-related anxiety around criticism', ...base }],
    symptoms: [],
    recentExamples: [],
    triggers: [{ id: 't1', value: 'Manager commenting on work', ...base }],
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
        evidence: base.evidence,
        reviewStatus: 'approved',
      },
    ],
    associativeLinks: [],
    themes: [
      {
        id: 'th1',
        theme: 'responsibility-defectiveness',
        confidence: 'high',
        evidenceLevel: 'suggested',
        reasoning: 'Not good enough language',
        evidence: base.evidence,
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
      },
    ],
    positiveCognitions: [],
    internalResources: [{ id: 'ir1', value: 'Running', ...base }],
    externalResources: [{ id: 'er1', value: 'Supportive wife', ...base }],
    targetCandidates: [
      {
        id: 'tc1',
        value: 'School-report memory',
        approximateAge: 10,
        ...base,
      },
    ],
    clinicalConsiderations: [],
    unansweredQuestions: [],
    clarificationSuggestions: [],
  };
}

function phase3Approved(): Phase3AssessmentAnalysis {
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
    worstPart: null,
    image: { id: 'i', value: "Mum's disappointed face", ...base },
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

function phase4Approved(): Phase4DesensitisationAnalysis {
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
    ],
    associations: [],
    newMemories: [],
    adaptiveInformation: [
      { id: 'ad1', value: 'She was stressed a lot — it was not only about me', ...base },
    ],
    sudChanges: [{ id: 'sc1', value: 'SUD around 5', ...base }],
    feederMemories: [],
    blockingBeliefs: [],
    therapistInterventions: [],
    imageThoughtEmotionBodyChanges: [],
    resolutionStatus: 'in-progress',
    unansweredQuestions: [],
    clarificationSuggestions: [],
  };
}

describe('AIP formulation (approved only)', () => {
  it('maps confidence to evidence strength labels without pathology scores', () => {
    expect(confidenceToEvidenceStrength('high', true)).toBe('strong-evidence');
    expect(confidenceToEvidenceStrength('moderate', true)).toBe('moderate-evidence');
    expect(confidenceToEvidenceStrength('low', true)).toBe('limited-evidence');
    expect(confidenceToEvidenceStrength(undefined, false)).toBe('not-established');
  });

  it('builds longitudinal theme summary for all four themes', () => {
    const client = emptyClientRecord('c1', 't1', 'Test', new Date().toISOString());
    const { client: next } = applyApprovedFindings(client, phase1Approved(), 'ai1', {
      nowIso: new Date().toISOString(),
    });
    const themes = buildThemeSummary(next);
    expect(themes).toHaveLength(4);
    const resp = themes.find((t) => t.theme === 'responsibility-defectiveness');
    expect(resp?.strengthLabel).toBe('Strong evidence');
    expect(themes.find((t) => t.theme === 'belonging')?.strengthLabel).toBe('Not established');
  });

  it('acceptance: two synthetic sessions preserve Phase 1+3 data and add Phase 4 without duplicates', () => {
    const now = new Date().toISOString();
    let client = emptyClientRecord('c1', 't1', 'Synthetic', now);

    // Session 1 — History
    ({ client } = applyApprovedFindings(client, phase1Approved(), 'ai_s1', { nowIso: now }));
    expect(client.memories[0]?.approximateAge).toBe(10);
    expect(client.memories[0]?.headline).toMatch(/school/i);
    expect(client.triggers[0]?.text).toMatch(/manager/i);
    expect(client.themes[0]?.theme).toBe('responsibility-defectiveness');
    expect(client.approvedNc).toMatch(/not good enough/i);
    expect(client.resources.some((r) => /running/i.test(r.text))).toBe(true);
    expect(client.resources.some((r) => /wife/i.test(r.text))).toBe(true);

    // Session 1 continued — Phase 3 target
    const p3 = applyPhase3ToTarget(client, phase3Approved(), 'ai_s1b', now);
    client = p3.client;
    expect(client.activeTarget?.headline).toMatch(/school/i);
    expect(client.activeTarget?.sud).toBe(7);
    expect(client.activeTarget?.voc).toBe(3);

    const afterSession1 = JSON.parse(JSON.stringify(client)) as typeof client;

    // Session 2 — Phase 4 processing
    ({ client } = applyApprovedFindings(client, phase4Approved(), 'ai_s2', { nowIso: now }));

    // Preserve original approved material
    expect(client.memories.filter((m) => /school/i.test(m.headline))).toHaveLength(1);
    expect(client.triggers.filter((t) => /manager/i.test(t.text))).toHaveLength(1);
    expect(client.themes.filter((t) => t.theme === 'responsibility-defectiveness')).toHaveLength(1);
    expect(client.approvedNc).toMatch(/not good enough/i);
    expect(client.resources.filter((r) => /running/i.test(r.text))).toHaveLength(1);
    expect(client.activeTarget?.headline).toBe(afterSession1.activeTarget?.headline);
    expect(client.activeTarget?.sud).toBe(7);

    // Incorporate new Phase 4 material without wiping prior
    expect(client.processingNotes?.some((n) => /chest hotter/i.test(n.value))).toBe(true);
    expect(client.adaptiveInformation?.some((a) => /stressed/i.test(a.text))).toBe(true);

    // Re-applying same Phase 4 should not duplicate
    const noteCount = client.processingNotes?.length ?? 0;
    const adaptiveCount = client.adaptiveInformation?.length ?? 0;
    ({ client } = applyApprovedFindings(client, phase4Approved(), 'ai_s2b', { nowIso: now }));
    expect(client.processingNotes?.length).toBe(noteCount);
    expect(client.adaptiveInformation?.length).toBe(adaptiveCount);

    const view = buildAipFormulation(client);
    expect(view.hasApprovedFormulation).toBe(true);
    expect(view.memoryTimeline[0]?.approximateAge).toBe(10);
    expect(view.themes.find((t) => t.theme === 'responsibility-defectiveness')?.strength).toBe(
      'strong-evidence',
    );
    expect(view.network.nodes.every((n) => n.resolved === false)).toBe(true);
    expect(
      view.network.nodes.some((n) => n.type === 'memory' || n.type === 'touchstone-candidate'),
    ).toBe(true);
    expect(view.network.nodes.some((n) => n.type === 'trigger')).toBe(true);
    expect(view.network.nodes.some((n) => n.type === 'clinical-theme')).toBe(true);
    expect(view.network.nodes.some((n) => n.type === 'target')).toBe(true);
    expect(view.prongs.find((p) => p.prong === 'past')?.memories.length).toBeGreaterThan(0);
    expect(view.prongs.find((p) => p.prong === 'present')?.triggers.length).toBeGreaterThan(0);
    const anyNew = (client.sessionChanges ?? []).some((sc) =>
      sc.items.some((i) => i.kind === 'new'),
    );
    expect(anyNew).toBe(true);
  });

  it('session change distinguishes new vs unchanged', () => {
    const now = new Date().toISOString();
    const prior = emptyClientRecord('c1', 't1', 'T', now);
    prior.presentingProblems = ['Anxiety'];
    prior.triggers = [{ id: 't1', text: 'Manager comments' }];
    const next = {
      ...prior,
      presentingProblems: ['Anxiety'],
      triggers: [
        { id: 't1', text: 'Manager comments' },
        { id: 't2', text: 'School report reminder' },
      ],
      updatedAt: now,
    };
    const change = computeSessionChange(prior, next, {
      analysisId: 'ai',
      phase: 'history',
      nowIso: now,
    });
    expect(change.items.some((i) => i.kind === 'new' && /school report reminder/i.test(i.label))).toBe(
      true,
    );
    expect(change.items.some((i) => i.kind === 'unchanged' && /anxiety/i.test(i.label))).toBe(true);
  });
});
