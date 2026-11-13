import type {
  AnyStructuredAnalysis,
  ApprovedClientContext,
  Phase3AssessmentAnalysis,
  Phase4DesensitisationAnalysis,
  SupportedAnalysisPhase,
  TranscriptAnalysis,
} from '../../src/clinical-intelligence/types';
import {
  PHASE3_SCHEMA_VERSION,
  PHASE4_SCHEMA_VERSION,
  PROMPT_VERSION,
  SCHEMA_VERSION,
} from '../../src/clinical-intelligence/types';
import type { ClinicalLens } from '../../src/clinical-intelligence/clinicalReasoning';
import type {
  PrimaryTreatmentApproach,
  ReasoningMode,
} from '../../src/clinical-intelligence/clinicalReasoning';
import { PCR_PROMPT_VERSION, TA_SCHEMA_VERSION } from '../../src/clinical-intelligence/clinicalReasoning';
import {
  shouldRunEmdrPipeline,
  shouldRunTaPipeline,
} from '../../src/clinical-intelligence/lib/lensGovernance';
import {
  BASE_SYSTEM_PROMPT,
  PHASE1_HISTORY_EXTRACTION,
  PHASE3_ASSESSMENT_EXTRACTION,
  PHASE4_DESENSITISATION_EXTRACTION,
  STRUCTURED_REPAIR_PROMPT,
  TA_FORMULATION_EXTRACTION,
  CORE_SYSTEM_PROMPT,
  TA_LENS_SYSTEM_APPEND,
  buildAnalyseUserInput,
} from './prompts';
import { LENS_CONSIDERATIONS_EXTRACTION } from './prompts/core';
import { ClinicalAIError, callOpenAIResponses, type OpenAIEnv } from './openai';
import { normaliseTranscriptSpeakers } from '../../src/clinical-intelligence/lib/speakerNormalisation';
import { segmentTranscriptSession } from '../../src/clinical-intelligence/lib/sessionSegmentation';
import {
  TRANSCRIPT_ANALYSIS_JSON_SCHEMA,
  parseTranscriptAnalysisJson,
  validateTranscriptAnalysis,
} from './schema';
import {
  PHASE3_ASSESSMENT_JSON_SCHEMA,
  PHASE4_DESENSITISATION_JSON_SCHEMA,
  validatePhase3Analysis,
  validatePhase4Analysis,
} from './schemaPhase34';
import { TA_FORMULATION_JSON_SCHEMA, validateTaAnalysis } from './schemaTa';
import { applySegmentDeltas, summariseApprovedForContext } from './segmentDiff';

const MAX_TRANSCRIPT_CHARS = 120_000;

export type AnalyseProtocol =
  | 'standard-emdr'
  | 'general-psychotherapy'
  | 'transactional-analysis'
  | 'integrated';

export function assertAnalyseRequest(body: unknown): {
  clientId: string;
  sessionId?: string;
  protocol: AnalyseProtocol;
  phase: SupportedAnalysisPhase | 'formulation';
  clinicalLens: ClinicalLens;
  reasoningMode: ReasoningMode;
  primaryApproach: PrimaryTreatmentApproach;
  exploreEmdr: boolean;
  transcript: string;
  sessionDate?: string;
  parentAnalysisId?: string;
} {
  if (!body || typeof body !== 'object') {
    throw new ClinicalAIError('Invalid request body.', 'request_failed', 400);
  }
  const b = body as Record<string, unknown>;
  const clientId = String(b.clientId ?? '').trim();
  const transcript = String(b.transcript ?? '');
  // Never default to EMDR — therapist/client frame must select it
  const protocol = String(b.protocol ?? 'general-psychotherapy') as AnalyseProtocol;
  const phase = String(b.phase ?? 'formulation') as SupportedAnalysisPhase | 'formulation';
  const lensRaw = String(b.clinicalLens ?? '');
  const modeRaw = String(b.reasoningMode ?? 'primary-lens-only');
  const approachRaw = String(b.primaryApproach ?? 'unspecified');
  const exploreEmdr = Boolean(b.exploreEmdr);

  if (!clientId) throw new ClinicalAIError('clientId is required.', 'request_failed', 400);
  if (!transcript.trim()) throw new ClinicalAIError('Transcript must not be empty.', 'request_failed', 400);
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    throw new ClinicalAIError('Transcript exceeds the maximum allowed size.', 'request_failed', 400);
  }

  const allowedProtocols: AnalyseProtocol[] = [
    'standard-emdr',
    'general-psychotherapy',
    'transactional-analysis',
    'integrated',
  ];
  if (!allowedProtocols.includes(protocol)) {
    throw new ClinicalAIError(
      'Supported clinical contexts: General Psychotherapy, Standard EMDR, Transactional Analysis, Integrated.',
      'request_failed',
      400,
    );
  }

  const reasoningMode: ReasoningMode =
    modeRaw === 'integrated' ||
    modeRaw === 'core-only' ||
    modeRaw === 'choose-lenses' ||
    modeRaw === 'primary-lens-only'
      ? modeRaw
      : 'primary-lens-only';

  const primaryApproach: PrimaryTreatmentApproach =
    approachRaw === 'general-integrative' ||
    approachRaw === 'transactional-analysis' ||
    approachRaw === 'emdr' ||
    approachRaw === 'integrated-ta-emdr' ||
    approachRaw === 'pain' ||
    approachRaw === 'other' ||
    approachRaw === 'unspecified'
      ? approachRaw
      : 'unspecified';

  let clinicalLens: ClinicalLens =
    lensRaw === 'emdr' || lensRaw === 'transactional-analysis' || lensRaw === 'integrated'
      ? lensRaw
      : protocol === 'standard-emdr'
        ? 'emdr'
        : protocol === 'transactional-analysis'
          ? 'transactional-analysis'
          : 'integrated';

  // Governance: TA / core / integrated-without-EMDR must not force EMDR phases
  const runEmdr = shouldRunEmdrPipeline({
    reasoningMode,
    primaryApproach,
    clinicalLens,
    exploreEmdr,
  });
  const runTa = shouldRunTaPipeline({
    reasoningMode,
    primaryApproach,
    clinicalLens,
  });

  if (runEmdr && !runTa) clinicalLens = 'emdr';
  else if (runTa && !runEmdr) clinicalLens = 'transactional-analysis';
  else if (reasoningMode === 'integrated') clinicalLens = 'integrated';

  const emdrPhases = phase === 'history' || phase === 'assessment' || phase === 'desensitisation';
  const taPhase = phase === 'formulation' || phase === 'history';

  if (clinicalLens === 'emdr' && !emdrPhases) {
    throw new ClinicalAIError(
      'EMDR lens supports Phase 1 History, Phase 3 Assessment, Phase 4 Desensitisation.',
      'request_failed',
      400,
    );
  }
  if (
    (clinicalLens === 'transactional-analysis' ||
      reasoningMode === 'core-only' ||
      (clinicalLens === 'integrated' && runTa && !runEmdr)) &&
    !taPhase
  ) {
    throw new ClinicalAIError(
      'Transactional Analysis / core / integrated (non-EMDR) analysis supports formulation / history.',
      'request_failed',
      400,
    );
  }

  const resolvedPhase: SupportedAnalysisPhase | 'formulation' =
    clinicalLens === 'transactional-analysis' ||
    reasoningMode === 'core-only' ||
    (clinicalLens === 'integrated' && runTa && !runEmdr)
      ? phase === 'history' || phase === 'formulation'
        ? 'formulation'
        : phase
      : phase;

  return {
    clientId,
    sessionId: b.sessionId ? String(b.sessionId) : undefined,
    protocol,
    phase: resolvedPhase,
    clinicalLens,
    reasoningMode,
    primaryApproach,
    exploreEmdr,
    transcript,
    sessionDate: b.sessionDate ? String(b.sessionDate) : undefined,
    parentAnalysisId: b.parentAnalysisId ? String(b.parentAnalysisId) : undefined,
  };
}

type AnalyseResult = {
  analysis: AnyStructuredAnalysis;
  model: string;
  latencyMs: number;
  promptVersion: string;
  schemaVersion: string;
};

export async function analyseTranscript(
  env: OpenAIEnv,
  args: {
    phase: SupportedAnalysisPhase | 'formulation';
    clinicalLens?: ClinicalLens;
    protocol?: AnalyseProtocol;
    reasoningMode?: ReasoningMode;
    primaryApproach?: PrimaryTreatmentApproach;
    exploreEmdr?: boolean;
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
    parentReviewed?: AnyStructuredAnalysis | null;
    isSegment?: boolean;
  },
): Promise<AnalyseResult> {
  const reasoningMode = args.reasoningMode ?? 'primary-lens-only';
  const primaryApproach = args.primaryApproach ?? 'unspecified';
  const clinicalLens = args.clinicalLens ?? 'integrated';
  const runEmdr = shouldRunEmdrPipeline({
    reasoningMode,
    primaryApproach,
    clinicalLens,
    exploreEmdr: args.exploreEmdr,
  });
  const runTa = shouldRunTaPipeline({
    reasoningMode,
    primaryApproach,
    clinicalLens,
  });

  const priorSummary =
    args.isSegment && args.parentReviewed
      ? summariseApprovedForContext(args.parentReviewed)
      : undefined;

  // Three-layer rule: never start with EMDR unless selected / primary EMDR / explore
  if (runTa && !runEmdr) {
    return runTaAnalysis(env, {
      ...args,
      reasoningMode,
      primaryApproach,
      includeLensConsiderations: reasoningMode === 'integrated',
      suppressTaConstructs: reasoningMode === 'core-only',
    }, priorSummary);
  }

  if (runEmdr) {
    let result: AnalyseResult;
    if (args.phase === 'assessment') {
      result = await runPhase3(env, args, priorSummary);
    } else if (args.phase === 'desensitisation') {
      result = await runPhase4(env, args, priorSummary);
    } else {
      result = await runPhase1(env, args, priorSummary);
    }
    if (args.isSegment) {
      return {
        ...result,
        analysis: applySegmentDeltas(result.analysis, args.parentReviewed),
      };
    }
    return result;
  }

  // Fallback: core-only via TA schema with constructs suppressed
  return runTaAnalysis(env, {
    ...args,
    reasoningMode: 'core-only',
    primaryApproach,
    includeLensConsiderations: false,
    suppressTaConstructs: true,
  }, priorSummary);
}

/** @deprecated use analyseTranscript — kept for callers expecting Phase 1 only */
export async function analysePhase1Transcript(
  env: OpenAIEnv,
  args: {
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
  },
): Promise<{
  analysis: TranscriptAnalysis;
  model: string;
  latencyMs: number;
  promptVersion: string;
  schemaVersion: string;
}> {
  const result = await analyseTranscript(env, {
    phase: 'history',
    transcript: args.transcript,
    clientContext: args.clientContext,
    sessionDate: args.sessionDate,
  });
  return {
    ...result,
    analysis: result.analysis as TranscriptAnalysis,
  };
}

async function runPhase1(
  env: OpenAIEnv,
  args: {
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
    isSegment?: boolean;
  },
  priorApprovedSummary?: unknown,
): Promise<AnalyseResult> {
  const instructions = `${BASE_SYSTEM_PROMPT}\n\n${PHASE1_HISTORY_EXTRACTION}`;
  const input = buildAnalyseUserInput({
    transcript: args.transcript,
    clientContext: args.clientContext,
    protocol: 'standard-emdr',
    phase: 'history',
    sessionDate: args.sessionDate,
    priorApprovedSummary,
    isSegment: args.isSegment,
  });
  return runStructured(env, {
    instructions,
    input,
    schemaName: 'transcript_analysis',
    schema: TRANSCRIPT_ANALYSIS_JSON_SCHEMA,
    schemaVersion: SCHEMA_VERSION,
    validate: (text) => {
      try {
        return validateTranscriptAnalysis(parseTranscriptAnalysisJson(text));
      } catch {
        return { ok: false as const, error: 'parse_error' };
      }
    },
  });
}

async function runTaAnalysis(
  env: OpenAIEnv,
  args: {
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
    protocol?: AnalyseProtocol;
    isSegment?: boolean;
    reasoningMode?: ReasoningMode;
    primaryApproach?: PrimaryTreatmentApproach;
    includeLensConsiderations?: boolean;
    suppressTaConstructs?: boolean;
  },
  priorApprovedSummary?: unknown,
): Promise<AnalyseResult> {
  const considerations =
    args.includeLensConsiderations ? `\n\n${LENS_CONSIDERATIONS_EXTRACTION}` : '';
  const instructions = `${CORE_SYSTEM_PROMPT}\n\n${
    args.suppressTaConstructs
      ? 'CORE-ONLY MODE: Do not produce TA constructs. Set noSufficientTaEvidence=true and leave TA arrays empty.'
      : TA_LENS_SYSTEM_APPEND
  }\n\n${TA_FORMULATION_EXTRACTION}${considerations}`;
  const speakerNorm = normaliseTranscriptSpeakers(args.transcript, {
    therapistNames: ['Brent'],
  });
  const segmented = segmentTranscriptSession(args.transcript);
  const clinicalTranscript = segmented.sessionOnlyText || args.transcript;
  const input = buildAnalyseUserInput({
    transcript: clinicalTranscript,
    clientContext: args.clientContext,
    protocol: args.protocol ?? 'transactional-analysis',
    phase: 'formulation',
    sessionDate: args.sessionDate,
    priorApprovedSummary,
    isSegment: args.isSegment,
    reasoningMode: args.reasoningMode,
    primaryApproach: args.primaryApproach,
    includeLensConsiderations: args.includeLensConsiderations,
    suppressTaConstructs: args.suppressTaConstructs,
  });
  const speakerAppendix = [
    '',
    'SPEAKER NORMALISATION (analysis aid only — original transcript remains authoritative and unchanged):',
    JSON.stringify(
      {
        speakerMap: speakerNorm.speakerMap,
        normalisedView: speakerNorm.normalisedView,
      },
      null,
      2,
    ),
    'Do not invent additional client participants. Mark uncertain attribution as unknown when needed.',
    '',
    'SESSION SEGMENTATION (analysis aid — do not formulate from non-session / post-session segments):',
    JSON.stringify(
      {
        suggestedClinicalEndTimestamp: segmented.suggestedClinicalEndTimestamp,
        segments: segmented.segments.map((s) => ({
          kind: s.kind,
          reason: s.reason,
          excludeFromClinicalAnalysisSuggested: s.excludeFromClinicalAnalysisSuggested,
          preview: s.preview,
          startTimestamp: s.startTimestamp,
          endTimestamp: s.endTimestamp,
        })),
      },
      null,
      2,
    ),
    'The transcript provided above is session-only text when segmentation succeeded. Non-session audio and post-session material must not enter clinical formulation.',
  ].join('\n');
  return runStructured(env, {
    instructions,
    input: `${input}${speakerAppendix}`,
    schemaName: 'ta_formulation_analysis',
    schema: TA_FORMULATION_JSON_SCHEMA as unknown as Record<string, unknown>,
    schemaVersion: TA_SCHEMA_VERSION,
    promptVersion: PCR_PROMPT_VERSION,
    validate: (text) => {
      try {
        const parsed = parseTranscriptAnalysisJson(text);
        return { ok: true as const, value: validateTaAnalysis(parsed) };
      } catch {
        return { ok: false as const, error: 'parse_error' };
      }
    },
  });
}

async function runPhase3(
  env: OpenAIEnv,
  args: {
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
    isSegment?: boolean;
  },
  priorApprovedSummary?: unknown,
): Promise<AnalyseResult> {
  const instructions = `${BASE_SYSTEM_PROMPT}\n\n${PHASE3_ASSESSMENT_EXTRACTION}`;
  const input = buildAnalyseUserInput({
    transcript: args.transcript,
    clientContext: args.clientContext,
    protocol: 'standard-emdr',
    phase: 'assessment',
    sessionDate: args.sessionDate,
    priorApprovedSummary,
    isSegment: args.isSegment,
  });
  return runStructured(env, {
    instructions,
    input,
    schemaName: 'phase3_assessment',
    schema: PHASE3_ASSESSMENT_JSON_SCHEMA,
    schemaVersion: PHASE3_SCHEMA_VERSION,
    validate: (text) => {
      try {
        return validatePhase3Analysis(parseTranscriptAnalysisJson(text));
      } catch {
        return { ok: false as const, error: 'parse_error' };
      }
    },
  });
}

async function runPhase4(
  env: OpenAIEnv,
  args: {
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
    isSegment?: boolean;
  },
  priorApprovedSummary?: unknown,
): Promise<AnalyseResult> {
  const instructions = `${BASE_SYSTEM_PROMPT}\n\n${PHASE4_DESENSITISATION_EXTRACTION}`;
  const input = buildAnalyseUserInput({
    transcript: args.transcript,
    clientContext: args.clientContext,
    protocol: 'standard-emdr',
    phase: 'desensitisation',
    sessionDate: args.sessionDate,
    priorApprovedSummary,
    isSegment: args.isSegment,
  });
  return runStructured(env, {
    instructions,
    input,
    schemaName: 'phase4_desensitisation',
    schema: PHASE4_DESENSITISATION_JSON_SCHEMA,
    schemaVersion: PHASE4_SCHEMA_VERSION,
    validate: (text) => {
      try {
        return validatePhase4Analysis(parseTranscriptAnalysisJson(text));
      } catch {
        return { ok: false as const, error: 'parse_error' };
      }
    },
  });
}

async function runStructured(
  env: OpenAIEnv,
  opts: {
    instructions: string;
    input: string;
    schemaName: string;
    schema: Record<string, unknown>;
    schemaVersion: string;
    promptVersion?: string;
    validate: (
      text: string,
    ) =>
      | { ok: true; value: AnyStructuredAnalysis }
      | { ok: false; error: string };
  },
): Promise<AnalyseResult> {
  const first = await callOpenAIResponses(env, {
    instructions: opts.instructions,
    input: opts.input,
    jsonSchema: { name: opts.schemaName, schema: opts.schema },
  });

  let validated = opts.validate(first.text);
  if (!validated.ok) {
    const repair = await callOpenAIResponses(env, {
      instructions: `${opts.instructions}\n\n${STRUCTURED_REPAIR_PROMPT}`,
      input: `Previous invalid output (for repair only):\n${first.text.slice(0, 8000)}\n\nOriginal transcript and context remain authoritative:\n${opts.input}`,
      jsonSchema: { name: opts.schemaName, schema: opts.schema },
    });
    validated = opts.validate(repair.text);
    if (!validated.ok) {
      throw new ClinicalAIError(
        'Clinical Reasoning returned invalid structured data. Your transcript has been preserved.',
        'invalid_output',
      );
    }
    return {
      analysis: validated.value,
      model: repair.model,
      latencyMs: first.latencyMs + repair.latencyMs,
      promptVersion: opts.promptVersion ?? PROMPT_VERSION,
      schemaVersion: opts.schemaVersion,
    };
  }

  return {
    analysis: validated.value,
    model: first.model,
    latencyMs: first.latencyMs,
    promptVersion: opts.promptVersion ?? PROMPT_VERSION,
    schemaVersion: opts.schemaVersion,
  };
}

export type { Phase3AssessmentAnalysis, Phase4DesensitisationAnalysis };
