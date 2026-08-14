import { DurableObject } from 'cloudflare:workers';
import {
  decodeMsg,
  encodeMsg,
  ROOM_TTL_MS,
  type ClientRole,
  type ClientToServer,
  type ServerToClient,
} from '../src/lib/roomProtocol';
import type { SessionSnapshot } from '../src/lib/types';
import { createDefaultSnapshot } from '../src/lib/types';

interface Attachment {
  role: ClientRole;
}

interface RoomRow {
  secret: string;
  created_at: number;
  expires_at: number;
  snapshot_json: string;
}

export class EmdrRoom extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          secret TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          snapshot_json TEXT NOT NULL
        );
      `);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/create') && request.method === 'POST') {
      return this.createRoom(request);
    }

    if (url.pathname.endsWith('/ws')) {
      return this.acceptWs(request);
    }

    if (url.pathname.endsWith('/status') && request.method === 'GET') {
      const row = this.getRow();
      if (!row) return Response.json({ ok: false }, { status: 404 });
      if (Date.now() > row.expires_at) {
        await this.ctx.storage.deleteAll();
        return Response.json({ ok: false, expired: true }, { status: 410 });
      }
      return Response.json({
        ok: true,
        expiresAt: row.expires_at,
        peers: this.ctx.getWebSockets().length,
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private async createRoom(request: Request): Promise<Response> {
    const body = (await request.json().catch(() => ({}))) as {
      secret?: string;
      snapshot?: SessionSnapshot;
    };
    const secret = body.secret;
    if (!secret || secret.length < 16) {
      return Response.json({ error: 'Invalid secret' }, { status: 400 });
    }
    const now = Date.now();
    const snapshot = body.snapshot ?? createDefaultSnapshot();
    this.ctx.storage.sql.exec(`DELETE FROM room`);
    this.ctx.storage.sql.exec(
      `INSERT INTO room (id, secret, created_at, expires_at, snapshot_json) VALUES (1, ?, ?, ?, ?)`,
      secret,
      now,
      now + ROOM_TTL_MS,
      JSON.stringify(snapshot),
    );
    await this.ctx.storage.setAlarm(now + ROOM_TTL_MS);
    return Response.json({ ok: true, expiresAt: now + ROOM_TTL_MS });
  }

  private async acceptWs(_request: Request): Promise<Response> {
    const row = this.getRow();
    if (!row) return new Response('Room not found', { status: 404 });
    if (Date.now() > row.expires_at) {
      await this.ctx.storage.deleteAll();
      return new Response('Room expired', { status: 410 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    const msg = decodeMsg<ClientToServer>(message);
    if (!msg) return;

    const row = this.getRow();
    if (!row) {
      this.send(ws, { type: 'expired' });
      ws.close(4000, 'expired');
      return;
    }
    if (Date.now() > row.expires_at) {
      this.send(ws, { type: 'expired' });
      await this.ctx.storage.deleteAll();
      ws.close(4000, 'expired');
      return;
    }

    if (msg.type === 'ping') {
      this.send(ws, { type: 'pong' });
      return;
    }

    if (msg.type === 'hello') {
      if (msg.role === 'therapist') {
        if (msg.secret !== row.secret) {
          this.send(ws, { type: 'error', message: 'Unauthorized therapist' });
          ws.close(4001, 'unauthorized');
          return;
        }
      }
      const attachment: Attachment = { role: msg.role };
      ws.serializeAttachment(attachment);

      // Only one therapist / one client — drop older same-role sockets
      for (const other of this.ctx.getWebSockets()) {
        if (other === ws) continue;
        const meta = other.deserializeAttachment() as Attachment | null;
        if (meta?.role === msg.role) {
          other.close(4002, 'replaced');
        }
      }

      const snapshot = this.readSnapshot(row);
      const roomId = this.roomIdFromRequest() ?? 'room';
      this.send(ws, { type: 'welcome', roomId, role: msg.role, snapshot });
      this.broadcastPeerStatus();
      return;
    }

    if (msg.type === 'state') {
      const meta = ws.deserializeAttachment() as Attachment | null;
      if (meta?.role !== 'therapist') {
        this.send(ws, { type: 'error', message: 'Only therapist can update state' });
        return;
      }
      this.ctx.storage.sql.exec(
        `UPDATE room SET snapshot_json = ? WHERE id = 1`,
        JSON.stringify(msg.snapshot),
      );
      this.broadcast({ type: 'state', snapshot: msg.snapshot }, ws);
      return;
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    void ws;
    this.broadcastPeerStatus();
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    void ws;
    this.broadcastPeerStatus();
  }

  async alarm(): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, { type: 'expired' });
      ws.close(4000, 'expired');
    }
    await this.ctx.storage.deleteAll();
  }

  private getRow(): RoomRow | null {
    const cursor = this.ctx.storage.sql.exec(
      `SELECT secret, created_at, expires_at, snapshot_json FROM room WHERE id = 1`,
    );
    const rows = cursor.toArray() as Array<{
      secret: string;
      created_at: number;
      expires_at: number;
      snapshot_json: string;
    }>;
    const one = rows[0];
    if (!one) return null;
    return {
      secret: one.secret,
      created_at: one.created_at,
      expires_at: one.expires_at,
      snapshot_json: one.snapshot_json,
    };
  }

  private readSnapshot(row: RoomRow): SessionSnapshot {
    try {
      return JSON.parse(row.snapshot_json) as SessionSnapshot;
    } catch {
      return createDefaultSnapshot();
    }
  }

  private send(ws: WebSocket, msg: ServerToClient): void {
    try {
      ws.send(encodeMsg(msg));
    } catch {
      /* ignore */
    }
  }

  private broadcast(msg: ServerToClient, except?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (except && ws === except) continue;
      this.send(ws, msg);
    }
  }

  private broadcastPeerStatus(): void {
    let therapist = false;
    let client = false;
    for (const ws of this.ctx.getWebSockets()) {
      const meta = ws.deserializeAttachment() as Attachment | null;
      if (meta?.role === 'therapist') therapist = true;
      if (meta?.role === 'client') client = true;
    }
    for (const ws of this.ctx.getWebSockets()) {
      const meta = ws.deserializeAttachment() as Attachment | null;
      if (meta?.role === 'therapist') {
        this.send(ws, { type: 'peer', connected: client });
      } else if (meta?.role === 'client') {
        this.send(ws, { type: 'peer', connected: therapist });
      }
    }
  }

  private roomIdFromRequest(): string | null {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/rooms') || path.startsWith('/ws/')) {
      return handleRoomRoutes(request, env, url);
    }

    // Security headers on HTML navigations via assets
    const res = await env.ASSETS.fetch(request);
    return withSecurityHeaders(res, url);
  },
};

async function handleRoomRoutes(request: Request, env: Env, url: URL): Promise<Response> {
  // POST /api/rooms  → create
  if (request.method === 'POST' && url.pathname === '/api/rooms') {
    const body = (await request.json().catch(() => ({}))) as {
      roomId?: string;
      secret?: string;
      snapshot?: SessionSnapshot;
    };
    if (!body.roomId || !body.secret) {
      return Response.json({ error: 'roomId and secret required' }, { status: 400 });
    }
    const id = env.ROOM.idFromName(body.roomId);
    const stub = env.ROOM.get(id);
    const res = await stub.fetch(
      new Request('https://room/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret: body.secret, snapshot: body.snapshot }),
      }),
    );
    const data = await res.json();
    return Response.json(
      { ...(data as object), roomId: body.roomId, joinPath: `/join/${body.roomId}` },
      { status: res.status },
    );
  }

  // GET /api/rooms/:id
  const statusMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
  if (request.method === 'GET' && statusMatch) {
    const roomId = decodeURIComponent(statusMatch[1]);
    const id = env.ROOM.idFromName(roomId);
    const stub = env.ROOM.get(id);
    return stub.fetch(new Request('https://room/status'));
  }

  // WS /ws/:roomId
  const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/);
  if (wsMatch) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }
    const roomId = decodeURIComponent(wsMatch[1]);
    const id = env.ROOM.idFromName(roomId);
    const stub = env.ROOM.get(id);
    return stub.fetch(new Request('https://room/ws', request));
  }

  return new Response('Not found', { status: 404 });
}

function withSecurityHeaders(res: Response, url: URL): Response {
  const headers = new Headers(res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );
  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data:",
      "connect-src 'self' ws: wss:",
      "media-src 'self'",
      "worker-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  );
  // Avoid caching API mistakenly
  if (url.pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store');
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
