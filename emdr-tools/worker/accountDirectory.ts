import { DurableObject } from 'cloudflare:workers';
import type {
  AnyStructuredAnalysis,
  ApplyFindingsRequest,
  ApplyToTargetRequest,
  ClientRecord,
  ClinicalAIAnalysisRecord,
  Phase3AssessmentAnalysis,
} from '../src/clinical-intelligence/types';
import {
  applyApprovedFindings,
  applyPhase3ToTarget,
  emptyClientRecord,
  toApprovedClientContext,
} from './clinical-ai/applyFindings';

interface TherapistRow {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  first_name: string;
  last_name: string;
  country: string | null;
  profession: string | null;
  emdr_training_status: string | null;
  account_tier: string;
  privacy_consent: number;
  created_at: number;
  updated_at: number;
}

/**
 * Global account directory (SQLite DO).
 * Architected for later Practice OS hierarchy without requiring D1 today.
 */
export class AccountDirectory extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS therapists (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          salt TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          country TEXT,
          profession TEXT,
          emdr_training_status TEXT,
          account_tier TEXT NOT NULL DEFAULT 'therapist-free',
          privacy_consent INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS auth_sessions (
          token TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clinical_sessions (
          id TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          reference_label TEXT NOT NULL,
          phase TEXT,
          target_json TEXT,
          sets_json TEXT,
          total_processing_ms INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          record_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS raw_transcripts (
          id TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          session_id TEXT,
          protocol TEXT NOT NULL,
          phase TEXT NOT NULL,
          raw_transcript TEXT NOT NULL,
          normalised_transcript TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clinical_ai_analyses (
          id TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          session_id TEXT,
          protocol TEXT NOT NULL,
          phase TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          prompt_version TEXT NOT NULL,
          schema_version TEXT NOT NULL,
          raw_transcript_id TEXT NOT NULL,
          structured_result_json TEXT NOT NULL,
          reviewed_result_json TEXT,
          review_status TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clinical_ai_audit (
          id TEXT PRIMARY KEY,
          therapist_id TEXT NOT NULL,
          client_id TEXT NOT NULL,
          analysis_id TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);
      // v0.2: keep AI output immutable; therapist review stored separately
      try {
        this.ctx.storage.sql.exec(
          `ALTER TABLE clinical_ai_analyses ADD COLUMN reviewed_result_json TEXT`,
        );
      } catch {
        // column already exists
      }
      // v0.3: incremental segment lineage
      for (const col of [
        `ALTER TABLE clinical_ai_analyses ADD COLUMN parent_analysis_id TEXT`,
        `ALTER TABLE clinical_ai_analyses ADD COLUMN segment_index INTEGER`,
      ]) {
        try {
          this.ctx.storage.sql.exec(col);
        } catch {
          // column already exists
        }
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.endsWith('/register') && request.method === 'POST') {
        return this.register(request);
      }
      if (path.endsWith('/login') && request.method === 'POST') {
        return this.login(request);
      }
      if (path.endsWith('/me') && request.method === 'GET') {
        return this.me(request);
      }
      if (path.endsWith('/logout') && request.method === 'POST') {
        return this.logout(request);
      }
      if (path.endsWith('/onboarding') && request.method === 'POST') {
        return this.onboarding(request);
      }
      if (path.endsWith('/sessions') && request.method === 'GET') {
        return this.listSessions(request);
      }
      if (path.endsWith('/sessions') && request.method === 'POST') {
        return this.saveSession(request);
      }
      if (path.endsWith('/delete-account') && request.method === 'POST') {
        return this.deleteAccount(request);
      }
      if (path.endsWith('/clients') && request.method === 'GET') {
        return this.listClients(request);
      }
      if (path.endsWith('/clients') && request.method === 'POST') {
        return this.createClient(request);
      }
      if (path.match(/\/clients\/[^/]+$/) && request.method === 'GET') {
        return this.getClient(request, path);
      }
      if (path.match(/\/clients\/[^/]+$/) && request.method === 'PATCH') {
        return this.patchClient(request, path);
      }
      if (path.match(/\/clients\/[^/]+\/context$/) && request.method === 'GET') {
        return this.getClientContext(request, path);
      }
      if (path.match(/\/clients\/[^/]+\/apply-findings$/) && request.method === 'POST') {
        return this.applyFindings(request, path);
      }
      if (path.match(/\/clients\/[^/]+\/apply-to-target$/) && request.method === 'POST') {
        return this.applyToTarget(request, path);
      }
      if (path.match(/\/clients\/[^/]+\/analyses$/) && request.method === 'GET') {
        return this.listAnalyses(request, path);
      }
      if (path.endsWith('/clinical-ai/store-analysis') && request.method === 'POST') {
        return this.storeAnalysis(request);
      }
      if (path.match(/\/clinical-ai\/analyses\/[^/]+$/) && request.method === 'GET') {
        return this.getAnalysis(request, path);
      }
      if (path.match(/\/clinical-ai\/analyses\/[^/]+$/) && request.method === 'PATCH') {
        return this.patchAnalysis(request, path);
      }
      if (path.endsWith('/auth-check') && request.method === 'GET') {
        const user = await this.userFromAuth(request);
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        return Response.json({ ok: true, therapistId: user.id });
      }
      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : 'Server error' },
        { status: 500 },
      );
    }
  }

  private async register(request: Request): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');
    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();
    const consent = Boolean(body.privacyConsent);

    if (!email || !email.includes('@') || password.length < 8) {
      return Response.json({ error: 'Valid email and password (8+ chars) required' }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return Response.json({ error: 'Name required' }, { status: 400 });
    }
    if (!consent) {
      return Response.json({ error: 'Privacy consent required' }, { status: 400 });
    }

    const existing = this.ctx.storage.sql
      .exec(`SELECT id FROM therapists WHERE email = ?`, email)
      .toArray();
    if (existing.length) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    const salt = randomHex(16);
    const password_hash = await hashPassword(password, salt);
    const id = `t_${randomHex(12)}`;
    const now = Date.now();
    this.ctx.storage.sql.exec(
      `INSERT INTO therapists
        (id, email, password_hash, salt, first_name, last_name, account_tier, privacy_consent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'therapist-free', 1, ?, ?)`,
      id,
      email,
      password_hash,
      salt,
      firstName,
      lastName,
      now,
      now,
    );

    const token = await this.createSession(id);
    return Response.json({
      ok: true,
      token,
      therapist: publicTherapist(this.getTherapist(id)!),
    });
  }

  private async login(request: Request): Promise<Response> {
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');
    const rows = this.ctx.storage.sql
      .exec(`SELECT * FROM therapists WHERE email = ?`, email)
      .toArray() as unknown as TherapistRow[];
    const user = rows[0];
    if (!user) return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.password_hash) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = await this.createSession(user.id);
    return Response.json({ ok: true, token, therapist: publicTherapist(user) });
  }

  private async me(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    return Response.json({ therapist: publicTherapist(user) });
  }

  private async logout(request: Request): Promise<Response> {
    const token = bearer(request);
    if (token) {
      this.ctx.storage.sql.exec(`DELETE FROM auth_sessions WHERE token = ?`, token);
    }
    return Response.json({ ok: true });
  }

  private async onboarding(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;
    this.ctx.storage.sql.exec(
      `UPDATE therapists SET country = ?, profession = ?, emdr_training_status = ?, updated_at = ? WHERE id = ?`,
      String(body.country ?? ''),
      String(body.profession ?? ''),
      String(body.emdrTrainingStatus ?? ''),
      Date.now(),
      user.id,
    );
    return Response.json({ ok: true, therapist: publicTherapist(this.getTherapist(user.id)!) });
  }

  private async listSessions(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT id, reference_label, phase, created_at, updated_at, total_processing_ms
         FROM clinical_sessions WHERE therapist_id = ? ORDER BY updated_at DESC LIMIT 50`,
        user.id,
      )
      .toArray();
    return Response.json({ sessions: rows });
  }

  private async saveSession(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? `cs_${randomHex(10)}`);
    const now = Date.now();
    // Privacy-first: store reference + operational clinical markers only (NC/PC as therapist-entered text in target_json — no required identity fields)
    this.ctx.storage.sql.exec(
      `INSERT INTO clinical_sessions
        (id, therapist_id, reference_label, phase, target_json, sets_json, total_processing_ms, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         reference_label = excluded.reference_label,
         phase = excluded.phase,
         target_json = excluded.target_json,
         sets_json = excluded.sets_json,
         total_processing_ms = excluded.total_processing_ms,
         updated_at = excluded.updated_at`,
      id,
      user.id,
      String(body.referenceLabel ?? 'Anonymous session'),
      String(body.phase ?? ''),
      JSON.stringify(body.target ?? {}),
      JSON.stringify(body.sets ?? []),
      Number(body.totalProcessingMs ?? 0),
      now,
      now,
    );
    return Response.json({ ok: true, id });
  }

  private async deleteAccount(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    this.ctx.storage.sql.exec(`DELETE FROM auth_sessions WHERE therapist_id = ?`, user.id);
    this.ctx.storage.sql.exec(`DELETE FROM clinical_sessions WHERE therapist_id = ?`, user.id);
    this.ctx.storage.sql.exec(`DELETE FROM clinical_ai_audit WHERE therapist_id = ?`, user.id);
    this.ctx.storage.sql.exec(`DELETE FROM clinical_ai_analyses WHERE therapist_id = ?`, user.id);
    this.ctx.storage.sql.exec(`DELETE FROM raw_transcripts WHERE therapist_id = ?`, user.id);
    this.ctx.storage.sql.exec(`DELETE FROM clients WHERE therapist_id = ?`, user.id);
    this.ctx.storage.sql.exec(`DELETE FROM therapists WHERE id = ?`, user.id);
    return Response.json({ ok: true });
  }

  private async listClients(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT id, display_name, record_json, updated_at FROM clients WHERE therapist_id = ? ORDER BY updated_at DESC LIMIT 100`,
        user.id,
      )
      .toArray() as Array<{ id: string; display_name: string; record_json: string; updated_at: number }>;
    const clients = rows.map((r) => {
      const record = JSON.parse(r.record_json) as ClientRecord;
      return {
        id: r.id,
        displayName: r.display_name,
        presentingProblem: record.presentingProblem,
        updatedAt: new Date(r.updated_at).toISOString(),
      };
    });
    return Response.json({ clients });
  }

  private async createClient(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as { displayName?: string };
    const displayName = String(body.displayName ?? '').trim();
    if (!displayName) return Response.json({ error: 'displayName required' }, { status: 400 });
    const id = `c_${randomHex(10)}`;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const record = emptyClientRecord(id, user.id, displayName, nowIso);
    this.ctx.storage.sql.exec(
      `INSERT INTO clients (id, therapist_id, display_name, record_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      user.id,
      displayName,
      JSON.stringify(record),
      now,
      now,
    );
    return Response.json({ ok: true, client: record });
  }

  private async getClient(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const id = path.split('/').pop()!;
    const client = this.loadClient(user.id, id);
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ client });
  }

  private async patchClient(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const id = path.split('/').pop()!;
    const existing = this.loadClient(user.id, id);
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
    const body = (await request.json()) as Partial<ClientRecord>;
    const now = Date.now();
    const next: ClientRecord = {
      ...existing,
      ...body,
      id: existing.id,
      therapistId: existing.therapistId,
      updatedAt: new Date(now).toISOString(),
    };
    if (body.displayName) next.displayName = String(body.displayName).trim() || existing.displayName;
    this.saveClient(next, now);
    return Response.json({ ok: true, client: next });
  }

  private async getClientContext(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const parts = path.split('/');
    const id = parts[parts.length - 2];
    const client = this.loadClient(user.id, id);
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ context: toApprovedClientContext(client), client });
  }

  private async applyFindings(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const parts = path.split('/');
    const clientId = parts[parts.length - 2];
    const client = this.loadClient(user.id, clientId);
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 });
    const body = (await request.json()) as ApplyFindingsRequest;
    if (!body.analysisId || !body.structuredResult) {
      return Response.json({ error: 'analysisId and structuredResult required' }, { status: 400 });
    }
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const result = applyApprovedFindings(client, body.structuredResult, body.analysisId, {
      themeConflicts: body.themeConflicts,
      memoryDuplicates: body.memoryDuplicates,
      nowIso,
    });
    if (result.conflictsRemaining.length) {
      return Response.json(
        {
          ok: false,
          needsResolution: true,
          conflicts: result.conflictsRemaining,
          preview: result.client,
        },
        { status: 409 },
      );
    }
    this.saveClient(result.client, now);
    for (const a of result.audit) {
      this.ctx.storage.sql.exec(
        `INSERT INTO clinical_ai_audit (id, therapist_id, client_id, analysis_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        a.id,
        user.id,
        clientId,
        body.analysisId,
        JSON.stringify(a),
        now,
      );
    }
    this.ctx.storage.sql.exec(
      `UPDATE clinical_ai_analyses SET review_status = ?, reviewed_result_json = ? WHERE id = ? AND therapist_id = ?`,
      'reviewed',
      JSON.stringify(body.structuredResult),
      body.analysisId,
      user.id,
    );
    return Response.json({ ok: true, client: result.client, auditCount: result.audit.length });
  }

  private async applyToTarget(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const parts = path.split('/');
    const clientId = parts[parts.length - 2];
    const client = this.loadClient(user.id, clientId);
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 });
    const body = (await request.json()) as ApplyToTargetRequest;
    if (!body.analysisId || !body.reviewedResult) {
      return Response.json({ error: 'analysisId and reviewedResult required' }, { status: 400 });
    }
    if (body.reviewedResult.analysisKind !== 'phase3-assessment') {
      return Response.json(
        { error: 'Apply to Target Assessment requires a Phase 3 analysis.' },
        { status: 400 },
      );
    }
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const result = applyPhase3ToTarget(
      client,
      body.reviewedResult as Phase3AssessmentAnalysis,
      body.analysisId,
      nowIso,
    );
    this.saveClient(result.client, now);
    for (const a of result.audit) {
      this.ctx.storage.sql.exec(
        `INSERT INTO clinical_ai_audit (id, therapist_id, client_id, analysis_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        a.id,
        user.id,
        clientId,
        body.analysisId,
        JSON.stringify(a),
        now,
      );
    }
    this.ctx.storage.sql.exec(
      `UPDATE clinical_ai_analyses SET review_status = ?, reviewed_result_json = ? WHERE id = ? AND therapist_id = ?`,
      'reviewed',
      JSON.stringify(body.reviewedResult),
      body.analysisId,
      user.id,
    );
    return Response.json({
      ok: true,
      client: result.client,
      draft: result.draft,
      auditCount: result.audit.length,
    });
  }

  private async storeAnalysis(request: Request): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as {
      clientId: string;
      sessionId?: string;
      protocol: string;
      phase: string;
      rawTranscript: string;
      model: string;
      promptVersion: string;
      schemaVersion: string;
      structuredResult: AnyStructuredAnalysis;
      parentAnalysisId?: string;
      segmentIndex?: number;
    };
    const client = this.loadClient(user.id, body.clientId);
    if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });
    const now = Date.now();
    const transcriptId = `rt_${randomHex(10)}`;
    const analysisId = `ai_${randomHex(10)}`;
    this.ctx.storage.sql.exec(
      `INSERT INTO raw_transcripts
        (id, therapist_id, client_id, session_id, protocol, phase, raw_transcript, normalised_transcript, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      transcriptId,
      user.id,
      body.clientId,
      body.sessionId ?? null,
      body.protocol,
      body.phase,
      body.rawTranscript,
      null,
      now,
    );
    const record: ClinicalAIAnalysisRecord = {
      id: analysisId,
      clientId: body.clientId,
      sessionId: body.sessionId,
      protocol: body.protocol,
      phase: body.phase,
      provider: 'openai',
      model: body.model,
      promptVersion: body.promptVersion,
      schemaVersion: body.schemaVersion,
      createdAt: new Date(now).toISOString(),
      rawTranscriptId: transcriptId,
      structuredResult: body.structuredResult,
      reviewedResult: null,
      reviewStatus: 'pending',
      parentAnalysisId: body.parentAnalysisId,
      segmentIndex: body.segmentIndex,
    };
    this.ctx.storage.sql.exec(
      `INSERT INTO clinical_ai_analyses
        (id, therapist_id, client_id, session_id, protocol, phase, provider, model, prompt_version, schema_version, raw_transcript_id, structured_result_json, reviewed_result_json, review_status, created_at, parent_analysis_id, segment_index)
       VALUES (?, ?, ?, ?, ?, ?, 'openai', ?, ?, ?, ?, ?, NULL, 'pending', ?, ?, ?)`,
      analysisId,
      user.id,
      body.clientId,
      body.sessionId ?? null,
      body.protocol,
      body.phase,
      body.model,
      body.promptVersion,
      body.schemaVersion,
      transcriptId,
      JSON.stringify(body.structuredResult),
      now,
      body.parentAnalysisId ?? null,
      body.segmentIndex ?? null,
    );
    return Response.json({
      ok: true,
      analysis: record,
      rawTranscriptId: transcriptId,
    });
  }

  private async listAnalyses(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const parts = path.split('/');
    const clientId = parts[parts.length - 2];
    const client = this.loadClient(user.id, clientId);
    if (!client) return Response.json({ error: 'Not found' }, { status: 404 });
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT id, protocol, phase, model, prompt_version, review_status, created_at, raw_transcript_id
         FROM clinical_ai_analyses WHERE therapist_id = ? AND client_id = ?
         ORDER BY created_at DESC LIMIT 50`,
        user.id,
        clientId,
      )
      .toArray() as Array<Record<string, unknown>>;
    return Response.json({
      analyses: rows.map((r) => ({
        id: r.id,
        protocol: r.protocol,
        phase: r.phase,
        model: r.model,
        promptVersion: r.prompt_version,
        reviewStatus: r.review_status,
        createdAt: new Date(Number(r.created_at)).toISOString(),
        rawTranscriptId: r.raw_transcript_id,
      })),
    });
  }

  private async getAnalysis(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const id = path.split('/').pop()!;
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT * FROM clinical_ai_analyses WHERE id = ? AND therapist_id = ?`,
        id,
        user.id,
      )
      .toArray() as Array<Record<string, unknown>>;
    const row = rows[0];
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    const trRows = this.ctx.storage.sql
      .exec(`SELECT raw_transcript FROM raw_transcripts WHERE id = ? AND therapist_id = ?`, row.raw_transcript_id, user.id)
      .toArray() as Array<{ raw_transcript: string }>;
    const reviewedRaw = row.reviewed_result_json;
    return Response.json({
      analysis: {
        id: row.id,
        clientId: row.client_id,
        sessionId: row.session_id,
        protocol: row.protocol,
        phase: row.phase,
        provider: row.provider,
        model: row.model,
        promptVersion: row.prompt_version,
        schemaVersion: row.schema_version,
        createdAt: new Date(Number(row.created_at)).toISOString(),
        rawTranscriptId: row.raw_transcript_id,
        structuredResult: JSON.parse(String(row.structured_result_json)),
        reviewedResult: reviewedRaw ? JSON.parse(String(reviewedRaw)) : null,
        reviewStatus: row.review_status,
        parentAnalysisId: row.parent_analysis_id ? String(row.parent_analysis_id) : undefined,
        segmentIndex: row.segment_index == null ? undefined : Number(row.segment_index),
      },
      rawTranscript: trRows[0]?.raw_transcript ?? '',
    });
  }

  private async patchAnalysis(request: Request, path: string): Promise<Response> {
    const user = await this.userFromAuth(request);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const id = path.split('/').pop()!;
    const body = (await request.json()) as {
      reviewedResult?: AnyStructuredAnalysis;
      /** @deprecated use reviewedResult — must not overwrite AI structured_result_json */
      structuredResult?: AnyStructuredAnalysis;
      reviewStatus?: string;
    };
    const rows = this.ctx.storage.sql
      .exec(`SELECT id FROM clinical_ai_analyses WHERE id = ? AND therapist_id = ?`, id, user.id)
      .toArray();
    if (!rows.length) return Response.json({ error: 'Not found' }, { status: 404 });
    const reviewed = body.reviewedResult ?? body.structuredResult;
    if (reviewed) {
      this.ctx.storage.sql.exec(
        `UPDATE clinical_ai_analyses SET reviewed_result_json = ?, review_status = ? WHERE id = ?`,
        JSON.stringify(reviewed),
        body.reviewStatus ?? 'partially-reviewed',
        id,
      );
    } else if (body.reviewStatus) {
      this.ctx.storage.sql.exec(
        `UPDATE clinical_ai_analyses SET review_status = ? WHERE id = ?`,
        body.reviewStatus,
        id,
      );
    }
    return Response.json({ ok: true });
  }

  private loadClient(therapistId: string, clientId: string): ClientRecord | null {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT record_json FROM clients WHERE id = ? AND therapist_id = ?`,
        clientId,
        therapistId,
      )
      .toArray() as Array<{ record_json: string }>;
    if (!rows[0]) return null;
    return JSON.parse(rows[0].record_json) as ClientRecord;
  }

  private saveClient(client: ClientRecord, now = Date.now()): void {
    this.ctx.storage.sql.exec(
      `UPDATE clients SET display_name = ?, record_json = ?, updated_at = ? WHERE id = ? AND therapist_id = ?`,
      client.displayName,
      JSON.stringify(client),
      now,
      client.id,
      client.therapistId,
    );
  }

  private async createSession(therapistId: string): Promise<string> {
    const token = randomHex(24);
    const now = Date.now();
    this.ctx.storage.sql.exec(
      `INSERT INTO auth_sessions (token, therapist_id, expires_at, created_at) VALUES (?, ?, ?, ?)`,
      token,
      therapistId,
      now + 1000 * 60 * 60 * 24 * 30,
      now,
    );
    return token;
  }

  private async userFromAuth(request: Request): Promise<TherapistRow | null> {
    const token = bearer(request);
    if (!token) return null;
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT therapist_id, expires_at FROM auth_sessions WHERE token = ?`,
        token,
      )
      .toArray() as Array<{ therapist_id: string; expires_at: number }>;
    const row = rows[0];
    if (!row || row.expires_at < Date.now()) return null;
    return this.getTherapist(row.therapist_id);
  }

  private getTherapist(id: string): TherapistRow | null {
    const rows = this.ctx.storage.sql
      .exec(`SELECT * FROM therapists WHERE id = ?`, id)
      .toArray() as unknown as TherapistRow[];
    return rows[0] ?? null;
  }
}

function bearer(request: Request): string | null {
  const h = request.headers.get('Authorization') ?? '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

function publicTherapist(u: TherapistRow) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    country: u.country,
    profession: u.profession,
    emdrTrainingStatus: u.emdr_training_status,
    accountTier: u.account_tier,
  };
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
}
