import { DurableObject } from 'cloudflare:workers';

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
      `);
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
    this.ctx.storage.sql.exec(`DELETE FROM therapists WHERE id = ?`, user.id);
    return Response.json({ ok: true });
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
