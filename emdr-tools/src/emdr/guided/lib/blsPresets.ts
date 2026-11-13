import type { RoomState } from '../../../types/room';
import { withSpeed01 } from '../../../types/room';
import {
  grantPainDefaultPatch,
  painInstallationSlowPatch,
  painVisualBlsPatch,
} from '../../lib/emdr-pain/painBlsPresets';

export type BlsPresetId =
  | 'standardReprocessing'
  | 'safeCalm'
  | 'installation'
  | 'emdShortSet'
  | 'grantPainAuditory'
  | 'painVisual'
  | 'painInstallation'
  | 'rdi'
  | 'futureTemplate';

export interface BlsPresetDefinition {
  id: BlsPresetId;
  label: string;
  summary: string;
  /** Practice Tool vs Protocol Guidance */
  guidanceKind: 'protocol' | 'practice-tool';
  apply: (current: RoomState) => Partial<RoomState>;
}

function standardReprocessingPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.55),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: false,
    setMode: 'timed',
    targetSeconds: 30,
    visualMode: 'horizontal',
    taxationMode: 'standard',
  };
}

function safeCalmPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.18),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: false,
    setMode: 'passes',
    targetPasses: 10,
    visualMode: 'horizontal',
    taxationMode: 'standard',
    taxationReduceVisualVariation: true,
  };
}

function installationPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.35),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: false,
    setMode: 'timed',
    targetSeconds: 25,
    visualMode: 'horizontal',
    taxationMode: 'standard',
  };
}

function emdShortSetPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.5),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: false,
    setMode: 'passes',
    targetPasses: 14,
    visualMode: 'horizontal',
    taxationMode: 'standard',
  };
}

function rdiPatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.2),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: false,
    setMode: 'passes',
    targetPasses: 10,
    visualMode: 'horizontal',
    taxationMode: 'standard',
  };
}

function futureTemplatePatch(current: RoomState): Partial<RoomState> {
  return {
    ...withSpeed01(current, 0.28),
    visualEnabled: true,
    audioEnabled: false,
    audioOnly: false,
    continuous: false,
    setMode: 'passes',
    targetPasses: 12,
    visualMode: 'horizontal',
    taxationMode: 'standard',
  };
}

/** Shared BLS presets — one engine, many clinical contexts. */
export const BLS_PRESETS: Record<BlsPresetId, BlsPresetDefinition> = {
  standardReprocessing: {
    id: 'standardReprocessing',
    label: 'Standard Reprocessing',
    summary: 'Predictable visual BLS · timed sets · advanced taxation off',
    guidanceKind: 'practice-tool',
    apply: standardReprocessingPatch,
  },
  safeCalm: {
    id: 'safeCalm',
    label: 'Safe / Calm BLS',
    summary: 'Slow · alternating · 8–10 passes · advanced taxation off',
    guidanceKind: 'protocol',
    apply: safeCalmPatch,
  },
  installation: {
    id: 'installation',
    label: 'Installation',
    summary: 'Standard · predictable · often slower than reprocessing',
    guidanceKind: 'practice-tool',
    apply: installationPatch,
  },
  emdShortSet: {
    id: 'emdShortSet',
    label: 'EMD Short Set',
    summary: '12–15 passes · standard predictable · manual clinician control',
    guidanceKind: 'protocol',
    apply: emdShortSetPatch,
  },
  grantPainAuditory: {
    id: 'grantPainAuditory',
    label: 'Grant Pain Default',
    summary: 'Auditory · alternating · continuous available · advanced taxation off',
    guidanceKind: 'protocol',
    apply: grantPainDefaultPatch,
  },
  painVisual: {
    id: 'painVisual',
    label: 'Pain Visual BLS',
    summary: 'Visual continuous alternative for pain work',
    guidanceKind: 'practice-tool',
    apply: painVisualBlsPatch,
  },
  painInstallation: {
    id: 'painInstallation',
    label: 'Pain Installation — Slow BLS',
    summary: 'Slow visual · ~8 passes',
    guidanceKind: 'protocol',
    apply: painInstallationSlowPatch,
  },
  rdi: {
    id: 'rdi',
    label: 'RDI',
    summary: 'Slower predictable BLS · ~6–12 passes · taxation off',
    guidanceKind: 'protocol',
    apply: rdiPatch,
  },
  futureTemplate: {
    id: 'futureTemplate',
    label: 'Future Template',
    summary: 'Slower rehearsal BLS · predictable',
    guidanceKind: 'protocol',
    apply: futureTemplatePatch,
  },
};

export function applyBlsPreset(id: BlsPresetId, current: RoomState): Partial<RoomState> {
  return BLS_PRESETS[id].apply(current);
}
