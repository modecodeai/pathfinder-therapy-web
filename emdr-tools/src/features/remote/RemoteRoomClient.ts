import {
  decodeMessage,
  encodeMessage,
  generateRoomId,
  generateTherapistSecret,
  isTherapistCommand,
  type ClientRole,
  type RoomEvent,
  type TherapistCommand,
} from './protocol';
import type { RoomState } from '../../types/room';

export type ClientConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'waiting'
  | 'reconnecting'
  | 'disconnected'
  | 'ended'
  | 'error';

interface RemoteRoomClientOptions {
  role: ClientRole;
  onRoomState: (state: RoomState, startAt?: number) => void;
  onPeerConnected?: () => void;
  onPeerDisconnected?: () => void;
  onSessionEnded?: () => void;
  onError?: (message: string) => void;
  onConnectionChange?: (status: ClientConnectionStatus) => void;
  /** CRITICAL: client must stop BLS immediately on socket loss */
  onConnectionLostWhileRunning?: () => void;
}

export class RemoteRoomClient {
  private ws: WebSocket | null = null;
  private readonly opts: RemoteRoomClientOptions;
  private roomId: string | null = null;
  private secret: string | null = null;
  private intentionalClose = false;
  private attempts = 0;
  private reconnectTimer: number | null = null;
  private wasRunning = false;
  private lastSequence = 0;

  constructor(opts: RemoteRoomClientOptions) {
    this.opts = opts;
  }

  getJoinUrl(origin = location.origin): string | null {
    return this.roomId ? `${origin}/join/${this.roomId}` : null;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  getSecret(): string | null {
    return this.secret;
  }

  async createRoom(initial: RoomState): Promise<{ roomId: string; joinUrl: string } | null> {
    const roomId = generateRoomId();
    const secret = generateTherapistSecret();
    this.secret = secret;
    this.roomId = roomId;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId, secret, state: initial }),
      });
      if (!res.ok) {
        this.opts.onError?.('Could not create remote session');
        return null;
      }
      this.connect(roomId, secret);
      return { roomId, joinUrl: `${location.origin}/join/${roomId}` };
    } catch {
      this.opts.onError?.('Remote service unavailable');
      return null;
    }
  }

  connect(roomId: string, secret?: string): void {
    this.intentionalClose = false;
    this.roomId = roomId;
    if (secret) this.secret = secret;
    this.openSocket();
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.opts.onConnectionChange?.('disconnected');
  }

  sendCommand(cmd: TherapistCommand): void {
    if (this.opts.role !== 'therapist') return;
    if (cmd.sequence < this.lastSequence) return;
    this.lastSequence = cmd.sequence;
    if (cmd.type === 'START' || cmd.type === 'RESUME') this.wasRunning = true;
    if (cmd.type === 'STOP' || cmd.type === 'PAUSE' || cmd.type === 'END_SESSION') {
      this.wasRunning = false;
    }
    this.send(cmd);
  }

  markLocalRunning(running: boolean): void {
    this.wasRunning = running;
  }

  private openSocket(): void {
    if (!this.roomId) return;
    this.opts.onConnectionChange?.(this.attempts > 0 ? 'reconnecting' : 'connecting');
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${location.host}/ws/${encodeURIComponent(this.roomId)}`);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.attempts = 0;
      this.opts.onConnectionChange?.('connected');
      this.send({
        type: 'HELLO',
        role: this.opts.role,
        secret: this.opts.role === 'therapist' ? this.secret ?? undefined : undefined,
      });
    });

    ws.addEventListener('message', (ev) => {
      const msg = decodeMessage(String(ev.data));
      if (!msg) return;
      this.handleEvent(msg as RoomEvent);
    });

    ws.addEventListener('close', () => {
      this.handleSocketLoss();
    });

    ws.addEventListener('error', () => {
      this.opts.onError?.('WebSocket connection error');
    });
  }

  private handleSocketLoss(): void {
    this.ws = null;
    if (this.opts.role === 'client' && this.wasRunning) {
      this.wasRunning = false;
      this.opts.onConnectionLostWhileRunning?.();
    }
    if (this.intentionalClose) {
      this.opts.onConnectionChange?.('disconnected');
      return;
    }
    this.opts.onConnectionChange?.('reconnecting');
    const delay = Math.min(10000, 500 * 2 ** this.attempts);
    this.attempts += 1;
    if (this.attempts > 12) {
      this.opts.onConnectionChange?.('error');
      this.opts.onError?.('Unable to reconnect');
      return;
    }
    this.reconnectTimer = window.setTimeout(() => this.openSocket(), delay);
  }

  private handleEvent(msg: RoomEvent | TherapistCommand): void {
    if (isTherapistCommand(msg)) return; // clients never accept peer commands via this path
    switch (msg.type) {
      case 'WELCOME':
        // Never auto-restart stimulation after (re)connect — therapist must Start/Resume.
        this.opts.onRoomState({
          ...msg.payload,
          running: false,
          paused: false,
        });
        this.wasRunning = false;
        this.opts.onConnectionChange?.('connected');
        break;
      case 'ROOM_STATE':
        if (msg.payload.sequence < this.lastSequence && this.opts.role === 'client') {
          break;
        }
        this.lastSequence = Math.max(this.lastSequence, msg.payload.sequence);
        this.wasRunning = msg.payload.running && !msg.payload.paused;
        this.opts.onRoomState(msg.payload, msg.startAt);
        break;
      case 'CLIENT_CONNECTED':
        this.opts.onPeerConnected?.();
        break;
      case 'CLIENT_DISCONNECTED':
        this.opts.onPeerDisconnected?.();
        break;
      case 'SESSION_ENDED':
        this.intentionalClose = true;
        this.opts.onSessionEnded?.();
        this.opts.onConnectionChange?.('ended');
        break;
      case 'ERROR':
        this.opts.onError?.(msg.message);
        break;
      default:
        break;
    }
  }

  private send(msg: Parameters<typeof encodeMessage>[0]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(encodeMessage(msg));
  }
}
