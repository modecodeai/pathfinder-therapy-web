import {
  createEmptyPainWorkspace,
  type PainProtocolStage,
  type PainSessionData,
  type PainWorkspaceState,
} from '../../types/painProtocol';
import { GRANT_PAIN_FULL, getFullSectionForStage } from '../../data/protocols/grant-pain-full';
import { GRANT_PAIN_SHORT } from '../../data/protocols/grant-pain-short';
import {
  GRANT_PAIN_INTEGRATIVE,
  GRANT_PAIN_VARIATIONS,
} from '../../data/protocols/grant-pain-variations';

export const PAIN_STORAGE_KEY = 'pathfinder.emdr.pain.workspace.v1';

export function loadPainWorkspace(): PainWorkspaceState {
  try {
    const raw = sessionStorage.getItem(PAIN_STORAGE_KEY);
    if (!raw) return createEmptyPainWorkspace();
    const parsed = JSON.parse(raw) as PainWorkspaceState;
    return {
      ...createEmptyPainWorkspace(),
      ...parsed,
      assessment: {
        ...createEmptyPainWorkspace().assessment,
        ...parsed.assessment,
      },
      antidote: { ...createEmptyPainWorkspace().antidote, ...parsed.antidote },
      imaginal: { ...createEmptyPainWorkspace().imaginal, ...parsed.imaginal },
      reevaluation: {
        ...createEmptyPainWorkspace().reevaluation,
        ...parsed.reevaluation,
      },
      closure: { ...createEmptyPainWorkspace().closure, ...parsed.closure },
      sessions: parsed.sessions ?? [],
      completedStages: parsed.completedStages ?? [],
    };
  } catch {
    return createEmptyPainWorkspace();
  }
}

export function savePainWorkspace(state: PainWorkspaceState): void {
  const next = { ...state, updatedAt: new Date().toISOString() };
  sessionStorage.setItem(PAIN_STORAGE_KEY, JSON.stringify(next));
}

export function markStageComplete(
  state: PainWorkspaceState,
  stage: PainProtocolStage,
): PainWorkspaceState {
  if (state.completedStages.includes(stage)) return state;
  return { ...state, completedStages: [...state.completedStages, stage] };
}

export function scriptForStage(
  stage: PainProtocolStage,
  prefer: 'full' | 'short' = 'full',
): ReturnType<typeof getFullSectionForStage> {
  if (prefer === 'short') {
    return GRANT_PAIN_SHORT.find((s) => s.phase === stage);
  }
  return getFullSectionForStage(stage) ?? GRANT_PAIN_SHORT.find((s) => s.phase === stage);
}

export function buildSessionRecord(state: PainWorkspaceState): PainSessionData | null {
  const a = state.assessment;
  if (!a.targetType || a.baselineSud == null || a.currentSud == null) return null;
  return {
    date: new Date().toISOString(),
    targetType: a.targetType,
    target: a.targetDescription || a.painImageMetaphor || 'Pain target',
    baselinePainSUD: a.baselineSud,
    endPainSUD: a.endSud ?? a.currentSud,
    originalNC: a.nc || undefined,
    originalPC: a.pc || undefined,
    endPC: a.revisedPc || a.pc || undefined,
    baselineVoC: a.voc,
    endVoC: a.endVoc ?? a.voc,
    painDescription: [
      a.painColour,
      a.painShape,
      a.painSize,
      a.painTexture,
      a.painMovement,
      a.additionalDescription,
    ]
      .filter(Boolean)
      .join('; '),
    painImage: a.painImageMetaphor || undefined,
    painLocation: a.bodyLocations,
    sleepChange: state.reevaluation.sleepChanges || undefined,
    activityChange: state.reevaluation.activityChanges || undefined,
    moodChange: state.reevaluation.moodChanges || undefined,
    antidoteImage: state.antidote.imageMetaphor || state.imaginal.image || undefined,
    antidoteWord: state.antidote.associatedWord || state.imaginal.associatedWord || undefined,
    continuousBLS: state.continuousBlsPreferred,
    clinicianNotes: state.privateNotes || undefined,
  };
}

export {
  GRANT_PAIN_FULL,
  GRANT_PAIN_SHORT,
  GRANT_PAIN_VARIATIONS,
  GRANT_PAIN_INTEGRATIVE,
};
