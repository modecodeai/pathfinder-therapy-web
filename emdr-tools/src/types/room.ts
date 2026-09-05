/** Operational BLS state only — never store clinical content. */

export type VisualMode =
  | 'horizontal'
  | 'vertical'
  | 'diagonal-down'
  | 'diagonal-up'
  | 'blink';

export type SetMode = 'manual' | 'passes' | 'timed';
export type AudioSound = 'soft-click' | 'soft-tone' | 'pulse';
export type SessionMode = 'in-person' | 'remote';
export type Side = 'L' | 'R';

export interface RoomState {
  visualEnabled: boolean;
  audioEnabled: boolean;
  visualMode: VisualMode;
  speedHz: number;
  stimulusColour: string;
  backgroundColour: string;
  /** Stimulus radius in CSS pixels (approx 8–40) */
  stimulusSize: number;
  /** Travel width 0.3–1 */
  travelWidth: number;
  /** Vertical position 0 (top) – 1 (bottom); 0.5 = centre */
  verticalPosition: number;
  running: boolean;
  paused: boolean;
  setMode: SetMode;
  targetPasses?: number;
  targetSeconds?: number;
  audioSound: AudioSound;
  /** 0–1 */
  audioVolume: number;
  audioOnly: boolean;
  syncAudioWithVisual: boolean;
  muteTherapistAudio: boolean;
  sequence: number;
}

export interface LocalMetrics {
  timeMs: number;
  passes: number;
  sets: number;
}

export const SPEED_MIN_HZ = 0.2;
export const SPEED_MAX_HZ = 2.5;
export const SPEED_STEP_HZ = 0.1;
export const DEFAULT_SPEED_HZ = 1.4;

export const SIZE_MIN = 8;
export const SIZE_MAX = 40;
export const DEFAULT_SIZE = 14;

export const TRAVEL_MIN = 0.3;
export const TRAVEL_MAX = 1;
export const DEFAULT_TRAVEL = 0.85;

export const PASS_PRESETS = [12, 18, 24, 30, 36] as const;
export const TIME_PRESETS = [10, 15, 20, 30, 45, 60] as const;

export const STIMULUS_COLOURS = [
  { id: 'teal', value: '#14B8A6' },
  { id: 'white', value: '#FFFFFF' },
  { id: 'red', value: '#EF4444' },
  { id: 'green', value: '#22C55E' },
  { id: 'yellow', value: '#EAB308' },
  { id: 'orange', value: '#F97316' },
  { id: 'blue', value: '#3B82F6' },
  { id: 'violet', value: '#8B5CF6' },
] as const;

export const BACKGROUND_COLOURS = [
  { id: 'charcoal', value: '#242628' },
  { id: 'black', value: '#000000' },
  { id: 'white', value: '#FFFFFF' },
  { id: 'light-grey', value: '#D1D5DB' },
] as const;

export function createDefaultRoomState(): RoomState {
  return {
    visualEnabled: true,
    audioEnabled: false,
    visualMode: 'horizontal',
    speedHz: DEFAULT_SPEED_HZ,
    stimulusColour: '#14B8A6',
    backgroundColour: '#242628',
    stimulusSize: DEFAULT_SIZE,
    travelWidth: DEFAULT_TRAVEL,
    verticalPosition: 0.5,
    running: false,
    paused: false,
    setMode: 'passes',
    targetPasses: 24,
    targetSeconds: 30,
    audioSound: 'soft-click',
    audioVolume: 0.45,
    audioOnly: false,
    syncAudioWithVisual: true,
    muteTherapistAudio: true,
    sequence: 0,
  };
}

export function createEmptyMetrics(): LocalMetrics {
  return { timeMs: 0, passes: 0, sets: 0 };
}

export function clampSpeed(hz: number): number {
  const stepped = Math.round(hz / SPEED_STEP_HZ) * SPEED_STEP_HZ;
  return Math.min(SPEED_MAX_HZ, Math.max(SPEED_MIN_HZ, Number(stepped.toFixed(1))));
}

export function clampSize(px: number): number {
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(px)));
}

export function clampTravel(t: number): number {
  return Math.min(TRAVEL_MAX, Math.max(TRAVEL_MIN, Number(t.toFixed(2))));
}
