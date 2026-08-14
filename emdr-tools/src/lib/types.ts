/** Shared clinical control types — never store client names, notes, SUD/VOC, or targets. */

export type BlsMode =
  | 'horizontal'
  | 'vertical'
  | 'diagonal-up'
  | 'diagonal-down'
  | 'blink';

export type SetMode = 'manual' | 'passes' | 'timed';
export type AudioSound = 'soft-click' | 'tone' | 'pulse';
export type SessionMode = 'in-person' | 'remote';
export type VerticalPosition = 'top' | 'center' | 'bottom';
export type Side = 'L' | 'R';

export interface VisualSettings {
  enabled: boolean;
  color: string;
  background: string;
  /** Relative stimulus size 0.4–3 */
  size: number;
  /** Fraction of stage width/height used for travel 0.25–1 */
  travelWidth: number;
  verticalPosition: VerticalPosition;
  mode: BlsMode;
}

export interface AudioSettings {
  enabled: boolean;
  muteTherapist: boolean;
  sound: AudioSound;
}

export interface SetSettings {
  mode: SetMode;
  passesTarget: number;
  timedSeconds: number;
}

/** Synced remote payload — controls only, not per-frame coordinates. */
export interface SessionSnapshot {
  running: boolean;
  paused: boolean;
  speedHz: number;
  visual: VisualSettings;
  audio: AudioSettings;
  set: SetSettings;
  timeMs: number;
  passes: number;
  sets: number;
  /** Phase origin for clients to stay roughly aligned after reconnect */
  phaseOriginMs: number;
}

export interface TherapistUiState extends SessionSnapshot {
  sessionMode: SessionMode;
  roomId: string | null;
  therapistSecret: string | null;
  clientConnected: boolean;
  clientViewOpen: boolean;
}

export const SPEED_MIN_HZ = 0.2;
export const SPEED_MAX_HZ = 2.5;
export const SPEED_STEP_HZ = 0.1;
export const DEFAULT_SPEED_HZ = 0.8;

export const DEFAULT_VISUAL: VisualSettings = {
  enabled: true,
  color: '#2f6f6a',
  background: '#0e1418',
  size: 1,
  travelWidth: 0.85,
  verticalPosition: 'center',
  mode: 'horizontal',
};

export const DEFAULT_AUDIO: AudioSettings = {
  enabled: false,
  muteTherapist: true,
  sound: 'soft-click',
};

export const DEFAULT_SET: SetSettings = {
  mode: 'manual',
  passesTarget: 24,
  timedSeconds: 30,
};

export function createDefaultSnapshot(): SessionSnapshot {
  return {
    running: false,
    paused: false,
    speedHz: DEFAULT_SPEED_HZ,
    visual: { ...DEFAULT_VISUAL },
    audio: { ...DEFAULT_AUDIO },
    set: { ...DEFAULT_SET },
    timeMs: 0,
    passes: 0,
    sets: 0,
    phaseOriginMs: 0,
  };
}

export function clampSpeed(hz: number): number {
  const stepped = Math.round(hz / SPEED_STEP_HZ) * SPEED_STEP_HZ;
  return Math.min(SPEED_MAX_HZ, Math.max(SPEED_MIN_HZ, Number(stepped.toFixed(1))));
}
