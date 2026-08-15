import {
  ClinicalAIError,
  callOpenAIResponses,
  clinicalModelName,
  isOpenAIConfigured,
} from './openai';
import { CONNECTION_TEST_PROMPT } from './prompts';
import { analysePhase1Transcript, assertAnalyseRequest } from './analyse';

function accountsStub(env: Env) {
  return env.ACCOUNTS.get(env.ACCOUNTS.idFromName('global'));
}

async function requireAuth(request: Request, env: Env): Promise<Response | null> {
  const stub = accountsStub(env);
  const res = await stub.fetch(
    new Request('https://accounts/auth-check', {
      method: 'GET',
      headers: request.headers,
    }),
  );
  if (!res.ok) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function handleClinicalIntelligenceRoutes(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const path = url.pathname;

  if (path === '/api/clinical-intelligence/status' && request.method === 'GET') {
    const denied = await requireAuth(request, env);
    if (denied) return denied;
    const configured = isOpenAIConfigured(env);
    return Response.json({
      configured,
      provider: 'openai',
      modelConfigured: Boolean(clinicalModelName(env)),
      model: clinicalModelName(env),
    });
  }

  if (path === '/api/clinical-intelligence/test' && request.method === 'POST') {
    const denied = await requireAuth(request, env);
    if (denied) return denied;
    if (!isOpenAIConfigured(env)) {
      return Response.json(
        {
          success: false,
          provider: 'openai',
          error: 'Clinical Intelligence is not configured.',
        },
        { status: 503 },
      );
    }
    try {
      const result = await callOpenAIResponses(env, {
        instructions: 'You are a connection test helper for Pathfinder Clinical Intelligence.',
        input: CONNECTION_TEST_PROMPT,
      });
      const response = result.text.trim();
      const ok = /^Hello Pathfinder\.?$/i.test(response);
      return Response.json({
        success: ok,
        provider: 'openai',
        model: result.model,
        response,
        latencyMs: result.latencyMs,
        ...(ok
          ? {}
          : { error: 'Unexpected response from OpenAI connection test.' }),
      });
    } catch (e) {
      const err = e instanceof ClinicalAIError ? e : null;
      return Response.json(
        {
          success: false,
          provider: 'openai',
          model: clinicalModelName(env),
          error: err?.message ?? 'Clinical Intelligence connection failed.',
        },
        { status: err?.status && err.status >= 400 ? err.status : 502 },
      );
    }
  }

  if (path === '/api/clinical-intelligence/analyse' && request.method === 'POST') {
    const denied = await requireAuth(request, env);
    if (denied) return denied;
    if (!isOpenAIConfigured(env)) {
      return Response.json(
        {
          success: false,
          error: 'Clinical Intelligence is not configured.',
        },
        { status: 503 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    let req;
    try {
      req = assertAnalyseRequest(body);
    } catch (e) {
      const err = e instanceof ClinicalAIError ? e : null;
      return Response.json(
        { error: err?.message ?? 'Invalid request' },
        { status: err?.status ?? 400 },
      );
    }

    const stub = accountsStub(env);
    const ctxRes = await stub.fetch(
      new Request(`https://accounts/clients/${encodeURIComponent(req.clientId)}/context`, {
        method: 'GET',
        headers: request.headers,
      }),
    );
    if (ctxRes.status === 404) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }
    if (!ctxRes.ok) {
      return Response.json({ error: 'Unable to load client context' }, { status: ctxRes.status });
    }
    const ctxData = (await ctxRes.json()) as { context: unknown };

    try {
      // Privacy: do not log transcript or OpenAI payloads.
      const analysed = await analysePhase1Transcript(env, {
        transcript: req.transcript,
        clientContext: (ctxData.context ?? {}) as import('../../src/clinical-intelligence/types').ApprovedClientContext,
        sessionDate: req.sessionDate,
      });

      const storeRes = await stub.fetch(
        new Request('https://accounts/clinical-ai/store-analysis', {
          method: 'POST',
          headers: {
            Authorization: request.headers.get('Authorization') ?? '',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            clientId: req.clientId,
            sessionId: req.sessionId,
            protocol: req.protocol,
            phase: req.phase,
            rawTranscript: req.transcript,
            model: analysed.model,
            promptVersion: analysed.promptVersion,
            schemaVersion: analysed.schemaVersion,
            structuredResult: analysed.analysis,
          }),
        }),
      );
      if (!storeRes.ok) {
        return Response.json(
          {
            success: false,
            error:
              'Analysis completed but could not be stored. Your transcript was not discarded from this request — please try again.',
            analysis: analysed.analysis,
          },
          { status: 502 },
        );
      }
      const stored = (await storeRes.json()) as {
        analysis: unknown;
        rawTranscriptId: string;
      };

      return Response.json({
        success: true,
        provider: 'openai',
        model: analysed.model,
        latencyMs: analysed.latencyMs,
        analysis: stored.analysis,
        structuredResult: analysed.analysis,
        rawTranscriptId: stored.rawTranscriptId,
      });
    } catch (e) {
      const err = e instanceof ClinicalAIError ? e : null;
      return Response.json(
        {
          success: false,
          error:
            err?.message ??
            'Clinical Intelligence could not analyse this transcript. The transcript has been preserved.',
        },
        { status: err?.code === 'invalid_output' ? 502 : err?.status && err.status >= 400 ? err.status : 502 },
      );
    }
  }

  const analysisMatch = path.match(/^\/api\/clinical-intelligence\/analyses\/([^/]+)$/);
  if (analysisMatch && (request.method === 'GET' || request.method === 'PATCH')) {
    const denied = await requireAuth(request, env);
    if (denied) return denied;
    const stub = accountsStub(env);
    return stub.fetch(
      new Request(`https://accounts/clinical-ai/analyses/${encodeURIComponent(analysisMatch[1])}`, {
        method: request.method,
        headers: request.headers,
        body: request.method === 'PATCH' ? await request.text() : undefined,
      }),
    );
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

export async function handleClientRoutes(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const stub = accountsStub(env);
  const path = url.pathname;

  let target = '';
  if (path === '/api/clients') {
    target = '/clients';
  } else {
    const m = path.match(/^\/api\/clients\/([^/]+)(?:\/(context|apply-findings|analyses))?$/);
    if (!m) return Response.json({ error: 'Not found' }, { status: 404 });
    const clientId = decodeURIComponent(m[1]);
    if (m[2] === 'context') target = `/clients/${clientId}/context`;
    else if (m[2] === 'apply-findings') target = `/clients/${clientId}/apply-findings`;
    else if (m[2] === 'analyses') target = `/clients/${clientId}/analyses`;
    else target = `/clients/${clientId}`;
  }

  return stub.fetch(
    new Request(`https://accounts${target}`, {
      method: request.method,
      headers: request.headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    }),
  );
}
