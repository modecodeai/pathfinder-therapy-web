/** Server-only OpenAI client. Never import from browser bundles. */

export interface OpenAIEnv {
  OPENAI_API_KEY?: string;
  OPENAI_CLINICAL_MODEL?: string;
}

export function isOpenAIConfigured(env: OpenAIEnv): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim() && env.OPENAI_CLINICAL_MODEL?.trim());
}

export function clinicalModelName(env: OpenAIEnv): string | null {
  const m = env.OPENAI_CLINICAL_MODEL?.trim();
  return m || null;
}

export class ClinicalAIError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'not_configured'
      | 'auth'
      | 'rate_limit'
      | 'quota'
      | 'billing'
      | 'unavailable'
      | 'invalid_output'
      | 'request_failed',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ClinicalAIError';
  }
}

export function mapOpenAIHttpError(status: number, bodyText: string): ClinicalAIError {
  const lower = bodyText.toLowerCase();
  if (status === 401 || status === 403) {
    return new ClinicalAIError(
      'Clinical Intelligence authentication failed. Check the server OpenAI configuration.',
      'auth',
      status,
    );
  }
  if (status === 429) {
    if (lower.includes('billing') || lower.includes('quota') || lower.includes('insufficient')) {
      return new ClinicalAIError(
        'OpenAI usage limit reached. Clinical Intelligence is temporarily unavailable. Your transcript has been preserved.',
        'quota',
        status,
      );
    }
    return new ClinicalAIError(
      'OpenAI rate limit reached. Clinical Intelligence is temporarily unavailable. Your transcript has been preserved.',
      'rate_limit',
      status,
    );
  }
  if (status === 402 || lower.includes('billing')) {
    return new ClinicalAIError(
      'OpenAI billing issue. Clinical Intelligence is temporarily unavailable. Your transcript has been preserved.',
      'billing',
      status,
    );
  }
  if (status >= 500) {
    return new ClinicalAIError(
      'OpenAI service is temporarily unavailable. Your transcript has been preserved.',
      'unavailable',
      status,
    );
  }
  return new ClinicalAIError(
    'Clinical Intelligence could not complete this request. Your transcript has been preserved.',
    'request_failed',
    status,
  );
}

export interface ResponsesCallResult {
  text: string;
  model: string;
  latencyMs: number;
}

/**
 * Call OpenAI Responses API (server-side only).
 * Model always comes from OPENAI_CLINICAL_MODEL — never hard-coded.
 */
export async function callOpenAIResponses(
  env: OpenAIEnv,
  args: {
    instructions: string;
    input: string;
    jsonSchema?: { name: string; schema: Record<string, unknown> };
  },
): Promise<ResponsesCallResult> {
  const apiKey = env.OPENAI_API_KEY?.trim();
  const model = clinicalModelName(env);
  if (!apiKey || !model) {
    throw new ClinicalAIError('Clinical Intelligence is not configured.', 'not_configured');
  }

  const body: Record<string, unknown> = {
    model,
    instructions: args.instructions,
    input: args.input,
  };

  if (args.jsonSchema) {
    body.text = {
      format: {
        type: 'json_schema',
        name: args.jsonSchema.name,
        strict: true,
        schema: args.jsonSchema.schema,
      },
    };
  }

  const started = Date.now();
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const latencyMs = Date.now() - started;
  const raw = await res.text();

  if (!res.ok) {
    throw mapOpenAIHttpError(res.status, raw);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new ClinicalAIError('Invalid response from OpenAI.', 'invalid_output', res.status);
  }

  const text = extractResponseText(parsed);
  if (!text) {
    throw new ClinicalAIError('OpenAI returned an empty response.', 'invalid_output', res.status);
  }

  return { text, model, latencyMs };
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const p = payload as Record<string, unknown>;

  if (typeof p.output_text === 'string' && p.output_text.trim()) {
    return p.output_text.trim();
  }

  const output = p.output;
  if (Array.isArray(output)) {
    const chunks: string[] = [];
    for (const item of output) {
      if (!item || typeof item !== 'object') continue;
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (!part || typeof part !== 'object') continue;
        const text = (part as { text?: unknown; type?: string }).text;
        if (typeof text === 'string') chunks.push(text);
      }
    }
    if (chunks.length) return chunks.join('\n').trim();
  }

  // Fallback: chat-completions-like shape if gateway remaps
  const choices = p.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === 'object') {
    const msg = (choices[0] as { message?: { content?: unknown } }).message;
    if (typeof msg?.content === 'string') return msg.content.trim();
  }

  return '';
}
