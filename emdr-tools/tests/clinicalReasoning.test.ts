import { describe, expect, it } from 'vitest';
import {
  CLINICAL_LENS_LABELS,
  emptyCoreFormulation,
  emptyTaLensFormulation,
  protocolToLens,
} from '../src/clinical-intelligence/clinicalReasoning';
import {
  deriveCoreFormulation,
  ensureClinicalReasoningStores,
} from '../src/clinical-intelligence/lib/coreFormulation';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import { validateTaAnalysis } from '../worker/clinical-ai/schemaTa';
import { assertAnalyseRequest } from '../worker/clinical-ai/analyse';

describe('clinical reasoning engine', () => {
  it('maps protocols to lenses without inventing client types', () => {
    expect(protocolToLens('standard-emdr')).toBe('emdr');
    expect(protocolToLens('transactional-analysis')).toBe('transactional-analysis');
    expect(protocolToLens('integrated')).toBe('integrated');
    expect(CLINICAL_LENS_LABELS.integrated).toBe('Integrated');
  });

  it('derives modality-agnostic core from existing EMDR fields without data loss', () => {
    const client = emptyClientRecord('c1', 't1', 'Ashley', '2026-08-15T10:00:00.000Z');
    client.presentingProblems = ['Workplace evaluation anxiety'];
    client.triggers = [{ id: 'tr1', text: 'Manager review' }];
    client.memories = [
      { id: 'm1', headline: 'Maternal criticism', approximateAge: 10 },
    ];
    client.resources = [{ id: 'r1', kind: 'internal', text: 'Running' }];
    client.themes = [
      { theme: 'responsibility-defectiveness', primary: true, confidence: 'high' },
    ];
    client.activeTarget = {
      headline: 'School reports',
      nc: 'I am not good enough',
      sud: 7,
    };

    const core = deriveCoreFormulation(client);
    expect(core.presentingProblems[0]?.text).toBe('Workplace evaluation anxiety');
    expect(core.significantExperiences[0]?.headline).toBe('Maternal criticism');
    expect(core.currentTriggers[0]?.text).toBe('Manager review');
    // EMDR-specific stays on client — not forced into core as NC/SUD
    expect((core as { activeTarget?: unknown }).activeTarget).toBeUndefined();
    expect(client.activeTarget?.nc).toBe('I am not good enough');
    expect(client.themes[0]?.theme).toBe('responsibility-defectiveness');
  });

  it('ensures TA lens store without wiping EMDR data', () => {
    const client = emptyClientRecord('c2', 't1', 'Tom', '2026-08-15T10:00:00.000Z');
    client.themes = [{ theme: 'belonging', confidence: 'moderate' }];
    const next = ensureClinicalReasoningStores(client);
    expect(next.themes.length).toBe(1);
    expect(next.coreFormulation).toBeTruthy();
    expect(next.taLens).toEqual(expect.objectContaining(emptyTaLensFormulation()));
    expect(next.activeApproaches).toContain('emdr');
  });

  it('validates TA analysis and forces cautious injunction labelling', () => {
    const raw = {
      analysisKind: 'ta-formulation',
      clinicalLens: 'transactional-analysis',
      summary: {
        id: 's1',
        value: 'Evaluation anxiety with possible Be Perfect pattern',
        evidenceLevel: 'suggested',
        confidence: 'moderate',
        evidence: [{ excerpt: 'nothing I do feels good enough' }],
        reviewStatus: 'pending',
      },
      egoStates: [],
      drivers: [
        {
          id: 'd1',
          driver: 'be-perfect',
          evidenceLevel: 'suggested',
          confidence: 'moderate',
          evidence: [{ excerpt: "If it isn't right I feel like I've failed." }],
          reasoning: 'Perfection language around evaluation',
          reviewStatus: 'pending',
          clinicalLens: 'transactional-analysis',
        },
      ],
      injunctionHypotheses: [
        {
          id: 'i1',
          injunction: 'dont-succeed',
          hypothesisLabel: 'wrong',
          evidenceLevel: 'suggested',
          confidence: 'low',
          evidence: [{ excerpt: "don't want people to think I'm useless" }],
          reasoning: 'Weak support',
          reviewStatus: 'pending',
          clinicalLens: 'transactional-analysis',
        },
      ],
      scriptMessages: [],
      lifePositions: [],
      transactions: [],
      gamePatterns: [],
      racketSystems: [],
      discounting: [],
      redecisionAreas: [],
      unansweredQuestions: [],
      clarificationSuggestions: [],
      noSufficientTaEvidence: false,
    };
    const v = validateTaAnalysis(raw);
    expect(v.injunctionHypotheses[0]?.hypothesisLabel).toBe('Possible injunction hypothesis');
    expect(v.drivers[0]?.driver).toBe('be-perfect');
  });

  it('accepts TA and integrated analyse requests', () => {
    const ta = assertAnalyseRequest({
      clientId: 'c1',
      protocol: 'transactional-analysis',
      phase: 'history',
      transcript: 'CLIENT:\nI feel like a child when reviewed.',
    });
    expect(ta.clinicalLens).toBe('transactional-analysis');
    expect(ta.phase).toBe('formulation');

    const emdr = assertAnalyseRequest({
      clientId: 'c1',
      protocol: 'standard-emdr',
      phase: 'history',
      transcript: 'CLIENT:\nHello',
    });
    expect(emdr.clinicalLens).toBe('emdr');
    expect(emdr.protocol).toBe('standard-emdr');
  });

  it('starts from empty core formulation factory', () => {
    expect(emptyCoreFormulation().workingHypotheses).toEqual([]);
  });
});
