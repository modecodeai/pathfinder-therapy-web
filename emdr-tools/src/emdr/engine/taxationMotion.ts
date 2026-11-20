import {
  hashSeed,
  mulberry32,
  pickIndex,
  speedScaleAtElapsed,
  easeInOut,
  lerp,
  clamp,
} from './colourEngine';
import { taxationPointAt } from './taxationTrajectory';
import type { MidlineDirection } from '../types/emdr';
import type {
  ActiveTaxationModifiers,
  DirectionShiftRate,
  PatternSwitchRate,
  TaxationConfig,
  TaxationTrajectory,
  VariableSpeedPreset,
} from '../types/emdrTaxation';
import { resolveActiveModifiers, intensityToSpeedPreset } from './taxationPresets';
import { colourChangePassInterval, frequencyToApproxPasses } from './colourEngine';

export interface TaxationMotionInput {
  wallElapsedMs: number;
  cycleDurationMs: number;
  config: TaxationConfig;
  baseColour: string;
  travelWidth: number;
  verticalPosition: number;
  midline: MidlineDirection;
  /** Prefer this trajectory when pattern switch is off */
  preferredTrajectory?: TaxationTrajectory;
}

export interface TaxationMotionFrame {
  x: number;
  y: number;
  passFloor: number;
  traversals: number;
  colour: string;
  colourChanged: boolean;
  trajectory: TaxationTrajectory;
  speedScale: number;
  reversedThisTick: boolean;
}

/**
 * Stateful motion runtime — shared by Direction Shift, Pattern Switch, Chaos, Custom.
 * Deterministic from seed + traversal counters so therapist/client stay aligned when
 * they share RoomState (seed + config). Wall-clock stepping uses local dt.
 */
export class TaxationMotionRuntime {
  private lastWall = -1;
  private u = 0;
  private dir: 1 | -1 = 1;
  private traj: TaxationTrajectory = 'horizontal';
  private traversals = 0;
  private passFloor = 0;
  private nextReversalAfter = -1;
  private nextPatternAfter = -1;
  private blendFrom: { x: number; y: number } | null = null;
  private blendT = 1;
  private blendDur = 550;
  private lastColour = '';
  private colourSlot = 0;
  private modeKey = '';
  private reversedThisTick = false;

  reset(): void {
    this.lastWall = -1;
    this.u = 0;
    this.dir = 1;
    this.traj = 'horizontal';
    this.traversals = 0;
    this.passFloor = 0;
    this.nextReversalAfter = -1;
    this.nextPatternAfter = -1;
    this.blendFrom = null;
    this.blendT = 1;
    this.lastColour = '';
    this.colourSlot = 0;
    this.modeKey = '';
    this.reversedThisTick = false;
  }

  /**
   * Soft-resync when taxation mode changes mid-set — keep position, re-schedule events.
   */
  onConfigChange(mods: ActiveTaxationModifiers): void {
    const key = `${mods.seed}:${mods.variableSpeed}:${mods.directionShift}:${mods.patternSwitch}:${mods.chaosLevel}`;
    if (key !== this.modeKey) {
      this.modeKey = key;
      this.nextReversalAfter = -1;
      this.nextPatternAfter = -1;
      this.scheduleReversal(mods);
      this.schedulePattern(mods);
      if (!mods.trajectories.includes(this.traj)) {
        this.beginPatternSwitch(mods.trajectories[0] ?? 'horizontal', mods, true);
      }
    }
  }

  tick(input: TaxationMotionInput): TaxationMotionFrame {
    const mods = resolveActiveModifiers(input.config);
    this.onConfigChange(mods);

    if (!mods.trajectories.includes(this.traj)) {
      this.traj = mods.trajectories[0] ?? 'horizontal';
    }
    if (
      !mods.patternSwitch &&
      input.preferredTrajectory &&
      mods.trajectories.includes(input.preferredTrajectory)
    ) {
      // Keep preferred when not switching (e.g. direction-shift stays horizontal)
      if (this.traj !== input.preferredTrajectory && mods.trajectories.length === 1) {
        this.traj = input.preferredTrajectory;
      }
    }

    const wall = Math.max(0, input.wallElapsedMs);
    let dt = this.lastWall < 0 ? 0 : Math.min(50, Math.max(0, wall - this.lastWall));
    this.lastWall = wall;
    this.reversedThisTick = false;

    const speedPreset = mods.variableSpeed
      ? mods.variableSpeedPreset
      : ('medium' as VariableSpeedPreset);
    const speedScale = mods.variableSpeed
      ? speedScaleAtElapsed(
          wall,
          mods.seed,
          speedPreset,
          mods.reduceVisualVariation,
        )
      : 1;

    // One-way duration = half of full L→R→L cycle
    const oneWayMs = Math.max(100, input.cycleDurationMs / 2);
    const du = (dt / oneWayMs) * speedScale * this.dir;
    this.u += du;

    // Early direction reversal (bounded central band 20–80%)
    if (mods.directionShift && this.nextReversalAfter >= 0) {
      if (this.traversals >= this.nextReversalAfter) {
        const inBand = this.u > 0.2 && this.u < 0.8;
        if (inBand) {
          this.dir = this.dir === 1 ? -1 : 1;
          this.reversedThisTick = true;
          this.scheduleReversal(mods);
        }
      }
    }

    // Bounce at ends
    if (this.u >= 1) {
      this.u = 1;
      this.dir = -1;
      this.completeTraversal(mods);
    } else if (this.u <= 0) {
      this.u = 0;
      this.dir = 1;
      this.completeTraversal(mods);
    }

    // Pattern switch
    if (mods.patternSwitch && this.nextPatternAfter >= 0) {
      if (this.traversals >= this.nextPatternAfter && mods.trajectories.length > 1) {
        const next = pickNextTrajectory(mods, this.traj, this.traversals);
        this.beginPatternSwitch(next, mods, false);
        this.schedulePattern(mods);
      }
    }

    if (this.blendT < 1) {
      this.blendT = Math.min(1, this.blendT + dt / this.blendDur);
    }

    const target = taxationPointAt(this.traj, this.u, {
      travelWidth: input.travelWidth,
      verticalPosition: input.verticalPosition,
      midline: input.midline,
    });

    let x = target.x;
    let y = target.y;
    if (this.blendFrom && this.blendT < 1) {
      const t = easeInOut(this.blendT);
      x = lerp(this.blendFrom.x, target.x, t);
      y = lerp(this.blendFrom.y, target.y, t);
    } else {
      this.blendFrom = null;
    }

    const colourInfo = resolveMotionColour(mods, input.baseColour, this.passFloor, this.colourSlot);
    if (colourInfo.slot !== this.colourSlot) this.colourSlot = colourInfo.slot;
    const colourChanged =
      this.lastColour !== '' && colourInfo.colour !== this.lastColour;
    this.lastColour = colourInfo.colour;

    return {
      x,
      y,
      passFloor: this.passFloor,
      traversals: this.traversals,
      colour: colourInfo.colour,
      colourChanged,
      trajectory: this.traj,
      speedScale,
      reversedThisTick: this.reversedThisTick,
    };
  }

  private completeTraversal(mods: ActiveTaxationModifiers): void {
    this.traversals += 1;
    // Full L→R→L = 2 one-way traversals
    const nextPass = Math.floor(this.traversals / 2);
    if (nextPass > this.passFloor) this.passFloor = nextPass;
    if (this.nextReversalAfter < 0) this.scheduleReversal(mods);
    if (this.nextPatternAfter < 0) this.schedulePattern(mods);
  }

  private scheduleReversal(mods: ActiveTaxationModifiers): void {
    if (!mods.directionShift) {
      this.nextReversalAfter = -1;
      return;
    }
    const [lo, hi] = reversalTraversalRange(mods.directionRate, mods.changeFrequency, mods.reduceVisualVariation);
    const rand = mulberry32(hashSeed(mods.seed, this.traversals, 19));
    const gap = lo + pickIndex(rand, Math.max(1, hi - lo + 1));
    this.nextReversalAfter = this.traversals + gap;
  }

  private schedulePattern(mods: ActiveTaxationModifiers): void {
    if (!mods.patternSwitch || mods.trajectories.length < 2) {
      this.nextPatternAfter = -1;
      return;
    }
    const [lo, hi] = patternTraversalRange(mods.patternRate, mods.changeFrequency, mods.reduceVisualVariation);
    const rand = mulberry32(hashSeed(mods.seed, this.traversals, 29));
    const gap = lo + pickIndex(rand, Math.max(1, hi - lo + 1));
    this.nextPatternAfter = this.traversals + gap;
  }

  private beginPatternSwitch(
    next: TaxationTrajectory,
    mods: ActiveTaxationModifiers,
    instant: boolean,
  ): void {
    if (next === this.traj) return;
    const cur = taxationPointAt(this.traj, this.u, {
      travelWidth: 0.85,
      verticalPosition: 0.5,
      midline: 'up',
    });
    this.blendFrom = { x: cur.x, y: cur.y };
    this.blendT = instant ? 1 : 0;
    this.blendDur = mods.reduceVisualVariation ? 750 : 550;
    this.traj = next;
  }
}

function pickNextTrajectory(
  mods: ActiveTaxationModifiers,
  current: TaxationTrajectory,
  traversals: number,
): TaxationTrajectory {
  const list = mods.trajectories;
  if (list.length === 1) return list[0]!;
  const rand = mulberry32(hashSeed(mods.seed, traversals, 37));
  let idx = pickIndex(rand, list.length);
  if (list[idx] === current) idx = (idx + 1) % list.length;
  return list[idx]!;
}

/** Low ≈ every 6–10 traversals; Moderate 3–6; High 2–4 */
export function reversalTraversalRange(
  rate: DirectionShiftRate,
  changeFrequency: number,
  reduce: boolean,
): [number, number] {
  let lo: number;
  let hi: number;
  switch (rate) {
    case 'low':
      lo = 6;
      hi = 10;
      break;
    case 'high':
      lo = 2;
      hi = 4;
      break;
    case 'moderate':
    default:
      lo = 3;
      hi = 6;
      break;
  }
  // Change frequency 1–10 tightens/widens slightly
  const f = clamp(changeFrequency, 1, 10);
  const shift = Math.round((f - 5) * 0.35);
  lo = Math.max(2, lo - shift);
  hi = Math.max(lo, hi - shift);
  if (reduce) {
    lo += 2;
    hi += 3;
  }
  return [lo, hi];
}

/** Low 8–12; Moderate 4–8; High 2–5; Random 2–12 */
export function patternTraversalRange(
  rate: PatternSwitchRate,
  changeFrequency: number,
  reduce: boolean,
): [number, number] {
  let lo: number;
  let hi: number;
  switch (rate) {
    case 'low':
      lo = 8;
      hi = 12;
      break;
    case 'high':
      lo = 2;
      hi = 5;
      break;
    case 'random':
      lo = 2;
      hi = 12;
      break;
    case 'moderate':
    default:
      lo = 4;
      hi = 8;
      break;
  }
  const f = clamp(changeFrequency, 1, 10);
  const shift = Math.round((f - 5) * 0.4);
  lo = Math.max(2, lo - shift);
  hi = Math.max(lo, hi - shift);
  if (reduce) {
    lo = Math.max(lo, 6);
    hi = Math.max(hi, 10);
  }
  return [lo, hi];
}

function resolveMotionColour(
  mods: ActiveTaxationModifiers,
  baseColour: string,
  passFloor: number,
  currentSlot: number,
): { colour: string; slot: number } {
  if (mods.disableColourTaxation || (!mods.colourShift && !mods.randomColour)) {
    return { colour: baseColour, slot: currentSlot };
  }
  const palette = mods.colourPalette.filter(Boolean);
  if (!palette.length) return { colour: baseColour, slot: currentSlot };

  if (mods.colourShift && !mods.randomColour) {
    const every = colourChangePassInterval(
      mods.colourShiftInterval,
      mods.seed,
      passFloor,
    );
    const slot = Math.floor(passFloor / Math.max(1, every));
    return { colour: palette[slot % palette.length]!, slot };
  }

  // random colour
  const every = frequencyToApproxPasses(mods.colourChangeFrequency);
  // Intensity/frequency can shorten interval
  const adj = Math.max(1, every - Math.floor((mods.changeFrequency - 5) / 3));
  const slot = Math.floor(passFloor / adj);
  if (slot === currentSlot && passFloor > 0) {
    // keep until next slot
  }
  const rand = mulberry32(hashSeed(mods.seed, slot, 77));
  let idx = pickIndex(rand, palette.length);
  if (slot > 0) {
    const prevRand = mulberry32(hashSeed(mods.seed, slot - 1, 77));
    const prev = pickIndex(prevRand, palette.length);
    if (idx === prev) idx = (idx + 1) % palette.length;
  }
  return { colour: palette[idx]!, slot };
}

// Re-export intensity helper used by tests
export { intensityToSpeedPreset };
