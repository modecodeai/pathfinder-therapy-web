/**
 * Session Preparation & Session Debrief builders.
 * All content is derived from therapist-approved ClientRecord fields only.
 * Suggestions are labelled AI-assisted planning — never treatment decisions.
 */

import { CLINICAL_THEME_LABELS, type ClientRecord, type FormulationSnapshot, type OutstandingQuestion, type SessionDebriefRecord, type SessionTimelineEvent, type SessionTimelineKind, type TreatmentPlanSuggestion } from '../types';

const MAX_SNAPSHOT_WORDS = 250;

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function truncateWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  return `${words.slice(0, max).join(' ')}…`;
}

function primaryThemeLabel(client: ClientRecord): string | undefined {
  const primary = client.themes.find((t) => t.primary) ?? client.themes[0];
  return primary ? CLINICAL_THEME_LABELS[primary.theme] : undefined;
}

function secondaryThemeLabels(client: ClientRecord): string[] {
  const primary = client.themes.find((t) => t.primary);
  return client.themes
    .filter((t) => !primary || t.theme !== primary.theme)
    .map((t) => CLINICAL_THEME_LABELS[t.theme]);
}

export function captureFormulationSnapshot(client: ClientRecord): FormulationSnapshot {
  return {
    presentingProblems: [...client.presentingProblems],
    primaryTheme: primaryThemeLabel(client),
    secondaryThemes: secondaryThemeLabels(client),
    currentTrigger: client.triggers[0]?.text,
    currentTarget: client.activeTarget?.headline,
    nc: client.activeTarget?.nc ?? client.approvedNc,
    pc: client.activeTarget?.pc ?? client.approvedPc,
    resources: client.resources.map((r) => r.text),
    sud: client.activeTarget?.sud ?? null,
    voc: client.activeTarget?.voc ?? null,
  };
}

/** Concise clinical briefing — max 250 words, approved data only. */
export function buildClinicalSnapshot(client: ClientRecord): string {
  const parts: string[] = [];
  const name = client.preferredName || client.displayName;
  const theme = primaryThemeLabel(client);
  const problems = client.presentingProblems.slice(0, 2);
  const trigger = client.triggers[0]?.text;
  const target = client.activeTarget;
  const adaptive = (client.adaptiveInformation ?? []).slice(-2).map((a) => a.text);
  const last = client.lastSessionSummary?.trim();

  if (problems.length) {
    parts.push(
      `${name} continues to present primarily with ${problems.join('; ')}${
        theme ? `. Current evidence supports ${theme} as the dominant organising theme` : ''
      }.`,
    );
  } else if (theme) {
    parts.push(
      `${name}'s approved formulation currently centres on ${theme} as the dominant organising theme.`,
    );
  } else {
    parts.push(
      `${name} does not yet have an approved formulation summary. Analyse and approve transcript findings before relying on this briefing.`,
    );
  }

  if (trigger) {
    parts.push(`Current triggers include ${trigger}.`);
  }
  if (target?.headline) {
    const metrics: string[] = [];
    if (target.sud != null) metrics.push(`SUD ${target.sud}`);
    if (target.voc != null) metrics.push(`VoC ${target.voc}`);
    parts.push(
      `The current treatment target remains ${target.headline}${
        metrics.length ? ` (${metrics.join(', ')})` : ''
      }.`,
    );
    if (target.nc) parts.push(`Negative cognition: “${target.nc}”.`);
    if (target.pc) parts.push(`Positive cognition: “${target.pc}”.`);
  }
  if (adaptive.length) {
    parts.push(`Recent adaptive information includes: ${adaptive.join('; ')}.`);
  }
  if (last) {
    parts.push(`Last approved session summary: ${last}`);
  }

  return truncateWords(parts.join(' '), MAX_SNAPSHOT_WORDS);
}

export interface DeltaBullet {
  id: string;
  text: string;
  kind: 'new' | 'updated' | 'unchanged' | 'clarification';
}

/** “What has changed since you last saw this client?” — delta only. */
export function buildSinceLastSessionDelta(client: ClientRecord): DeltaBullet[] {
  const latest = (client.sessionChanges ?? []).slice(-1)[0];
  const bullets: DeltaBullet[] = [];

  if (!latest) {
    if (client.activeTarget?.headline) {
      bullets.push({
        id: 'target-remains',
        kind: 'unchanged',
        text: `Target remains: ${client.activeTarget.headline}`,
      });
    }
    if (client.activeTarget?.nc) {
      bullets.push({
        id: 'nc-unchanged',
        kind: 'unchanged',
        text: `No change to current NC (“${client.activeTarget.nc}”)`,
      });
    }
    return bullets;
  }

  for (const item of latest.items) {
    if (item.kind === 'unchanged' && item.category === 'activeTarget' && !item.detail) {
      bullets.push({
        id: item.id,
        kind: 'unchanged',
        text: `Target remains: ${item.label}`,
      });
      continue;
    }
    if (item.kind === 'unchanged' && item.category !== 'activeTarget') {
      if (item.category === 'themes' || item.category === 'resources') {
        // skip bulk unchanged noise except NC-style
      }
      continue;
    }
    if (item.kind === 'new') {
      const prefix =
        item.category === 'memories'
          ? 'New memory'
          : item.category === 'themes'
            ? 'Theme'
            : item.category === 'resources'
              ? 'Resource'
              : item.category === 'adaptiveInformation'
                ? 'Adaptive shift'
                : 'New';
      bullets.push({
        id: item.id,
        kind: 'new',
        text: `${prefix}: ${item.label}${item.detail ? ` (${item.detail})` : ''}`,
      });
      continue;
    }
    if (item.kind === 'updated') {
      if (item.category === 'activeTarget' && item.detail) {
        bullets.push({
          id: item.id,
          kind: 'updated',
          text: item.detail.includes('→')
            ? item.detail
            : `${item.label}: ${item.detail}`,
        });
      } else if (item.category === 'themes') {
        bullets.push({
          id: item.id,
          kind: 'updated',
          text: `${item.label} theme strengthened`,
        });
      } else {
        bullets.push({
          id: item.id,
          kind: 'updated',
          text: `${item.label}${item.detail ? ` — ${item.detail}` : ''}`,
        });
      }
      continue;
    }
    if (item.kind === 'needs-clarification') {
      bullets.push({
        id: item.id,
        kind: 'clarification',
        text: item.label,
      });
    }
  }

  // Always surface current NC stability when present and not already listed
  if (
    client.activeTarget?.nc &&
    !bullets.some((b) => b.text.toLowerCase().includes('nc'))
  ) {
    const ncChanged = latest.items.some(
      (i) =>
        (i.kind === 'new' || i.kind === 'updated') &&
        (i.label === client.activeTarget?.nc ||
          (i.category === 'activeTarget' &&
            i.detail?.toLowerCase().includes('nc'))),
    );
    if (!ncChanged) {
      bullets.push({
        id: 'nc-stable',
        kind: 'unchanged',
        text: `No change to current NC (“${client.activeTarget.nc}”)`,
      });
    }
  }

  return bullets.slice(0, 12);
}

export interface StrategySuggestion {
  id: string;
  text: string;
}

/** Rule-based planning suggestions from approved formulation — never auto-applied. */
export function buildTreatmentStrategySuggestions(client: ClientRecord): StrategySuggestion[] {
  const suggestions: StrategySuggestion[] = [];
  const target = client.activeTarget;

  if (target?.headline) {
    suggestions.push({
      id: 'continue-target',
      text: `Continue processing current target (${target.headline})`,
    });
  } else {
    suggestions.push({
      id: 'establish-target',
      text: 'Establish or confirm an active treatment target before processing',
    });
  }

  if (target && !target.image) {
    suggestions.push({ id: 'clarify-image', text: 'Clarify target image' });
  }
  if (target && !target.pc && !client.approvedPc) {
    suggestions.push({ id: 'confirm-pc', text: 'Confirm positive cognition (PC)' });
  }
  if ((client.adaptiveInformation ?? []).length) {
    suggestions.push({
      id: 'review-adaptive',
      text: 'Review previous adaptive shift',
    });
  }
  if (client.triggers.length) {
    suggestions.push({ id: 'assess-trigger', text: 'Assess current trigger' });
  }
  if (target?.sud != null && target.sud <= 3) {
    suggestions.push({
      id: 'check-gains',
      text: 'Confirm whether previous SUD gains have been maintained',
    });
  }

  return suggestions.slice(0, 6);
}

export function deriveOutstandingQuestions(client: ClientRecord): OutstandingQuestion[] {
  const stored = (client.outstandingQuestions ?? []).filter((q) => q.status === 'open');
  const derived: OutstandingQuestion[] = [];
  const now = client.updatedAt || new Date().toISOString();
  const target = client.activeTarget;

  const pushGap = (id: string, text: string) => {
    if (stored.some((q) => q.text.toLowerCase() === text.toLowerCase())) return;
    if (derived.some((q) => q.text.toLowerCase() === text.toLowerCase())) return;
    derived.push({ id, text, source: 'gap', status: 'open', createdAt: now });
  };

  if (target?.headline && !target.image) {
    pushGap('gap-image', 'Target image still not confirmed.');
  }
  if (target?.headline && !target.body) {
    pushGap('gap-body', 'Current body location not established.');
  }
  if (target?.headline && target.nc == null && !client.approvedNc) {
    pushGap('gap-nc', 'Negative cognition for the current target is not established.');
  }
  if (target?.headline && target.pc == null && !client.approvedPc) {
    pushGap('gap-pc', 'Positive cognition for the current target is not established.');
  }
  if (target?.sud == null && target?.headline) {
    pushGap('gap-sud', 'Current SUD for the active target is not established.');
  }
  if (!client.triggers.length && client.presentingProblems.length) {
    pushGap('gap-trigger', 'Current trigger activating the network is not established.');
  }

  return [...stored, ...derived];
}

export function buildThingsToReview(client: ClientRecord): string[] {
  const items: string[] = [];
  const target = client.activeTarget;
  if (target?.sud != null) {
    items.push(`Previous session ended at SUD ${target.sud}. Confirm whether gains maintained.`);
  }
  if (client.triggers[0]?.text) {
    items.push(`Reassess current trigger (${client.triggers[0].text}).`);
  }
  if (client.resources.length) {
    items.push('Review current resources.');
  }
  if ((client.nextSessionPrepHints ?? []).length) {
    items.push(...(client.nextSessionPrepHints ?? []));
  }
  if (!items.length) {
    items.push('Review approved formulation and confirm readiness before greeting the client.');
  }
  // Dedupe
  return [...new Set(items)].slice(0, 8);
}

export interface PreparationBriefing {
  clientName: string;
  sessionNumber: number;
  protocol: string;
  currentPhase: string;
  dateLabel: string;
  lastSeenLabel: string;
  therapistLabel: string;
  estimatedDuration: string;
  delta: DeltaBullet[];
  clinicalSnapshot: string;
  formulation: FormulationSnapshot;
  strategySuggestions: StrategySuggestion[];
  approvedStrategy: string[];
  outstandingQuestions: OutstandingQuestion[];
  thingsToReview: string[];
  currentTarget?: string;
  futureCandidates: string[];
  practiceHref: string;
}

export function buildPreparationBriefing(
  client: ClientRecord,
  opts?: { therapistName?: string },
): PreparationBriefing {
  const sessionNumber = client.sessionCount ?? (client.sessionDebriefs?.filter((d) => d.status === 'approved').length ?? 0) + 1;
  return {
    clientName: client.preferredName || client.displayName,
    sessionNumber,
    protocol: client.currentProtocol || 'Standard EMDR',
    currentPhase: client.currentPhase || 'Not established',
    dateLabel: new Date().toLocaleDateString(),
    lastSeenLabel: client.updatedAt
      ? new Date(client.updatedAt).toLocaleDateString()
      : 'Not recorded',
    therapistLabel: opts?.therapistName || 'Therapist',
    estimatedDuration: '50–60 min',
    delta: buildSinceLastSessionDelta(client),
    clinicalSnapshot: buildClinicalSnapshot(client),
    formulation: captureFormulationSnapshot(client),
    strategySuggestions: buildTreatmentStrategySuggestions(client),
    approvedStrategy: client.treatmentStrategy ?? [],
    outstandingQuestions: deriveOutstandingQuestions(client),
    thingsToReview: buildThingsToReview(client),
    currentTarget: client.activeTarget?.headline,
    futureCandidates: client.targetCandidates.map((t) => t.headline).slice(0, 4),
    practiceHref: `/practice/standard?clientId=${encodeURIComponent(client.id)}`,
  };
}

export function buildTreatmentPlanSuggestions(client: ClientRecord): TreatmentPlanSuggestion[] {
  const sud = client.activeTarget?.sud;
  const suggestions: TreatmentPlanSuggestion[] = [];

  if (sud != null && sud > 0) {
    suggestions.push({
      id: 'continue',
      label: 'Continue',
      rationale: `Current SUD is ${sud}. Continue processing the active target if clinically appropriate.`,
    });
  } else {
    suggestions.push({
      id: 'continue',
      label: 'Continue',
      rationale: 'Continue with the current treatment focus if the therapist judges the target ready.',
    });
  }

  if (sud != null && sud <= 2) {
    suggestions.push({
      id: 'next-target',
      label: 'Move to next target',
      rationale: 'Low SUD may support considering the next candidate — therapist decides.',
    });
  }

  if (!client.activeTarget?.image || !client.activeTarget?.body) {
    suggestions.push({
      id: 'preparation',
      label: 'Preparation',
      rationale: 'Assessment elements remain incomplete; consider preparation / clarification work.',
    });
  }

  if (client.resources.length) {
    suggestions.push({
      id: 'review-resources',
      label: 'Review resources',
      rationale: 'Approved resources are available for stabilisation review if needed.',
    });
  }

  suggestions.push({
    id: 'pause',
    label: 'Pause',
    rationale: 'Pause processing if the client needs containment or medical review.',
  });

  return suggestions;
}

export function buildHomeworkFromApproved(client: ClientRecord): string[] {
  // Only surface homework-like content when adaptive/resources notes explicitly suggest it.
  const homework: string[] = [];
  for (const note of client.processingNotes ?? []) {
    const v = note.value.toLowerCase();
    if (v.includes('homework') || v.includes('between sessions') || v.includes('practice')) {
      homework.push(note.value);
    }
  }
  return homework.slice(0, 4);
}

export function buildNextSessionPrep(client: ClientRecord, debriefQuestions: string[]): string[] {
  const hints: string[] = [];
  const target = client.activeTarget;
  if (target?.sud != null) {
    hints.push('Review previous gains and confirm whether SUD reduction has been maintained.');
  }
  if (target && !target.image) {
    hints.push('Confirm target image.');
  }
  if (client.triggers[0]?.text) {
    hints.push('Check current trigger.');
  }
  if (target?.sud != null && target.sud > 0) {
    hints.push('Continue processing if SUD maintained or increased.');
  }
  for (const q of debriefQuestions.slice(0, 3)) {
    hints.push(q);
  }
  return [...new Set(hints)].slice(0, 8);
}

export function buildDebriefDraft(
  client: ClientRecord,
  opts?: { analysisId?: string; phase?: string; prior?: FormulationSnapshot },
): SessionDebriefRecord {
  const latest = (client.sessionChanges ?? []).slice(-1)[0];
  const prior = opts?.prior ?? captureFormulationSnapshot(client);
  // Prefer prior from previous debrief if available
  const lastDebrief = (client.sessionDebriefs ?? []).filter((d) => d.status === 'approved').slice(-1)[0];
  const priorSnap = opts?.prior ?? lastDebrief?.updatedFormulation ?? prior;
  const updated = captureFormulationSnapshot(client);

  const whatChanged = buildSinceLastSessionDelta(client)
    .filter((b) => b.kind !== 'unchanged')
    .map((b) => b.text);

  const outstandingWork: string[] = [];
  if (client.activeTarget && !client.activeTarget.image) outstandingWork.push('Clarify target image');
  if (client.activeTarget && !client.activeTarget.body) outstandingWork.push('Establish body location');
  if (client.activeTarget?.sud != null && client.activeTarget.sud > 0) {
    outstandingWork.push('Continue desensitisation as clinically indicated');
  }

  const questions = deriveOutstandingQuestions(client).map((q) => q.text);
  const summary =
    client.lastSessionSummary?.trim() ||
    truncateWords(
      [
        whatChanged.length
          ? `This session updated the approved record with: ${whatChanged.slice(0, 4).join('; ')}.`
          : 'Approved findings were applied; no major deltas were recorded.',
        client.activeTarget?.headline
          ? `Active target: ${client.activeTarget.headline}.`
          : '',
        client.activeTarget?.sud != null ? `Current SUD: ${client.activeTarget.sud}.` : '',
        client.activeTarget?.voc != null ? `Current VoC: ${client.activeTarget.voc}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
      MAX_SNAPSHOT_WORDS,
    );

  const id = `debrief_${latest?.id ?? client.id}_${Date.now()}`;
  return {
    id,
    analysisId: opts?.analysisId ?? latest?.analysisId,
    phase: opts?.phase ?? latest?.phase ?? client.currentPhase,
    createdAt: new Date().toISOString(),
    status: 'draft',
    sessionSummary: summary,
    whatChanged: whatChanged.length ? whatChanged : ['No material deltas recorded in the latest approved apply.'],
    priorFormulation: priorSnap,
    updatedFormulation: updated,
    targetStatus: {
      headline: client.activeTarget?.headline,
      status:
        client.activeTarget?.sud != null && client.activeTarget.sud <= 1
          ? 'Near complete / re-evaluate'
          : client.activeTarget
            ? 'Processing'
            : 'Not established',
      sud: client.activeTarget?.sud ?? null,
      voc: client.activeTarget?.voc ?? null,
      outstandingWork,
    },
    treatmentPlanSuggestions: buildTreatmentPlanSuggestions(client),
    homework: buildHomeworkFromApproved(client),
    nextSessionPrep: buildNextSessionPrep(client, questions),
    outstandingQuestions: questions,
  };
}

export function approveDebrief(
  client: ClientRecord,
  draft: SessionDebriefRecord,
  opts?: { approvedPlanIds?: SessionDebriefRecord['approvedPlanIds']; editedSummary?: string },
): ClientRecord {
  const now = new Date().toISOString();
  const approved: SessionDebriefRecord = {
    ...draft,
    status: 'approved',
    approvedAt: now,
    sessionSummary: opts?.editedSummary?.trim() || draft.sessionSummary,
    approvedPlanIds: opts?.approvedPlanIds ?? draft.approvedPlanIds,
  };

  const openQuestions: OutstandingQuestion[] = approved.outstandingQuestions.map((text, i) => ({
    id: `oq_${approved.id}_${i}`,
    text,
    source: 'debrief' as const,
    status: 'open' as const,
    createdAt: now,
  }));

  const strategy =
    approved.approvedPlanIds?.length
      ? approved.treatmentPlanSuggestions
          .filter((s) => approved.approvedPlanIds!.includes(s.id))
          .map((s) => s.label)
      : (client.treatmentStrategy ?? []);

  const timeline = appendTimeline(client.sessionTimeline ?? [], [
    { kind: 'approved', label: 'Findings approved', at: now, analysisId: approved.analysisId },
    { kind: 'debrief', label: 'Session debrief approved', at: now, debriefId: approved.id, analysisId: approved.analysisId },
    { kind: 'formulation-updated', label: 'Formulation updated', at: now, debriefId: approved.id },
  ]);

  return {
    ...client,
    lastSessionSummary: approved.sessionSummary,
    outstandingQuestions: openQuestions,
    treatmentStrategy: strategy.length ? strategy : client.treatmentStrategy,
    nextSessionPrepHints: approved.nextSessionPrep,
    sessionDebriefs: [...(client.sessionDebriefs ?? []), approved],
    sessionTimeline: timeline,
    sessionCount: (client.sessionCount ?? 0) + 1,
    updatedAt: now,
  };
}

export function appendTimeline(
  existing: SessionTimelineEvent[],
  events: Array<{
    kind: SessionTimelineKind;
    label: string;
    at: string;
    analysisId?: string;
    debriefId?: string;
    href?: string;
  }>,
): SessionTimelineEvent[] {
  const next = [...existing];
  for (const e of events) {
    next.push({
      id: `tl_${e.kind}_${e.at}_${next.length}`,
      kind: e.kind,
      label: e.label,
      at: e.at,
      analysisId: e.analysisId,
      debriefId: e.debriefId,
      href: e.href,
    });
  }
  return next;
}

export function assertSnapshotWordLimit(text: string): boolean {
  return wordCount(text) <= MAX_SNAPSHOT_WORDS;
}
