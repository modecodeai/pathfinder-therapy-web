import type { SessionSnapshot } from './types';

export type ClientRole = 'therapist' | 'client';

export type ClientToServer =
  | { type: 'hello'; role: ClientRole; secret?: string }
  | { type: 'state'; snapshot: SessionSnapshot }
  | { type: 'ping' };

export type ServerToClient =
  | { type: 'welcome'; roomId: string; role: ClientRole; snapshot: SessionSnapshot | null }
  | { type: 'state'; snapshot: SessionSnapshot }
  | { type: 'peer'; connected: boolean }
  | { type: 'error'; message: string }
  | { type: 'pong' }
  | { type: 'expired' };

export function encodeMsg(msg: ClientToServer | ServerToClient): string {
  return JSON.stringify(msg);
}

export function decodeMsg<T = ClientToServer | ServerToClient>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Short room code for join URLs — URL-safe, no ambiguous chars */
export function generateRoomId(bytes = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  let out = '';
  for (const b of arr) out += alphabet[b % alphabet.length];
  return out;
}

export function generateSecret(bytes = 18): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const ROOM_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours
