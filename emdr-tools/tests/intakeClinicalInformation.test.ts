import { describe, expect, it } from 'vitest';
import {
  PATHFINDER_INTAKE_FORM_VERSION,
  answersToStructuredIntake,
  parsePastedIntakeToAnswers,
} from '../src/clinical-intelligence/lib/pathfinderIntakeForm';
import {
  analyseIntakeCoreOnly,
  approvedFindingsToCore,
  assertNoEmdrConstructs,
  mergeIntakeFindingsCorroborate,
} from '../src/clinical-intelligence/lib/intakeReasoning';
import { buildFirstSessionPreparation } from '../src/clinical-intelligence/lib/firstSessionPrep';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SYNTHETIC_INTAKE_BASE,
  SYNTHETIC_INTAKE_PASTE_TEXT,
  SYNTHETIC_INTAKE_WITH_PAIN,
  SYNTHETIC_INTAKE_WITH_RISK,
  SYNTHETIC_INTAKE_WITH_TRAUMA,
} from './fixtures/intake-synthetic/answers';
import { expectedSyntheticNoisyExtraction } from './fixtures/intake-synthetic/noisyPaste';
import {
  extractedToStructuredIntake,
  validateAndSanitizeExtractedIntake,
} from '../src/clinical-intelligence/lib/intakeExtraction';
import { analyseConfirmedIntake } from '../src/clinical-intelligence/lib/intakeAnalysisPipeline';

const root = resolve(import.meta.dirname, '..');

describe('Pathfinder intake clinical information', () => {
  it('documents PATHFINDER INITIAL CLINICAL INFORMATION PRINCIPLE', () => {
    const doc = readFileSync(resolve(root, 'docs/CLINICAL_REASONING.md'), 'utf8');
    expect(doc).toContain('PATHFINDER INITIAL CLINICAL INFORMATION PRINCIPLE');
  });

  it('preserves form versioning and structured sections from the existing form', () => {
    const structured = answersToStructuredIntake(SYNTHETIC_INTAKE_BASE);
    expect(structured.formVersion).toBe(PATHFINDER_INTAKE_FORM_VERSION);
    expect(structured.personalInformation.fullName).toBe('Synthetic Client');
    expect(structured.presentingProblem.therapyGoals).toContain('calmer');
    expect(structured.goals.clientStatedGoals).toBe(SYNTHETIC_INTAKE_BASE.therapyGoals);
  });

  it('acceptance — intake only: core formulation, no TA/EMDR constructs', () => {
    const structured = answersToStructuredIntake(SYNTHETIC_INTAKE_BASE);
    const result = analyseIntakeCoreOnly({
      answers: SYNTHETIC_INTAKE_BASE,
      structured,
      rawSubmissionId: 'raw_test',
    });
    expect(result.findings.some((f) => f.category === 'presenting-problem')).toBe(true);
    expect(result.findings.some((f) => f.category === 'symptom')).toBe(true);
    expect(result.findings.some((f) => f.category === 'therapeutic-goal')).toBe(true);
    expect(result.findings.some((f) => /supportive partner/i.test(f.text))).toBe(true);
    expect(assertNoEmdrConstructs(result.findings)).toEqual([]);
    const blob = result.findings.map((f) => f.text).join(' ');
    expect(blob).not.toMatch(/ego state|injunction|Be Perfect|touchstone|EMDR target/i);

    const approved = result.findings.map((f) => ({ ...f, reviewStatus: 'approved' as const }));
    const core = approvedFindingsToCore(approved);
    expect(core.presentingProblems.length).toBeGreaterThan(0);
    expect(core.goals[0]?.text).toBe(SYNTHETIC_INTAKE_BASE.therapyGoals);
  });

  it('acceptance — trauma creates significant history, not EMDR target', () => {
    const structured = answersToStructuredIntake(SYNTHETIC_INTAKE_WITH_TRAUMA);
    const result = analyseIntakeCoreOnly({
      answers: SYNTHETIC_INTAKE_WITH_TRAUMA,
      structured,
    });
    expect(result.findings.some((f) => f.category === 'trauma-adversity')).toBe(true);
    expect(assertNoEmdrConstructs(result.findings)).toEqual([]);
    const blob = result.findings.map((f) => `${f.category}:${f.text}`).join('\n');
    expect(blob).not.toMatch(/EMDR target|negative cognition|positive cognition|\bSUD\b|\bVoC\b|touchstone/i);
  });

  it('acceptance — chronic pain is clinical consideration only', () => {
    const structured = answersToStructuredIntake(SYNTHETIC_INTAKE_WITH_PAIN);
    const result = analyseIntakeCoreOnly({
      answers: SYNTHETIC_INTAKE_WITH_PAIN,
      structured,
    });
    expect(result.explorePainSomaticLens).toBe(true);
    expect(result.findings.some((f) => /Chronic pain reported/i.test(f.text))).toBe(true);
    expect(result.findings.some((f) => /activate.*pain protocol/i.test(f.text))).toBe(false);
  });

  it('acceptance — risk flags clinical review without invented severity', () => {
    const structured = answersToStructuredIntake(SYNTHETIC_INTAKE_WITH_RISK);
    const result = analyseIntakeCoreOnly({
      answers: SYNTHETIC_INTAKE_WITH_RISK,
      structured,
    });
    expect(result.clinicalReviewRequired).toBe(true);
    const risk = result.findings.find((f) => f.category === 'risk-clinical-review');
    expect(risk?.text).toMatch(/clinical review required/i);
    expect(risk?.text).toMatch(/not established/i);
    expect(risk?.text).not.toMatch(/severity score|high risk|imminent/i);
  });

  it('acceptance — later transcript corroborates without duplicate', () => {
    const structured = answersToStructuredIntake(SYNTHETIC_INTAKE_BASE);
    const intake = analyseIntakeCoreOnly({
      answers: SYNTHETIC_INTAKE_BASE,
      structured,
      rawSubmissionId: 'raw_intake',
    });
    const support = intake.findings.filter((f) => /supportive partner/i.test(f.text));
    expect(support.length).toBeGreaterThanOrEqual(1);
    const fromTranscript = support.map((f) => ({
      ...f,
      id: `${f.id}_tx`,
      evidence: [
        {
          sourceType: 'transcript' as const,
          sectionId: f.evidence[0]!.sectionId,
          sectionLabel: f.evidence[0]!.sectionLabel,
          questionId: 'transcript',
          questionLabel: 'Session 1',
          clientResponse: 'My partner has been incredibly supportive.',
        },
      ],
    }));
    const merged = mergeIntakeFindingsCorroborate(intake.findings, fromTranscript);
    const partners = merged.filter((f) => /supportive partner/i.test(f.text + (f.clientStatement ?? '')));
    expect(partners.some((p) => p.provenanceStatus === 'corroborated')).toBe(true);
  });

  it('paste legacy intake structures known labels only (deprecated parser — not primary)', () => {
    const answers = parsePastedIntakeToAnswers(SYNTHETIC_INTAKE_PASTE_TEXT);
    expect(answers.fullName).toBe('Synthetic Client');
    expect(answers.mainProblems).toMatch(/Anxiety/);
    expect(answers.therapyGoals).toMatch(/calmer/);
  });

  it('first session preparation uses approved intake only and stays brief', () => {
    const structured = answersToStructuredIntake(SYNTHETIC_INTAKE_BASE);
    const result = analyseIntakeCoreOnly({ answers: SYNTHETIC_INTAKE_BASE, structured });
    const approved = result.findings.map((f) => ({ ...f, reviewStatus: 'approved' as const }));
    const client = emptyClientRecord('c_syn', 't_1', 'Synthetic Client', new Date().toISOString());
    client.intakeCoreFindings = approved;
    client.coreFormulation = approvedFindingsToCore(approved);
    const prep = buildFirstSessionPreparation(client, approved);
    expect(prep.sourceLabel).toBe('Pre-session information from client intake.');
    expect(prep.clientStatedGoals).toContain('calmer');
    expect(prep.wordCount).toBeLessThan(500);
    expect(prep.modalityNote).toMatch(/modality-neutral|No treatment approach/i);
  });

  it('Stage B — confirmed structured extraction yields useful core clinical findings', () => {
    const extracted = validateAndSanitizeExtractedIntake(expectedSyntheticNoisyExtraction());
    const { structured, answerMap } = extractedToStructuredIntake(extracted);
    const result = analyseConfirmedIntake({
      answers: answerMap,
      structured,
      extracted,
      rawSubmissionId: 'raw_syn',
    });
    expect(result.findings.some((f) => f.category === 'presenting-problem')).toBe(true);
    expect(result.findings.some((f) => f.category === 'therapeutic-goal')).toBe(true);
    expect(result.findings.some((f) => /anxiety explicitly reported/i.test(f.text))).toBe(true);
    expect(result.findings.some((f) => /hopeless|clinical review/i.test(f.text))).toBe(true);
    expect(assertNoEmdrConstructs(result.findings)).toEqual([]);
    const approved = result.findings.map((f) => ({ ...f, reviewStatus: 'approved' as const }));
    const client = emptyClientRecord('c_syn2', 't_1', 'Alex Morgan', new Date().toISOString());
    client.intakeCoreFindings = approved;
    client.coreFormulation = approvedFindingsToCore(approved);
    const prep = buildFirstSessionPreparation(client, approved);
    expect(prep.whySeekingTherapy).not.toBe('Not established from approved intake.');
    expect(prep.clientStatedGoals).not.toBe('Not established from approved intake.');
  });

  it('keeps intake and clinical notes conceptually separate in UI copy', () => {
    const view = readFileSync(
      resolve(root, 'src/clinical-intelligence/IntakeClinicalView.tsx'),
      'utf8',
    );
    expect(view).toContain('separate from clinical session notes');
    expect(view).toContain('View Original Submission');
  });
});
