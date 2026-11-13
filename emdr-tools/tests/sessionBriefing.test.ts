import { describe, expect, it } from 'vitest';
import {
  approveDebrief,
  assertSnapshotWordLimit,
  buildClinicalSnapshot,
  buildDebriefDraft,
  buildPreparationBriefing,
  buildSinceLastSessionDelta,
  buildTreatmentStrategySuggestions,
  deriveOutstandingQuestions,
} from '../src/clinical-intelligence/lib/sessionBriefing';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import type { ClientRecord } from '../src/clinical-intelligence/types';

function seededClient(): ClientRecord {
  const base = emptyClientRecord('c1', 't1', 'Ashley', '2026-08-01T10:00:00.000Z');
  return {
    ...base,
    presentingProblems: ['Anxiety linked to hyper-responsibility'],
    themes: [
      {
        theme: 'responsibility-defectiveness',
        primary: true,
        confidence: 'high',
      },
      {
        theme: 'belonging',
        confidence: 'moderate',
      },
    ],
    triggers: [{ id: 'tr1', text: 'Housing discussions' }],
    memories: [
      {
        id: 'm1',
        headline: 'Age-10 maternal criticism',
        approximateAge: 10,
        themes: ['responsibility-defectiveness'],
      },
    ],
    activeTarget: {
      headline: 'School reports',
      nc: 'I have to carry everything alone',
      pc: 'I do not have to carry everything alone',
      sud: 4,
      voc: 5,
    },
    approvedNc: 'I have to carry everything alone',
    approvedPc: 'I do not have to carry everything alone',
    resources: [{ id: 'r1', kind: 'internal', text: 'Running' }],
    adaptiveInformation: [
      { id: 'a1', text: 'Emerging belief she does not have to carry everything alone' },
    ],
    targetCandidates: [
      { id: 'tc1', headline: 'Workplace criticism' },
      { id: 'tc2', headline: 'Father school criticism' },
    ],
    lastSessionSummary:
      'Previous session ended with a reduction in SUD from 7 to 4 and an emerging adaptive belief.',
    sessionChanges: [
      {
        id: 'sc1',
        analysisId: 'an1',
        phase: 'desensitisation',
        createdAt: '2026-08-14T12:00:00.000Z',
        items: [
          {
            id: 'i1',
            kind: 'updated',
            category: 'activeTarget',
            label: 'School reports',
            detail: 'SUD 7 → 4',
          },
          {
            id: 'i2',
            kind: 'new',
            category: 'memories',
            label: 'New memory age 8',
          },
          {
            id: 'i3',
            kind: 'updated',
            category: 'themes',
            label: 'Belonging',
          },
          {
            id: 'i4',
            kind: 'new',
            category: 'resources',
            label: 'Running',
          },
          {
            id: 'i5',
            kind: 'unchanged',
            category: 'activeTarget',
            label: 'School reports',
          },
        ],
      },
    ],
    currentPhase: 'Phase 4 — Desensitisation',
    currentProtocol: 'Standard EMDR',
    sessionCount: 3,
  };
}

describe('session briefing', () => {
  it('builds a clinical snapshot under 250 words from approved data', () => {
    const snap = buildClinicalSnapshot(seededClient());
    expect(assertSnapshotWordLimit(snap)).toBe(true);
    expect(snap.toLowerCase()).toContain('ashley');
    expect(snap.toLowerCase()).toContain('responsibility');
    expect(snap.toLowerCase()).toContain('school reports');
  });

  it('builds since-last-session delta without inventing content', () => {
    const delta = buildSinceLastSessionDelta(seededClient());
    expect(delta.some((d) => d.text.includes('SUD 7 → 4'))).toBe(true);
    expect(delta.some((d) => d.text.toLowerCase().includes('age 8'))).toBe(true);
    expect(delta.some((d) => d.text.toLowerCase().includes('nc'))).toBe(true);
  });

  it('derives outstanding questions from formulation gaps', () => {
    const client = seededClient();
    client.activeTarget = { ...client.activeTarget!, image: undefined, body: undefined };
    const qs = deriveOutstandingQuestions(client);
    expect(qs.some((q) => q.text.toLowerCase().includes('image'))).toBe(true);
    expect(qs.some((q) => q.text.toLowerCase().includes('body'))).toBe(true);
  });

  it('labels strategy as suggestions and never auto-orders targets', () => {
    const suggestions = buildTreatmentStrategySuggestions(seededClient());
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]!.text.toLowerCase()).toContain('continue');
    const brief = buildPreparationBriefing(seededClient());
    expect(brief.futureCandidates[0]).toBe('Workplace criticism');
    expect(brief.currentTarget).toBe('School reports');
  });

  it('approving debrief updates preparation fields without duplicating timeline noise', () => {
    const client = seededClient();
    const draft = buildDebriefDraft(client, { analysisId: 'an1', phase: 'desensitisation' });
    expect(assertSnapshotWordLimit(draft.sessionSummary)).toBe(true);
    const next = approveDebrief(client, draft, { approvedPlanIds: ['continue'] });
    expect(next.sessionDebriefs?.length).toBe(1);
    expect(next.sessionDebriefs?.[0]?.status).toBe('approved');
    expect(next.nextSessionPrepHints?.length).toBeGreaterThan(0);
    expect(next.outstandingQuestions?.every((q) => q.status === 'open')).toBe(true);
    expect(next.sessionTimeline?.some((e) => e.kind === 'debrief')).toBe(true);
    expect(next.sessionCount).toBe(4);
    expect(next.treatmentStrategy).toContain('Continue');
  });
});
