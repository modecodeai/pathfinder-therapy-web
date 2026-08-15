import type {
  ApplyFindingsRequest,
  ApprovedClientContext,
  AuditProvenance,
  ClientRecord,
  ClinicalAIAnalysisRecord,
  ClinicalThemeId,
  RawTranscriptRecord,
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
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function toApprovedClientContext(client: ClientRecord): ApprovedClientContext {
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

export function applyApprovedFindings(
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
    const value = p.reviewStatus === 'edited' ? (p.therapistEditedValue ?? p.value) : p.value;
    if (!next.presentingProblems.includes(value)) next.presentingProblems.push(value);
    if (!next.presentingProblem) next.presentingProblem = value;
    pushAudit('presentingProblems', p.value, p.evidence, p.reviewStatus, p.therapistEditedValue);
  }

  for (const t of analysis.triggers) {
    if (t.reviewStatus !== 'approved' && t.reviewStatus !== 'edited') continue;
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

  // NC/PC: store as approved suggestions on record only if approved — do not auto-fill Phase 3 target
  for (const nc of analysis.negativeCognitions) {
    if (nc.reviewStatus !== 'approved' && nc.reviewStatus !== 'edited') continue;
    const value = nc.reviewStatus === 'edited' ? (nc.therapistEditedValue ?? nc.value) : nc.value;
    if (!next.approvedNc) next.approvedNc = value;
    pushAudit('negativeCognitions', nc.value, nc.evidence, nc.reviewStatus, nc.therapistEditedValue);
  }
  for (const pc of analysis.positiveCognitions) {
    if (pc.reviewStatus !== 'approved' && pc.reviewStatus !== 'edited') continue;
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
