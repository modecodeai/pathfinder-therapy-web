/**
 * Pathfinder Therapist Reasoning Model — observation before theory.
 * Therapist style is a preference layer, never a source of clinical truth.
 */

import type { TranscriptEvidence } from './types';
import type { ClinicalLens, EvidenceReference, LensId } from './clinicalReasoning';

/** Recurring stages of clinical thinking — do not skip observation for theory. */
export type ReasoningStageId =
  | 'observe'
  | 'regulate-orient'
  | 'explore'
  | 'identify-pattern'
  | 'ask-protective-function'
  | 'formulate-meaning'
  | 'apply-clinical-lens'
  | 'identify-choice-movement'
  | 'consider-intervention';

export const REASONING_STAGE_LABELS: Record<ReasoningStageId, string> = {
  observe: 'Observe',
  'regulate-orient': 'Regulate / Orient',
  explore: 'Explore',
  'identify-pattern': 'Identify Pattern',
  'ask-protective-function': 'Ask Protective Function',
  'formulate-meaning': 'Formulate Meaning',
  'apply-clinical-lens': 'Apply Clinical Lens',
  'identify-choice-movement': 'Identify Choice / Movement',
  'consider-intervention': 'Consider Intervention',
};

export const DEFAULT_REASONING_SEQUENCE: ReasoningStageId[] = [
  'observe',
  'regulate-orient',
  'explore',
  'identify-pattern',
  'ask-protective-function',
  'formulate-meaning',
  'apply-clinical-lens',
  'identify-choice-movement',
  'consider-intervention',
];

/** Modality-neutral process categories (sit above modality constructs). */
export type ClinicalProcessCategory =
  | 'protective-process'
  | 'relational-process'
  | 'affect-regulation-process'
  | 'cognitive-control-process'
  | 'avoidance-withdrawal-process'
  | 'embodiment-disembodiment'
  | 'autonomy-dependence-tension'
  | 'recognition-invisibility'
  | 'boundary-process'
  | 'shame-process'
  | 'grief-process'
  | 'threat-anticipation';

export const CLINICAL_PROCESS_LABELS: Record<ClinicalProcessCategory, string> = {
  'protective-process': 'Protective Process',
  'relational-process': 'Relational Process',
  'affect-regulation-process': 'Affect Regulation Process',
  'cognitive-control-process': 'Cognitive Control Process',
  'avoidance-withdrawal-process': 'Avoidance / Withdrawal Process',
  'embodiment-disembodiment': 'Embodiment / Disembodiment',
  'autonomy-dependence-tension': 'Autonomy / Dependence Tension',
  'recognition-invisibility': 'Recognition / Invisibility',
  'boundary-process': 'Boundary Process',
  'shame-process': 'Shame Process',
  'grief-process': 'Grief Process',
  'threat-anticipation': 'Threat Anticipation',
};

export type StatementProvenance =
  | 'client-explicit'
  | 'client-endorsed'
  | 'therapist-interpretation'
  | 'therapist-introduced'
  | 'ai-suggested'
  | 'unknown';

export interface ClinicalObservation {
  id: string;
  text: string;
  clientLanguage?: string;
  evidence: TranscriptEvidence[];
  provenance: StatementProvenance;
  /** Observation only — no modality labels */
  stage: 'observe';
}

export interface RegulationOrientationNote {
  id: string;
  text: string;
  evidence: TranscriptEvidence[];
  /** Never "Ready for trauma work" — use preparation / regulation considerations */
  label: 'Relevant preparation / regulation considerations';
  domains?: Array<
    | 'regulation'
    | 'affect-tolerance'
    | 'dissociation'
    | 'overwhelm'
    | 'presence'
    | 'grounding'
    | 'social-support'
    | 'functioning'
  >;
}

export interface ClinicalPatternProcess {
  id: string;
  label: 'Possible repeating clinical pattern';
  summary: string;
  sequence?: string[];
  evidence: TranscriptEvidence[];
  processCategories?: ClinicalProcessCategory[];
}

export interface ProtectiveFunctionHypothesis {
  id: string;
  behaviour: string;
  possibleFunction: string;
  label: 'Possible protective function';
  evidence: TranscriptEvidence[];
  alternativeFunctions?: string[];
}

export interface ClinicalTension {
  id: string;
  sideA: string;
  sideB: string;
  evidenceA?: TranscriptEvidence[];
  evidenceB?: TranscriptEvidence[];
  note?: string;
}

export interface CognitionVsEmbodimentNote {
  id: string;
  cognitiveUnderstanding?: string;
  embodiedExperience?: string;
  evidence: TranscriptEvidence[];
  movement?: string;
}

export interface RiskLanguageFlag {
  id: string;
  excerpt: string;
  kind: 'self-harm' | 'not-wanting-to-live' | 'other-risk-language';
  label: 'CLINICAL REVIEW REQUIRED';
  /** Never invent intent/plan/means/severity/immediacy */
  currentStatus: 'not-established-in-transcript';
  evidence: TranscriptEvidence[];
}

export interface DissociationNote {
  id: string;
  text: string;
  label: 'Possible dissociative experience — explicit client report';
  evidence: TranscriptEvidence[];
  /** Do not diagnose DID / depersonalisation disorder / structural dissociation */
  reviewConsideration: 'Clinical review / dissociation assessment consideration';
}

export interface ContractMaterial {
  id: string;
  kind: 'feeling' | 'self-belief' | 'behavioural-movement' | 'other';
  clientLanguage: string;
  label: 'CLIENT-ENDORSED CONTRACT MATERIAL';
  evidence: TranscriptEvidence[];
}

export interface TherapeuticMovementNote {
  id: string;
  earlier?: string;
  now?: string;
  evidence: TranscriptEvidence[];
  /** Do not claim resolution */
  label: 'Evidence of movement — not resolution';
}

/**
 * Reusable reasoning card — observation before theory.
 */
export interface ClinicalReasoningCard {
  id: string;
  observation: string;
  clientLanguage?: string;
  pattern?: string;
  possibleProtectiveFunction?: string;
  meaning?: string;
  primaryLens?: {
    lens: ClinicalLens | LensId;
    interpretation: string;
  };
  alternativeLenses?: Array<{
    lens: LensId;
    interpretation: string;
    label: 'Possible complementary clinical lens';
  }>;
  openQuestion?: string;
  evidence: TranscriptEvidence[];
  provenanceNotes?: Array<{ text: string; provenance: StatementProvenance }>;
}

/**
 * Future-ready therapist preference layer — never silent learning.
 * Only populated from explicitly approved preferences or development fixtures.
 */
export interface TherapistReasoningProfile {
  id: string;
  therapistId: string;
  enabled: boolean;
  preferredSequence?: ReasoningStageId[];
  preferredQuestionTypes?: string[];
  preferredFormulationStyle?: string[];
  preferredClinicalLenses?: string[];
  preferredLanguagePatterns?: string[];
  /** Explicit source session ids if ever enabled */
  sourceSessionIds?: string[];
  updatedAt?: string;
  /** Therapist may reset / export / delete — profile is editable */
  version: number;
}

export function emptyTherapistReasoningProfile(
  therapistId: string,
): TherapistReasoningProfile {
  return {
    id: `trp_${therapistId}`,
    therapistId,
    enabled: false,
    preferredSequence: [...DEFAULT_REASONING_SEQUENCE],
    preferredQuestionTypes: [],
    preferredFormulationStyle: [],
    preferredClinicalLenses: [],
    preferredLanguagePatterns: [],
    sourceSessionIds: [],
    version: 1,
  };
}

/** Core process layer that sits above modality lenses. */
export interface CoreProcessFormulation {
  observations: ClinicalObservation[];
  regulationOrientation: RegulationOrientationNote[];
  patterns: ClinicalPatternProcess[];
  protectiveFunctions: ProtectiveFunctionHypothesis[];
  clinicalTensions: ClinicalTension[];
  cognitionVsEmbodiment: CognitionVsEmbodimentNote[];
  dissociationNotes: DissociationNote[];
  riskFlags: RiskLanguageFlag[];
  contractMaterial: ContractMaterial[];
  therapeuticMovement: TherapeuticMovementNote[];
  reasoningCards: ClinicalReasoningCard[];
  relationalProcessHypotheses?: Array<{
    id: string;
    label: 'Working relational process hypothesis';
    summary: string;
    sequence?: string[];
    evidence: TranscriptEvidence[];
  }>;
  updatedAt?: string;
}

export function emptyCoreProcessFormulation(): CoreProcessFormulation {
  return {
    observations: [],
    regulationOrientation: [],
    patterns: [],
    protectiveFunctions: [],
    clinicalTensions: [],
    cognitionVsEmbodiment: [],
    dissociationNotes: [],
    riskFlags: [],
    contractMaterial: [],
    therapeuticMovement: [],
    reasoningCards: [],
    relationalProcessHypotheses: [],
  };
}

export type { EvidenceReference };
