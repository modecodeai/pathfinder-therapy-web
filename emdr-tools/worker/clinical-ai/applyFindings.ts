import type {
  AnyStructuredAnalysis,
  ApplyFindingsRequest,
  ApprovedClientContext,
  AuditProvenance,
  ClientRecord,
  ClinicalAIAnalysisRecord,
  ClinicalThemeId,
  Phase3AssessmentAnalysis,
  Phase4DesensitisationAnalysis,
  RawTranscriptRecord,
  TargetAssessmentDraft,
  TranscriptAnalysis,
} from '../../src/clinical-intelligence/types';

export function emptyClientRecord(
  id: string,
  therapistId: string,
  displayName: string,
  nowIso: string,
): ClientRecord {
  return {
    id,
    therapistId,
    displayName,
    presentingProblems: [],
    triggers: [],
    memories: [],
    themes: [],
    resources: [],
    targetCandidates: [],
    processingNotes: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function toApprovedClientContext(client: ClientRecord): ApprovedClientContext {
  const notes = (client.processingNotes ?? []).slice(-12).map((n) => n.value);
  return {
    presentingProblem: client.presentingProblem,
    presentingProblems: client.presentingProblems,
    triggers: client.triggers.map((t) => t.text),
    memories: client.memories.map((m) => ({
      headline: m.headline,
      approximateAge: m.approximateAge,
      description: m.description,
    })),
    themes: client.themes.map((t) => ({ theme: t.theme, primary: t.primary })),
    activeTarget: client.activeTarget,
    approvedNc: client.approvedNc,
    approvedPc: client.approvedPc,
    lastSessionSummary: client.lastSessionSummary,
    recentProcessingNotes: notes,
  };
}

export function detectThemeConflicts(
  client: ClientRecord,
  analysis: TranscriptAnalysis,
): Array<{ theme: ClinicalThemeId; existingPrimary?: ClinicalThemeId; incoming: ClinicalThemeId }> {
  const approvedIncoming = analysis.themes.filter((t) => t.reviewStatus === 'approved');
  const existingPrimary = client.themes.find((t) => t.primary)?.theme;
  const conflicts: Array<{
    theme: ClinicalThemeId;
    existingPrimary?: ClinicalThemeId;
    incoming: ClinicalThemeId;
  }> = [];
  if (!existingPrimary) return conflicts;
  for (const t of approvedIncoming) {
    if (t.theme !== existingPrimary) {
      conflicts.push({ theme: t.theme, existingPrimary, incoming: t.theme });
    }
  }
  return conflicts;
}

function isApprovedStatus(s: string) {
  return s === 'approved' || s === 'edited';
}

function effectiveSuggestionValue(item: {
  reviewStatus: string;
  value: string;
  therapistEditedValue?: string;
}): string {
  return item.reviewStatus === 'edited' ? (item.therapistEditedValue ?? item.value) : item.value;
}

/** Build Target Assessment draft from reviewed Phase 3 analysis (approved fields only). */
export function draftFromPhase3(analysis: Phase3AssessmentAnalysis): TargetAssessmentDraft {
  const unanswered = [...analysis.unansweredQuestions];
  const pick = (
    field: { reviewStatus: string; value: string; therapistEditedValue?: string } | null,
  ): string | undefined => {
    if (!field || !isApprovedStatus(field.reviewStatus)) return undefined;
    return effectiveSuggestionValue(field);
  };

  const draft: TargetAssessmentDraft = {
    label: pick(analysis.target),
    image: pick(analysis.image),
    nc: pick(analysis.negativeCognition),
    pc: pick(analysis.positiveCognition),
    emotion: pick(analysis.emotion),
    body: pick(analysis.bodyLocation),
    voc: null,
    sud: null,
    unanswered,
  };

  if (
    analysis.voc &&
    isApprovedStatus(analysis.voc.reviewStatus) &&
    analysis.voc.evidenceLevel === 'explicit' &&
    analysis.vocNumeric != null
  ) {
    draft.voc = analysis.vocNumeric;
  } else if (!unanswered.some((q) => /voc/i.test(q))) {
    unanswered.push('VoC not established');
  }

  if (
    analysis.sud &&
    isApprovedStatus(analysis.sud.reviewStatus) &&
    analysis.sud.evidenceLevel === 'explicit' &&
    analysis.sudNumeric != null
  ) {
    draft.sud = analysis.sudNumeric;
  } else if (!unanswered.some((q) => /sud/i.test(q))) {
    unanswered.push('SUD not established');
  }

  draft.unanswered = unanswered;
  return draft;
}

export function applyPhase3ToTarget(
  client: ClientRecord,
  analysis: Phase3AssessmentAnalysis,
  analysisId: string,
  nowIso: string,
): { client: ClientRecord; audit: AuditProvenance[]; draft: TargetAssessmentDraft } {
  const draft = draftFromPhase3(analysis);
  const audit: AuditProvenance[] = [];
  const next: ClientRecord = {
    ...client,
    updatedAt: nowIso,
    activeTarget: {
      headline: draft.label ?? client.activeTarget?.headline ?? 'Target',
      image: draft.image ?? client.activeTarget?.image,
      nc: draft.nc ?? client.activeTarget?.nc,
      pc: draft.pc ?? client.activeTarget?.pc,
      voc: draft.voc !== undefined ? draft.voc : (client.activeTarget?.voc ?? null),
      sud: draft.sud !== undefined ? draft.sud : (client.activeTarget?.sud ?? null),
      emotion: draft.emotion ?? client.activeTarget?.emotion,
      body: draft.body ?? client.activeTarget?.body,
    },
  };
  if (draft.nc) next.approvedNc = draft.nc;
  if (draft.pc) next.approvedPc = draft.pc;

  const push = (
    fieldPath: string,
    aiSuggestion: unknown,
    evidence: Phase3AssessmentAnalysis['summary']['evidence'],
    decision: AuditProvenance['decision'],
    therapistEdit?: unknown,
  ) => {
    audit.push({
      id: `aud_${Math.random().toString(16).slice(2, 10)}`,
      clientId: client.id,
      analysisId,
      fieldPath,
      aiSuggestion,
      evidence,
      decision,
      therapistEdit,
      approvedAt: nowIso,
    });
  };

  if (analysis.target && isApprovedStatus(analysis.target.reviewStatus)) {
    push('activeTarget.headline', analysis.target.value, analysis.target.evidence, analysis.target.reviewStatus, analysis.target.therapistEditedValue);
  }
  if (analysis.image && isApprovedStatus(analysis.image.reviewStatus)) {
    push('activeTarget.image', analysis.image.value, analysis.image.evidence, analysis.image.reviewStatus, analysis.image.therapistEditedValue);
  }
  if (analysis.negativeCognition && isApprovedStatus(analysis.negativeCognition.reviewStatus)) {
    push('activeTarget.nc', analysis.negativeCognition.value, analysis.negativeCognition.evidence, analysis.negativeCognition.reviewStatus, analysis.negativeCognition.therapistEditedValue);
  }
  if (analysis.positiveCognition && isApprovedStatus(analysis.positiveCognition.reviewStatus)) {
    push('activeTarget.pc', analysis.positiveCognition.value, analysis.positiveCognition.evidence, analysis.positiveCognition.reviewStatus, analysis.positiveCognition.therapistEditedValue);
  }
  if (analysis.voc && isApprovedStatus(analysis.voc.reviewStatus) && draft.voc != null) {
    push('activeTarget.voc', analysis.vocNumeric, analysis.voc.evidence, analysis.voc.reviewStatus);
  }
  if (analysis.sud && isApprovedStatus(analysis.sud.reviewStatus) && draft.sud != null) {
    push('activeTarget.sud', analysis.sudNumeric, analysis.sud.evidence, analysis.sud.reviewStatus);
  }
  if (analysis.emotion && isApprovedStatus(analysis.emotion.reviewStatus)) {
    push('activeTarget.emotion', analysis.emotion.value, analysis.emotion.evidence, analysis.emotion.reviewStatus, analysis.emotion.therapistEditedValue);
  }
  if (analysis.bodyLocation && isApprovedStatus(analysis.bodyLocation.reviewStatus)) {
    push('activeTarget.body', analysis.bodyLocation.value, analysis.bodyLocation.evidence, analysis.bodyLocation.reviewStatus, analysis.bodyLocation.therapistEditedValue);
  }
  if (analysis.summary && isApprovedStatus(analysis.summary.reviewStatus)) {
    next.lastSessionSummary = effectiveSuggestionValue(analysis.summary);
    push('summary', analysis.summary.value, analysis.summary.evidence, analysis.summary.reviewStatus, analysis.summary.therapistEditedValue);
  }

  return { client: next, audit, draft };
}

function applyPhase4Findings(
  client: ClientRecord,
  analysis: Phase4DesensitisationAnalysis,
  analysisId: string,
  nowIso: string,
): { client: ClientRecord; audit: AuditProvenance[]; conflictsRemaining: string[] } {
  const audit: AuditProvenance[] = [];
  const next: ClientRecord = {
    ...client,
    processingNotes: [...(client.processingNotes ?? [])],
    memories: [...client.memories],
    updatedAt: nowIso,
  };

  const push = (
    fieldPath: string,
    aiSuggestion: unknown,
    evidence: Phase4DesensitisationAnalysis['summary']['evidence'],
    decision: AuditProvenance['decision'],
    therapistEdit?: unknown,
  ) => {
    audit.push({
      id: `aud_${Math.random().toString(16).slice(2, 10)}`,
      clientId: client.id,
      analysisId,
      fieldPath,
      aiSuggestion,
      evidence,
      decision,
      therapistEdit,
      approvedAt: nowIso,
    });
  };

  for (const step of analysis.sequence) {
    if (!isApprovedStatus(step.reviewStatus)) continue;
    if (step.findingDelta === 'already-known') continue;
    const value =
      step.reviewStatus === 'edited' ? (step.therapistEditedValue ?? step.value) : step.value;
    const dup = next.processingNotes!.some(
      (n) => n.value.toLowerCase() === value.toLowerCase() && n.category === step.category,
    );
    if (dup) continue;
    next.processingNotes!.push({
      id: step.id,
      order: step.order,
      sequenceLabel: step.sequenceLabel,
      category: step.category,
      value,
      sourceAnalysisId: analysisId,
      approvedAt: nowIso,
    });
    push('processingNotes.sequence', step, step.evidence, step.reviewStatus, step.therapistEditedValue);
  }

  for (const m of analysis.newMemories) {
    if (!isApprovedStatus(m.reviewStatus)) continue;
    if (m.findingDelta === 'already-known') continue;
    const headline = m.reviewStatus === 'edited' ? (m.therapistEditedValue ?? m.headline) : m.headline;
    if (next.memories.some((x) => x.headline.toLowerCase() === headline.toLowerCase())) continue;
    next.memories.push({
      id: m.id,
      headline,
      approximateAge: m.approximateAge,
      description: m.description,
      themes: m.possibleThemes,
      possibleTouchstoneCandidate: m.possibleTouchstoneCandidate,
      sourceAnalysisId: analysisId,
      approvedAt: nowIso,
    });
    push('memories', m, m.evidence, m.reviewStatus, headline);
  }

  if (isApprovedStatus(analysis.summary.reviewStatus)) {
    next.lastSessionSummary = effectiveSuggestionValue(analysis.summary);
    push(
      'summary',
      analysis.summary.value,
      analysis.summary.evidence,
      analysis.summary.reviewStatus,
      analysis.summary.therapistEditedValue,
    );
  }

  // Never mark target resolved from Phase 4 AI output
  return { client: next, audit, conflictsRemaining: [] };
}

export function applyApprovedFindings(
  client: ClientRecord,
  analysis: AnyStructuredAnalysis,
  analysisId: string,
  opts: {
    themeConflicts?: ApplyFindingsRequest['themeConflicts'];
    memoryDuplicates?: ApplyFindingsRequest['memoryDuplicates'];
    nowIso: string;
  },
): { client: ClientRecord; audit: AuditProvenance[]; conflictsRemaining: string[] } {
  if (analysis.analysisKind === 'phase3-assessment') {
    const r = applyPhase3ToTarget(client, analysis, analysisId, opts.nowIso);
    return { client: r.client, audit: r.audit, conflictsRemaining: [] };
  }
  if (analysis.analysisKind === 'phase4-desensitisation') {
    return applyPhase4Findings(client, analysis, analysisId, opts.nowIso);
  }
  return applyPhase1Findings(client, analysis, analysisId, opts);
}

function applyPhase1Findings(
  client: ClientRecord,
  analysis: TranscriptAnalysis,
  analysisId: string,
  opts: {
    themeConflicts?: ApplyFindingsRequest['themeConflicts'];
    memoryDuplicates?: ApplyFindingsRequest['memoryDuplicates'];
    nowIso: string;
  },
): { client: ClientRecord; audit: AuditProvenance[]; conflictsRemaining: string[] } {
  const audit: AuditProvenance[] = [];
  const conflictsRemaining: string[] = [];
  const next: ClientRecord = {
    ...client,
    presentingProblems: [...client.presentingProblems],
    triggers: [...client.triggers],
    memories: [...client.memories],
    themes: [...client.themes],
    resources: [...client.resources],
    targetCandidates: [...client.targetCandidates],
    updatedAt: opts.nowIso,
  };

  const pushAudit = (
    fieldPath: string,
    aiSuggestion: unknown,
    evidence: TranscriptAnalysis['summary']['evidence'],
    decision: AuditProvenance['decision'],
    therapistEdit?: unknown,
  ) => {
    audit.push({
      id: `aud_${Math.random().toString(16).slice(2, 10)}`,
      clientId: client.id,
      analysisId,
      fieldPath,
      aiSuggestion,
      evidence,
      decision,
      therapistEdit,
      approvedAt: opts.nowIso,
    });
  };

  for (const p of analysis.presentingProblems) {
    if (p.reviewStatus !== 'approved' && p.reviewStatus !== 'edited') continue;
    if (p.findingDelta === 'already-known') continue;
    const value = p.reviewStatus === 'edited' ? (p.therapistEditedValue ?? p.value) : p.value;
    if (!next.presentingProblems.includes(value)) next.presentingProblems.push(value);
    if (!next.presentingProblem) next.presentingProblem = value;
    pushAudit('presentingProblems', p.value, p.evidence, p.reviewStatus, p.therapistEditedValue);
  }

  for (const t of analysis.triggers) {
    if (t.reviewStatus !== 'approved' && t.reviewStatus !== 'edited') continue;
    if (t.findingDelta === 'already-known') continue;
    const value = t.reviewStatus === 'edited' ? (t.therapistEditedValue ?? t.value) : t.value;
    if (next.triggers.some((x) => x.text.toLowerCase() === value.toLowerCase())) continue;
    next.triggers.push({
      id: t.id,
      text: value,
      sourceAnalysisId: analysisId,
      approvedAt: opts.nowIso,
    });
    pushAudit('triggers', t.value, t.evidence, t.reviewStatus, t.therapistEditedValue);
  }

  for (const m of analysis.memories) {
    if (m.reviewStatus !== 'approved' && m.reviewStatus !== 'edited') continue;
    if (m.findingDelta === 'already-known') continue;
    const headline =
      m.reviewStatus === 'edited' ? (m.therapistEditedValue ?? m.headline) : m.headline;
    const dup = opts.memoryDuplicates?.find((d) => d.suggestionId === m.id);
    if (dup?.resolution === 'merge') {
      const existing = next.memories.find((x) => x.id === dup.existingMemoryId);
      if (existing) {
        existing.description = [existing.description, m.description].filter(Boolean).join(' · ');
        existing.approximateAge = existing.approximateAge ?? m.approximateAge;
      }
      pushAudit('memories.merge', m, m.evidence, m.reviewStatus, headline);
      continue;
    }
    const similar = next.memories.find(
      (x) => x.headline.toLowerCase() === headline.toLowerCase(),
    );
    if (similar && !dup) {
      conflictsRemaining.push(`Possible duplicate memory: "${headline}"`);
      continue;
    }
    if (similar && dup?.resolution === 'keep-separate') {
      // fall through with new id
    } else if (similar) {
      continue;
    }
    next.memories.push({
      id: m.id,
      headline,
      approximateAge: m.approximateAge,
      description: m.description,
      themes: m.possibleThemes,
      possibleTouchstoneCandidate: m.possibleTouchstoneCandidate,
      sourceAnalysisId: analysisId,
      approvedAt: opts.nowIso,
    });
    pushAudit('memories', m, m.evidence, m.reviewStatus, headline);
  }

  for (const theme of analysis.themes) {
    if (theme.reviewStatus !== 'approved' && theme.reviewStatus !== 'edited') continue;
    if (theme.findingDelta === 'already-known') continue;
    const resolution = opts.themeConflicts?.find((c) => c.theme === theme.theme)?.resolution;
    const priorPrimary = client.themes.find((t) => t.primary)?.theme;
    const existingPrimaryInNext = next.themes.find((t) => t.primary);
    if (priorPrimary && priorPrimary !== theme.theme && !resolution) {
      conflictsRemaining.push(
        `Possible conflict: existing primary theme ${priorPrimary} vs ${theme.theme}`,
      );
      continue;
    }
    if (resolution === 'keep-existing') {
      pushAudit('themes.keep-existing', theme, theme.evidence, 'rejected');
      continue;
    }
    if (resolution === 'replace' && existingPrimaryInNext) {
      next.themes = next.themes.map((t) => ({ ...t, primary: false }));
    }
    const already = next.themes.find((t) => t.theme === theme.theme);
    const makePrimary =
      resolution === 'replace' || (!priorPrimary && !existingPrimaryInNext);
    if (already) {
      already.confidence = theme.confidence;
      already.notes = theme.reasoning;
      if (makePrimary) already.primary = true;
    } else {
      next.themes.push({
        theme: theme.theme,
        confidence: theme.confidence,
        notes: theme.reasoning,
        primary: makePrimary,
        sourceAnalysisId: analysisId,
        approvedAt: opts.nowIso,
      });
    }
    pushAudit('themes', theme, theme.evidence, theme.reviewStatus);
  }

  for (const r of [...analysis.internalResources, ...analysis.externalResources]) {
    if (r.reviewStatus !== 'approved' && r.reviewStatus !== 'edited') continue;
    if (r.findingDelta === 'already-known') continue;
    const value = r.reviewStatus === 'edited' ? (r.therapistEditedValue ?? r.value) : r.value;
    const kind = analysis.internalResources.includes(r) ? 'internal' : 'external';
    if (next.resources.some((x) => x.text.toLowerCase() === value.toLowerCase() && x.kind === kind)) {
      continue;
    }
    next.resources.push({
      id: r.id,
      kind,
      text: value,
      sourceAnalysisId: analysisId,
      approvedAt: opts.nowIso,
    });
    pushAudit(`resources.${kind}`, r.value, r.evidence, r.reviewStatus, r.therapistEditedValue);
  }

  for (const t of analysis.targetCandidates) {
    if (t.reviewStatus !== 'approved' && t.reviewStatus !== 'edited') continue;
    if (t.findingDelta === 'already-known') continue;
    const headline = t.reviewStatus === 'edited' ? (t.therapistEditedValue ?? t.value) : t.value;
    if (next.targetCandidates.some((x) => x.headline.toLowerCase() === headline.toLowerCase())) {
      continue;
    }
    next.targetCandidates.push({
      id: t.id,
      headline,
      approximateAge: t.approximateAge,
      sourceAnalysisId: analysisId,
      approvedAt: opts.nowIso,
    });
    pushAudit('targetCandidates', t.value, t.evidence, t.reviewStatus, t.therapistEditedValue);
  }

  for (const nc of analysis.negativeCognitions) {
    if (nc.reviewStatus !== 'approved' && nc.reviewStatus !== 'edited') continue;
    if (nc.findingDelta === 'already-known') continue;
    const value = nc.reviewStatus === 'edited' ? (nc.therapistEditedValue ?? nc.value) : nc.value;
    if (!next.approvedNc) next.approvedNc = value;
    pushAudit('negativeCognitions', nc.value, nc.evidence, nc.reviewStatus, nc.therapistEditedValue);
  }
  for (const pc of analysis.positiveCognitions) {
    if (pc.reviewStatus !== 'approved' && pc.reviewStatus !== 'edited') continue;
    if (pc.findingDelta === 'already-known') continue;
    const value = pc.reviewStatus === 'edited' ? (pc.therapistEditedValue ?? pc.value) : pc.value;
    if (!next.approvedPc) next.approvedPc = value;
    pushAudit('positiveCognitions', pc.value, pc.evidence, pc.reviewStatus, pc.therapistEditedValue);
  }

  if (analysis.summary.reviewStatus === 'approved' || analysis.summary.reviewStatus === 'edited') {
    next.lastSessionSummary =
      analysis.summary.reviewStatus === 'edited'
        ? (analysis.summary.therapistEditedValue ?? analysis.summary.value)
        : analysis.summary.value;
    pushAudit(
      'summary',
      analysis.summary.value,
      analysis.summary.evidence,
      analysis.summary.reviewStatus,
      analysis.summary.therapistEditedValue,
    );
  }

  return { client: next, audit, conflictsRemaining };
}

export type { ClinicalAIAnalysisRecord, RawTranscriptRecord };
