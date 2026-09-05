import type { ApprovedClientContext, TranscriptAnalysis } from '../../src/clinical-intelligence/types';
import { PROMPT_VERSION, SCHEMA_VERSION } from '../../src/clinical-intelligence/types';
import {
  BASE_SYSTEM_PROMPT,
  PHASE1_HISTORY_EXTRACTION,
  STRUCTURED_REPAIR_PROMPT,
  buildAnalyseUserInput,
} from './prompts';
import { ClinicalAIError, callOpenAIResponses, type OpenAIEnv } from './openai';
import {
  TRANSCRIPT_ANALYSIS_JSON_SCHEMA,
  parseTranscriptAnalysisJson,
  validateTranscriptAnalysis,
} from './schema';

const MAX_TRANSCRIPT_CHARS = 120_000;

export function assertAnalyseRequest(body: unknown): {
  clientId: string;
  sessionId?: string;
  protocol: 'standard-emdr';
  phase: 'history';
  transcript: string;
  sessionDate?: string;
} {
  if (!body || typeof body !== 'object') {
    throw new ClinicalAIError('Invalid request body.', 'request_failed', 400);
  }
  const b = body as Record<string, unknown>;
  const clientId = String(b.clientId ?? '').trim();
  const transcript = String(b.transcript ?? '');
  const protocol = String(b.protocol ?? '');
  const phase = String(b.phase ?? '');

  if (!clientId) throw new ClinicalAIError('clientId is required.', 'request_failed', 400);
  if (!transcript.trim()) throw new ClinicalAIError('Transcript must not be empty.', 'request_failed', 400);
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    throw new ClinicalAIError('Transcript exceeds the maximum allowed size.', 'request_failed', 400);
  }
  if (protocol !== 'standard-emdr' || phase !== 'history') {
    throw new ClinicalAIError(
      'v0.1 supports Standard EMDR Phase 1 (History / Treatment Planning) only.',
      'request_failed',
      400,
    );
  }

  return {
    clientId,
    sessionId: b.sessionId ? String(b.sessionId) : undefined,
    protocol: 'standard-emdr',
    phase: 'history',
    transcript,
    sessionDate: b.sessionDate ? String(b.sessionDate) : undefined,
  };
}

export async function analysePhase1Transcript(
  env: OpenAIEnv,
  args: {
    transcript: string;
    clientContext: ApprovedClientContext;
    sessionDate?: string;
  },
): Promise<{ analysis: TranscriptAnalysis; model: string; latencyMs: number; promptVersion: string; schemaVersion: string }> {
  const instructions = `${BASE_SYSTEM_PROMPT}\n\n${PHASE1_HISTORY_EXTRACTION}`;
  const input = buildAnalyseUserInput({
    transcript: args.transcript,
    clientContext: args.clientContext,
    protocol: 'standard-emdr',
    phase: 'history',
    sessionDate: args.sessionDate,
  });

  const first = await callOpenAIResponses(env, {
    instructions,
    input,
    jsonSchema: { name: 'transcript_analysis', schema: TRANSCRIPT_ANALYSIS_JSON_SCHEMA },
  });

  let validated = tryValidate(first.text);
  if (!validated.ok) {
    const repair = await callOpenAIResponses(env, {
      instructions: `${instructions}\n\n${STRUCTURED_REPAIR_PROMPT}`,
      input: `Previous invalid output (for repair only):\n${first.text.slice(0, 8000)}\n\nOriginal transcript and context remain authoritative:\n${input}`,
      jsonSchema: { name: 'transcript_analysis', schema: TRANSCRIPT_ANALYSIS_JSON_SCHEMA },
    });
    validated = tryValidate(repair.text);
    if (!validated.ok) {
      throw new ClinicalAIError(
        'Clinical Intelligence returned invalid structured data. Your transcript has been preserved.',
        'invalid_output',
      );
    }
    return {
      analysis: validated.value,
      model: repair.model,
      latencyMs: first.latencyMs + repair.latencyMs,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  return {
    analysis: validated.value,
    model: first.model,
    latencyMs: first.latencyMs,
    promptVersion: PROMPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
  };
}

function tryValidate(text: string) {
  try {
    const parsed = parseTranscriptAnalysisJson(text);
    return validateTranscriptAnalysis(parsed);
  } catch {
    return { ok: false as const, error: 'parse_error' };
  }
}
