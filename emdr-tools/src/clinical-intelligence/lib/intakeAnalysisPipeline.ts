/**
 * Confirmed extraction → semantic corroboration → core clinical reasoning.
 * Keeps document extraction and clinical understanding distinct.
 */

import type { ExtractedIntake } from './intakeExtraction';
import type { IntakeAnswerMap, StructuredIntake } from './pathfinderIntakeForm';
import {
  analyseIntakeCoreOnly,
  assertNoEmdrConstructs,
  type IntakeCoreAnalysisResult,
} from './intakeReasoning';
import {
  buildSemanticClinicalEvidence,
  mergeSemanticIntoCoreFindings,
  type ClinicalEvidence,
} from './intakeSemanticEvidence';

export interface ConfirmedIntakeAnalysis extends IntakeCoreAnalysisResult {
  clinicalEvidence: ClinicalEvidence[];
}

/**
 * Run after therapist confirms extraction.
 * Does not mutate unknown form selections (null stays null).
 */
export function analyseConfirmedIntake(args: {
  answers: IntakeAnswerMap;
  structured: StructuredIntake;
  extracted?: ExtractedIntake | null;
  rawSubmissionId?: string;
}): ConfirmedIntakeAnalysis {
  const core = analyseIntakeCoreOnly({
    answers: args.answers,
    structured: args.structured,
    rawSubmissionId: args.rawSubmissionId,
  });
  const semantic = buildSemanticClinicalEvidence({
    answers: args.answers,
    structured: args.structured,
    extracted: args.extracted,
    rawSubmissionId: args.rawSubmissionId,
  });
  const findings = mergeSemanticIntoCoreFindings(core.findings, semantic);

  for (const f of findings) {
    if (
      f.category === 'psychological-history' &&
      /biopolar|bipolar|severe depression/i.test(f.text) &&
      !/Relationship to client/i.test(f.text)
    ) {
      const raw = f.clientStatement ?? f.text;
      f.text = `Reported family mental-health history: ${raw.trim()}. Relationship to client: not established.`;
    }
  }

  const hasTrauma = findings.some(
    (f) => f.category === 'trauma-adversity' && f.framing !== 'not-established',
  );
  const filtered = hasTrauma
    ? findings.filter(
        (f) => !(f.category === 'not-established' && /trauma|adversity/i.test(f.text)),
      )
    : findings;

  const leaks = assertNoEmdrConstructs(filtered);

  return {
    ...core,
    findings: filtered,
    clinicalReviewRequired: core.clinicalReviewRequired || semantic.clinicalReviewRequired,
    clinicalEvidence: [...semantic.evidence, ...semantic.contradictions],
    emdrLeakageDetected: core.emdrLeakageDetected || leaks.length > 0,
    forbiddenTermsFound: [...core.forbiddenTermsFound, ...leaks],
  };
}
