/**
 * Shared Clinical Intelligence types (browser + worker).
 * Keep free of Node/Worker-only imports.
 */

export type EvidenceLevel = 'explicit' | 'inferred' | 'suggested' | 'unknown';
export type ConfidenceLevel = 'high' | 'moderate' | 'low';
export type ReviewStatus = 'pending' | 'approved' | 'edited' | 'rejected';
export type FindingDelta = 'new' | 'updated' | 'possible-conflict' | 'already-known';
export type ClinicalThemeId =
  | 'responsibility-defectiveness'
  | 'belonging'
  | 'safety-vulnerability'
  | 'power-control';

export const CLINICAL_THEME_LABELS: Record<ClinicalThemeId, string> = {
  'responsibility-defectiveness': 'Responsibility / Defectiveness',
  belonging: 'Belonging',
  'safety-vulnerability': 'Safety / Vulnerability',
  'power-control': 'Power / Control / Choices',
};

export interface TranscriptEvidence {
  excerpt: string;
  speaker?: 'client' | 'therapist' | 'unknown';
  startOffset?: number;
  endOffset?: number;
}

export interface ClinicalSuggestion<T = string> {
  id: string;
  value: T;
  evidenceLevel: EvidenceLevel;
  confidence: ConfidenceLevel;
  evidence: TranscriptEvidence[];
  reviewStatus: ReviewStatus;
  originalAIValue?: T;
  therapistEditedValue?: T;
  /** Present when analysing an incremental transcript segment */
  findingDelta?: FindingDelta;
}

export interface TriggerSuggestion extends ClinicalSuggestion<string> {
  relatedMemories?: string[];
}

export interface MemorySuggestion {
  id: string;
  headline: string;
  approximateAge?: number;
  description?: string;
  evidenceLevel: EvidenceLevel;
  confidence: ConfidenceLevel;
  evidence: TranscriptEvidence[];
  possibleThemes: ClinicalThemeId[];
  possibleTouchstoneCandidate: boolean;
  reviewStatus: ReviewStatus;
  originalAIValue?: string;
  therapistEditedValue?: string;
  findingDelta?: FindingDelta;
}

export interface ClinicalThemeAnalysis {
  id: string;
  theme: ClinicalThemeId;
  confidence: ConfidenceLevel;
  evidenceLevel: EvidenceLevel;
  reasoning: string;
  evidence: TranscriptEvidence[];
  relatedMemories: string[];
  relatedTriggers: string[];
  possibleCognitions: string[];
  reviewStatus: ReviewStatus;
  originalAIValue?: string;
  therapistEditedValue?: string;
  findingDelta?: FindingDelta;
}

export interface CognitionSuggestion extends ClinicalSuggestion<string> {
  kind: 'explicit' | 'suggested';
  polarity: 'negative' | 'positive';
}

export interface TargetSuggestion extends ClinicalSuggestion<string> {
  relatedMemoryId?: string;
  approximateAge?: number;
  possibleThemes?: ClinicalThemeId[];
}

export interface TranscriptAnalysis {
  analysisKind: 'phase1-history';
  summary: ClinicalSuggestion<string>;
  presentingProblems: ClinicalSuggestion<string>[];
  symptoms: ClinicalSuggestion<string>[];
  recentExamples: ClinicalSuggestion<string>[];
  triggers: TriggerSuggestion[];
  memories: MemorySuggestion[];
  associativeLinks: ClinicalSuggestion<string>[];
  themes: ClinicalThemeAnalysis[];
  negativeCognitions: CognitionSuggestion[];
  positiveCognitions: CognitionSuggestion[];
  internalResources: ClinicalSuggestion<string>[];
  externalResources: ClinicalSuggestion<string>[];
  targetCandidates: TargetSuggestion[];
  clinicalConsiderations: ClinicalSuggestion<string>[];
  unansweredQuestions: string[];
  clarificationSuggestions: string[];
}

/** Phase 3 — Assessment. Numeric VoC/SUD only when explicitly stated in transcript. */
export interface Phase3AssessmentAnalysis {
  analysisKind: 'phase3-assessment';
  summary: ClinicalSuggestion<string>;
  target: ClinicalSuggestion<string>;
  worstPart: ClinicalSuggestion<string> | null;
  image: ClinicalSuggestion<string> | null;
  negativeCognition: CognitionSuggestion | null;
  positiveCognition: CognitionSuggestion | null;
  /** Explicit numeric VoC only; null = not established (never invent). */
  voc: ClinicalSuggestion<string> | null;
  vocNumeric: number | null;
  emotion: ClinicalSuggestion<string> | null;
  /** Explicit numeric SUD only; null = not established (never invent). */
  sud: ClinicalSuggestion<string> | null;
  sudNumeric: number | null;
  bodyLocation: ClinicalSuggestion<string> | null;
  unansweredQuestions: string[];
  clarificationSuggestions: string[];
}

export type ProcessingStepCategory =
  | 'image'
  | 'thought'
  | 'emotion'
  | 'body'
  | 'association'
  | 'new-memory'
  | 'adaptive'
  | 'sud'
  | 'feeder'
  | 'blocking-belief'
  | 'intervention'
  | 'other';

export interface ProcessingSequenceStep {
  id: string;
  order: number;
  /** Ordinal / narrative label from transcript order — do not invent clock times */
  sequenceLabel: string;
  timestamp: string | null;
  category: ProcessingStepCategory;
  value: string;
  evidenceLevel: EvidenceLevel;
  confidence: ConfidenceLevel;
  evidence: TranscriptEvidence[];
  reviewStatus: ReviewStatus;
  originalAIValue?: string;
  therapistEditedValue?: string;
  findingDelta?: FindingDelta;
}

export interface Phase4DesensitisationAnalysis {
  analysisKind: 'phase4-desensitisation';
  summary: ClinicalSuggestion<string>;
  /** Ordered processing sequence — preserve transcript order; never invent timestamps */
  sequence: ProcessingSequenceStep[];
  associations: ClinicalSuggestion<string>[];
  newMemories: MemorySuggestion[];
  adaptiveInformation: ClinicalSuggestion<string>[];
  sudChanges: ClinicalSuggestion<string>[];
  feederMemories: ClinicalSuggestion<string>[];
  blockingBeliefs: ClinicalSuggestion<string>[];
  therapistInterventions: ClinicalSuggestion<string>[];
  imageThoughtEmotionBodyChanges: ClinicalSuggestion<string>[];
  /** Always remind that resolution is therapist-judged */
  resolutionStatus: 'not-established' | 'in-progress' | 'incomplete';
  unansweredQuestions: string[];
  clarificationSuggestions: string[];
}

export type AnyStructuredAnalysis =
  | TranscriptAnalysis
  | Phase3AssessmentAnalysis
  | Phase4DesensitisationAnalysis;

export type SupportedAnalysisPhase = 'history' | 'assessment' | 'desensitisation';

export const PROMPT_VERSION = 'ci-v0.3-phase1-3-4';
export const SCHEMA_VERSION = 'ci-transcript-analysis-v3';
export const PHASE3_SCHEMA_VERSION = 'ci-phase3-assessment-v1';
export const PHASE4_SCHEMA_VERSION = 'ci-phase4-desensitisation-v1';

export interface ClinicalAIAnalysisRecord {
  id: string;
  clientId: string;
  sessionId?: string;
  protocol: string;
  phase: string;
  provider: 'openai';
  model: string;
  promptVersion: string;
  schemaVersion: string;
  createdAt: string;
  rawTranscriptId: string;
  /** Immutable OpenAI structured output */
  structuredResult: AnyStructuredAnalysis;
  /** Therapist Approve/Edit/Reject state; null until review begins */
  reviewedResult?: AnyStructuredAnalysis | null;
  reviewStatus: 'pending' | 'partially-reviewed' | 'reviewed';
  parentAnalysisId?: string;
  segmentIndex?: number;
}

/** Draft for Apply to Target Assessment (console + client activeTarget). */
export interface TargetAssessmentDraft {
  label?: string;
  age?: string;
  image?: string;
  nc?: string;
  pc?: string;
  voc?: number | null;
  sud?: number | null;
  emotion?: string;
  body?: string;
  unanswered: string[];
}

export interface AnalyseTranscriptRequest {
  clientId: string;
  sessionId?: string;
  protocol: 'standard-emdr';
  phase: SupportedAnalysisPhase;
  transcript: string;
  sessionDate?: string;
  /** When set, treat as incremental segment relative to this analysis */
  parentAnalysisId?: string;
}

export interface ApplyFindingsRequest {
  clientId: string;
  analysisId: string;
  structuredResult: AnyStructuredAnalysis;
  themeConflicts?: Array<{
    theme: ClinicalThemeId;
    resolution: 'keep-existing' | 'add-additional' | 'replace';
  }>;
  memoryDuplicates?: Array<{
    suggestionId: string;
    existingMemoryId: string;
    resolution: 'merge' | 'keep-separate';
  }>;
}

export interface ApplyToTargetRequest {
  clientId: string;
  analysisId: string;
  reviewedResult: Phase3AssessmentAnalysis;
}

export interface RawTranscriptRecord {
  id: string;
  clientId: string;
  sessionId?: string;
  protocol: string;
  phase: string;
  rawTranscript: string;
  normalisedTranscript?: string;
  createdAt: string;
}

export interface ClientMemory {
  id: string;
  headline: string;
  approximateAge?: number;
  description?: string;
  themes?: ClinicalThemeId[];
  possibleTouchstoneCandidate?: boolean;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface ClientTheme {
  theme: ClinicalThemeId;
  confidence?: ConfidenceLevel;
  notes?: string;
  primary?: boolean;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface ClientTrigger {
  id: string;
  text: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface ClientResource {
  id: string;
  kind: 'internal' | 'external';
  text: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface ClientTargetCandidate {
  id: string;
  headline: string;
  approximateAge?: number;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface ClientProcessingNote {
  id: string;
  order: number;
  sequenceLabel: string;
  category: string;
  value: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export type TemporalProng = 'past' | 'present' | 'future';

export type ThemeEvidenceStrength =
  | 'strong-evidence'
  | 'moderate-evidence'
  | 'limited-evidence'
  | 'not-established';

export const THEME_EVIDENCE_LABELS: Record<ThemeEvidenceStrength, string> = {
  'strong-evidence': 'Strong evidence',
  'moderate-evidence': 'Moderate evidence',
  'limited-evidence': 'Limited evidence',
  'not-established': 'Not established',
};

export interface ClientAdaptiveItem {
  id: string;
  text: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface ClientFutureTemplate {
  id: string;
  text: string;
  desiredResponse?: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export interface ClientCognition {
  id: string;
  polarity: 'negative' | 'positive';
  text: string;
  sourceAnalysisId?: string;
  approvedAt?: string;
}

export type SessionChangeKind = 'new' | 'updated' | 'unchanged' | 'possible-conflict' | 'needs-clarification';

export interface SessionChangeItem {
  id: string;
  kind: SessionChangeKind;
  category: string;
  label: string;
  detail?: string;
}

export interface SessionChangeSummary {
  id: string;
  analysisId: string;
  phase: string;
  createdAt: string;
  items: SessionChangeItem[];
}

export interface AuditProvenance {
  id: string;
  clientId: string;
  analysisId: string;
  fieldPath: string;
  aiSuggestion: unknown;
  evidence: TranscriptEvidence[];
  decision: ReviewStatus;
  therapistEdit?: unknown;
  approvedAt: string;
}

export interface ClientRecord {
  id: string;
  therapistId: string;
  displayName: string;
  preferredName?: string;
  reference?: string;
  status?: 'active' | 'archived';
  currentPhase?: string;
  presentingProblem?: string;
  presentingProblems: string[];
  triggers: ClientTrigger[];
  memories: ClientMemory[];
  themes: ClientTheme[];
  activeTarget?: {
    headline: string;
    image?: string;
    nc?: string;
    pc?: string;
    voc?: number | null;
    sud?: number | null;
    emotion?: string;
    body?: string;
  };
  approvedNc?: string;
  approvedPc?: string;
  cognitions?: ClientCognition[];
  resources: ClientResource[];
  targetCandidates: ClientTargetCandidate[];
  processingNotes?: ClientProcessingNote[];
  adaptiveInformation?: ClientAdaptiveItem[];
  futureTemplates?: ClientFutureTemplate[];
  /** Therapist overrides for PAST | PRESENT | FUTURE organisation (keyed by item id) */
  prongAssignments?: Record<string, TemporalProng>;
  sessionChanges?: SessionChangeSummary[];
  lastSessionSummary?: string;
  createdAt: string;
  updatedAt: string;
}

/** Minimised context sent to the model — never the full DB. */
export interface ApprovedClientContext {
  presentingProblem?: string;
  presentingProblems?: string[];
  triggers?: string[];
  memories?: Array<{ headline: string; approximateAge?: number; description?: string }>;
  themes?: Array<{ theme: ClinicalThemeId; primary?: boolean }>;
  activeTarget?: {
    headline: string;
    image?: string;
    nc?: string;
    pc?: string;
    voc?: number | null;
    sud?: number | null;
    emotion?: string;
    body?: string;
  };
  approvedNc?: string;
  approvedPc?: string;
  lastSessionSummary?: string;
  recentProcessingNotes?: string[];
}
