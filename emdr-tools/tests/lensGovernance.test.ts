import { describe, expect, it } from 'vitest';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import { validateTaAnalysis } from '../worker/clinical-ai/schemaTa';
import { assertAnalyseRequest } from '../worker/clinical-ai/analyse';
import {
  ensureLensGovernance,
  inferPrimaryApproach,
  shouldRunEmdrPipeline,
  shouldRunTaPipeline,
  resolveSessionAnalysisPlan,
  setPrimaryTreatmentApproach,
} from '../src/clinical-intelligence/lib/lensGovernance';

/** Kat — synthetic TA-primary client material (integration governance). */
const KAT_TRANSCRIPT = `
CLIENT: I don't know what I feel most of the time.
CLIENT: I can tell exactly how everyone else in the room is feeling.
CLIENT: My own needs don't seem to matter — I push them aside.
CLIENT: There's this voice that says I should cope and not make a fuss.
CLIENT: Years ago I used to hurt myself when it got too much.
CLIENT: People leave when I need them. I learned not to need anyone.
CLIENT: I keep saying I don't know what I feel.
`;

describe('integrative lens governance', () => {
  it('does not auto-assign EMDR to unspecified / empty clients', () => {
    const client = emptyClientRecord('c_new', 't1', 'New', '2026-08-15T10:00:00.000Z');
    expect(inferPrimaryApproach(client)).toBe('unspecified');
    const governed = ensureLensGovernance(client);
    expect(governed.primaryTreatmentApproach).toBe('unspecified');
  });

  it('migrates existing EMDR data to primary EMDR without loss', () => {
    const client = emptyClientRecord('c_emdr', 't1', 'Em', '2026-08-15T10:00:00.000Z');
    client.themes = [{ theme: 'belonging', confidence: 'high', primary: true }];
    client.activeTarget = { headline: 'School', nc: 'I am alone' };
    const governed = ensureLensGovernance(client);
    expect(governed.primaryTreatmentApproach).toBe('emdr');
    expect(governed.themes[0]?.theme).toBe('belonging');
    expect(governed.activeTarget?.nc).toBe('I am alone');
  });

  it('TA primary: primary-lens-only runs TA and not EMDR', () => {
    const client = emptyClientRecord('kat', 't1', 'Kat', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'transactional-analysis';
    const plan = resolveSessionAnalysisPlan({
      client,
      reasoningMode: 'primary-lens-only',
    });
    expect(plan.runTa).toBe(true);
    expect(plan.runEmdr).toBe(false);
    expect(plan.clinicalLens).toBe('transactional-analysis');
  });

  it('TA primary: integrated does not run full EMDR pipeline', () => {
    const client = emptyClientRecord('kat2', 't1', 'Kat', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'transactional-analysis';
    expect(
      shouldRunEmdrPipeline({
        reasoningMode: 'integrated',
        primaryApproach: 'transactional-analysis',
        clinicalLens: 'integrated',
      }),
    ).toBe(false);
    expect(
      shouldRunTaPipeline({
        reasoningMode: 'integrated',
        primaryApproach: 'transactional-analysis',
        clinicalLens: 'integrated',
      }),
    ).toBe(true);
  });

  it('Explore EMDR can activate EMDR for a TA client intentionally', () => {
    expect(
      shouldRunEmdrPipeline({
        reasoningMode: 'primary-lens-only',
        primaryApproach: 'transactional-analysis',
        clinicalLens: 'transactional-analysis',
        exploreEmdr: true,
      }),
    ).toBe(true);
  });

  it('changing primary approach preserves TA and EMDR stores', () => {
    const client = emptyClientRecord('c_switch', 't1', 'Sam', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'transactional-analysis';
    client.taLens = {
      egoStateObservations: [],
      drivers: [{ id: 'd1', driver: 'be-strong' }],
      injunctionHypotheses: [],
      scriptMessages: [],
      lifePositions: [],
      transactions: [],
      gamePatterns: [],
      racketSystems: [],
      discounting: [],
      redecisionAreas: [],
      scriptSummary: 'Stay strong alone',
    };
    client.themes = [{ theme: 'safety-vulnerability', confidence: 'moderate' }];
    const next = setPrimaryTreatmentApproach(client, 'emdr');
    expect(next.primaryTreatmentApproach).toBe('emdr');
    expect(next.taLens?.drivers[0]?.driver).toBe('be-strong');
    expect(next.themes[0]?.theme).toBe('safety-vulnerability');
    expect(next.treatmentApproachHistory?.length).toBeGreaterThan(0);
  });

  it('Kat TA analysis schema rejects silent EMDR fields and keeps cautious labels', () => {
    const raw = {
      analysisKind: 'ta-formulation',
      clinicalLens: 'transactional-analysis',
      summary: {
        id: 's1',
        value:
          'Difficulty identifying own feelings with greater awareness of others; self-critical pattern; relational trauma history',
        evidenceLevel: 'inferred',
        confidence: 'moderate',
        evidence: [{ excerpt: "I don't know what I feel" }],
        reviewStatus: 'pending',
      },
      egoStates: [
        {
          id: 'e1',
          egoState: 'critical-parent',
          evidenceLevel: 'suggested',
          confidence: 'moderate',
          evidence: [{ excerpt: 'voice that says I should cope' }],
          reasoning: 'Self-critical internal dialogue',
          reviewStatus: 'pending',
          clinicalLens: 'transactional-analysis',
        },
        {
          id: 'e2',
          egoState: 'adapted-child',
          evidenceLevel: 'suggested',
          confidence: 'moderate',
          evidence: [{ excerpt: 'push them aside' }],
          reasoning: 'Own needs dismissed',
          reviewStatus: 'pending',
          clinicalLens: 'transactional-analysis',
        },
      ],
      drivers: [
        {
          id: 'd1',
          driver: 'be-strong',
          evidenceLevel: 'suggested',
          confidence: 'moderate',
          evidence: [{ excerpt: 'not to need anyone' }],
          reasoning: 'Possible Be Strong',
          reviewStatus: 'pending',
          clinicalLens: 'transactional-analysis',
        },
        {
          id: 'd2',
          driver: 'please-others',
          evidenceLevel: 'suggested',
          confidence: 'moderate',
          evidence: [{ excerpt: 'how everyone else in the room is feeling' }],
          reasoning: 'Possible Please Others',
          reviewStatus: 'pending',
          clinicalLens: 'transactional-analysis',
        },
      ],
      injunctionHypotheses: [
        {
          id: 'i1',
          injunction: 'dont-feel',
          hypothesisLabel: 'Possible injunction hypothesis',
          evidenceLevel: 'suggested',
          confidence: 'moderate',
          evidence: [{ excerpt: "I don't know what I feel" }],
          reasoning: 'Possible Don\'t Feel',
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
      lensConsiderations: [],
      reasoningMode: 'primary-lens-only',
      primaryApproach: 'transactional-analysis',
    };
    const v = validateTaAnalysis(raw);
    expect(v.drivers.map((d) => d.driver)).toContain('be-strong');
    expect(v.drivers.map((d) => d.driver)).toContain('please-others');
    expect(v.injunctionHypotheses[0]?.hypothesisLabel).toBe('Possible injunction hypothesis');
    expect(v.injunctionHypotheses[0]?.injunction).toBe('dont-feel');
    // No EMDR constructs in TA formulation object
    expect((v as { themes?: unknown }).themes).toBeUndefined();
    expect((v as { negativeCognitions?: unknown }).negativeCognitions).toBeUndefined();
    expect(KAT_TRANSCRIPT.includes("I don't know what I feel")).toBe(true);
  });

  it('Kat integrated mode may list complementary lenses without full EMDR formulation', () => {
    const raw = {
      analysisKind: 'ta-formulation',
      clinicalLens: 'transactional-analysis',
      summary: {
        id: 's1',
        value: 'Core + TA; complementary lenses noted',
        evidenceLevel: 'suggested',
        confidence: 'moderate',
        evidence: [{ excerpt: "I don't know what I feel" }],
        reviewStatus: 'pending',
      },
      egoStates: [],
      drivers: [
        {
          id: 'd1',
          driver: 'be-strong',
          evidenceLevel: 'suggested',
          confidence: 'moderate',
          evidence: [{ excerpt: 'cope and not make a fuss' }],
          reasoning: 'Be Strong',
          reviewStatus: 'pending',
          clinicalLens: 'transactional-analysis',
        },
      ],
      injunctionHypotheses: [],
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
      lensConsiderations: [
        {
          id: 'lc1',
          lens: 'gestalt',
          relevance: 'potentially-relevant',
          reason: 'Difficulty contacting present emotional experience',
          label: 'Possible complementary clinical lens',
        },
        {
          id: 'lc2',
          lens: 'attachment',
          relevance: 'potentially-relevant',
          reason: 'Relational trauma and expectations of others',
          label: 'Possible complementary clinical lens',
        },
        {
          id: 'lc3',
          lens: 'emdr',
          relevance: 'limited-current-evidence',
          reason: 'May be worth considering if discrete past–present linkages emerge',
          label: 'Possible complementary clinical lens',
        },
      ],
      reasoningMode: 'integrated',
      primaryApproach: 'transactional-analysis',
    };
    const v = validateTaAnalysis(raw);
    expect(v.lensConsiderations?.every((c) => c.label === 'Possible complementary clinical lens')).toBe(
      true,
    );
    expect(v.lensConsiderations?.some((c) => c.lens === 'gestalt')).toBe(true);
    expect((v as { targetCandidates?: unknown }).targetCandidates).toBeUndefined();
  });

  it('assertAnalyseRequest no longer defaults protocol to EMDR', () => {
    const req = assertAnalyseRequest({
      clientId: 'c1',
      transcript: 'Hello',
      phase: 'formulation',
      protocol: 'transactional-analysis',
      clinicalLens: 'transactional-analysis',
      reasoningMode: 'primary-lens-only',
      primaryApproach: 'transactional-analysis',
    });
    expect(req.protocol).toBe('transactional-analysis');
    expect(req.clinicalLens).toBe('transactional-analysis');
    const bare = assertAnalyseRequest({
      clientId: 'c1',
      transcript: 'Hello',
      phase: 'formulation',
    });
    expect(bare.protocol).toBe('general-psychotherapy');
    expect(bare.clinicalLens).not.toBe('emdr');
  });
});
