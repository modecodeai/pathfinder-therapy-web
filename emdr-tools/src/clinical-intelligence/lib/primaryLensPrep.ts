/**
 * Primary-lens preparation helpers.
 * Core understanding precedes theoretical formulation.
 * Session Preparation reads approved formulation for the client's current approach —
 * never invents EMDR concepts merely because EMDR is available on the platform.
 */

import type { ClientRecord } from '../types';
import type {
  ClinicalLens,
  LensId,
  TaLensFormulation,
} from '../clinicalReasoning';
import {
  CLINICAL_LENS_LABELS,
  LENS_ID_LABELS,
  PRIMARY_APPROACH_LABELS,
} from '../clinicalReasoning';
import { inferPrimaryApproach, approachToProtocol } from './lensGovernance';

export type LensRunStatus = 'not-run' | 'awaiting-review' | 'approved' | 'inactive';

export type PrimaryClinicalLensId = LensId | 'none';

export function resolvePrimaryClinicalLens(client: ClientRecord): PrimaryClinicalLensId {
  if (client.primaryClinicalLens && client.primaryClinicalLens !== 'none') {
    return client.primaryClinicalLens;
  }
  const approach = inferPrimaryApproach(client);
  switch (approach) {
    case 'transactional-analysis':
    case 'integrated-ta-emdr':
      return 'transactional-analysis';
    case 'emdr':
    case 'pain':
      return 'emdr';
    case 'general-integrative':
      // Integrative ≠ EMDR-primary — therapist must choose
      return client.primaryClinicalLens ?? 'transactional-analysis';
    default:
      return 'none';
  }
}

export function complementaryLenses(client: ClientRecord): LensId[] {
  const primary = resolvePrimaryClinicalLens(client);
  const listed = (client.activeClinicalLenses ?? []).filter((l) => l !== primary);
  if (primary === 'transactional-analysis' && !listed.includes('emdr')) {
    // EMDR available as complementary only — not auto-active
    return listed;
  }
  return listed;
}

export function coreFormulationStatus(client: ClientRecord): 'approved' | 'pending' | 'absent' {
  if (client.intakeClinicalStatus === 'therapist-reviewed' && client.coreFormulation) {
    return 'approved';
  }
  if (client.coreFormulation) return 'pending';
  return 'absent';
}

export function taLensStatus(client: ClientRecord): LensRunStatus {
  const ta = client.taFormulation ?? client.taLens;
  if (!ta) return 'inactive';
  const primary = resolvePrimaryClinicalLens(client);
  if (primary !== 'transactional-analysis' && inferPrimaryApproach(client) !== 'integrated-ta-emdr') {
    if (!hasAnyApprovedTa(ta) && !(client.pendingTaLensReview?.length)) return 'inactive';
  }
  if (client.pendingTaLensReview && client.pendingTaLensReview.length > 0) return 'awaiting-review';
  if (hasAnyApprovedTa(ta)) return 'approved';
  if (client.taLensAnalysedAt) return 'awaiting-review';
  return 'not-run';
}

export function emdrLensStatus(client: ClientRecord): LensRunStatus {
  const primary = resolvePrimaryClinicalLens(client);
  const approach = inferPrimaryApproach(client);
  const emdrActive =
    primary === 'emdr' ||
    approach === 'emdr' ||
    approach === 'pain' ||
    (client.activeClinicalLenses ?? []).includes('emdr') ||
    Boolean(client.emdrLensExplored);
  if (!emdrActive) return 'inactive';
  if (client.emdrFormulation?.hasApprovedData || client.activeTarget?.headline) return 'approved';
  if (client.emdrLensExplored) return 'awaiting-review';
  return 'not-run';
}

function hasAnyApprovedTa(ta: TaLensFormulation): boolean {
  return Boolean(
    ta.drivers.length ||
      ta.injunctionHypotheses.length ||
      ta.egoStateObservations.length ||
      ta.scriptMessages.length ||
      (ta.scriptSummary && ta.scriptSummary.trim()) ||
      ta.redecisionAreas.length,
  );
}

export function isEmdrPrimaryForPrep(client: ClientRecord): boolean {
  return (
    resolvePrimaryClinicalLens(client) === 'emdr' ||
    inferPrimaryApproach(client) === 'emdr' ||
    inferPrimaryApproach(client) === 'pain'
  );
}

export function shouldShowEmdrPrepFields(client: ClientRecord): boolean {
  return isEmdrPrimaryForPrep(client) || emdrLensStatus(client) !== 'inactive';
}

export function shouldShowTaPrepFields(client: ClientRecord): boolean {
  const status = taLensStatus(client);
  return status === 'approved' || status === 'awaiting-review';
}

export function protocolLabelForClient(client: ClientRecord): string {
  if (client.currentProtocol && !isProtocolEmdrDefaultMismatch(client)) {
    return client.currentProtocol;
  }
  const approach = inferPrimaryApproach(client);
  const primary = resolvePrimaryClinicalLens(client);
  switch (approach) {
    case 'emdr':
    case 'pain':
      return 'Standard EMDR';
    case 'transactional-analysis':
      return 'Transactional Analysis';
    case 'integrated-ta-emdr':
      return primary === 'emdr' ? 'Integrated · EMDR-primary' : 'Integrated · TA-primary';
    case 'general-integrative':
      return primary === 'transactional-analysis'
        ? 'Integrated · TA-primary'
        : primary === 'emdr'
          ? 'Integrated · EMDR-primary'
          : 'General psychotherapy';
    default:
      return 'General psychotherapy';
  }
}

export function isProtocolEmdrDefaultMismatch(client: ClientRecord): boolean {
  const protocol = (client.activeCycle?.protocol ?? client.currentProtocol ?? '').toLowerCase();
  if (!protocol.includes('emdr')) return false;
  if (isEmdrPrimaryForPrep(client)) return false;
  const approach = inferPrimaryApproach(client);
  return (
    approach === 'transactional-analysis' ||
    approach === 'integrated-ta-emdr' ||
    approach === 'general-integrative' ||
    approach === 'unspecified' ||
    approach === 'other'
  );
}

export function sessionApproachMismatch(client: ClientRecord): {
  mismatched: boolean;
  clientApproachLabel: string;
  sessionProtocol: string;
} | null {
  const cycle = client.activeCycle;
  if (!cycle || cycle.workflowStatus === 'complete') return null;
  if (!isProtocolEmdrDefaultMismatch({ ...client, currentProtocol: cycle.protocol })) {
    return null;
  }
  const primary = resolvePrimaryClinicalLens(client);
  const approach = inferPrimaryApproach(client);
  return {
    mismatched: true,
    clientApproachLabel: `${PRIMARY_APPROACH_LABELS[approach]}${
      primary !== 'none' ? ` / ${(LENS_ID_LABELS as Record<string, string>)[primary] ?? CLINICAL_LENS_LABELS[primary as ClinicalLens] ?? primary}-primary` : ''
    }`,
    sessionProtocol: cycle.protocol,
  };
}

export function defaultSessionTypeOptions(client: ClientRecord): Array<{ id: string; label: string }> {
  const primary = resolvePrimaryClinicalLens(client);
  const approach = inferPrimaryApproach(client);
  if (approach === 'emdr' || approach === 'pain') {
    return [
      { id: 'standard-emdr', label: 'Standard EMDR / Guided Practice' },
      { id: 'general', label: 'General psychotherapy' },
      { id: 'other', label: 'Other' },
    ];
  }
  const opts: Array<{ id: string; label: string }> = [
    { id: 'general-ta', label: 'General psychotherapy / TA' },
    { id: 'ta-focused', label: 'TA-focused psychotherapy' },
    { id: 'integrated', label: 'Integrated psychotherapy' },
    { id: 'explore-emdr', label: 'Explore EMDR' },
    { id: 'other', label: 'Other' },
  ];
  if (primary === 'transactional-analysis') {
    return opts;
  }
  return opts;
}

export function protocolFromSessionType(sessionTypeId: string): string {
  switch (sessionTypeId) {
    case 'standard-emdr':
      return 'Standard EMDR';
    case 'ta-focused':
      return 'Transactional Analysis';
    case 'integrated':
      return 'Integrated · TA-primary';
    case 'explore-emdr':
      return 'Explore EMDR';
    case 'general-ta':
      return 'General psychotherapy / TA';
    default:
      return 'General psychotherapy';
  }
}

export function phaseLabelForProtocol(protocol: string): string {
  if (/emdr/i.test(protocol) && !/explore/i.test(protocol)) return 'Guided Practice';
  if (/transactional|ta-primary|general psychotherapy/i.test(protocol)) return 'Session work';
  return 'Session work';
}

export function approachStatusSummary(client: ClientRecord): {
  approach: string;
  primaryLens: string;
  core: string;
  ta: string;
  emdr: string;
} {
  const approach = inferPrimaryApproach(client);
  const primary = resolvePrimaryClinicalLens(client);
  const ta = taLensStatus(client);
  const emdr = emdrLensStatus(client);
  const core = coreFormulationStatus(client);
  const taLabel =
    ta === 'not-run'
      ? 'Awaiting analysis'
      : ta === 'awaiting-review'
        ? 'Awaiting review'
        : ta === 'approved'
          ? 'Approved'
          : 'Inactive';
  const emdrLabel =
    emdr === 'inactive' ? 'Inactive' : emdr === 'approved' ? 'Approved' : emdr === 'awaiting-review' ? 'Awaiting review' : 'Not run';
  return {
    approach: PRIMARY_APPROACH_LABELS[approach],
    primaryLens:
      primary === 'none'
        ? 'Not selected'
        : (LENS_ID_LABELS as Record<string, string>)[primary] ?? String(primary),
    core: core === 'approved' ? 'Approved' : core === 'pending' ? 'Pending' : 'Not established',
    ta: taLabel,
    emdr: emdrLabel,
  };
}

export function primaryLensCta(client: ClientRecord): { label: string; action: 'run-ta' | 'review-ta' | 'run-emdr' | 'none' } {
  const primary = resolvePrimaryClinicalLens(client);
  if (coreFormulationStatus(client) !== 'approved') {
    return { label: 'Complete Core approval first', action: 'none' };
  }
  if (primary === 'transactional-analysis' || inferPrimaryApproach(client) === 'integrated-ta-emdr') {
    const ta = taLensStatus(client);
    if (ta === 'not-run') return { label: 'Run Transactional Analysis Lens', action: 'run-ta' };
    if (ta === 'awaiting-review') return { label: 'Review TA Findings', action: 'review-ta' };
    return { label: 'TA Formulation Approved', action: 'none' };
  }
  if (primary === 'emdr') {
    const emdr = emdrLensStatus(client);
    if (emdr === 'not-run' || emdr === 'inactive') return { label: 'Run EMDR Lens', action: 'run-emdr' };
    if (emdr === 'awaiting-review') return { label: 'Review EMDR Findings', action: 'run-emdr' };
  }
  if (primary === 'none') {
    return { label: 'Select Primary Clinical Lens', action: 'none' };
  }
  return { label: 'Run Primary Lens Analysis', action: 'none' };
}

/** Re-export for callers that need protocol enum */
export { approachToProtocol };
