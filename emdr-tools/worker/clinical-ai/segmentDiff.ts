import type {
  AnyStructuredAnalysis,
  ClinicalSuggestion,
  FindingDelta,
  MemorySuggestion,
  Phase3AssessmentAnalysis,
  Phase4DesensitisationAnalysis,
  ProcessingSequenceStep,
  TranscriptAnalysis,
} from '../../src/clinical-intelligence/types';

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function similar(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const aw = new Set(x.split(' ').filter((w) => w.length > 2));
  const bw = y.split(' ').filter((w) => w.length > 2);
  if (!bw.length || !aw.size) return false;
  const overlap = bw.filter((w) => aw.has(w)).length;
  return overlap / Math.max(bw.length, 1) >= 0.6;
}

function classifyAgainst(priorValues: string[], incoming: string): FindingDelta {
  const n = norm(incoming);
  if (!n) return 'new';
  if (priorValues.some((p) => norm(p) === n)) return 'already-known';
  const soft = priorValues.find((p) => similar(p, incoming));
  if (!soft) return 'new';
  if (norm(soft) !== n) return 'possible-conflict';
  return 'already-known';
}

function approvedText(items: Array<ClinicalSuggestion | MemorySuggestion | ProcessingSequenceStep>): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (item.reviewStatus !== 'approved' && item.reviewStatus !== 'edited') continue;
    if ('therapistEditedValue' in item && item.reviewStatus === 'edited' && item.therapistEditedValue) {
      out.push(String(item.therapistEditedValue));
      continue;
    }
    if ('headline' in item) out.push(item.headline);
    else if ('value' in item) out.push(String(item.value));
  }
  return out;
}

function tagSuggestion<T extends ClinicalSuggestion>(item: T, prior: string[]): T {
  return { ...item, findingDelta: classifyAgainst(prior, String(item.value)) };
}

function tagMemory(item: MemorySuggestion, prior: string[]): MemorySuggestion {
  return { ...item, findingDelta: classifyAgainst(prior, item.headline) };
}

function tagStep(item: ProcessingSequenceStep, prior: string[]): ProcessingSequenceStep {
  return { ...item, findingDelta: classifyAgainst(prior, item.value) };
}

function pickApprovedAnalysis(parent: AnyStructuredAnalysis): AnyStructuredAnalysis {
  return parent;
}

/** Mark New / Updated / Possible Conflict / Already Known vs previously approved material. */
export function applySegmentDeltas(
  incoming: AnyStructuredAnalysis,
  parentReviewed: AnyStructuredAnalysis | null | undefined,
): AnyStructuredAnalysis {
  if (!parentReviewed) return incoming;
  const prior = pickApprovedAnalysis(parentReviewed);

  if (incoming.analysisKind === 'phase1-history' && prior.analysisKind === 'phase1-history') {
    return diffPhase1(incoming, prior);
  }
  if (incoming.analysisKind === 'phase3-assessment' && prior.analysisKind === 'phase3-assessment') {
    return diffPhase3(incoming, prior);
  }
  if (incoming.analysisKind === 'phase4-desensitisation' && prior.analysisKind === 'phase4-desensitisation') {
    return diffPhase4(incoming, prior);
  }
  return incoming;
}

function fieldDelta(
  incoming: ClinicalSuggestion | null,
  prior: ClinicalSuggestion | null,
): ClinicalSuggestion | null {
  if (!incoming) return null;
  if (!prior || (prior.reviewStatus !== 'approved' && prior.reviewStatus !== 'edited')) {
    return { ...incoming, findingDelta: 'new' };
  }
  const priorVal =
    prior.reviewStatus === 'edited' ? String(prior.therapistEditedValue ?? prior.value) : prior.value;
  const delta = classifyAgainst([priorVal], incoming.value);
  if (delta === 'already-known') return { ...incoming, findingDelta: 'already-known' };
  if (delta === 'possible-conflict') return { ...incoming, findingDelta: 'possible-conflict' };
  // soft similar but classified new → treat as updated when prior existed
  if (similar(priorVal, incoming.value) && norm(priorVal) !== norm(incoming.value)) {
    return { ...incoming, findingDelta: 'updated' };
  }
  return { ...incoming, findingDelta: 'new' };
}

function refineUpdated(items: ClinicalSuggestion[], priorTexts: string[]): ClinicalSuggestion[] {
  return items.map((item) => {
    const tagged = tagSuggestion(item, priorTexts);
    if (tagged.findingDelta === 'possible-conflict') {
      // Prefer "updated" when clearly elaborating the same idea with extra detail
      const match = priorTexts.find((p) => similar(p, item.value));
      if (match && norm(item.value).length > norm(match).length + 8) {
        return { ...tagged, findingDelta: 'updated' as FindingDelta };
      }
    }
    return tagged;
  });
}

function diffPhase1(incoming: TranscriptAnalysis, prior: TranscriptAnalysis): TranscriptAnalysis {
  return {
    ...incoming,
    summary: tagSuggestion(incoming.summary, approvedText([prior.summary])),
    presentingProblems: refineUpdated(incoming.presentingProblems, approvedText(prior.presentingProblems)),
    symptoms: refineUpdated(incoming.symptoms, approvedText(prior.symptoms)),
    recentExamples: refineUpdated(incoming.recentExamples, approvedText(prior.recentExamples)),
    triggers: refineUpdated(incoming.triggers, approvedText(prior.triggers)),
    memories: incoming.memories.map((m) => tagMemory(m, approvedText(prior.memories))),
    associativeLinks: refineUpdated(incoming.associativeLinks, approvedText(prior.associativeLinks)),
    themes: incoming.themes.map((t) => {
      const priorTheme = prior.themes.find(
        (p) =>
          p.theme === t.theme && (p.reviewStatus === 'approved' || p.reviewStatus === 'edited'),
      );
      if (!priorTheme) return { ...t, findingDelta: 'new' as FindingDelta };
      return { ...t, findingDelta: 'already-known' as FindingDelta };
    }),
    negativeCognitions: refineUpdated(
      incoming.negativeCognitions,
      approvedText(prior.negativeCognitions),
    ) as TranscriptAnalysis['negativeCognitions'],
    positiveCognitions: refineUpdated(
      incoming.positiveCognitions,
      approvedText(prior.positiveCognitions),
    ) as TranscriptAnalysis['positiveCognitions'],
    internalResources: refineUpdated(incoming.internalResources, approvedText(prior.internalResources)),
    externalResources: refineUpdated(incoming.externalResources, approvedText(prior.externalResources)),
    targetCandidates: refineUpdated(
      incoming.targetCandidates,
      approvedText(prior.targetCandidates),
    ) as TranscriptAnalysis['targetCandidates'],
    clinicalConsiderations: refineUpdated(
      incoming.clinicalConsiderations,
      approvedText(prior.clinicalConsiderations),
    ),
  };
}

function diffPhase3(
  incoming: Phase3AssessmentAnalysis,
  prior: Phase3AssessmentAnalysis,
): Phase3AssessmentAnalysis {
  return {
    ...incoming,
    summary: tagSuggestion(incoming.summary, approvedText([prior.summary])),
    target: fieldDelta(incoming.target, prior.target) as ClinicalSuggestion,
    worstPart: fieldDelta(incoming.worstPart, prior.worstPart),
    image: fieldDelta(incoming.image, prior.image),
    negativeCognition: fieldDelta(incoming.negativeCognition, prior.negativeCognition) as Phase3AssessmentAnalysis['negativeCognition'],
    positiveCognition: fieldDelta(incoming.positiveCognition, prior.positiveCognition) as Phase3AssessmentAnalysis['positiveCognition'],
    voc: fieldDelta(incoming.voc, prior.voc),
    emotion: fieldDelta(incoming.emotion, prior.emotion),
    sud: fieldDelta(incoming.sud, prior.sud),
    bodyLocation: fieldDelta(incoming.bodyLocation, prior.bodyLocation),
  };
}

function diffPhase4(
  incoming: Phase4DesensitisationAnalysis,
  prior: Phase4DesensitisationAnalysis,
): Phase4DesensitisationAnalysis {
  const priorSeq = approvedText(prior.sequence);
  return {
    ...incoming,
    summary: tagSuggestion(incoming.summary, approvedText([prior.summary])),
    sequence: incoming.sequence.map((s) => {
      const tagged = tagStep(s, priorSeq);
      if (tagged.findingDelta === 'possible-conflict') {
        const match = priorSeq.find((p) => similar(p, s.value));
        if (match && norm(s.value).length > norm(match).length + 8) {
          return { ...tagged, findingDelta: 'updated' as FindingDelta };
        }
      }
      return tagged;
    }),
    associations: refineUpdated(incoming.associations, approvedText(prior.associations)),
    newMemories: incoming.newMemories.map((m) => tagMemory(m, approvedText(prior.newMemories))),
    adaptiveInformation: refineUpdated(incoming.adaptiveInformation, approvedText(prior.adaptiveInformation)),
    sudChanges: refineUpdated(incoming.sudChanges, approvedText(prior.sudChanges)),
    feederMemories: refineUpdated(incoming.feederMemories, approvedText(prior.feederMemories)),
    blockingBeliefs: refineUpdated(incoming.blockingBeliefs, approvedText(prior.blockingBeliefs)),
    therapistInterventions: refineUpdated(
      incoming.therapistInterventions,
      approvedText(prior.therapistInterventions),
    ),
    imageThoughtEmotionBodyChanges: refineUpdated(
      incoming.imageThoughtEmotionBodyChanges,
      approvedText(prior.imageThoughtEmotionBodyChanges),
    ),
  };
}

/** Compact approved snapshot for model context (avoid re-sending full transcript). */
export function summariseApprovedForContext(analysis: AnyStructuredAnalysis): unknown {
  if (analysis.analysisKind === 'phase1-history') {
    return {
      presentingProblems: approvedText(analysis.presentingProblems),
      memories: approvedText(analysis.memories),
      themes: analysis.themes
        .filter((t) => t.reviewStatus === 'approved' || t.reviewStatus === 'edited')
        .map((t) => t.theme),
      negativeCognitions: approvedText(analysis.negativeCognitions),
    };
  }
  if (analysis.analysisKind === 'phase3-assessment') {
    const pick = (s: ClinicalSuggestion | null) =>
      s && (s.reviewStatus === 'approved' || s.reviewStatus === 'edited')
        ? s.reviewStatus === 'edited'
          ? s.therapistEditedValue ?? s.value
          : s.value
        : null;
    return {
      target: pick(analysis.target),
      image: pick(analysis.image),
      nc: pick(analysis.negativeCognition),
      pc: pick(analysis.positiveCognition),
      voc: analysis.vocNumeric,
      sud: analysis.sudNumeric,
      emotion: pick(analysis.emotion),
      body: pick(analysis.bodyLocation),
    };
  }
  return {
    sequence: approvedText(analysis.sequence),
    associations: approvedText(analysis.associations),
    resolutionStatus: analysis.resolutionStatus,
  };
}
