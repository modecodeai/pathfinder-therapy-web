/**
 * Stage A: Intake Extraction tests (document extraction — not clinical reasoning).
 * Stage B remains in intakeClinicalInformation.test.ts.
 */

import { describe, expect, it } from 'vitest';
import {
  INTAKE_READER_VERSION,
  displayExtractedValue,
  extractedIntakeToAnswerMap,
  extractedToStructuredIntake,
  hasCriticalExtractionErrors,
  isRejectedLabelValue,
  looksTruncated,
  validateAndSanitizeExtractedIntake,
} from '../src/clinical-intelligence/lib/intakeExtraction';
import {
  BROKEN_LABEL_EXTRACTION,
  SYNTHETIC_NOISY_INTAKE_PASTE,
  expectedSyntheticNoisyExtraction,
} from './fixtures/intake-synthetic/noisyPaste';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

describe('Intake Reader — Stage A document extraction', () => {
  it('rejects label/placeholder values that must never become client data', () => {
    expect(isRejectedLabelValue('*')).toBe(true);
    expect(isRejectedLabelValue('Address')).toBe(true);
    expect(isRejectedLabelValue('Number*')).toBe(true);
    expect(isRejectedLabelValue('Full Name*')).toBe(true);
    expect(isRejectedLabelValue('(He/Him, She/Her, They/Them)')).toBe(true);
    expect(isRejectedLabelValue('Alex Morgan')).toBe(false);
    expect(isRejectedLabelValue('alex.morgan.synthetic@example.test')).toBe(false);
  });

  it('sanitizes broken label extraction to null + warnings', () => {
    const cleaned = validateAndSanitizeExtractedIntake(BROKEN_LABEL_EXTRACTION);
    expect(cleaned.personalInformation.fullName).toBeNull();
    expect(cleaned.personalInformation.email).toBeNull();
    expect(cleaned.personalInformation.telephone).toBeNull();
    expect(cleaned.personalInformation.dateOfBirth).toBeNull();
    expect(cleaned.personalInformation.pronouns).toBeNull();
    expect(cleaned.extractionWarnings.some((w) => w.code === 'label_rejected')).toBe(true);
    expect(hasCriticalExtractionErrors(cleaned.extractionWarnings)).toBe(true);
  });

  it('preserves truncated narrative without inventing the ending', () => {
    const extracted = expectedSyntheticNoisyExtraction();
    const cleaned = validateAndSanitizeExtractedIntake(extracted);
    expect(cleaned.presentingProblem.summary).toMatch(/healthier, e$/);
    expect(looksTruncated(cleaned.presentingProblem.summary)).toBe(true);
    expect(cleaned.extractionWarnings.some((w) => w.code === 'truncated')).toBe(true);
  });

  it('maps expected noisy extraction to correct structured fields (no labels as values)', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);

    expect(answerMap.fullName).toBe('Alex Morgan');
    expect(answerMap.preferredName).toBe('Alex');
    expect(answerMap.dateOfBirth).toBe('03/14/1985');
    expect(answerMap.currentAge).toBe('40');
    expect(answerMap.email).toBe('alex.morgan.synthetic@example.test');
    expect(answerMap.gpPractice).toBe('N/A');
    expect(answerMap.referralSource).toBe('FRIEND');
    expect(answerMap.mainProblems).toMatch(/Marriage of 12 years/);
    expect(answerMap.currentSeverity).toBeUndefined();
    expect(answerMap.therapyGoals).toMatch(/emotional regulation/);
    expect(answerMap.diagnosedHealthConditions).toBe('None');
    expect(answerMap.medication).toBe('None');
    expect(answerMap.chronicPain).toBeUndefined();
    expect(answerMap.sleepProblems).toBeUndefined();
    expect(answerMap.exercise).toMatch(/2-3/);
    expect(answerMap.exercise).toMatch(/Running/);
    expect(answerMap.household).toMatch(/10 year old/);
    expect(answerMap.occupation).toBe('Self-employed');
    expect(answerMap.fiveWordsDescribingSelf).toMatch(/Tenacious/);
    expect(answerMap.mostImportantThingInLife).toBe('My family and dogs.');

    expect(structured.personalInformation.fullName).toBe('Alex Morgan');
    expect(structured.personalInformation.email).not.toBe('Address');
    expect(structured.personalInformation.fullName).not.toBe('*');
  });

  it('keeps ambiguous Yes/No and rating scales as null in extraction model', () => {
    const extracted = expectedSyntheticNoisyExtraction();
    expect(extracted.lifestyleAndSymptoms.sleepProblems).toBeNull();
    expect(extracted.medicalHistory.chronicPain).toBeNull();
    expect(extracted.presentingProblem.severity).toBeNull();
    expect(extracted.lifestyleAndSymptoms.sleepRating).toBeNull();
  });

  it('displays Not established for null extraction fields', () => {
    expect(displayExtractedValue(null)).toBe('Not established');
    expect(displayExtractedValue('Alex')).toBe('Alex');
    expect(displayExtractedValue(true)).toBe('Yes');
  });

  it('fixture paste contains form chrome that regex parsers mishandle', () => {
    expect(SYNTHETIC_NOISY_INTAKE_PASTE).toContain('Full Name*');
    expect(SYNTHETIC_NOISY_INTAKE_PASTE).toContain('Save & Exit');
    expect(SYNTHETIC_NOISY_INTAKE_PASTE).toMatch(/Sleep problems[\s\S]*No[\s\S]*Yes/);
    // Must not contain real Jason identifiers
    expect(SYNTHETIC_NOISY_INTAKE_PASTE).not.toMatch(/Jason|DeLozier|leonidasdelozier/i);
  });

  it('extractor version is intake-reader-v2', () => {
    expect(INTAKE_READER_VERSION).toBe('intake-reader-v2');
  });

  it('answer map from extraction does not treat UI labels as values', () => {
    const map = extractedIntakeToAnswerMap(
      validateAndSanitizeExtractedIntake(BROKEN_LABEL_EXTRACTION),
    );
    expect(map.fullName).toBeUndefined();
    expect(map.email).toBeUndefined();
  });

  it('UI separates extraction review from clinical JSON dump', () => {
    const view = readFileSync(resolve(root, 'src/clinical-intelligence/IntakeClinicalView.tsx'), 'utf8');
    const icr = readFileSync(
      resolve(root, 'src/clinical-intelligence/components/InitialClinicalReview.tsx'),
      'utf8',
    );
    expect(view).toContain('Initial Clinical Review');
    expect(icr).toContain('Confirm initial information & analyse');
    expect(icr).toContain('View original submission');
    expect(view).toContain('Re-extract Intake');
    expect(view).not.toContain('parsePastedIntakeToAnswers');
    expect(view).toContain('extractIntakeFromPaste');
  });

  it('worker Intake Reader is document-extraction only', () => {
    const reader = readFileSync(resolve(root, 'worker/clinical-ai/intakeReader.ts'), 'utf8');
    expect(reader).toContain('document extraction, not clinical interpretation');
    expect(reader).toContain('Never diagnose');
    expect(reader).not.toMatch(/EMDR target|ego state|injunction/i);
  });
});
