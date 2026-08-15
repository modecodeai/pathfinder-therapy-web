/**
 * Review-state counters + Primary-lens preparation integrity.
 */

import { describe, expect, it } from 'vitest';
import {
  computeReviewFindingStats,
  filterFindingsByQueue,
  findingsEligibleForApproveAllConfirmed,
} from '../src/clinical-intelligence/lib/initialClinicalBrief';
import type { IntakeCoreFinding } from '../src/clinical-intelligence/lib/intakeReasoning';
import {
  buildClinicalSnapshot,
  buildPreparationBriefing,
  buildTreatmentStrategySuggestions,
  deriveOutstandingQuestions,
} from '../src/clinical-intelligence/lib/sessionBriefing';
import { createClinicalCycle } from '../src/clinical-intelligence/lib/clinicalCycle';
import {
  isProtocolEmdrDefaultMismatch,
  protocolLabelForClient,
  resolvePrimaryClinicalLens,
  sessionApproachMismatch,
  shouldShowEmdrPrepFields,
} from '../src/clinical-intelligence/lib/primaryLensPrep';
import {
  proposeTaLensFromApprovedCore,
  applyApprovedPendingTaFindings,
} from '../src/clinical-intelligence/lib/taLensFromApprovedCore';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import { emptyTaLensFormulation } from '../src/clinical-intelligence/clinicalReasoning';

function finding(
  partial: Partial<IntakeCoreFinding> & Pick<IntakeCoreFinding, 'id' | 'category' | 'text'>,
): IntakeCoreFinding {
  return {
    framing: 'client-reported-information',
    evidence: [],
    provenanceStatus: 'single',
    reviewStatus: 'pending',
    ...partial,
  };
}

describe('Review status counters', () => {
  it('tracks approved vs pending confirmed facts accurately after Approve All', () => {
    const findings: IntakeCoreFinding[] = [
      finding({ id: '1', category: 'symptom', text: 'Severe anxiety' }),
      finding({ id: '2', category: 'symptom', text: 'Poor sleep' }),
      finding({ id: '3', category: 'working-hypothesis', text: 'Possible protective function' }),
      finding({ id: '4', category: 'risk-clinical-review', text: 'Hopelessness — clinical review' }),
      finding({
        id: '5',
        category: 'outstanding-question',
        text: 'Clarify the childhood femur incident',
      }),
    ];
    const eligible = findingsEligibleForApproveAllConfirmed(findings);
    expect(eligible).toEqual(['1', '2']);
    const approved = findings.map((f) =>
      eligible.includes(f.id) ? { ...f, reviewStatus: 'approved' as const } : f,
    );
    const stats = computeReviewFindingStats(approved);
    expect(stats.total).toBe(5);
    expect(stats.approved).toBe(2);
    expect(stats.confirmedFactsPending).toBe(0);
    expect(stats.confirmedFactsApproved).toBe(2);
    expect(stats.workingHypothesesPending).toBe(1);
    expect(stats.clinicalReviewItems).toBe(1);
    expect(filterFindingsByQueue(approved, ['pending', 'needs-review']).every((f) => f.reviewStatus !== 'approved')).toBe(
      true,
    );
    expect(filterFindingsByQueue(approved, ['approved']).map((f) => f.id).sort()).toEqual(['1', '2']);
  });
});

describe('Primary lens preparation', () => {
  it('does not default Integrated / TA-primary clients to Standard EMDR', () => {
    const client = emptyClientRecord('j1', 't1', 'Jason', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'integrated-ta-emdr';
    client.primaryClinicalLens = 'transactional-analysis';
    client.intakeClinicalStatus = 'therapist-reviewed';
    client.coreFormulation = {
      presentingProblems: [{ id: 'p1', text: 'Acute marital crisis' }],
      symptoms: [{ id: 's1', text: 'Severe anxiety' }],
      currentTriggers: [],
      repeatingPatterns: [{ id: 'r1', text: 'Handles problems alone' }],
      significantExperiences: [],
      relationships: [],
      currentEmotionalExperience: [],
      copingStrategies: [],
      resources: [{ id: 'res1', text: 'Family' }],
      strengths: [],
      vulnerabilities: [],
      goals: [],
      workingHypotheses: [],
      outstandingQuestions: [],
      recentChanges: [],
    };
    client.presentingProblems = ['Acute marital crisis'];

    expect(resolvePrimaryClinicalLens(client)).toBe('transactional-analysis');
    expect(protocolLabelForClient(client)).toMatch(/Integrated|TA/i);
    expect(protocolLabelForClient(client)).not.toBe('Standard EMDR');
    expect(shouldShowEmdrPrepFields(client)).toBe(false);

    const cycle = createClinicalCycle(client);
    expect(cycle.protocol).not.toMatch(/Standard EMDR/i);

    const strategy = buildTreatmentStrategySuggestions(client);
    expect(strategy.some((s) => /active treatment target/i.test(s.text))).toBe(false);

    const questions = deriveOutstandingQuestions({
      ...client,
      outstandingQuestions: [
        {
          id: 'q1',
          text: 'Current trigger activating the network is not established.',
          source: 'gap',
          status: 'open',
          createdAt: client.updatedAt,
        },
        {
          id: 'q2',
          text: 'Clarify current safety / risk status',
          source: 'therapist',
          status: 'open',
          createdAt: client.updatedAt,
        },
      ],
    });
    expect(questions.some((q) => /network/i.test(q.text))).toBe(false);
    expect(questions.some((q) => /safety/i.test(q.text))).toBe(true);

    const brief = buildPreparationBriefing(client);
    expect(brief.protocol).not.toBe('Standard EMDR');
    expect(brief.currentTarget).toBeUndefined();
  });

  it('shows Session approach mismatch for Integrated client with Standard EMDR cycle', () => {
    const client = emptyClientRecord('j2', 't1', 'Jason', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'integrated-ta-emdr';
    client.primaryClinicalLens = 'transactional-analysis';
    client.currentProtocol = 'Standard EMDR';
    client.activeCycle = {
      sessionId: 'session_3a34fe52da927521',
      clientId: client.id,
      protocol: 'Standard EMDR',
      phase: 'Guided Practice',
      sessionDate: '2026-08-15',
      workflowStatus: 'in-progress',
      transcriptStatus: 'no-transcript',
      startedAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
    };
    expect(isProtocolEmdrDefaultMismatch(client)).toBe(true);
    const m = sessionApproachMismatch(client);
    expect(m?.mismatched).toBe(true);
    expect(m?.sessionProtocol).toMatch(/Standard EMDR/);
  });

  it('proposes cautious TA hypotheses from approved core without forcing a full script', () => {
    const client = emptyClientRecord('j3', 't1', 'Jason', '2026-08-15T10:00:00.000Z');
    client.intakeCoreFindings = [
      finding({
        id: 'a',
        category: 'relational-pattern',
        text: 'Difficulty asking for help',
        reviewStatus: 'approved',
      }),
      finding({
        id: 'b',
        category: 'protective-process',
        text: 'Handles problems alone',
        reviewStatus: 'approved',
      }),
      finding({
        id: 'c',
        category: 'relational-pattern',
        text: 'Emotional withdrawal rather than expressing feelings',
        reviewStatus: 'approved',
      }),
    ];
    const proposals = proposeTaLensFromApprovedCore(client);
    expect(proposals.some((p) => p.driver === 'be-strong')).toBe(true);
    expect(proposals.some((p) => p.injunction === 'dont-feel')).toBe(true);
    expect(proposals.every((p) => p.workingHypothesis)).toBe(true);
    const approved = proposals.map((p) =>
      p.driver === 'be-strong' ? { ...p, reviewStatus: 'approved' as const } : { ...p, reviewStatus: 'rejected' as const },
    );
    const ta = applyApprovedPendingTaFindings(emptyTaLensFormulation(), approved);
    expect(ta.drivers.map((d) => d.driver)).toEqual(['be-strong']);
    expect(ta.injunctionHypotheses.length).toBe(0);
  });

  it('prefers core snapshot over raw truncated presenting problem for non-EMDR clients', () => {
    const client = emptyClientRecord('j4', 't1', 'Jason', '2026-08-15T10:00:00.000Z');
    client.primaryTreatmentApproach = 'integrated-ta-emdr';
    client.primaryClinicalLens = 'transactional-analysis';
    client.presentingProblems = [
      'nships. I have been experiencing severe anxiety and cannot sleep for weeks after threatened divorce and childhood material that continues for many more words beyond a clinical snapshot limit intentionally',
    ];
    client.coreFormulation = {
      presentingProblems: [{ id: 'p1', text: 'acute marital distress following threatened divorce' }],
      symptoms: [
        { id: 's1', text: 'severe anxiety' },
        { id: 's2', text: 'marked sleep disruption' },
      ],
      currentTriggers: [],
      repeatingPatterns: [
        { id: 'r1', text: 'defensiveness' },
        { id: 'r2', text: 'emotional withdrawal' },
      ],
      significantExperiences: [],
      relationships: [],
      currentEmotionalExperience: [],
      copingStrategies: [],
      resources: [{ id: 'res1', text: 'family' }, { id: 'res2', text: 'fatherhood' }],
      strengths: [],
      vulnerabilities: [],
      goals: [],
      workingHypotheses: [],
      outstandingQuestions: [],
      recentChanges: [],
    };
    const snap = buildClinicalSnapshot(client);
    expect(snap.toLowerCase()).toContain('marital');
    expect(snap).not.toMatch(/nships\. I have been experiencing/);
  });
});
