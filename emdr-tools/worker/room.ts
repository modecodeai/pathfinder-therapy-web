import { DurableObject } from 'cloudflare:workers';
import {
  decodeMessage,
  encodeMessage,
  ROOM_IDLE_MS,
  ROOM_TTL_MS,
  validateTherapistCommand,
  type ClientRole,
  type RoomEvent,
  type WireMessage,
} from '../src/features/remote/protocol';
import { createDefaultRoomState, type RoomState } from '../src/types/room';
import {
  clampSize,
  clampSpeed,
  clampTravel,
} from '../src/types/room';

interface Attachment {
  role: ClientRole;
}

/**
 * One Durable Object per remote room.
 * Stores operational RoomState only — no clinical content.
 */
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
          last_active INTEGER NOT NULL,
          state_json TEXT NOT NULL
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
      return this.acceptWs();
    }
    if (url.pathname.endsWith('/status')) {
      return this.status();
    }
    return new Response('Not found', { status: 404 });
  }

  private async createRoom(request: Request): Promise<Response> {
    const body = (await request.json().catch(() => ({}))) as {
      secret?: string;
      state?: RoomState;
    };
    if (!body.secret || body.secret.length < 24) {
      return Response.json({ error: 'Invalid secret' }, { status: 400 });
    }
    const now = Date.now();
    const state = normalizeState(body.state ?? createDefaultRoomState());
    this.ctx.storage.sql.exec(`DELETE FROM room`);
    this.ctx.storage.sql.exec(
      `INSERT INTO room (id, secret, created_at, expires_at, last_active, state_json)
       VALUES (1, ?, ?, ?, ?, ?)`,
      body.secret,
      now,
      now + ROOM_TTL_MS,
      now,
      JSON.stringify(state),
    );
    await this.ctx.storage.setAlarm(now + Math.min(ROOM_TTL_MS, ROOM_IDLE_MS));
    return Response.json({ ok: true, expiresAt: now + ROOM_TTL_MS });
  }

  private async acceptWs(): Promise<Response> {
    const row = this.getRow();
    if (!row) return new Response('Room not found', { status: 404 });
    if (this.isExpired(row)) {
      await this.destroy('expired');
      return new Response('Room expired', { status: 410 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async status(): Promise<Response> {
    const row = this.getRow();
    if (!row) return Response.json({ ok: false }, { status: 404 });
    if (this.isExpired(row)) {
      await this.destroy('expired');
      return Response.json({ ok: false, expired: true }, { status: 410 });
    }
    return Response.json({
      ok: true,
      expiresAt: row.expires_at,
      peers: this.ctx.getWebSockets().length,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    const msg = decodeMessage(message);
    if (!msg) return;

    const row = this.getRow();
    if (!row || this.isExpired(row)) {
      this.send(ws, { type: 'SESSION_ENDED' });
      ws.close(4000, 'expired');
      await this.destroy('expired');
      return;
    }

    if (msg.type === 'PING') {
      this.send(ws, { type: 'PONG' });
      return;
    }

    if (msg.type === 'HELLO') {
      await this.handleHello(ws, msg.role, msg.secret, row);
      return;
    }

    const meta = ws.deserializeAttachment() as Attachment | null;
    if (meta?.role !== 'therapist') {
      this.send(ws, { type: 'ERROR', message: 'Clients cannot control the session' });
      return;
    }

    const cmd = validateTherapistCommand(msg);
    if (!cmd) {
      this.send(ws, { type: 'ERROR', message: 'Invalid command' });
      return;
    }

    await this.handleTherapistCommand(ws, cmd, row);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const meta = ws.deserializeAttachment() as Attachment | null;
    if (meta?.role === 'client') {
      this.broadcast({ type: 'CLIENT_DISCONNECTED' }, ws);
    }
    if (meta?.role === 'therapist') {
      // Therapist disconnect does not auto-end; client keeps waiting until expiry/end
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    void ws;
  }

  async alarm(): Promise<void> {
    const row = this.getRow();
    if (!row) {
      await this.ctx.storage.deleteAll();
      return;
    }
    const now = Date.now();
    if (now >= row.expires_at || now - row.last_active >= ROOM_IDLE_MS) {
      await this.destroy('expired');
      return;
    }
    const next = Math.min(row.expires_at, row.last_active + ROOM_IDLE_MS);
    await this.ctx.storage.setAlarm(next);
  }

  private async handleHello(
    ws: WebSocket,
    role: ClientRole,
    secret: string | undefined,
    row: RoomRow,
  ): Promise<void> {
    if (role === 'therapist' && secret !== row.secret) {
      this.send(ws, { type: 'ERROR', message: 'Unauthorized' });
      ws.close(4001, 'unauthorized');
      return;
    }

    ws.serializeAttachment({ role } satisfies Attachment);

    for (const other of this.ctx.getWebSockets()) {
      if (other === ws) continue;
      const meta = other.deserializeAttachment() as Attachment | null;
      if (meta?.role === role) other.close(4002, 'replaced');
    }

    const state = this.readState(row);
    this.send(ws, { type: 'WELCOME', role, roomId: 'room', payload: state });
    this.touch();

    if (role === 'client') {
      this.broadcast({ type: 'CLIENT_CONNECTED' }, ws);
    } else {
      const clientConnected = this.ctx.getWebSockets().some((s) => {
        const m = s.deserializeAttachment() as Attachment | null;
        return m?.role === 'client';
      });
      if (clientConnected) this.send(ws, { type: 'CLIENT_CONNECTED' });
    }
  }

  private async handleTherapistCommand(
    ws: WebSocket,
    cmd: NonNullable<ReturnType<typeof validateTherapistCommand>>,
    row: RoomRow,
  ): Promise<void> {
    let state = this.readState(row);
    if (cmd.sequence < state.sequence) {
      this.send(ws, { type: 'ERROR', message: 'Stale sequence' });
      return;
    }

    if (cmd.type === 'END_SESSION') {
      await this.destroy('ended');
      return;
    }

    let startAt: number | undefined;
    if (cmd.type === 'SET_SETTINGS') {
      const { running: _r, paused: _p, sequence: _s, ...safe } = cmd.payload;
      void _r;
      void _p;
      void _s;
      state = normalizeState({ ...state, ...safe, sequence: cmd.sequence });
    } else if (cmd.type === 'START') {
      state = {
        ...state,
        running: true,
        paused: false,
        sequence: cmd.sequence,
      };
      startAt = cmd.startAt;
    } else if (cmd.type === 'PAUSE') {
      state = { ...state, paused: true, running: true, sequence: cmd.sequence };
    } else if (cmd.type === 'RESUME') {
      state = { ...state, paused: false, running: true, sequence: cmd.sequence };
      startAt = cmd.startAt;
    } else if (cmd.type === 'STOP') {
      state = { ...state, running: false, paused: false, sequence: cmd.sequence };
    }

    this.persistState(state);
    this.touch();
    const event: RoomEvent = { type: 'ROOM_STATE', payload: state, startAt };
    this.broadcast(event);
  }

  private persistState(state: RoomState): void {
    this.ctx.storage.sql.exec(
      `UPDATE room SET state_json = ? WHERE id = 1`,
      JSON.stringify(state),
    );
  }

  private touch(): void {
    const now = Date.now();
    this.ctx.storage.sql.exec(`UPDATE room SET last_active = ? WHERE id = 1`, now);
    void this.ctx.storage.setAlarm(now + ROOM_IDLE_MS);
  }

  private async destroy(reason: 'expired' | 'ended'): Promise<void> {
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, { type: 'SESSION_ENDED' });
      ws.close(4000, reason);
    }
    await this.ctx.storage.deleteAll();
  }

  private isExpired(row: RoomRow): boolean {
    const now = Date.now();
    return now > row.expires_at || now - row.last_active > ROOM_IDLE_MS;
  }

  private getRow(): RoomRow | null {
    const rows = this.ctx.storage.sql
      .exec(
        `SELECT secret, created_at, expires_at, last_active, state_json FROM room WHERE id = 1`,
      )
      .toArray() as Array<{
      secret: string;
      created_at: number;
      expires_at: number;
      last_active: number;
      state_json: string;
    }>;
    const one = rows[0];
    if (!one) return null;
    return {
      secret: one.secret,
      created_at: one.created_at,
      expires_at: one.expires_at,
      last_active: one.last_active,
      state_json: one.state_json,
    };
  }

  private readState(row: RoomRow): RoomState {
    try {
      return normalizeState(JSON.parse(row.state_json) as RoomState);
    } catch {
      return createDefaultRoomState();
    }
  }

  private send(ws: WebSocket, msg: RoomEvent): void {
    try {
      ws.send(encodeMessage(msg as WireMessage));
    } catch {
      /* ignore */
    }
  }

  private broadcast(msg: RoomEvent, except?: WebSocket): void {
    for (const ws of this.ctx.getWebSockets()) {
      if (except && ws === except) continue;
      this.send(ws, msg);
    }
  }
}

interface RoomRow {
  secret: string;
  created_at: number;
  expires_at: number;
  last_active: number;
  state_json: string;
}

function normalizeState(s: RoomState): RoomState {
  const base = createDefaultRoomState();
  return {
    ...base,
    ...s,
    speedHz: clampSpeed(s.speedHz ?? base.speedHz),
    stimulusSize: clampSize(s.stimulusSize ?? base.stimulusSize),
    travelWidth: clampTravel(s.travelWidth ?? base.travelWidth),
    verticalPosition: Math.min(1, Math.max(0, s.verticalPosition ?? 0.5)),
    audioVolume: Math.min(1, Math.max(0, s.audioVolume ?? 0.45)),
    sequence: typeof s.sequence === 'number' ? s.sequence : 0,
  };
}
