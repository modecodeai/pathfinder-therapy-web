/**
 * Lens governance — primary approach, reasoning modes, migration, analysis routing.
 * Client comes before the model. Never auto-apply EMDR.
 */

import type { ClientRecord } from '../types';
import type {
  ClinicalLens,
  ClinicalContextProtocol,
  PrimaryTreatmentApproach,
  ReasoningMode,
  TreatmentApproachHistoryEntry,
  LensId,
  LensRelevance,
  ClinicalLensConsideration,
} from '../clinicalReasoning';
import {
  PRIMARY_APPROACH_LABELS,
  emptyTaLensFormulation,
  emptyCoreFormulation,
} from '../clinicalReasoning';
import { deriveCoreFormulation, mergeTaLens } from './coreFormulation';
import {
  getTherapistDefaultReasoningMode,
  type TherapistDefaultReasoning,
} from './lensGovernancePrefs';

export type { TherapistDefaultReasoning };
export {
  getTherapistDefaultReasoningMode,
  setTherapistDefaultReasoningMode,
} from './lensGovernancePrefs';

export const REASONING_MODE_LABELS: Record<ReasoningMode, string> = {
  'primary-lens-only': 'Primary lens only',
  integrated: 'Integrated',
  'core-only': 'Core formulation only',
  'choose-lenses': 'Choose additional lenses',
};

export const LENS_RELEVANCE_LABELS: Record<LensRelevance, string> = {
  'strongly-relevant': 'Strongly relevant',
  'potentially-relevant': 'Potentially relevant',
  'limited-current-evidence': 'Limited current evidence',
  'not-currently-indicated': 'Not currently indicated by available material',
  'not-assessed': 'Not assessed',
};

/** Infer primary approach for migration — never invent EMDR for unspecified clients. */
export function inferPrimaryApproach(client: ClientRecord): PrimaryTreatmentApproach {
  if (client.primaryTreatmentApproach && client.primaryTreatmentApproach !== 'unspecified') {
    return client.primaryTreatmentApproach;
  }
  const approaches = client.activeApproaches ?? [];
  if (approaches.includes('pain')) return 'pain';
  if (approaches.includes('transactional-analysis') && approaches.includes('emdr')) {
    return 'integrated-ta-emdr';
  }
  if (approaches.includes('transactional-analysis')) return 'transactional-analysis';
  if (approaches.includes('emdr') || client.themes.length > 0 || client.activeTarget) {
    return 'emdr';
  }
  if (approaches.includes('integrated')) return 'general-integrative';
  // Do NOT auto-assign EMDR to general / empty clients
  return 'unspecified';
}

export function approachToProtocol(approach: PrimaryTreatmentApproach): ClinicalContextProtocol {
  switch (approach) {
    case 'emdr':
    case 'pain':
      return 'standard-emdr';
    case 'transactional-analysis':
      return 'transactional-analysis';
    case 'integrated-ta-emdr':
      return 'integrated';
    case 'general-integrative':
    case 'other':
    case 'unspecified':
    default:
      return 'general-psychotherapy';
  }
}

export function approachToPrimaryLens(approach: PrimaryTreatmentApproach): ClinicalLens {
  switch (approach) {
    case 'emdr':
    case 'pain':
      return 'emdr';
    case 'transactional-analysis':
      return 'transactional-analysis';
    case 'integrated-ta-emdr':
      return 'integrated';
    default:
      return 'integrated';
  }
}

/** Whether analysis should run the EMDR structured pipeline (Phase 1/3/4). */
export function shouldRunEmdrPipeline(args: {
  reasoningMode: ReasoningMode;
  primaryApproach: PrimaryTreatmentApproach;
  clinicalLens: ClinicalLens;
  exploreEmdr?: boolean;
  additionalLenses?: LensId[];
}): boolean {
  if (args.exploreEmdr) return true;
  if (args.clinicalLens === 'emdr') return true;
  if (args.reasoningMode === 'core-only') return false;
  if (args.reasoningMode === 'primary-lens-only') {
    return args.primaryApproach === 'emdr' || args.primaryApproach === 'pain';
  }
  if (args.additionalLenses?.includes('emdr')) return true;
  // Integrated: only full EMDR when EMDR is primary — never auto for TA clients
  if (args.reasoningMode === 'integrated') {
    return args.primaryApproach === 'emdr' || args.primaryApproach === 'pain';
  }
  return false;
}

/** Whether analysis should run the TA formulation pipeline. */
export function shouldRunTaPipeline(args: {
  reasoningMode: ReasoningMode;
  primaryApproach: PrimaryTreatmentApproach;
  clinicalLens: ClinicalLens;
  additionalLenses?: LensId[];
}): boolean {
  if (args.reasoningMode === 'core-only') return true; // core-only uses TA schema with TA suppressed
  if (args.clinicalLens === 'transactional-analysis') return true;
  if (args.reasoningMode === 'primary-lens-only') {
    return args.primaryApproach === 'transactional-analysis';
  }
  if (args.additionalLenses?.includes('transactional-analysis')) return true;
  if (args.reasoningMode === 'integrated') {
    return (
      args.primaryApproach === 'transactional-analysis' ||
      args.primaryApproach === 'integrated-ta-emdr' ||
      args.primaryApproach === 'general-integrative' ||
      args.primaryApproach === 'unspecified' ||
      args.clinicalLens === 'integrated'
    );
  }
  return false;
}

export function resolveSessionAnalysisPlan(args: {
  client: ClientRecord;
  reasoningMode?: ReasoningMode;
  clinicalLens?: ClinicalLens;
  exploreEmdr?: boolean;
  additionalLenses?: LensId[];
}): {
  primaryApproach: PrimaryTreatmentApproach;
  reasoningMode: ReasoningMode;
  protocol: ClinicalContextProtocol;
  clinicalLens: ClinicalLens;
  runEmdr: boolean;
  runTa: boolean;
  includeLensConsiderations: boolean;
  suppressTaConstructs: boolean;
} {
  const primaryApproach = inferPrimaryApproach(args.client);
  const pref = getTherapistDefaultReasoningMode();
  let reasoningMode: ReasoningMode =
    args.reasoningMode ??
    (pref === 'integrated'
      ? 'integrated'
      : pref === 'core-only'
        ? 'core-only'
        : 'primary-lens-only');

  if (reasoningMode === 'primary-lens-only' && primaryApproach === 'unspecified') {
    reasoningMode = 'core-only';
  }

  const clinicalLens: ClinicalLens =
    args.clinicalLens ??
    (reasoningMode === 'core-only'
      ? 'integrated'
      : reasoningMode === 'integrated'
        ? 'integrated'
        : approachToPrimaryLens(primaryApproach));

  const runEmdr = shouldRunEmdrPipeline({
    reasoningMode,
    primaryApproach,
    clinicalLens,
    exploreEmdr: args.exploreEmdr,
    additionalLenses: args.additionalLenses,
  });
  const runTa = shouldRunTaPipeline({
    reasoningMode,
    primaryApproach,
    clinicalLens,
    additionalLenses: args.additionalLenses,
  });

  return {
    primaryApproach,
    reasoningMode,
    protocol: approachToProtocol(primaryApproach),
    clinicalLens: runEmdr && !runTa ? 'emdr' : runTa && !runEmdr ? 'transactional-analysis' : clinicalLens,
    runEmdr,
    runTa,
    includeLensConsiderations: reasoningMode === 'integrated',
    suppressTaConstructs: reasoningMode === 'core-only',
  };
}

export function appendApproachHistory(
  client: ClientRecord,
  next: PrimaryTreatmentApproach,
  note?: string,
): TreatmentApproachHistoryEntry[] {
  const prior = client.treatmentApproachHistory ?? [];
  const last = prior[prior.length - 1];
  if (last && last.approach === next && !last.endedAt) {
    return prior;
  }
  const now = new Date().toISOString();
  const closed =
    last && !last.endedAt
      ? prior.map((e, i) => (i === prior.length - 1 ? { ...e, endedAt: now } : e))
      : prior;
  return [
    ...closed,
    {
      id: `tah_${Date.now()}`,
      approach: next,
      startedAt: now,
      note,
    },
  ];
}

/** Migrate stores + primary approach without deleting EMDR or TA data. */
export function ensureLensGovernance(client: ClientRecord): ClientRecord {
  const coreFormulation = deriveCoreFormulation(client);
  const taFormulation = client.taFormulation ?? client.taLens ?? emptyTaLensFormulation();
  const primary = inferPrimaryApproach(client);
  const history =
    client.treatmentApproachHistory?.length
      ? client.treatmentApproachHistory
      : primary !== 'unspecified'
        ? [
            {
              id: 'tah_migrated',
              approach: primary,
              startedAt: client.createdAt || new Date().toISOString(),
              note: 'Migrated from existing clinical record',
            },
          ]
        : [];

  const activeClinicalLenses: LensId[] = client.activeClinicalLenses?.length
    ? client.activeClinicalLenses
    : primary === 'emdr' || primary === 'pain'
      ? ['emdr']
      : primary === 'transactional-analysis'
        ? ['transactional-analysis']
        : primary === 'integrated-ta-emdr'
          ? ['transactional-analysis', 'emdr']
          : [];

  return {
    ...client,
    coreFormulation: coreFormulation ?? emptyCoreFormulation(),
    taLens: taFormulation,
    taFormulation,
    emdrFormulation: client.emdrFormulation ?? {
      hasApprovedData: Boolean(client.themes.length || client.activeTarget),
      updatedAt: client.updatedAt,
    },
    painFormulation: client.painFormulation ?? { hasApprovedData: false },
    primaryTreatmentApproach: primary,
    activeClinicalLenses,
    treatmentApproachHistory: history,
    activeApproaches: client.activeApproaches?.length
      ? client.activeApproaches
      : mapApproachToActive(primary),
  };
}

function mapApproachToActive(
  a: PrimaryTreatmentApproach,
): Array<'emdr' | 'transactional-analysis' | 'pain' | 'integrated'> {
  switch (a) {
    case 'emdr':
      return ['emdr'];
    case 'pain':
      return ['pain'];
    case 'transactional-analysis':
      return ['transactional-analysis'];
    case 'integrated-ta-emdr':
      return ['emdr', 'transactional-analysis'];
    case 'general-integrative':
      return ['integrated'];
    default:
      return [];
  }
}

export function setPrimaryTreatmentApproach(
  client: ClientRecord,
  approach: PrimaryTreatmentApproach,
): ClientRecord {
  const history = appendApproachHistory(client, approach);
  return ensureLensGovernance({
    ...client,
    primaryTreatmentApproach: approach,
    treatmentApproachHistory: history,
    activeApproaches: mapApproachToActive(approach),
    taLens: client.taLens ?? client.taFormulation,
    taFormulation: client.taFormulation ?? client.taLens,
  });
}

export { PRIMARY_APPROACH_LABELS, mergeTaLens };

export type {
  ClinicalLensConsideration,
  LensRelevance,
  LensId,
  PrimaryTreatmentApproach,
  ReasoningMode,
};
