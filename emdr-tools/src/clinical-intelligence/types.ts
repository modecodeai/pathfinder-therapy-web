/**
 * Shared Clinical Intelligence types (browser + worker).
 * Keep free of Node/Worker-only imports.
 */

export type EvidenceLevel = 'explicit' | 'inferred' | 'suggested' | 'unknown';
export type ConfidenceLevel = 'high' | 'moderate' | 'low';
export type ReviewStatus = 'pending' | 'approved' | 'edited' | 'rejected';
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
  summary: ClinicalSuggestion<string>;
  presentingProblems: ClinicalSuggestion<string>[];
  symptoms: ClinicalSuggestion<string>[];
  recentExamples: ClinicalSuggestion<string>[];
  triggers: TriggerSuggestion[];
  memories: MemorySuggestion[];
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

export const PROMPT_VERSION = 'ci-v0.1-phase1-history';
export const SCHEMA_VERSION = 'ci-transcript-analysis-v1';

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
  structuredResult: TranscriptAnalysis;
  reviewStatus: 'pending' | 'partially-reviewed' | 'reviewed';
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
  presentingProblem?: string;
  presentingProblems: string[];
  triggers: ClientTrigger[];
  memories: ClientMemory[];
  themes: ClientTheme[];
  activeTarget?: {
    headline: string;
    nc?: string;
    pc?: string;
  };
  approvedNc?: string;
  approvedPc?: string;
  resources: ClientResource[];
  targetCandidates: ClientTargetCandidate[];
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
  activeTarget?: { headline: string; nc?: string; pc?: string };
  approvedNc?: string;
  approvedPc?: string;
  lastSessionSummary?: string;
}

export interface AnalyseTranscriptRequest {
  clientId: string;
  sessionId?: string;
  protocol: 'standard-emdr';
  phase: 'history';
  transcript: string;
  sessionDate?: string;
}

export interface ApplyFindingsRequest {
  clientId: string;
  analysisId: string;
  structuredResult: TranscriptAnalysis;
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
