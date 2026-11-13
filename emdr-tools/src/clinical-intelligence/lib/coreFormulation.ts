/**
 * Derive and sync modality-agnostic core formulation from approved ClientRecord fields.
 * EMDR-specific data stays on ClientRecord for the EMDR lens — never duplicated as a second client.
 */

import type { ClientRecord } from '../types';
import {
  emptyCoreFormulation,
  emptyTaLensFormulation,
  type CoreClinicalFormulation,
  type SignificantExperience,
  type TaLensFormulation,
} from '../clinicalReasoning';
import { ensureLensGovernance } from './lensGovernance';

/** Migrate existing approved EMDR-shaped fields into core without data loss. */
export function deriveCoreFormulation(client: ClientRecord): CoreClinicalFormulation {
  const existing = client.coreFormulation;
  const base = existing ? { ...emptyCoreFormulation(), ...existing } : emptyCoreFormulation();

  const presentingProblems =
    client.presentingProblems.length > 0
      ? client.presentingProblems.map((text, i) => ({
          id: `pp_${i}_${hash(text)}`,
          text,
        }))
      : base.presentingProblems;

  const currentTriggers =
    client.triggers.length > 0
      ? client.triggers.map((t) => ({ id: t.id, text: t.text, sourceAnalysisId: t.sourceAnalysisId }))
      : base.currentTriggers;

  const significantExperiences: SignificantExperience[] =
    client.memories.length > 0
      ? client.memories.map((m) => ({
          id: m.id,
          headline: m.headline,
          approximateAge: m.approximateAge,
          description: m.description,
          sourceAnalysisId: m.sourceAnalysisId,
          approvedAt: m.approvedAt,
        }))
      : base.significantExperiences;

  const resources =
    client.resources.length > 0
      ? client.resources.map((r) => ({
          id: r.id,
          kind: r.kind,
          text: r.text,
          sourceAnalysisId: r.sourceAnalysisId,
        }))
      : base.resources;

  return {
    ...base,
    presentingProblems,
    currentTriggers,
    significantExperiences,
    resources,
    outstandingQuestions: client.outstandingQuestions ?? base.outstandingQuestions,
    treatmentStrategyNotes: client.treatmentStrategy ?? base.treatmentStrategyNotes,
    updatedAt: new Date().toISOString(),
  };
}

/** Ensure client has core + lens stores + primary approach without wiping EMDR/TA data. */
export function ensureClinicalReasoningStores(client: ClientRecord): ClientRecord {
  return ensureLensGovernance(client);
}

export function mergeTaLens(
  prior: TaLensFormulation | undefined,
  incoming: Partial<TaLensFormulation>,
): TaLensFormulation {
  const base = prior ?? emptyTaLensFormulation();
  return {
    ...base,
    ...incoming,
    egoStateObservations: mergeById(base.egoStateObservations, incoming.egoStateObservations),
    drivers: mergeById(base.drivers, incoming.drivers),
    injunctionHypotheses: mergeById(base.injunctionHypotheses, incoming.injunctionHypotheses),
    scriptMessages: mergeById(base.scriptMessages, incoming.scriptMessages),
    lifePositions: mergeById(base.lifePositions, incoming.lifePositions),
    transactions: mergeById(base.transactions, incoming.transactions),
    gamePatterns: mergeById(base.gamePatterns, incoming.gamePatterns),
    racketSystems: mergeById(base.racketSystems, incoming.racketSystems),
    discounting: mergeById(base.discounting, incoming.discounting),
    redecisionAreas: mergeById(base.redecisionAreas, incoming.redecisionAreas),
    updatedAt: new Date().toISOString(),
  };
}

function mergeById<T extends { id: string }>(
  prior: T[],
  incoming: T[] | undefined,
): T[] {
  if (!incoming?.length) return prior;
  const map = new Map(prior.map((p) => [p.id, p]));
  for (const item of incoming) {
    map.set(item.id, { ...(map.get(item.id) as T | undefined), ...item });
  }
  return [...map.values()];
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/** Integrated view model — perspectives coexist; never forced agreement. */
export interface IntegratedFormulationView {
  core: CoreClinicalFormulation;
  emdrPerspective: {
    primaryTheme?: string;
    activeTarget?: string;
    nc?: string;
    pc?: string;
    networkSummary?: string;
  };
  taPerspective: {
    drivers: string[];
    egoStates: string[];
    injunctions: string[];
    scriptSummary?: string;
    noSufficientEvidence?: boolean;
  };
  integratedHypothesis?: string;
}
