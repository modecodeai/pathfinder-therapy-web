import type { EMDRPhase } from '../types/emdr';

export type ScriptCategory =
  | 'standard'
  | 'assessment'
  | 'resource'
  | 'reprocessing'
  | 'closure'
  | 'technique'
  | 'decision-support';

export type ScriptSectionType =
  | 'say'
  | 'ask'
  | 'observe'
  | 'instruction'
  | 'caution'
  | 'decision-point';

export type ScriptSourceType = 'source-derived' | 'pathfinder-original';

export type ContentStatus = 'draft' | 'clinical-review' | 'approved' | 'retired';

export interface ScriptSection {
  heading?: string;
  text: string;
  type?: ScriptSectionType;
}

export interface ScriptSourceReference {
  document: string;
  section?: string;
  page?: number;
}

export interface EMDRScript {
  id: string;
  title: string;
  phase: EMDRPhase | 'cross-phase';
  category: ScriptCategory;
  sections: ScriptSection[];
  sourceReference?: ScriptSourceReference;
  sourceType: ScriptSourceType;
  clinicalNote?: string;
  caution?: string;
  tags?: string[];
  /** Set when content needs clinician review before relying on it */
  requiresClinicalReview?: boolean;
  quickPromptIds?: string[];
}

export interface HelpLibraryMeta {
  contentVersion: string;
  reviewedAt?: string;
  reviewedBy?: string;
  sourceVersion: string;
  status: ContentStatus;
}

export const HELP_LIBRARY_META: HelpLibraryMeta = {
  contentVersion: '1.0.0',
  sourceVersion: 'Part 1 Basic Training Manual / Worksheets 03-2026 (reference framework)',
  status: 'clinical-review',
  reviewedAt: '2026-08-14',
  reviewedBy: 'Pathfinder content draft — pending clinical sign-off',
};

export const SECTION_LABELS: Record<ScriptSectionType, string> = {
  say: 'SAY',
  ask: 'ASK',
  observe: 'NOTICE',
  instruction: 'INSTRUCTION',
  caution: 'CAUTION',
  'decision-point': 'DECISION POINT',
};
