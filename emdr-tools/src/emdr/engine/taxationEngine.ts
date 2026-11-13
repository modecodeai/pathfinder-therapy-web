import {
  colourChangePassInterval,
  frequencyToApproxPasses,
  hashSeed,
  integrateEffectiveElapsed,
  mulberry32,
  pickIndex,
  speedScaleAtElapsed,
} from './colourEngine';
import type {
  TaxationConfig,
  TaxationRuntimeSnapshot,
  WorkingMemoryLoad,
} from '../types/emdrTaxation';
import { TAXATION_MODE_LABELS } from '../types/emdrTaxation';
import {
  estimateWorkingMemoryLoad,
  resolveActiveModifiers,
  shouldUseMotionRuntime,
} from './taxationPresets';

export { estimateWorkingMemoryLoad, resolveActiveModifiers, shouldUseMotionRuntime } from './taxationPresets';
export {
  integrateEffectiveElapsed,
  speedScaleAtElapsed,
  shouldUseColourTaxation,
  shouldUseVariableSpeed,
} from './colourEngine';
export { TaxationMotionRuntime } from './taxationMotion';

export function newTaxationSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) || 1) >>> 0;
}

/**
 * Resolve stimulus colour for a completed-pass floor.
 * Deterministic from seed so therapist and client stay aligned.
 */
export function resolveTaxationColour(
  config: TaxationConfig,
  baseColour: string,
  passFloor: number,
): { colour: string; changed: boolean; previous: string } {
  const mods = resolveActiveModifiers(config);
  if (mods.disableColourTaxation || (!mods.colourShift && !mods.randomColour)) {
    return { colour: baseColour, changed: false, previous: baseColour };
  }

  const palette = mods.colourPalette.filter(Boolean);
  if (palette.length === 0) {
    return { colour: baseColour, changed: false, previous: baseColour };
  }

  if (mods.colourShift && !mods.randomColour) {
    const every = colourChangePassInterval(
      mods.colourShiftInterval,
      mods.seed,
      passFloor,
    );
    const slot = Math.floor(passFloor / Math.max(1, every));
    const prevSlot = Math.floor(Math.max(0, passFloor - 1) / Math.max(1, every));
    const colour = palette[slot % palette.length] ?? baseColour;
    const previous =
      passFloor <= 0
        ? baseColour
        : (palette[prevSlot % palette.length] ?? baseColour);
    return { colour, changed: passFloor > 0 && colour !== previous, previous };
  }

  const every = frequencyToApproxPasses(mods.colourChangeFrequency);
  const slot = Math.floor(passFloor / Math.max(1, every));
  const prevSlot = Math.floor(Math.max(0, passFloor - 1) / Math.max(1, every));
  const colour = colourForSlot(mods.seed, slot, palette, baseColour);
  const previous =
    passFloor <= 0 ? baseColour : colourForSlot(mods.seed, prevSlot, palette, baseColour);
  return { colour, changed: passFloor > 0 && colour !== previous, previous };
}

function colourForSlot(
  seed: number,
  slot: number,
  palette: string[],
  fallback: string,
): string {
  if (palette.length === 1) return palette[0] ?? fallback;
  const rand = mulberry32(hashSeed(seed, slot, 77));
  let idx = pickIndex(rand, palette.length);
  if (slot > 0) {
    const prevIdx = colourIndexForSlot(seed, slot - 1, palette.length);
    if (idx === prevIdx) idx = (idx + 1) % palette.length;
  }
  return palette[idx] ?? fallback;
}

function colourIndexForSlot(seed: number, slot: number, length: number): number {
  const rand = mulberry32(hashSeed(seed, slot, 77));
  return pickIndex(rand, length);
}

export function resolveSpeedScale(config: TaxationConfig, wallElapsedMs: number): number {
  const mods = resolveActiveModifiers(config);
  if (!mods.variableSpeed) return 1;
  return speedScaleAtElapsed(
    wallElapsedMs,
    mods.seed,
    mods.variableSpeedPreset,
    mods.reduceVisualVariation,
  );
}

const effectiveElapsedCache = new Map<string, number>();

export function resolveEffectiveElapsed(
  config: TaxationConfig,
  wallElapsedMs: number,
): number {
  const mods = resolveActiveModifiers(config);
  if (!mods.variableSpeed) return wallElapsedMs;
  // Motion runtime applies speed itself — identity for elapsed-based path
  if (shouldUseMotionRuntime(config) && (mods.directionShift || mods.patternSwitch)) {
    return wallElapsedMs;
  }
  const preset = mods.variableSpeedPreset;
  const bucket = Math.floor(wallElapsedMs);
  const key = `${mods.seed}:${preset}:${mods.reduceVisualVariation}:${bucket}`;
  const hit = effectiveElapsedCache.get(key);
  if (hit != null) return hit;
  const value = integrateEffectiveElapsed(
    wallElapsedMs,
    mods.seed,
    preset,
    mods.reduceVisualVariation,
    40,
  );
  if (effectiveElapsedCache.size > 4000) effectiveElapsedCache.clear();
  effectiveElapsedCache.set(key, value);
  return value;
}

export function taxationRuntimeSnapshot(
  config: TaxationConfig,
  baseColour: string,
  wallElapsedMs: number,
  passFloor: number,
): TaxationRuntimeSnapshot {
  const mods = resolveActiveModifiers(config);
  const colourInfo = resolveTaxationColour(config, baseColour, passFloor);
  const load = estimateWorkingMemoryLoad(config);
  const traj = mods.trajectories[0] ?? 'horizontal';
  const usesNonBilateral =
    mods.patternSwitch ||
    mods.directionShift ||
    traj !== 'horizontal' ||
    config.mode === 'chaos';

  return {
    mode: config.mode,
    load,
    speedScale: resolveSpeedScale(config, wallElapsedMs),
    colour: mods.colourShift || mods.randomColour ? colourInfo.colour : null,
    colourChanged: colourInfo.changed,
    stimulusLabel: usesNonBilateral
      ? 'visual-working-memory-taxation'
      : 'bilateral-visual',
    trajectory: traj,
  };
}

export function taxationModeDisplayLabel(config: TaxationConfig): string {
  if (config.mode === 'chaos') return `Chaos ${config.chaosLevel}`;
  return TAXATION_MODE_LABELS[config.mode];
}

export function loadLabel(load: WorkingMemoryLoad): string {
  switch (load) {
    case 'standard':
      return 'Standard';
    case 'low':
      return 'Low';
    case 'moderate':
      return 'Moderate';
    case 'high':
      return 'High';
  }
}
