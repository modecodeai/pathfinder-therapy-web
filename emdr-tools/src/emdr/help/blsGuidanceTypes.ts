import type { EMDRPhase, SetResponse } from '../types/emdr';

/** Four primary statuses + runtime between-set / reassess states */
export type BlsGuidanceStatus =
  | 'use'
  | 'optional'
  | 'not-yet'
  | 'do-not-continue'
  /** Runtime: set finished — obtain client feedback before next set */
  | 'paused-between-sets'
  /** Runtime: pause and reassess (e.g. two consecutive no-change) */
  | 'pause-reassess'
  /** Body scan clear / completed closure — BLS not routinely required */
  | 'not-required';

export type ClinicalBlsPresetId =
  | 'resource'
  | 'desensitisation'
  | 'installation'
  | 'body-scan'
  | 'positive-strengthening'
  | 'future-template'
  | 'infinity'
  | 'manual';

export interface BLSGuidance {
  status: BlsGuidanceStatus;
  title: string;
  rationale?: string;
  suggestedPreset?: string;
  /** Maps to clinical timing preset applied via Load suggested BLS */
  presetId?: ClinicalBlsPresetId;
  instructions?: string[];
  caution?: string;
  action?: {
    label: string;
    presetId?: ClinicalBlsPresetId;
  };
  /** Internal provenance — not shown as copyrighted text */
  sourceSection?: string;
}

export const BLS_STATUS_LABELS: Record<BlsGuidanceStatus, string> = {
  use: 'BLS — USE',
  optional: 'BLS — OPTIONAL',
  'not-yet': 'BLS — NOT YET',
  'do-not-continue': 'BLS — DO NOT CONTINUE',
  'paused-between-sets': 'BLS — PAUSED',
  'pause-reassess': 'BLS — PAUSE / REASSESS',
  'not-required': 'BLS — NOT ROUTINELY REQUIRED',
};

export interface BlsGuidanceContext {
  phase?: EMDRPhase;
  processingActive?: boolean;
  awaitingFeedback?: boolean;
  consecutiveNoChange?: number;
  lastResponse?: SetResponse | null;
  /** Therapist-recorded Safe/Calm response */
  resourceResponse?: 'positive' | 'negative' | null;
  /** Body scan finding */
  bodyScanFinding?: 'clear' | 'positive' | 'disturbing' | 'new' | null;
  /** Closure path */
  closurePath?: 'completed' | 'incomplete' | null;
  /** Taking SUD mid-phase-4 */
  obtainingSud?: boolean;
  /** Returned to target, awaiting client report before BLS */
  returningToTarget?: boolean;
  infinityMode?: boolean;
}

export type {
  EMDRPhase,
};
