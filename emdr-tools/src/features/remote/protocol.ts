import { createDefaultRoomState, type RoomState } from '../../types/room';

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

const VISUAL_MODES = new Set([
  'horizontal',
  'vertical',
  'diagonal-down',
  'diagonal-up',
  'blink',
  'infinity',
]);
const SET_MODES = new Set(['manual', 'passes', 'timed', 'continuous']);
const SOUNDS = new Set(['soft-click', 'soft-tone', 'pulse']);
const TAXATION_MODES = new Set([
  'standard',
  'variable-speed',
  'direction-shift',
  'colour-shift',
  'random-colour',
  'pattern-switch',
  'chaos',
  'custom',
]);
const VAR_SPEED = new Set(['low', 'medium', 'high']);
const COLOUR_FREQ = new Set(['low', 'medium', 'high']);
const COLOUR_INTERVAL = new Set([2, 4, 6, 'random']);
const DIR_RATE = new Set(['low', 'moderate', 'high']);
const PATTERN_RATE = new Set(['low', 'moderate', 'high', 'random']);
const TAX_TRAJ = new Set([
  'horizontal',
  'vertical',
  'diagonal-a',
  'diagonal-b',
  'wide-arc',
  'figure-eight',
]);

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
  if (typeof input.cycleDurationMs === 'number' && Number.isFinite(input.cycleDurationMs)) {
    out.cycleDurationMs = Math.min(5000, Math.max(550, Math.round(input.cycleDurationMs)));
  }
  if (typeof input.speed01 === 'number' && Number.isFinite(input.speed01)) {
    out.speed01 = Math.min(1, Math.max(0, input.speed01));
  }
  if (input.midlineDirection === 'up' || input.midlineDirection === 'down') {
    out.midlineDirection = input.midlineDirection;
  }
  if (typeof input.continuous === 'boolean') out.continuous = input.continuous;
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
  if (typeof input.taxationMode === 'string' && TAXATION_MODES.has(input.taxationMode)) {
    out.taxationMode = input.taxationMode as RoomState['taxationMode'];
  }
  if (
    typeof input.taxationVariableSpeedPreset === 'string' &&
    VAR_SPEED.has(input.taxationVariableSpeedPreset)
  ) {
    out.taxationVariableSpeedPreset =
      input.taxationVariableSpeedPreset as RoomState['taxationVariableSpeedPreset'];
  }
  if (
    input.taxationColourShiftInterval === 'random' ||
    input.taxationColourShiftInterval === 2 ||
    input.taxationColourShiftInterval === 4 ||
    input.taxationColourShiftInterval === 6 ||
    (typeof input.taxationColourShiftInterval === 'number' &&
      COLOUR_INTERVAL.has(input.taxationColourShiftInterval))
  ) {
    out.taxationColourShiftInterval =
      input.taxationColourShiftInterval as RoomState['taxationColourShiftInterval'];
  }
  if (Array.isArray(input.taxationColourPalette)) {
    out.taxationColourPalette = input.taxationColourPalette.filter(
      (c): c is string => typeof c === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c),
    );
  }
  if (
    typeof input.taxationColourChangeFrequency === 'string' &&
    COLOUR_FREQ.has(input.taxationColourChangeFrequency)
  ) {
    out.taxationColourChangeFrequency =
      input.taxationColourChangeFrequency as RoomState['taxationColourChangeFrequency'];
  }
  if (typeof input.taxationColourNamingMode === 'boolean') {
    out.taxationColourNamingMode = input.taxationColourNamingMode;
  }
  if (
    typeof input.taxationDirectionShiftRate === 'string' &&
    DIR_RATE.has(input.taxationDirectionShiftRate)
  ) {
    out.taxationDirectionShiftRate =
      input.taxationDirectionShiftRate as RoomState['taxationDirectionShiftRate'];
  }
  if (
    typeof input.taxationPatternSwitchRate === 'string' &&
    PATTERN_RATE.has(input.taxationPatternSwitchRate)
  ) {
    out.taxationPatternSwitchRate =
      input.taxationPatternSwitchRate as RoomState['taxationPatternSwitchRate'];
  }
  if (Array.isArray(input.taxationEnabledTrajectories)) {
    out.taxationEnabledTrajectories = input.taxationEnabledTrajectories.filter(
      (t): t is RoomState['taxationEnabledTrajectories'][number] =>
        typeof t === 'string' && TAX_TRAJ.has(t),
    );
  }
  if (
    input.taxationChaosLevel === 1 ||
    input.taxationChaosLevel === 2 ||
    input.taxationChaosLevel === 3
  ) {
    out.taxationChaosLevel = input.taxationChaosLevel;
  }
  if (input.taxationCustomToggles && typeof input.taxationCustomToggles === 'object') {
    out.taxationCustomToggles = {
      ...createDefaultRoomState().taxationCustomToggles,
      ...(input.taxationCustomToggles as RoomState['taxationCustomToggles']),
    };
  }
  if (
    typeof input.taxationCustomIntensity === 'number' &&
    Number.isFinite(input.taxationCustomIntensity)
  ) {
    out.taxationCustomIntensity = Math.min(
      10,
      Math.max(1, Math.round(input.taxationCustomIntensity)),
    );
  }
  if (
    typeof input.taxationCustomChangeFrequency === 'number' &&
    Number.isFinite(input.taxationCustomChangeFrequency)
  ) {
    out.taxationCustomChangeFrequency = Math.min(
      10,
      Math.max(1, Math.round(input.taxationCustomChangeFrequency)),
    );
  }
  if (typeof input.taxationReduceVisualVariation === 'boolean') {
    out.taxationReduceVisualVariation = input.taxationReduceVisualVariation;
  }
  if (typeof input.taxationDisableColour === 'boolean') {
    out.taxationDisableColour = input.taxationDisableColour;
  }
  if (typeof input.taxationSeed === 'number' && Number.isFinite(input.taxationSeed)) {
    out.taxationSeed = input.taxationSeed >>> 0 || 1;
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
