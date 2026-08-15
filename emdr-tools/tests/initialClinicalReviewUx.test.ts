/**
 * Initial Clinical Review UX — person-first briefing, not form inspection.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildInitialClinicalBrief,
  buildInitialClinicalReviewModel,
  findingsEligibleForApproveAllConfirmed,
} from '../src/clinical-intelligence/lib/initialClinicalBrief';
import {
  extractedToStructuredIntake,
  validateAndSanitizeExtractedIntake,
} from '../src/clinical-intelligence/lib/intakeExtraction';
import { analyseConfirmedIntake } from '../src/clinical-intelligence/lib/intakeAnalysisPipeline';
import { expectedSyntheticNoisyExtraction } from './fixtures/intake-synthetic/noisyPaste';
import { assertNoEmdrConstructs } from '../src/clinical-intelligence/lib/intakeReasoning';

const root = resolve(import.meta.dirname, '..');

describe('Initial Clinical Review UX', () => {
  it('documents INITIAL CLINICAL REVIEW PRINCIPLE', () => {
    const doc = readFileSync(resolve(root, 'docs/CLINICAL_REASONING.md'), 'utf8');
    expect(doc).toContain('INITIAL CLINICAL REVIEW PRINCIPLE');
    expect(doc).toContain('orienting themselves to a person');
  });

  it('builds a modality-neutral brief covering Jason-equivalent signals within ~200 words', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const brief = buildInitialClinicalBrief({
      extracted,
      evidence: analysis.clinicalEvidence,
      findings: analysis.findings,
    });
    expect(brief.toLowerCase()).toMatch(/marital|relationship|divorce/);
    expect(brief.toLowerCase()).toMatch(/anxiety/);
    expect(brief.toLowerCase()).toMatch(/sleep|3/);
    expect(brief.toLowerCase()).toMatch(/hopeless/);
    expect(brief).not.toMatch(/Adapted Child|injunction|EMDR target|negative cognition/i);
    expect(brief.split(/\s+/).length).toBeLessThanOrEqual(210);
  });

  it('organises review around the person — goals, difficulties, patterns, risk, clarifications', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const model = buildInitialClinicalReviewModel({
      extracted,
      evidence: analysis.clinicalEvidence,
      findings: analysis.findings,
      warnings: extracted.extractionWarnings,
    });
    expect(model.goals.length).toBeGreaterThanOrEqual(3);
    expect(model.difficulties.some((d) => /anxiety/i.test(d.title))).toBe(true);
    expect(model.difficulties.some((d) => /sleep/i.test(d.title))).toBe(true);
    expect(model.patterns.length).toBeGreaterThanOrEqual(3);
    expect(model.riskPanel?.required).toBe(true);
    expect(model.riskPanel?.items.every((i) => i.status === 'Not established')).toBe(true);
    expect(model.ambiguities.some((a) => /ambiguity/i.test(a.title))).toBe(true);
    expect(model.ambiguities[0]?.body).not.toMatch(/Father broke .+ femur/i);
    expect(model.lifeContext.some((c) => /family mental-health/i.test(c.title))).toBe(true);
    expect(model.lifeContext.find((c) => /family/i.test(c.title))?.body).toMatch(
      /Relationship to client: Not established/,
    );
    expect(model.clientDetails.some((d) => d.label === 'Full name')).toBe(true);
    expect(model.warningGroups.important.filter((w) => w.code === 'truncated').length).toBeLessThanOrEqual(1);
  });

  it('Approve All Confirmed excludes hypotheses, risk, and ambiguous items', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const ids = new Set(findingsEligibleForApproveAllConfirmed(analysis.findings));
    for (const f of analysis.findings) {
      if (f.category === 'working-hypothesis') expect(ids.has(f.id)).toBe(false);
      if (f.category === 'risk-clinical-review') expect(ids.has(f.id)).toBe(false);
      if (f.category === 'outstanding-question' && /femur|source inconsistency/i.test(f.text)) {
        expect(ids.has(f.id)).toBe(false);
      }
    }
    expect(ids.size).toBeGreaterThan(0);
  });

  it('UI uses Initial Clinical Review naming and avoids form-led extraction chrome', () => {
    const view = readFileSync(
      resolve(root, 'src/clinical-intelligence/IntakeClinicalView.tsx'),
      'utf8',
    );
    const icr = readFileSync(
      resolve(root, 'src/clinical-intelligence/components/InitialClinicalReview.tsx'),
      'utf8',
    );
    expect(view).toContain('Initial Clinical Review');
    expect(icr).toContain('Initial clinical brief');
    expect(icr).toContain('Approve all confirmed');
    expect(icr).toContain('Clinical review required');
    expect(icr).toContain('Patterns the client identifies');
    expect(icr).toContain('View original submission');
    expect(icr).not.toContain('Extraction payload');
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    expect(assertNoEmdrConstructs(analysis.findings)).toEqual([]);
  });
});
