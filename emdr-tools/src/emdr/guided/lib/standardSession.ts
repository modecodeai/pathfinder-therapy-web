import type { GuidedScriptStep, SourceReference, TargetSummary } from '../../guided/types/guidedScript';
import type { CognitionTheme } from '../../data/scripts/cognitions';
import type { ProcessingTimelineEntry } from '../../guided/types/guidedScript';

export type StandardPhaseId =
  | 'history'
  | 'preparation'
  | 'assessment'
  | 'desensitisation'
  | 'installation'
  | 'body-scan'
  | 'closure'
  | 'reevaluation';

export const STANDARD_PHASE_LABELS: Record<StandardPhaseId, string> = {
  history: '1 — History / Treatment Planning',
  preparation: '2 — Preparation',
  assessment: '3 — Target Assessment',
  desensitisation: '4 — Desensitisation',
  installation: '5 — Installation',
  'body-scan': '6 — Body Scan',
  closure: '7 — Closure',
  reevaluation: '8 — Re-evaluation',
};

export interface Phase1HistoryState {
  presentingComplaint: string;
  recentExample: string;
  presentTriggers: string;
  memoryMapping: string;
  pastExperiences: string;
  childOnset: string;
  adultOnset: string;
  selfIdentity: string;
  existingResources: string;
  neededResources: string;
  futureGoals: string;
  potentialTargets: string;
  clinicalThemes: CognitionTheme[];
  selectedInitialTarget: string;
  identityCulture?: string;
  raceEthnicity?: string;
  genderSexuality?: string;
  religion?: string;
  migration?: string;
  discrimination?: string;
  systemicStress?: string;
  community?: string;
  socialLocation?: string;
  contextualSafety?: string;
}

export interface StandardSessionState {
  phase: StandardPhaseId;
  history: Phase1HistoryState;
  target: TargetSummary;
  closureBranch: 'complete' | 'incomplete' | null;
  timeline: ProcessingTimelineEntry[];
  setCount: number;
  readinessNotes: string[];
  readinessReviewed: boolean;
  updatedAt: string;
}

const KEY = 'pathfinder.emdr.standardSession.v1';

export function emptyHistory(): Phase1HistoryState {
  return {
    presentingComplaint: '',
    recentExample: '',
    presentTriggers: '',
    memoryMapping: '',
    pastExperiences: '',
    childOnset: '',
    adultOnset: '',
    selfIdentity: '',
    existingResources: '',
    neededResources: '',
    futureGoals: '',
    potentialTargets: '',
    clinicalThemes: [],
    selectedInitialTarget: '',
  };
}

export function emptyTarget(): TargetSummary {
  return {
    label: '',
    age: '',
    image: '',
    nc: '',
    pc: '',
    voc: null,
    sud: null,
    body: '',
    emotion: '',
  };
}

export function createEmptyStandardSession(): StandardSessionState {
  return {
    phase: 'assessment',
    history: emptyHistory(),
    target: emptyTarget(),
    closureBranch: null,
    timeline: [],
    setCount: 0,
    readinessNotes: [],
    readinessReviewed: false,
    updatedAt: new Date().toISOString(),
  };
}

export function loadStandardSession(): StandardSessionState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createEmptyStandardSession();
    const parsed = JSON.parse(raw) as StandardSessionState;
    return {
      ...createEmptyStandardSession(),
      ...parsed,
      history: { ...emptyHistory(), ...parsed.history },
      target: { ...emptyTarget(), ...parsed.target },
      timeline: parsed.timeline ?? [],
    };
  } catch {
    return createEmptyStandardSession();
  }
}

export function saveStandardSession(state: StandardSessionState): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export const FLOATBACK_CAUTION: GuidedScriptStep = {
  id: 'floatback-caution',
  protocol: 'floatback',
  phase: 'history',
  section: 'caution',
  type: 'warning',
  text:
    'Clinical caution: For clients who are easily overwhelmed or dissociative, consider pacing, stabilisation, and consultation. Do not automatically launch Floatback based on symptoms alone — clinician judgement governs whether and when to use this technique.',
  source: {
    organisation: 'The Center for Excellence in EMDR Therapy',
    title: 'Appendix B / Part I — Floatback Technique',
    date: 'March 2026',
  } satisfies SourceReference,
};

export const FLOATBACK_STEPS: GuidedScriptStep[] = [
  {
    id: 'fb-recent',
    protocol: 'floatback',
    phase: 'history',
    section: 'anchor',
    type: 'say',
    text: 'Which of the recent experiences you mentioned is the most disturbing to you now?',
    source: FLOATBACK_CAUTION.source,
  },
  {
    id: 'fb-image',
    protocol: 'floatback',
    phase: 'history',
    section: 'anchor',
    type: 'say',
    text: 'What is the image that represents the worst part of this recent experience?',
    source: FLOATBACK_CAUTION.source,
  },
  {
    id: 'fb-nc',
    protocol: 'floatback',
    phase: 'history',
    section: 'anchor',
    type: 'say',
    text: 'What negative thoughts are you having about yourself as you hold it in mind?',
    source: FLOATBACK_CAUTION.source,
  },
  {
    id: 'fb-emotion',
    protocol: 'floatback',
    phase: 'history',
    section: 'anchor',
    type: 'say',
    text: 'What are the emotions you are experiencing? Where do you feel it in your body?',
    source: FLOATBACK_CAUTION.source,
  },
  {
    id: 'fb-float',
    protocol: 'floatback',
    phase: 'history',
    section: 'float',
    type: 'say',
    text: 'As you focus on the image, the negative thoughts you’re having about yourself, the emotions and sensations you’re experiencing now, just let your mind float back to an earlier time when you may have felt this way before, and just notice what associations come to mind…',
    source: FLOATBACK_CAUTION.source,
  },
  {
    id: 'fb-continue',
    protocol: 'floatback',
    phase: 'history',
    section: 'float',
    type: 'say',
    text: 'As you focus on the last association, what else comes to mind?',
    source: FLOATBACK_CAUTION.source,
  },
  FLOATBACK_CAUTION,
];

export const READINESS_FLAGS = [
  'Dissociation considerations',
  'Stability / affect tolerance',
  'Life circumstances / timing',
  'Support network',
  'Substance use',
  'Emotional regulation capacity',
  'Therapeutic rapport',
  'Medical factors',
  'Capacity for dual awareness',
] as const;
