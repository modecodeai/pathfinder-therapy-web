import type {
  ColourChangeFrequency,
  ColourShiftInterval,
  TaxationConfig,
  VariableSpeedPreset,
} from '../types/emdrTaxation';

/** Mulberry32 — deterministic PRNG for therapist/client parity */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(...parts: number[]): number {
  let h = 2166136261;
  for (const p of parts) {
    h ^= Math.imul(p | 0, 16777619);
    h = Math.imul(h ^ (h >>> 13), 2246822507);
  }
  return h >>> 0;
}

export function pickIndex(rand: () => number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.floor(rand() * length));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Smoothstep ease between a and b */
export function easeInOut(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface VariableSpeedBounds {
  minScale: number;
  maxScale: number;
  /** Typical segment length before choosing a new target (ms) */
  segmentMs: number;
  /** Transition duration into a new scale (ms) */
  transitionMs: number;
}

export function variableSpeedBounds(
  preset: VariableSpeedPreset,
  reduceVariation: boolean,
): VariableSpeedBounds {
  if (reduceVariation) {
    return { minScale: 0.85, maxScale: 1.15, segmentMs: 2800, transitionMs: 900 };
  }
  switch (preset) {
    case 'low':
      return { minScale: 0.8, maxScale: 1.2, segmentMs: 2600, transitionMs: 800 };
    case 'high':
      return { minScale: 0.55, maxScale: 1.55, segmentMs: 1600, transitionMs: 700 };
    case 'medium':
    default:
      return { minScale: 0.7, maxScale: 1.35, segmentMs: 2000, transitionMs: 750 };
  }
}

/**
 * Continuous, eased speed scale over wall-clock elapsed.
 * Bounded randomisation — never instantaneous jumps.
 */
export function speedScaleAtElapsed(
  wallElapsedMs: number,
  seed: number,
  preset: VariableSpeedPreset,
  reduceVariation: boolean,
): number {
  const bounds = variableSpeedBounds(preset, reduceVariation);
  const seg = Math.max(400, bounds.segmentMs);
  const trans = Math.min(bounds.transitionMs, seg * 0.45);
  const idx = Math.floor(Math.max(0, wallElapsedMs) / seg);
  const local = Math.max(0, wallElapsedMs) - idx * seg;

  const randA = mulberry32(hashSeed(seed, idx, 11));
  const randB = mulberry32(hashSeed(seed, idx + 1, 11));
  const from = lerp(bounds.minScale, bounds.maxScale, randA());
  const to = lerp(bounds.minScale, bounds.maxScale, randB());

  if (local >= trans) return to;
  return lerp(from, to, easeInOut(local / trans));
}

/**
 * Integrate speed scale so position advances continuously without teleporting
 * when scale changes. Sampled in fixed steps for therapist/client parity.
 */
export function integrateEffectiveElapsed(
  wallElapsedMs: number,
  seed: number,
  preset: VariableSpeedPreset,
  reduceVariation: boolean,
  stepMs = 16,
): number {
  if (wallElapsedMs <= 0) return 0;
  let acc = 0;
  const end = wallElapsedMs;
  for (let t = 0; t < end; t += stepMs) {
    const dt = Math.min(stepMs, end - t);
    acc += dt * speedScaleAtElapsed(t + dt * 0.5, seed, preset, reduceVariation);
  }
  return acc;
}

export function colourChangePassInterval(
  interval: ColourShiftInterval,
  seed: number,
  passFloor: number,
): number {
  if (interval === 'random') {
    const r = mulberry32(hashSeed(seed, Math.floor(passFloor / 3), 41))();
    return 2 + pickIndex(() => r, 5); // 2–6
  }
  return interval;
}

export function frequencyToApproxPasses(freq: ColourChangeFrequency): number {
  switch (freq) {
    case 'low':
      return 5;
    case 'high':
      return 2;
    case 'medium':
    default:
      return 3;
  }
}

export function shouldUseColourTaxation(config: TaxationConfig): boolean {
  if (config.disableColourTaxation || config.reduceVisualVariation) return false;
  return (
    config.mode === 'colour-shift' ||
    config.mode === 'random-colour' ||
    (config.mode === 'chaos' && config.chaosLevel >= 1) ||
    (config.mode === 'custom' &&
      (config.customToggles.colourChanges || config.customToggles.randomColours))
  );
}

export function shouldUseVariableSpeed(config: TaxationConfig): boolean {
  if (config.mode === 'variable-speed') return true;
  if (config.mode === 'chaos') return true;
  if (config.mode === 'custom' && config.customToggles.variableSpeed) return true;
  return false;
}
