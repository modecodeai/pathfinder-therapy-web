import type { RoomState } from '../../types/room';

export type ClientRole = 'therapist' | 'client';

export type TherapistCommand =
  | { type: 'SET_SETTINGS'; payload: Partial<RoomState>; sequence: number }
  | { type: 'START'; sequence: number; startAt: number }
  | { type: 'PAUSE'; sequence: number }
  | { type: 'RESUME'; sequence: number; startAt: number }
  | { type: 'STOP'; sequence: number }
  | { type: 'END_SESSION'; sequence: number };

export type ClientMessage =
  | { type: 'HELLO'; role: ClientRole; secret?: string }
  | { type: 'PING' };

export type RoomEvent =
  | { type: 'ROOM_STATE'; payload: RoomState; startAt?: number }
  | { type: 'CLIENT_CONNECTED' }
  | { type: 'CLIENT_DISCONNECTED' }
  | { type: 'SESSION_ENDED' }
  | { type: 'ERROR'; message: string }
  | { type: 'WELCOME'; role: ClientRole; roomId: string; payload: RoomState }
  | { type: 'PONG' };

export type WireMessage = TherapistCommand | ClientMessage | RoomEvent;

const THERAPIST_TYPES = new Set([
  'SET_SETTINGS',
  'START',
  'PAUSE',
  'RESUME',
  'STOP',
  'END_SESSION',
]);

export function encodeMessage(msg: WireMessage): string {
  return JSON.stringify(msg);
}

export function decodeMessage(raw: string): WireMessage | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object' || !('type' in data)) return null;
    return data as WireMessage;
  } catch {
    return null;
  }
}

export function isTherapistCommand(msg: WireMessage): msg is TherapistCommand {
  return THERAPIST_TYPES.has(msg.type);
}

export function validateTherapistCommand(msg: unknown): TherapistCommand | null {
  if (!msg || typeof msg !== 'object') return null;
  const m = msg as Record<string, unknown>;
  if (typeof m.type !== 'string' || typeof m.sequence !== 'number' || !Number.isFinite(m.sequence)) {
    return null;
  }
  if (!THERAPIST_TYPES.has(m.type)) return null;

  if (m.type === 'SET_SETTINGS') {
    if (!m.payload || typeof m.payload !== 'object') return null;
    return {
      type: 'SET_SETTINGS',
      sequence: m.sequence,
      payload: sanitizePartialRoomState(m.payload as Record<string, unknown>),
    };
  }

  if (m.type === 'START' || m.type === 'RESUME') {
    if (typeof m.startAt !== 'number' || !Number.isFinite(m.startAt)) return null;
    return { type: m.type, sequence: m.sequence, startAt: m.startAt };
  }

  return { type: m.type as 'PAUSE' | 'STOP' | 'END_SESSION', sequence: m.sequence };
}

const VISUAL_MODES = new Set(['horizontal', 'vertical', 'diagonal-down', 'diagonal-up', 'blink']);
const SET_MODES = new Set(['manual', 'passes', 'timed']);
const SOUNDS = new Set(['soft-click', 'soft-tone', 'pulse']);

export function sanitizePartialRoomState(input: Record<string, unknown>): Partial<RoomState> {
  const out: Partial<RoomState> = {};
  if (typeof input.visualEnabled === 'boolean') out.visualEnabled = input.visualEnabled;
  if (typeof input.audioEnabled === 'boolean') out.audioEnabled = input.audioEnabled;
  if (typeof input.visualMode === 'string' && VISUAL_MODES.has(input.visualMode)) {
    out.visualMode = input.visualMode as RoomState['visualMode'];
  }
  if (typeof input.speedHz === 'number' && Number.isFinite(input.speedHz)) {
    out.speedHz = input.speedHz;
  }
  if (typeof input.stimulusColour === 'string' && /^#[0-9A-Fa-f]{6}$/.test(input.stimulusColour)) {
    out.stimulusColour = input.stimulusColour;
  }
  if (typeof input.backgroundColour === 'string' && /^#[0-9A-Fa-f]{6}$/.test(input.backgroundColour)) {
    out.backgroundColour = input.backgroundColour;
  }
  if (typeof input.stimulusSize === 'number' && Number.isFinite(input.stimulusSize)) {
    out.stimulusSize = input.stimulusSize;
  }
  if (typeof input.travelWidth === 'number' && Number.isFinite(input.travelWidth)) {
    out.travelWidth = input.travelWidth;
  }
  if (typeof input.verticalPosition === 'number' && Number.isFinite(input.verticalPosition)) {
    out.verticalPosition = Math.min(1, Math.max(0, input.verticalPosition));
  }
  if (typeof input.running === 'boolean') out.running = input.running;
  if (typeof input.paused === 'boolean') out.paused = input.paused;
  if (typeof input.setMode === 'string' && SET_MODES.has(input.setMode)) {
    out.setMode = input.setMode as RoomState['setMode'];
  }
  if (typeof input.targetPasses === 'number' && Number.isFinite(input.targetPasses)) {
    out.targetPasses = Math.max(1, Math.min(200, Math.round(input.targetPasses)));
  }
  if (typeof input.targetSeconds === 'number' && Number.isFinite(input.targetSeconds)) {
    out.targetSeconds = Math.max(1, Math.min(600, Math.round(input.targetSeconds)));
  }
  if (typeof input.audioSound === 'string' && SOUNDS.has(input.audioSound)) {
    out.audioSound = input.audioSound as RoomState['audioSound'];
  }
  if (typeof input.audioVolume === 'number' && Number.isFinite(input.audioVolume)) {
    out.audioVolume = Math.min(1, Math.max(0, input.audioVolume));
  }
  if (typeof input.audioOnly === 'boolean') out.audioOnly = input.audioOnly;
  if (typeof input.syncAudioWithVisual === 'boolean') {
    out.syncAudioWithVisual = input.syncAudioWithVisual;
  }
  if (typeof input.muteTherapistAudio === 'boolean') {
    out.muteTherapistAudio = input.muteTherapistAudio;
  }
  return out;
}

/** User-friendly room ID like K7P4-M9Q2 with strong entropy underneath */
export function generateRoomId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let raw = '';
  for (const b of bytes) raw += alphabet[b % alphabet.length];
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function generateTherapistSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** ~2 hours max lifespan */
export const ROOM_TTL_MS = 1000 * 60 * 60 * 2;
/** Inactivity expiry */
export const ROOM_IDLE_MS = 1000 * 60 * 45;
