import { describe, expect, it } from 'vitest';
import {
  completeCycle,
  createClinicalCycle,
  ensureActiveCycle,
  markFindingsReviewed,
  markSessionFinished,
  markTranscriptDraft,
  resumeCycleHref,
} from '../src/clinical-intelligence/lib/clinicalCycle';
import {
  approveDebrief,
  buildDebriefDraft,
  buildSinceLastSessionDelta,
} from '../src/clinical-intelligence/lib/sessionBriefing';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';

describe('clinical cycle integrity', () => {
  it('threads one session ID from prepare → practice → finish → debrief', () => {
    let client = emptyClientRecord('c1', 't1', 'Ashley', '2026-08-15T10:00:00.000Z');
    const ensured = ensureActiveCycle(client);
    client = ensured.client;
    const sessionId = ensured.cycle.sessionId;
    expect(sessionId.startsWith('session_')).toBe(true);

    client = markSessionFinished(client, {
      mode: 'with-transcript',
      phase: 'Phase 4',
      targetHeadline: 'School reports',
      sud: 4,
      voc: 5,
    });
    expect(client.activeCycle?.sessionId).toBe(sessionId);
    expect(client.activeCycle?.workflowStatus).toBe('awaiting-transcript');

    client = markTranscriptDraft(client, 'THERAPIST:\nHello\nCLIENT:\nHi');
    expect(client.activeCycle?.sessionId).toBe(sessionId);
    expect(client.activeCycle?.transcriptStatus).toBe('transcript-added');

    client = markFindingsReviewed(client, 'an1');
    expect(client.activeCycle?.workflowStatus).toBe('awaiting-debrief');
    expect(client.activeCycle?.sessionId).toBe(sessionId);

    const draft = buildDebriefDraft(client, { sessionId, analysisId: 'an1' });
    expect(draft.sessionId).toBe(sessionId);
    const approved = approveDebrief(client, draft, { approvedPlanIds: ['continue'] });
    const done = completeCycle(approved, draft.id);
    expect(done.activeCycle).toBeNull();
    expect(done.clinicalCycles?.slice(-1)[0]?.sessionId).toBe(sessionId);
    expect(done.sessionDebriefs?.slice(-1)[0]?.sessionId).toBe(sessionId);
  });

  it('supports finish without transcript → manual debrief', () => {
    let client = emptyClientRecord('c2', 't1', 'Tom', '2026-08-15T10:00:00.000Z');
    client = ensureActiveCycle(client).client;
    client = markSessionFinished(client, { mode: 'without-transcript', phase: 'Closure' });
    expect(client.activeCycle?.workflowStatus).toBe('awaiting-debrief');
    expect(client.activeCycle?.finishMode).toBe('without-transcript');
    const resume = resumeCycleHref(client);
    expect(resume?.href).toContain('debrief');
    expect(resume?.href).toContain('manual=1');
    const draft = buildDebriefDraft(client, {
      sessionId: client.activeCycle!.sessionId,
      manual: true,
    });
    expect(draft.manual).toBe(true);
  });

  it('delta only includes actual changes, not whole-case summary', () => {
    const client = emptyClientRecord('c3', 't1', 'Ben', '2026-08-15T10:00:00.000Z');
    client.activeTarget = { headline: 'School reports', sud: 4, nc: 'I am not enough' };
    client.sessionChanges = [
      {
        id: 'sc1',
        analysisId: 'a1',
        phase: 'desensitisation',
        createdAt: '2026-08-14T12:00:00.000Z',
        items: [
          {
            id: '1',
            kind: 'updated',
            category: 'activeTarget',
            label: 'School reports',
            detail: 'SUD 7 → 4',
          },
          { id: '2', kind: 'new', category: 'memories', label: 'Age 8 corridor' },
          { id: '3', kind: 'unchanged', category: 'themes', label: 'belonging' },
        ],
      },
    ];
    const delta = buildSinceLastSessionDelta(client);
    expect(delta.some((d) => d.text.includes('SUD 7 → 4'))).toBe(true);
    expect(delta.some((d) => d.text.toLowerCase().includes('corridor'))).toBe(true);
    expect(delta.every((d) => !d.text.toLowerCase().includes('presents primarily'))).toBe(true);
  });

  it('creates a fresh session id when forcing a new cycle', () => {
    const client = emptyClientRecord('c4', 't1', 'Sam', '2026-08-15T10:00:00.000Z');
    const a = createClinicalCycle(client);
    const b = createClinicalCycle(client);
    expect(a.sessionId).not.toBe(b.sessionId);
  });
});
