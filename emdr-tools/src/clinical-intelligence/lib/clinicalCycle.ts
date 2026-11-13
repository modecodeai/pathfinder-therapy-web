/**
 * Clinical cycle workflow helpers — session ID threading, rail status, resume.
 * Does not make clinical decisions; only tracks workflow state.
 */

import type {
  ClientRecord,
  ClinicalCycleState,
  CycleRailStep,
  CycleWorkflowStatus,
  SessionTimelineEvent,
  TranscriptLifecycleStatus,
  TreatmentStrategyItem,
} from '../types';
import { appendTimeline } from './sessionBriefing';

function randomId(prefix: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function newSessionId(): string {
  return randomId('session');
}

export function newLockToken(): string {
  return randomId('lock');
}

export const CYCLE_RAIL_STEPS: Array<{ id: CycleRailStep; label: string }> = [
  { id: 'preparation', label: 'Preparation' },
  { id: 'practice', label: 'Practice' },
  { id: 'review', label: 'Review' },
  { id: 'debrief', label: 'Debrief' },
  { id: 'ready', label: 'Ready for Next Session' },
];

export const WORKFLOW_STATUS_LABELS: Record<CycleWorkflowStatus, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  'awaiting-transcript': 'Awaiting transcript',
  'awaiting-ci-review': 'Awaiting CI review',
  'awaiting-debrief': 'Awaiting debrief',
  complete: 'Complete',
};

export const TRANSCRIPT_STATUS_LABELS: Record<TranscriptLifecycleStatus, string> = {
  'no-transcript': 'No transcript',
  'transcript-added': 'Transcript added',
  'analysis-pending': 'Analysis pending',
  'analysis-complete': 'Analysis complete',
  'findings-awaiting-review': 'Findings awaiting review',
  'findings-reviewed': 'Findings reviewed',
};

export function railStepForStatus(status: CycleWorkflowStatus): CycleRailStep {
  switch (status) {
    case 'not-started':
      return 'preparation';
    case 'in-progress':
      return 'practice';
    case 'awaiting-transcript':
    case 'awaiting-ci-review':
      return 'review';
    case 'awaiting-debrief':
      return 'debrief';
    case 'complete':
      return 'ready';
    default:
      return 'preparation';
  }
}

export function createClinicalCycle(
  client: ClientRecord,
  opts?: { protocol?: string; phase?: string },
): ClinicalCycleState {
  const now = new Date().toISOString();
  return {
    sessionId: newSessionId(),
    clientId: client.id,
    protocol: opts?.protocol ?? client.currentProtocol ?? 'Standard EMDR',
    phase: opts?.phase ?? client.currentPhase,
    targetHeadline: client.activeTarget?.headline,
    sud: client.activeTarget?.sud ?? null,
    voc: client.activeTarget?.voc ?? null,
    sessionDate: now.slice(0, 10),
    workflowStatus: 'in-progress',
    transcriptStatus: 'no-transcript',
    startedAt: now,
    updatedAt: now,
  };
}

export function patchCycle(
  cycle: ClinicalCycleState,
  partial: Partial<ClinicalCycleState>,
): ClinicalCycleState {
  return { ...cycle, ...partial, updatedAt: new Date().toISOString() };
}

export function ensureActiveCycle(
  client: ClientRecord,
  opts?: { protocol?: string; forceNew?: boolean },
): { client: ClientRecord; cycle: ClinicalCycleState; created: boolean } {
  if (!opts?.forceNew && client.activeCycle && client.activeCycle.workflowStatus !== 'complete') {
    return { client, cycle: client.activeCycle, created: false };
  }
  const cycle = createClinicalCycle(client, { protocol: opts?.protocol });
  const timeline = appendTimeline(client.sessionTimeline ?? [], [
    {
      kind: 'preparation',
      label: 'Preparation started',
      at: cycle.startedAt,
      sessionId: cycle.sessionId,
      href: `/clients/${client.id}?tab=preparation&sessionId=${cycle.sessionId}`,
    },
  ]);
  return {
    created: true,
    cycle,
    client: {
      ...client,
      activeCycle: cycle,
      sessionTimeline: timeline,
      currentProtocol: cycle.protocol,
    },
  };
}

export function resumeCycleHref(client: ClientRecord): { label: string; href: string } | null {
  const cycle = client.activeCycle;
  if (!cycle || cycle.workflowStatus === 'complete') {
    return {
      label: 'Prepare Next Session',
      href: `/clients/${client.id}?tab=preparation`,
    };
  }
  const sid = encodeURIComponent(cycle.sessionId);
  const cid = encodeURIComponent(client.id);
  switch (cycle.workflowStatus) {
    case 'not-started':
    case 'in-progress':
      if (cycle.finishMode === 'with-transcript' || cycle.finishMode === 'without-transcript') {
        break;
      }
      return {
        label: 'Resume Clinical Cycle',
        href: `/practice/standard?clientId=${cid}&sessionId=${sid}`,
      };
    case 'awaiting-transcript':
      return {
        label: 'Resume Clinical Cycle',
        href: `/clients/${client.id}/clinical-intelligence?finish=1&sessionId=${sid}`,
      };
    case 'awaiting-ci-review':
      return {
        label: 'Resume Clinical Cycle',
        href: `/clients/${client.id}/clinical-intelligence?sessionId=${sid}`,
      };
    case 'awaiting-debrief':
      return {
        label: 'Resume Clinical Cycle',
        href: `/clients/${client.id}/debrief?sessionId=${sid}${
          cycle.analysisId ? `&analysisId=${encodeURIComponent(cycle.analysisId)}` : ''
        }${cycle.finishMode === 'without-transcript' ? '&manual=1' : ''}`,
      };
    default:
      return {
        label: 'Prepare Next Session',
        href: `/clients/${client.id}?tab=preparation`,
      };
  }
  // finish modes still in practice-adjacent
  if (cycle.finishMode === 'without-transcript') {
    return {
      label: 'Resume Clinical Cycle',
      href: `/clients/${client.id}/debrief?sessionId=${sid}&manual=1`,
    };
  }
  return {
    label: 'Resume Clinical Cycle',
    href: `/clients/${client.id}/clinical-intelligence?finish=1&sessionId=${sid}`,
  };
}

export function practiceHref(clientId: string, sessionId: string): string {
  return `/practice/standard?clientId=${encodeURIComponent(clientId)}&sessionId=${encodeURIComponent(sessionId)}`;
}

export function ciHref(clientId: string, sessionId: string, finish = false): string {
  return `/clients/${encodeURIComponent(clientId)}/clinical-intelligence?sessionId=${encodeURIComponent(sessionId)}${
    finish ? '&finish=1' : ''
  }`;
}

export function debriefHref(
  clientId: string,
  sessionId: string,
  opts?: { analysisId?: string; manual?: boolean },
): string {
  const q = new URLSearchParams({ sessionId });
  if (opts?.analysisId) q.set('analysisId', opts.analysisId);
  if (opts?.manual) q.set('manual', '1');
  return `/clients/${encodeURIComponent(clientId)}/debrief?${q.toString()}`;
}

export function markPracticeStarted(
  client: ClientRecord,
  cycle: ClinicalCycleState,
): ClientRecord {
  const next = patchCycle(cycle, {
    workflowStatus: 'in-progress',
    phase: cycle.phase || client.currentPhase || 'Guided Practice',
  });
  return {
    ...client,
    activeCycle: next,
    currentPhase: next.phase,
    sessionTimeline: appendTimeline(client.sessionTimeline ?? [], [
      {
        kind: 'practice',
        label: `Guided Practice · ${next.protocol}${next.phase ? ` · ${next.phase}` : ''}`,
        at: next.updatedAt,
        sessionId: next.sessionId,
        href: practiceHref(client.id, next.sessionId),
      },
    ]),
  };
}

export function markSessionFinished(
  client: ClientRecord,
  opts: {
    mode: 'with-transcript' | 'without-transcript';
    phase?: string;
    targetHeadline?: string;
    sud?: number | null;
    voc?: number | null;
    blsElapsedMs?: number;
    unsavedNotes?: boolean;
  },
): ClientRecord {
  const cycle = client.activeCycle;
  if (!cycle) return client;
  const next = patchCycle(cycle, {
    finishMode: opts.mode,
    phase: opts.phase ?? cycle.phase,
    targetHeadline: opts.targetHeadline ?? cycle.targetHeadline,
    sud: opts.sud ?? cycle.sud,
    voc: opts.voc ?? cycle.voc,
    blsElapsedMs: opts.blsElapsedMs ?? cycle.blsElapsedMs,
    unsavedNotes: opts.unsavedNotes,
    workflowStatus: opts.mode === 'with-transcript' ? 'awaiting-transcript' : 'awaiting-debrief',
    transcriptStatus: opts.mode === 'with-transcript' ? 'no-transcript' : 'no-transcript',
  });
  return { ...client, activeCycle: next, currentPhase: next.phase };
}

export function markTranscriptDraft(
  client: ClientRecord,
  transcript: string,
): ClientRecord {
  const cycle = client.activeCycle;
  if (!cycle) return client;
  const hasText = transcript.trim().length > 0;
  const next = patchCycle(cycle, {
    drafts: {
      ...cycle.drafts,
      transcript,
      savedAt: new Date().toISOString(),
    },
    transcriptStatus: hasText
      ? cycle.transcriptStatus === 'no-transcript'
        ? 'transcript-added'
        : cycle.transcriptStatus
      : 'no-transcript',
    workflowStatus:
      hasText && cycle.workflowStatus === 'awaiting-transcript'
        ? 'awaiting-ci-review'
        : cycle.workflowStatus,
  });
  let timeline = client.sessionTimeline ?? [];
  if (hasText && cycle.transcriptStatus === 'no-transcript') {
    timeline = appendTimeline(timeline, [
      {
        kind: 'transcript',
        label: 'Transcript added',
        at: next.updatedAt,
        sessionId: next.sessionId,
        href: ciHref(client.id, next.sessionId, true),
      },
    ]);
  }
  return { ...client, activeCycle: next, sessionTimeline: timeline };
}

export function markAnalysisStarted(client: ClientRecord, analysisId: string): ClientRecord {
  const cycle = client.activeCycle;
  if (!cycle) return client;
  const next = patchCycle(cycle, {
    analysisId,
    transcriptStatus: 'analysis-pending',
    workflowStatus: 'awaiting-ci-review',
  });
  return {
    ...client,
    activeCycle: next,
    sessionTimeline: appendTimeline(client.sessionTimeline ?? [], [
      {
        kind: 'clinical-intelligence',
        label: 'Clinical Intelligence analysis started',
        at: next.updatedAt,
        sessionId: next.sessionId,
        analysisId,
        href: ciHref(client.id, next.sessionId),
      },
    ]),
  };
}

export function markFindingsAwaitingReview(client: ClientRecord): ClientRecord {
  const cycle = client.activeCycle;
  if (!cycle) return client;
  return {
    ...client,
    activeCycle: patchCycle(cycle, {
      transcriptStatus: 'findings-awaiting-review',
      workflowStatus: 'awaiting-ci-review',
    }),
  };
}

export function markFindingsReviewed(client: ClientRecord, analysisId?: string): ClientRecord {
  const cycle = client.activeCycle;
  if (!cycle) return client;
  const next = patchCycle(cycle, {
    analysisId: analysisId ?? cycle.analysisId,
    transcriptStatus: 'findings-reviewed',
    workflowStatus: 'awaiting-debrief',
  });
  return {
    ...client,
    activeCycle: next,
    sessionTimeline: appendTimeline(client.sessionTimeline ?? [], [
      {
        kind: 'approved',
        label: 'Findings reviewed / applied',
        at: next.updatedAt,
        sessionId: next.sessionId,
        analysisId: next.analysisId,
        href: debriefHref(client.id, next.sessionId, { analysisId: next.analysisId }),
      },
    ]),
  };
}

export function completeCycle(
  client: ClientRecord,
  debriefId: string,
): ClientRecord {
  const cycle = client.activeCycle;
  if (!cycle) return client;
  const next = patchCycle(cycle, {
    debriefId,
    workflowStatus: 'complete',
    transcriptStatus:
      cycle.finishMode === 'without-transcript'
        ? 'no-transcript'
        : 'findings-reviewed',
  });
  const closed = [...(client.clinicalCycles ?? []), next];
  return {
    ...client,
    activeCycle: null,
    clinicalCycles: closed,
    sessionTimeline: appendTimeline(client.sessionTimeline ?? [], [
      {
        kind: 'debrief',
        label: 'Debrief approved · session complete',
        at: next.updatedAt,
        sessionId: next.sessionId,
        debriefId,
        href: `/clients/${client.id}?tab=preparation`,
      },
      {
        kind: 'formulation-updated',
        label: 'Formulation updated · ready for next preparation',
        at: next.updatedAt,
        sessionId: next.sessionId,
        debriefId,
        href: `/clients/${client.id}?tab=preparation`,
      },
    ]),
  };
}

export function acquireCycleLock(
  cycle: ClinicalCycleState,
  ownerToken: string,
  ownerLabel: string,
): ClinicalCycleState | { conflict: true; lock: NonNullable<ClinicalCycleState['lock']> } {
  const now = Date.now();
  if (
    cycle.lock &&
    cycle.lock.ownerToken !== ownerToken &&
    new Date(cycle.lock.expiresAt).getTime() > now
  ) {
    return { conflict: true, lock: cycle.lock };
  }
  return patchCycle(cycle, {
    lock: {
      ownerToken,
      ownerLabel,
      at: new Date(now).toISOString(),
      expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
    },
  });
}

export function filterRejectedStrategies(
  items: TreatmentStrategyItem[] | undefined,
): TreatmentStrategyItem[] {
  return (items ?? []).filter((i) => i.decision !== 'rejected');
}

export function acceptedStrategyTexts(client: ClientRecord): string[] {
  const structured = (client.strategyItems ?? [])
    .filter((i) => i.decision === 'accepted' || i.decision === 'edited')
    .map((i) => (i.decision === 'edited' && i.editedText ? i.editedText : i.text));
  if (structured.length) return structured;
  return client.treatmentStrategy ?? [];
}

export function timelineForSession(
  client: ClientRecord,
  sessionId: string,
): SessionTimelineEvent[] {
  return (client.sessionTimeline ?? []).filter((e) => e.sessionId === sessionId);
}

export function getRetentionPreference(): 'ask' | 'delete-after-approve' | 'keep' {
  if (typeof localStorage === 'undefined') return 'ask';
  return (
    (localStorage.getItem('pf-emdr-retention-transcript') as
      | 'ask'
      | 'delete-after-approve'
      | 'keep') || 'ask'
  );
}
