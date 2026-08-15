/**
 * Pathfinder Clinical Reasoning Engine (PCR) — modality-agnostic core + clinical lenses.
 * Client comes first. Modalities are interpretation lenses over therapist-approved evidence.
 */

import type {
  ConfidenceLevel,
  EvidenceLevel,
  OutstandingQuestion,
  ReviewStatus,
  TranscriptEvidence,
} from './types';

/** Selectable clinical interpretation lens. Default follows client primary approach — never force EMDR. */
export type ClinicalLens =
  | 'integrated'
  | 'emdr'
  | 'transactional-analysis';

/** Broader lens ids for considerations / explore (future lenses included). */
export type LensId =
  | 'emdr'
  | 'transactional-analysis'
  | 'gestalt'
  | 'pain'
  | 'attachment'
  | 'act'
  | 'cbt';

export const CLINICAL_LENS_LABELS: Record<ClinicalLens, string> = {
  integrated: 'Integrated',
  emdr: 'EMDR',
  'transactional-analysis': 'Transactional Analysis',
};

export const LENS_ID_LABELS: Record<LensId, string> = {
  emdr: 'EMDR',
  'transactional-analysis': 'Transactional Analysis',
  gestalt: 'Gestalt',
  pain: 'Pain / Somatic',
  attachment: 'Attachment-informed',
  act: 'ACT',
  cbt: 'CBT',
};

/**
 * Therapist-selected current treatment frame — not a permanent client type.
 * Changeable over time; history is preserved.
 */
export type PrimaryTreatmentApproach =
  | 'general-integrative'
  | 'transactional-analysis'
  | 'emdr'
  | 'integrated-ta-emdr'
  | 'pain'
  | 'other'
  | 'unspecified';

export const PRIMARY_APPROACH_LABELS: Record<PrimaryTreatmentApproach, string> = {
  'general-integrative': 'General / Integrative Psychotherapy',
  'transactional-analysis': 'Transactional Analysis',
  emdr: 'EMDR',
  'integrated-ta-emdr': 'Integrated TA + EMDR',
  pain: 'Pain / Somatic',
  other: 'Other',
  unspecified: 'Not yet specified',
};

export type ReasoningMode =
  | 'primary-lens-only'
  | 'integrated'
  | 'core-only'
  | 'choose-lenses';

export type LensRelevance =
  | 'strongly-relevant'
  | 'potentially-relevant'
  | 'limited-current-evidence'
  | 'not-currently-indicated'
  | 'not-assessed';

/** Possible complementary clinical lens — never a treatment recommendation. */
export interface ClinicalLensConsideration {
  id: string;
  lens: LensId;
  relevance: LensRelevance;
  reason: string;
  /** Always "Possible complementary clinical lens" */
  label: 'Possible complementary clinical lens';
  evidence?: EvidenceReference[];
}

export interface TreatmentApproachHistoryEntry {
  id: string;
  approach: PrimaryTreatmentApproach;
  startedAt: string;
  endedAt?: string;
  note?: string;
}

/** Lightweight EMDR lens store marker — detailed EMDR fields remain on ClientRecord. */
export interface EmdrLensFormulation {
  hasApprovedData: boolean;
  summary?: string;
  updatedAt?: string;
}

export interface PainLensFormulation {
  hasApprovedData: boolean;
  summary?: string;
  updatedAt?: string;
}

export type ClinicalContextProtocol =
  | 'general-psychotherapy'
  | 'standard-emdr'
  | 'transactional-analysis'
  | 'integrated';

export const CLINICAL_CONTEXT_LABELS: Record<ClinicalContextProtocol, string> = {
  'general-psychotherapy': 'General Psychotherapy',
  'standard-emdr': 'Standard EMDR',
  'transactional-analysis': 'Transactional Analysis',
  integrated: 'Integrated',
};

export function protocolToLens(protocol: ClinicalContextProtocol): ClinicalLens {
  if (protocol === 'standard-emdr') return 'emdr';
  if (protocol === 'transactional-analysis') return 'transactional-analysis';
  return 'integrated';
}

/** Shared evidence reference — one excerpt may support multiple lens interpretations. */
export interface EvidenceReference {
  id: string;
  excerpt: string;
  speaker?: 'client' | 'therapist' | 'unknown';
  sessionId?: string;
  analysisId?: string;
  startOffset?: number;
  endOffset?: number;
}

export type HypothesisEvidenceStrength = 'strong' | 'moderate' | 'limited';

export interface WorkingHypothesis {
  id: string;
  statement: string;
  evidenceStrength: HypothesisEvidenceStrength;
  evidence: EvidenceReference[];
  contradictoryEvidence?: EvidenceReference[];
  status: 'working' | 'strengthened' | 'weakened' | 'retired';
  clinicianApproved: boolean;
  clinicalLens?: ClinicalLens;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface PresentingProblemCore {
  id: string;
  text: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface SymptomCore {
  id: string;
  text: string;
  sourceAnalysisId?: string;
}

export interface TriggerCore {
  id: string;
  text: string;
  sourceAnalysisId?: string;
}

export interface ClinicalPattern {
  id: string;
  text: string;
  evidence?: EvidenceReference[];
  sourceAnalysisId?: string;
}

/** Modality-neutral life experience (EMDR may interpret as memory/target; TA as script-reinforcing). */
export interface SignificantExperience {
  id: string;
  headline: string;
  approximateAge?: number;
  description?: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface RelationshipPattern {
  id: string;
  text: string;
  evidence?: EvidenceReference[];
  sourceAnalysisId?: string;
}

export interface ResourceCore {
  id: string;
  kind: 'internal' | 'external';
  text: string;
  sourceAnalysisId?: string;
}

export interface StrengthCore {
  id: string;
  text: string;
}

export interface ClinicalConsiderationCore {
  id: string;
  text: string;
}

export interface TherapeuticGoal {
  id: string;
  text: string;
  sourceAnalysisId?: string;
}

/**
 * Modality-agnostic core formulation.
 * Does NOT contain NC/PC/VOC/SUD/EMDR targets, AIP themes, or TA constructs.
 */
export interface CoreClinicalFormulation {
  presentingProblems: PresentingProblemCore[];
  symptoms: SymptomCore[];
  currentTriggers: TriggerCore[];
  repeatingPatterns: ClinicalPattern[];
  significantExperiences: SignificantExperience[];
  relationships: RelationshipPattern[];
  /** Current emotional experience (modality-neutral) */
  currentEmotionalExperience?: ClinicalPattern[];
  copingStrategies?: ClinicalPattern[];
  resources: ResourceCore[];
  strengths: StrengthCore[];
  vulnerabilities: ClinicalConsiderationCore[];
  goals: TherapeuticGoal[];
  workingHypotheses: WorkingHypothesis[];
  outstandingQuestions: OutstandingQuestion[];
  recentChanges?: ClinicalPattern[];
  treatmentStrategyNotes?: string[];
  updatedAt?: string;
}

/* ─── Transactional Analysis lens ─── */

export type TaEgoState =
  | 'parent'
  | 'adult'
  | 'child'
  | 'critical-parent'
  | 'nurturing-parent'
  | 'adapted-child'
  | 'free-child';

export type TaDriverId =
  | 'be-perfect'
  | 'be-strong'
  | 'please-others'
  | 'try-hard'
  | 'hurry-up';

export const TA_DRIVER_LABELS: Record<TaDriverId, string> = {
  'be-perfect': 'Be Perfect',
  'be-strong': 'Be Strong',
  'please-others': 'Please Others',
  'try-hard': 'Try Hard',
  'hurry-up': 'Hurry Up',
};

export type TaInjunctionId =
  | 'dont-be'
  | 'dont-be-you'
  | 'dont-be-a-child'
  | 'dont-grow-up'
  | 'dont-succeed'
  | 'dont-be-important'
  | 'dont-belong'
  | 'dont-be-close'
  | 'dont-feel'
  | 'dont-think'
  | 'dont-be-well'
  | 'dont-do';

export const TA_INJUNCTION_LABELS: Record<TaInjunctionId, string> = {
  'dont-be': "Don't Be",
  'dont-be-you': "Don't Be You",
  'dont-be-a-child': "Don't Be a Child",
  'dont-grow-up': "Don't Grow Up",
  'dont-succeed': "Don't Succeed",
  'dont-be-important': "Don't Be Important",
  'dont-belong': "Don't Belong",
  'dont-be-close': "Don't Be Close",
  'dont-feel': "Don't Feel",
  'dont-think': "Don't Think",
  'dont-be-well': "Don't Be Well",
  'dont-do': "Don't Do",
};

export type TaLifePosition =
  | 'ok-ok'
  | 'ok-not-ok'
  | 'not-ok-ok'
  | 'not-ok-not-ok';

export const TA_LIFE_POSITION_LABELS: Record<TaLifePosition, string> = {
  'ok-ok': "I'm OK — You're OK",
  'ok-not-ok': "I'm OK — You're Not OK",
  'not-ok-ok': "I'm Not OK — You're OK",
  'not-ok-not-ok': "I'm Not OK — You're Not OK",
};

export interface TaFindingBase {
  id: string;
  evidenceLevel: EvidenceLevel;
  confidence: ConfidenceLevel;
  evidence: TranscriptEvidence[];
  reasoning: string;
  reviewStatus: ReviewStatus;
  clinicalLens: 'transactional-analysis';
  findingDelta?: 'new' | 'updated' | 'possible-conflict' | 'already-known';
}

export interface TaEgoStateObservation extends TaFindingBase {
  egoState: TaEgoState;
  context?: string;
}

export interface TaDriverSuggestion extends TaFindingBase {
  driver: TaDriverId;
  relatedBehaviours?: string[];
  relatedContexts?: string[];
}

export interface TaInjunctionHypothesis extends TaFindingBase {
  injunction: TaInjunctionId;
  /** Always treated as hypothesis — never established fact */
  hypothesisLabel: 'Possible injunction hypothesis';
}

export interface TaScriptMessage extends TaFindingBase {
  kind: 'counter-injunction' | 'script-message' | 'permission';
  clientLanguage: string;
}

export interface TaLifePositionObservation extends TaFindingBase {
  position: TaLifePosition;
  contextSpecific: true;
  context: string;
}

export interface TaTransactionObservation extends TaFindingBase {
  kind: 'complementary' | 'crossed' | 'ulterior';
  description: string;
}

export interface TaGamePattern extends TaFindingBase {
  label: 'Possible game pattern';
  sequence: string;
  payoff?: string;
}

export interface TaRacketSystem extends TaFindingBase {
  racketFeeling?: string;
  authenticFeeling?: string;
  racketBehaviour?: string;
  racketBeliefs?: string;
  reinforcingMemories?: string;
  payoff?: string;
}

export interface TaDiscountingProcess extends TaFindingBase {
  domain: 'existence' | 'significance' | 'change-possibilities' | 'personal-abilities';
  description: string;
}

export interface TaRedecisionArea extends TaFindingBase {
  oldDecision: string;
  possibleNewDecision: string;
}

/** Therapist-approved TA lens store on the client (never replaces core). */
export interface TaLensFormulation {
  egoStateObservations: Array<{
    id: string;
    egoState: TaEgoState;
    context?: string;
    evidence?: EvidenceReference[];
    approvedAt?: string;
  }>;
  drivers: Array<{
    id: string;
    driver: TaDriverId;
    evidence?: EvidenceReference[];
    relatedBehaviours?: string[];
    approvedAt?: string;
  }>;
  injunctionHypotheses: Array<{
    id: string;
    injunction: TaInjunctionId;
    evidence?: EvidenceReference[];
    approvedAt?: string;
  }>;
  scriptMessages: Array<{
    id: string;
    kind: 'counter-injunction' | 'script-message' | 'permission';
    clientLanguage: string;
    approvedAt?: string;
  }>;
  lifePositions: Array<{
    id: string;
    position: TaLifePosition;
    context: string;
    approvedAt?: string;
  }>;
  transactions: Array<{
    id: string;
    kind: 'complementary' | 'crossed' | 'ulterior';
    description: string;
    approvedAt?: string;
  }>;
  gamePatterns: Array<{
    id: string;
    sequence: string;
    payoff?: string;
    approvedAt?: string;
  }>;
  racketSystems: Array<{
    id: string;
    racketFeeling?: string;
    authenticFeeling?: string;
    racketBehaviour?: string;
    racketBeliefs?: string;
    approvedAt?: string;
  }>;
  discounting: Array<{
    id: string;
    domain: string;
    description: string;
    approvedAt?: string;
  }>;
  redecisionAreas: Array<{
    id: string;
    oldDecision: string;
    possibleNewDecision: string;
    approvedAt?: string;
  }>;
  scriptSummary?: string;
  noSufficientEvidence?: boolean;
  updatedAt?: string;
}

/** Structured TA analysis returned by the model (pending therapist review). */
export interface TaTranscriptAnalysis {
  analysisKind: 'ta-formulation';
  clinicalLens: 'transactional-analysis';
  summary: {
    id: string;
    value: string;
    evidenceLevel: EvidenceLevel;
    confidence: ConfidenceLevel;
    evidence: TranscriptEvidence[];
    reviewStatus: ReviewStatus;
  };
  egoStates: TaEgoStateObservation[];
  drivers: TaDriverSuggestion[];
  injunctionHypotheses: TaInjunctionHypothesis[];
  scriptMessages: TaScriptMessage[];
  lifePositions: TaLifePositionObservation[];
  transactions: TaTransactionObservation[];
  gamePatterns: TaGamePattern[];
  racketSystems: TaRacketSystem[];
  discounting: TaDiscountingProcess[];
  redecisionAreas: TaRedecisionArea[];
  unansweredQuestions: string[];
  clarificationSuggestions: string[];
  /** True when transcript lacks sufficient TA-specific evidence */
  noSufficientTaEvidence: boolean;
  /**
   * Integrated mode only: possible complementary lenses (suggestions, not treatment).
   * Never a full alternative-modality formulation.
   */
  lensConsiderations?: ClinicalLensConsideration[];
  /** Core-only / primary mode flags for governance */
  reasoningMode?: ReasoningMode;
  primaryApproach?: PrimaryTreatmentApproach;
}

export const TA_SCHEMA_VERSION = 'ci-ta-formulation-v1';
export const PCR_PROMPT_VERSION = 'pcr-v1.1-lens-governance';

export function emptyCoreFormulation(): CoreClinicalFormulation {
  return {
    presentingProblems: [],
    symptoms: [],
    currentTriggers: [],
    repeatingPatterns: [],
    significantExperiences: [],
    relationships: [],
    currentEmotionalExperience: [],
    copingStrategies: [],
    resources: [],
    strengths: [],
    vulnerabilities: [],
    goals: [],
    workingHypotheses: [],
    outstandingQuestions: [],
    recentChanges: [],
  };
}

export function emptyTaLensFormulation(): TaLensFormulation {
  return {
    egoStateObservations: [],
    drivers: [],
    injunctionHypotheses: [],
    scriptMessages: [],
    lifePositions: [],
    transactions: [],
    gamePatterns: [],
    racketSystems: [],
    discounting: [],
    redecisionAreas: [],
  };
}
