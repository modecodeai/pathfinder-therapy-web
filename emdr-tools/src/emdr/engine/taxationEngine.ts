import {
  colourChangePassInterval,
  frequencyToApproxPasses,
  hashSeed,
  integrateEffectiveElapsed,
  mulberry32,
  pickIndex,
  shouldUseColourTaxation,
  shouldUseVariableSpeed,
  speedScaleAtElapsed,
} from './colourEngine';
import type {
  TaxationConfig,
  TaxationRuntimeSnapshot,
  WorkingMemoryLoad,
} from '../types/emdrTaxation';
import { TAXATION_MODE_LABELS } from '../types/emdrTaxation';
import { estimateWorkingMemoryLoad } from './taxationPresets';

export { estimateWorkingMemoryLoad } from './taxationPresets';
export {
  integrateEffectiveElapsed,
  speedScaleAtElapsed,
  shouldUseColourTaxation,
  shouldUseVariableSpeed,
} from './colourEngine';

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
  if (!shouldUseColourTaxation(config)) {
    return { colour: baseColour, changed: false, previous: baseColour };
  }

  const palette = config.colourPalette.filter(Boolean);
  if (palette.length === 0) {
    return { colour: baseColour, changed: false, previous: baseColour };
  }

  if (config.mode === 'colour-shift') {
    const every = colourChangePassInterval(
      config.colourShiftInterval,
      config.seed,
      passFloor,
    );
    const slot = Math.floor(passFloor / Math.max(1, every));
    const prevSlot = Math.floor(Math.max(0, passFloor - 1) / Math.max(1, every));
    const idx = slot % palette.length;
    const colour = palette[idx] ?? baseColour;
    const previous =
      passFloor <= 0
        ? baseColour
        : (palette[prevSlot % palette.length] ?? baseColour);
    return { colour, changed: passFloor > 0 && colour !== previous, previous };
  }

  // random-colour (and colour-capable chaos/custom Stage 1 path)
  const every = frequencyToApproxPasses(config.colourChangeFrequency);
  const slot = Math.floor(passFloor / Math.max(1, every));
  const prevSlot = Math.floor(Math.max(0, passFloor - 1) / Math.max(1, every));

  const colour = colourForSlot(config.seed, slot, palette, baseColour);
  const previous =
    passFloor <= 0 ? baseColour : colourForSlot(config.seed, prevSlot, palette, baseColour);
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
  if (!shouldUseVariableSpeed(config) || config.mode === 'standard') return 1;
  // Stage 1: variable-speed (+ mild chaos uses low preset unless later stages expand)
  const preset =
    config.mode === 'chaos' && config.chaosLevel === 1
      ? 'low'
      : config.mode === 'chaos'
        ? config.chaosLevel >= 3
          ? 'high'
          : 'medium'
        : config.variableSpeedPreset;
  return speedScaleAtElapsed(
    wallElapsedMs,
    config.seed,
    preset,
    config.reduceVisualVariation,
  );
}

const effectiveElapsedCache = new Map<string, number>();

export function resolveEffectiveElapsed(
  config: TaxationConfig,
  wallElapsedMs: number,
): number {
  if (!shouldUseVariableSpeed(config) || config.mode === 'standard') {
    return wallElapsedMs;
  }
  const preset =
    config.mode === 'chaos' && config.chaosLevel === 1
      ? 'low'
      : config.mode === 'chaos'
        ? config.chaosLevel >= 3
          ? 'high'
          : 'medium'
        : config.variableSpeedPreset;
  const bucket = Math.floor(wallElapsedMs);
  const key = `${config.seed}:${preset}:${config.reduceVisualVariation}:${bucket}`;
  const hit = effectiveElapsedCache.get(key);
  if (hit != null) return hit;
  const value = integrateEffectiveElapsed(
    wallElapsedMs,
    config.seed,
    preset,
    config.reduceVisualVariation,
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
  const colourInfo = resolveTaxationColour(config, baseColour, passFloor);
  const load = estimateWorkingMemoryLoad(config);
  const usesNonBilateral =
    config.mode === 'pattern-switch' ||
    config.mode === 'chaos' ||
    config.mode === 'direction-shift' ||
    (config.mode === 'custom' &&
      (config.customToggles.variableTrajectory ||
        config.customToggles.vertical ||
        config.customToggles.diagonal ||
        config.customToggles.figureEight));

  return {
    mode: config.mode,
    load,
    speedScale: resolveSpeedScale(config, wallElapsedMs),
    colour: shouldUseColourTaxation(config) ? colourInfo.colour : null,
    colourChanged: colourInfo.changed,
    stimulusLabel: usesNonBilateral
      ? 'visual-working-memory-taxation'
      : 'bilateral-visual',
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
