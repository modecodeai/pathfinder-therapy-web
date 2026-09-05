/**
 * Initial Clinical Review UX — person-first briefing, not form inspection.
 * Final cleanup v1.1: operate by exception; no duplicate clarifications.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildInitialClinicalBrief,
  buildInitialClinicalReviewModel,
  dedupeClarifications,
  displayNormalise,
  findingsEligibleForApproveAllConfirmed,
  reviewStatsWithEligible,
  type ClinicalReviewItem,
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
    const motivationHits = brief.toLowerCase().match(/motivation for change/g) ?? [];
    expect(motivationHits.length).toBeLessThanOrEqual(1);
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

  it('deduplicates near-duplicate clarification questions', () => {
    const items: ClinicalReviewItem[] = [
      {
        id: 'a',
        title: 'Clarify the childhood femur incident and father’s role/context',
        body: '',
        confidence: 'Needs review',
        kind: 'clarification',
      },
      {
        id: 'b',
        title: 'Clarify the childhood femur / leg injury and the father’s role/context',
        body: '',
        confidence: 'Needs review',
        kind: 'clarification',
      },
      {
        id: 'c',
        title: 'Clarify current safety / risk status',
        body: '',
        confidence: 'Needs review',
        kind: 'clarification',
      },
      {
        id: 'd',
        title: 'Clarify current safety/risk status',
        body: '',
        confidence: 'Needs review',
        kind: 'clarification',
      },
    ];
    const deduped = dedupeClarifications(items);
    expect(deduped.length).toBe(2);
    expect(deduped.some((c) => /femur/i.test(c.title))).toBe(true);
    expect(deduped.some((c) => /safety/i.test(c.title))).toBe(true);
  });

  it('groups self-described qualities and keeps impact separate from patterns', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const model = buildInitialClinicalReviewModel({
      extracted,
      evidence: analysis.clinicalEvidence,
      findings: analysis.findings,
      warnings: extracted.extractionWarnings,
    });
    expect(model.selfDescribedQualities).toBeTruthy();
    expect(model.selfDescribedQualities!.display).toMatch(/·/);
    expect(model.selfDescribedQualities!.rawWords.length).toBeGreaterThanOrEqual(3);
    expect(model.resources.every((r) => !/^(Loyal|Strong|Kind|Funny)$/i.test(r.title))).toBe(true);
    expect(model.currentCosts.every((c) => c.kind === 'cost')).toBe(true);
    if (model.currentCosts[0]?.sourceExcerpt) {
      expect(model.currentCosts[0].body.length).toBeLessThan(model.currentCosts[0].sourceExcerpt.length);
    }
    const stats = reviewStatsWithEligible(analysis.findings);
    expect(stats.total).toBe(analysis.findings.length);
    expect(stats.confirmedFacts).toBe(findingsEligibleForApproveAllConfirmed(analysis.findings).length);
  });

  it('normalises clinician-facing display without mutating source', () => {
    expect(displayNormalise('Self employeed')).toBe('Self-employed');
    expect(displayNormalise('Biopolar')).toMatch(/Bipolar/i);
    expect(displayNormalise('big heart')).toBe('Big-hearted');
  });

  it('UI uses Initial Clinical Review naming and cleanup v1.1 affordances', () => {
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
    expect(icr).toContain('Review individually');
    expect(icr).toContain('Clinical review required');
    expect(icr).toContain('Client-identified patterns');
    expect(icr).toContain('Preview from pending evidence');
    expect(icr).toContain('Preview only — not yet part of the clinical record');
    expect(icr).toContain('Approved First Session Preparation');
    expect(icr).toContain('First-session readiness');
    expect(icr).toContain('IMPORTANT TO REVIEW');
    expect(icr).toContain('Import / form extraction notes');
    expect(icr).toContain('Mark reviewed');
    expect(icr).toContain('Add to first-session questions');
    expect(icr).toContain('Run TA Lens After Core Approval');
    expect(icr).toContain('Approve & prepare first session');
    expect(icr).toContain('Self-described qualities');
    expect(icr).toContain('View original submission');
    expect(icr).not.toContain('Extraction payload');
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    expect(assertNoEmdrConstructs(analysis.findings)).toEqual([]);
  });
});
