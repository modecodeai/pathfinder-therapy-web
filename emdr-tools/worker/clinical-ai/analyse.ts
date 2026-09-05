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
import { PCR_PROMPT_VERSION, TA_SCHEMA_VERSION } from '../../src/clinical-intelligence/clinicalReasoning';
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
import { ClinicalAIError, callOpenAIResponses, type OpenAIEnv } from './openai';
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
  const protocol = String(b.protocol ?? 'standard-emdr') as AnalyseProtocol;
  const phase = String(b.phase ?? '') as SupportedAnalysisPhase | 'formulation';
  const lensRaw = String(b.clinicalLens ?? '');

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

  let clinicalLens: ClinicalLens =
    lensRaw === 'emdr' || lensRaw === 'transactional-analysis' || lensRaw === 'integrated'
      ? lensRaw
      : protocol === 'standard-emdr'
        ? 'emdr'
        : protocol === 'transactional-analysis'
          ? 'transactional-analysis'
          : 'integrated';

  // TA / general / integrated formulation uses phase "formulation" or history
  const emdrPhases = phase === 'history' || phase === 'assessment' || phase === 'desensitisation';
  const taPhase = phase === 'formulation' || phase === 'history';

  if (clinicalLens === 'emdr' && !emdrPhases) {
    throw new ClinicalAIError(
      'EMDR lens supports Phase 1 History, Phase 3 Assessment, Phase 4 Desensitisation.',
      'request_failed',
      400,
    );
  }
  if (clinicalLens === 'transactional-analysis' && !taPhase) {
    throw new ClinicalAIError(
      'Transactional Analysis lens currently supports formulation / history analysis.',
      'request_failed',
      400,
    );
  }
  if (clinicalLens === 'integrated' && !(emdrPhases || phase === 'formulation')) {
    throw new ClinicalAIError('Unsupported phase for Integrated lens.', 'request_failed', 400);
  }

  return {
    clientId,
    sessionId: b.sessionId ? String(b.sessionId) : undefined,
    protocol,
    phase:
      clinicalLens === 'transactional-analysis' && phase === 'history'
        ? 'formulation'
        : phase,
    clinicalLens,
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
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
    parentReviewed?: AnyStructuredAnalysis | null;
    isSegment?: boolean;
  },
): Promise<AnalyseResult> {
  const lens = args.clinicalLens ?? 'emdr';
  const priorSummary =
    args.isSegment && args.parentReviewed
      ? summariseApprovedForContext(args.parentReviewed)
      : undefined;

  if (lens === 'transactional-analysis' || args.phase === 'formulation') {
    return runTa(env, args, priorSummary);
  }

  // Integrated with history: run EMDR phase 1 (core+EMDR); TA available as separate analysis
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

async function runTa(
  env: OpenAIEnv,
  args: {
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
    protocol?: AnalyseProtocol;
    isSegment?: boolean;
  },
  priorApprovedSummary?: unknown,
): Promise<AnalyseResult> {
  const instructions = `${CORE_SYSTEM_PROMPT}\n\n${TA_LENS_SYSTEM_APPEND}\n\n${TA_FORMULATION_EXTRACTION}`;
  const input = buildAnalyseUserInput({
    transcript: args.transcript,
    clientContext: args.clientContext,
    protocol: args.protocol ?? 'transactional-analysis',
    phase: 'formulation',
    sessionDate: args.sessionDate,
    priorApprovedSummary,
    isSegment: args.isSegment,
  });
  return runStructured(env, {
    instructions,
    input,
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
