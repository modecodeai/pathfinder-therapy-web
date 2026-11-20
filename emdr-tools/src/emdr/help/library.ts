import { PHASE1_SCRIPTS, PHASE2_SCRIPTS } from './content/phase1and2';
import { PHASE3_SCRIPTS } from './content/phase3';
import { PHASE4_SCRIPTS } from './content/phase4';
import { PHASE5_SCRIPTS, PHASE6_SCRIPTS, PHASE7_SCRIPTS } from './content/phase5to7';
import {
  CROSS_PHASE_SCRIPTS,
  FUTURE_TEMPLATE_SCRIPTS,
  INFINITY_SCRIPTS,
  PHASE8_SCRIPTS,
} from './content/phase8andMore';
import type { EMDRScript } from './types';
import { HELP_LIBRARY_META } from './types';
import type { EMDRPhase, SetResponse } from '../types/emdr';
import { SCRIPT_BLS_GUIDANCE } from './blsGuidanceCatalog';

export { HELP_LIBRARY_META };
export {
  resolveBlsGuidance,
  SCRIPT_BLS_GUIDANCE,
  clinicalPresetToPhase,
  PHASE_ACTIVATION_GUIDANCE,
} from './blsGuidanceCatalog';
export type { BLSGuidance, BlsGuidanceContext, ClinicalBlsPresetId } from './blsGuidanceTypes';
export { BLS_STATUS_LABELS } from './blsGuidanceTypes';

function enrich(scripts: EMDRScript[]): EMDRScript[] {
  return scripts.map((s) => ({
    ...s,
    blsGuidance: s.blsGuidance ?? SCRIPT_BLS_GUIDANCE[s.id],
  }));
}

export const ALL_SCRIPTS: EMDRScript[] = enrich([
  ...PHASE1_SCRIPTS,
  ...PHASE2_SCRIPTS,
  ...PHASE3_SCRIPTS,
  ...PHASE4_SCRIPTS,
  ...PHASE5_SCRIPTS,
  ...PHASE6_SCRIPTS,
  ...PHASE7_SCRIPTS,
  ...PHASE8_SCRIPTS,
  ...FUTURE_TEMPLATE_SCRIPTS,
  ...INFINITY_SCRIPTS,
  ...CROSS_PHASE_SCRIPTS,
]);

export function getScriptById(id: string): EMDRScript | undefined {
  return ALL_SCRIPTS.find((s) => s.id === id);
}

export function scriptsForPhase(phase: EMDRPhase): EMDRScript[] {
  return ALL_SCRIPTS.filter(
    (s) => s.phase === phase || s.phase === 'cross-phase' || relevantCross(phase, s),
  );
}

function relevantCross(phase: EMDRPhase, s: EMDRScript): boolean {
  if (s.id === 'cross-container') {
    return phase === 'preparation' || phase === 'closure';
  }
  if (s.id === 'infinity-figure-eight') {
    return phase === 'closure' || phase === 'preparation';
  }
  return false;
}

/** Context-sensitive default script ids for the current session activity */
export function contextualScriptIds(opts: {
  phase: EMDRPhase;
  awaitingFeedback?: boolean;
  consecutiveNoChange?: number;
  infinityMode?: boolean;
  focusField?: 'sud' | 'voc' | 'nc' | null;
  lastResponse?: SetResponse | null;
}): string[] {
  const ids: string[] = [];
  if (opts.infinityMode) ids.push('infinity-figure-eight');
  if (opts.focusField === 'sud') ids.push('phase3-sud-help');
  if (opts.focusField === 'voc') ids.push('phase3-voc-help');
  if (opts.focusField === 'nc') ids.push('phase3-nc-help');

  if (opts.lastResponse === 'return-to-target') ids.push('phase4-return-to-target');
  if (opts.lastResponse === 'change') ids.push('phase4-change-path');
  if (opts.lastResponse === 'no-change') {
    if ((opts.consecutiveNoChange ?? 0) >= 2) ids.push('phase4-no-change-twice');
    else ids.push('phase4-no-change-once');
  }

  if (opts.phase === 'desensitisation' && opts.awaitingFeedback) {
    ids.push('phase4-processing-checkin');
    if ((opts.consecutiveNoChange ?? 0) >= 2) ids.push('phase4-no-change-twice');
    else if ((opts.consecutiveNoChange ?? 0) === 1) ids.push('phase4-no-change-once');
  }

  const defaults: Partial<Record<EMDRPhase, string[]>> = {
    history: ['phase1-presenting-issue', 'phase1-aip-mapping', 'phase1-floatback'],
    preparation: ['phase2-emdr-orientation', 'phase2-stop-signal', 'phase2-safe-calm-place'],
    assessment: ['phase3-assessment-sequence'],
    desensitisation: ['phase4-processing-checkin', 'phase4-return-to-target'],
    installation: ['phase5-installation'],
    'body-scan': ['phase6-body-scan'],
    closure: ['phase7-incomplete-closure', 'phase7-completed-closure', 'infinity-figure-eight'],
    reevaluation: ['phase8-global-reevaluation', 'phase8-target-reevaluation'],
    'future-template': ['future-template-sequence'],
  };

  for (const id of defaults[opts.phase] ?? []) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function searchScripts(query: string): EMDRScript[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_SCRIPTS;
  return ALL_SCRIPTS.filter((s) => {
    const hay = [
      s.title,
      s.clinicalNote ?? '',
      s.caution ?? '',
      ...(s.tags ?? []),
      ...s.sections.map((sec) => `${sec.heading ?? ''} ${sec.text}`),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export const LIBRARY_GROUPS: { title: string; ids: string[] }[] = [
  {
    title: 'Standard Protocol',
    ids: [
      'phase1-presenting-issue',
      'phase1-aip-mapping',
      'phase2-emdr-orientation',
      'phase3-assessment-sequence',
      'phase4-processing-checkin',
      'phase5-installation',
      'phase6-body-scan',
      'phase7-completed-closure',
      'phase7-incomplete-closure',
      'phase8-global-reevaluation',
      'phase8-target-reevaluation',
      'future-template-sequence',
    ],
  },
  {
    title: 'Preparation & Regulation',
    ids: [
      'phase2-safe-calm-place',
      'phase2-container',
      'cross-container',
      'infinity-figure-eight',
      'phase2-stop-signal',
    ],
  },
  {
    title: 'Treatment Planning',
    ids: ['phase1-aip-mapping', 'phase1-direct-questioning', 'phase1-floatback'],
  },
  {
    title: 'Advanced Tools',
    ids: ['phase2-rdi-placeholder'],
  },
];
