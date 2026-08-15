/**
 * Semantic corroboration — narrative evidence when form selections are unknown.
 * Stage separation: form nulls stay null; clinical evidence can still be high-confidence.
 */

import { describe, expect, it } from 'vitest';
import {
  extractedToStructuredIntake,
  validateAndSanitizeExtractedIntake,
} from '../src/clinical-intelligence/lib/intakeExtraction';
import { analyseConfirmedIntake } from '../src/clinical-intelligence/lib/intakeAnalysisPipeline';
import {
  buildSemanticClinicalEvidence,
  formatDisplayList,
  formatGoalsAsBullets,
  prioritiseExtractionWarnings,
} from '../src/clinical-intelligence/lib/intakeSemanticEvidence';
import { assertNoEmdrConstructs, approvedFindingsToCore } from '../src/clinical-intelligence/lib/intakeReasoning';
import { buildFirstSessionPreparation } from '../src/clinical-intelligence/lib/firstSessionPrep';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import { expectedSyntheticNoisyExtraction } from './fixtures/intake-synthetic/noisyPaste';

describe('Intake semantic corroboration v1.2', () => {
  it('keeps anxiety form selection null while narrative establishes clinical evidence', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    expect(extracted.lifestyleAndSymptoms.anxietyPanicPhobias).toBeNull();

    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    expect(answerMap.anxietyPanicPhobias).toBeUndefined();

    const semantic = buildSemanticClinicalEvidence({ answers: answerMap, structured, extracted });
    const anxiety = semantic.evidence.find((e) => e.concept === 'anxiety');
    expect(anxiety).toBeTruthy();
    expect(anxiety!.evidenceLevel).toBe('explicitly-reported');
    expect(anxiety!.confidence).toBe('high');
    expect(anxiety!.formSelectionStatus).toBe('unknown');
    expect(anxiety!.statement).toMatch(/Anxiety explicitly reported/i);

    // Corroboration from multiple fields — not duplicated findings after merge
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const anxietyFindings = analysis.findings.filter((f) => /anxiety explicitly reported/i.test(f.text));
    expect(anxietyFindings.length).toBe(1);
    expect(anxietyFindings[0]!.provenanceStatus).toBe('corroborated');
    expect(anxietyFindings[0]!.evidence.length).toBeGreaterThanOrEqual(2);
  });

  it('establishes sleep disturbance from narrative without inventing a sleep score', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    expect(extracted.lifestyleAndSymptoms.sleepProblems).toBeNull();
    expect(extracted.lifestyleAndSymptoms.sleepRating).toBeNull();
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const sleep = analysis.clinicalEvidence.find((e) => e.concept === 'sleep-disturbance');
    expect(sleep?.statement).toMatch(/sleep disturbance explicitly reported/i);
    expect(analysis.findings.some((f) => /sleep rating:\s*\d/i.test(f.text))).toBe(false);
  });

  it('establishes previous therapy from VA narrative while form checkbox stays unknown', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    expect(extracted.psychologicalHistory.previousTherapy).toBeNull();
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const prev = analysis.clinicalEvidence.find((e) => e.concept === 'previous-therapy');
    expect(prev?.statement).toMatch(/Previous therapy explicitly established/i);
    expect(prev?.formSelectionStatus).toBe('unknown');
  });

  it('flags hopelessness for clinical review without inventing risk severity', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    expect(analysis.clinicalReviewRequired).toBe(true);
    const risk = analysis.findings.filter((f) => f.category === 'risk-clinical-review');
    expect(risk.length).toBeGreaterThan(0);
    const blob = risk.map((f) => f.text).join(' ');
    expect(blob).toMatch(/CLINICAL REVIEW REQUIRED/i);
    expect(blob).toMatch(/Not established/i);
    expect(blob).not.toMatch(/\b(low|moderate|high)\s+risk\b|\bimminent\b/i);
  });

  it('keeps ambiguous femur/abuse detail ambiguous with outstanding question', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    expect(analysis.findings.some((f) => /broke .+ femur|Father broke/i.test(f.text))).toBe(false);
    expect(
      analysis.findings.some((f) => /Clarify the childhood femur/i.test(f.text)),
    ).toBe(true);
  });

  it('does not invent family relationship for family mental-health history', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const fam = analysis.findings.find((f) => /family mental-health history/i.test(f.text));
    expect(fam?.text).toMatch(/Biopolar|Bipolar/i);
    expect(fam?.text).toMatch(/Relationship to client: not established/i);
    expect(fam?.text).not.toMatch(/mother|father|sibling|parent has/i);
  });

  it('surfaces contradiction when form says No but narrative reports severe anxiety', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    extracted.lifestyleAndSymptoms.anxietyPanicPhobias = false;
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    answerMap.anxietyPanicPhobias = 'No';
    const semantic = buildSemanticClinicalEvidence({ answers: answerMap, structured, extracted });
    expect(semantic.contradictions.some((c) => /source inconsistency/i.test(c.statement))).toBe(true);
  });

  it('deduplicates and prioritises extraction warnings', () => {
    const extracted = expectedSyntheticNoisyExtraction();
    const groups = prioritiseExtractionWarnings(extracted.extractionWarnings);
    const truncKeys = groups.important.filter((w) => w.code === 'truncated');
    expect(truncKeys.length).toBe(1);
    expect(groups.formUnrecoverable.length).toBeGreaterThan(0);
  });

  it('formats goals and exercise lists for display without altering raw', () => {
    const extracted = expectedSyntheticNoisyExtraction();
    expect(formatGoalsAsBullets(extracted.goals.therapyGoals).length).toBeGreaterThanOrEqual(3);
    expect(formatDisplayList(extracted.lifestyleAndSymptoms.exerciseTypes)).toContain(' · ');
    expect(formatDisplayList(extracted.identityAndSelfDescription.fiveWords)).toMatch(/Loyal · Strong/);
  });

  it('core remains modality-neutral — no TA/EMDR leakage after corroboration', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    expect(assertNoEmdrConstructs(analysis.findings)).toEqual([]);
    const blob = analysis.findings.map((f) => f.text).join(' ');
    expect(blob).not.toMatch(/Adapted Child|Critical Parent|injunction|Be Perfect|EMDR target|touchstone/i);
    expect(analysis.findings.some((f) => f.category === 'working-hypothesis')).toBe(true);
  });

  it('first session prep surfaces approved corroboration usefully', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    const approved = analysis.findings.map((f) => ({ ...f, reviewStatus: 'approved' as const }));
    const client = emptyClientRecord('c_sem', 't_1', 'Alex Morgan', new Date().toISOString());
    client.intakeCoreFindings = approved;
    client.coreFormulation = approvedFindingsToCore(approved);
    client.primaryTreatmentApproach = 'transactional-analysis';
    const prep = buildFirstSessionPreparation(client, approved);
    expect(prep.whySeekingTherapy).not.toBe('Not established from approved intake.');
    expect(prep.relevantCurrentSymptoms).toMatch(/anxiety|sleep|grief|hopeless/i);
    expect(prep.patternsClientIdentifies).toMatch(/defensive|withdraw|help|fixing|alone/i);
    expect(prep.riskItemsToClarify).toMatch(/CLINICAL REVIEW|Not established/i);
    expect(prep.modalityNote).toMatch(/core-first/i);
    expect(prep.modalityNote).toMatch(/deferred|lens/i);
    expect(prep.whySeekingTherapy + prep.patternsClientIdentifies).not.toMatch(
      /\bAdapted Child\b|\bCritical Parent\b|\bBe Perfect\b|\binjunction\b/i,
    );
  });

  it('relationship crisis and food/appetite stress are clinically evidenced', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const analysis = analyseConfirmedIntake({ answers: answerMap, structured, extracted });
    expect(analysis.clinicalEvidence.some((e) => e.concept === 'relationship-crisis')).toBe(true);
    expect(analysis.clinicalEvidence.some((e) => e.concept === 'food-appetite-stress')).toBe(true);
    expect(
      analysis.clinicalEvidence.find((e) => e.concept === 'food-appetite-stress')?.statement,
    ).not.toMatch(/eating disorder/i);
  });
});
