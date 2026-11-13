/** Structured guided-practice script model (clinician-only; not sent to client display). */

export interface SourceReference {
  author?: string;
  organisation?: string;
  title: string;
  edition?: string;
  date?: string;
  page?: string;
}

export type GuidedStepType =
  | 'say'
  | 'clinician-note'
  | 'bls-action'
  | 'decision'
  | 'capture'
  | 'warning';

export interface GuidedScriptStep {
  id: string;
  protocol: string;
  phase: string;
  section: string;
  type: GuidedStepType;
  text: string;
  fieldKey?: string;
  blsPreset?: string;
  next?: string[];
  source?: SourceReference;
}

export type ScriptSize = 'small' | 'medium' | 'large' | 'xl';

export const SCRIPT_SIZE_PX: Record<ScriptSize, number> = {
  small: 16,
  medium: 18,
  large: 21,
  xl: 24,
};

export interface SessionHeaderModel {
  protocol: string;
  phase: string;
  target?: string;
  sud?: number | null;
  voc?: number | null;
  blsSummary?: string;
  setCount?: number;
  elapsedLabel?: string;
  extra?: Array<{ label: string; value: string }>;
}

export interface ProcessingTimelineEntry {
  id: string;
  at: string;
  setNumber?: number;
  modality?: string;
  mode?: string;
  durationSec?: number;
  note: string;
}

export interface TargetSummary {
  label?: string;
  age?: string;
  image?: string;
  nc?: string;
  pc?: string;
  voc?: number | null;
  sud?: number | null;
  body?: string;
  emotion?: string;
}

export type ConsoleViewMode = 'standard' | 'reading' | 'processing';
