import { PROMPT_VERSION } from '../../src/clinical-intelligence/types';
import { CORE_SYSTEM_PROMPT } from './prompts/core';
import { EMDR_LENS_SYSTEM_APPEND } from './prompts/emdr';
import { TA_FORMULATION_EXTRACTION, TA_LENS_SYSTEM_APPEND } from './prompts/transactionalAnalysis';

/** @deprecated Prefer CORE_SYSTEM_PROMPT + lens appends — retained for EMDR phase runners. */
export const BASE_SYSTEM_PROMPT = `${CORE_SYSTEM_PROMPT}

${EMDR_LENS_SYSTEM_APPEND}

Legacy prompt version tag: ${PROMPT_VERSION}`;

export { CORE_SYSTEM_PROMPT };
export { EMDR_LENS_SYSTEM_APPEND };
export { TA_LENS_SYSTEM_APPEND, TA_FORMULATION_EXTRACTION };

export const PHASE1_HISTORY_EXTRACTION = `Fully supported analysis mode: EMDR lens — Phase 1 History / Treatment Planning.

Extract and organise:
- Presenting problems
- Symptoms / difficulties
- Recent examples
- Current triggers
- Earlier experiences / significant experiences (memories array, with approximateAge when stated)
- Possible associative links (associativeLinks) — past–present connections suggested by the dialogue
- Possible touchstone candidates (memories with possibleTouchstoneCandidate)
- Possible Negative Cognitions (explicit vs suggested)
- Possible Positive Cognitions (only if truly established as preferred belief; otherwise empty + unansweredQuestions)
- Internal resources
- External resources
- Clinical themes (all four theme ids; do not force a primary theme if evidence is weak)
- Possible target memories (targetCandidates — not current target)
- Clinical considerations
- Information still needed (unansweredQuestions) — always include absent Phase 3 items when not discussed: target image, PC, VOC, SUD, body sensation
- Possible areas to clarify next session (clarificationSuggestions) — AI-assisted only; do not prescribe interventions

Theme pattern guides (context-sensitive, not mechanical phrase matching):
- Responsibility / Defectiveness: not good enough, failed, should have done something, my fault, defective, inadequate
- Belonging: don't fit in, invisible, don't matter, unwanted, outsider, alone
- Safety / Vulnerability: not safe, can't trust, in danger, can't protect myself, something bad will happen
- Power / Control / Choices: powerless, no control, can't say no, trapped, can't stand up for myself, have to keep control

Keep evidence excerpts short. Assign unique string ids to every suggestion object.
Set reviewStatus to "pending" for every suggestion.
Set analysisKind to "phase1-history".
For summary, use evidenceLevel inferred or suggested as appropriate with brief evidence.`;

export const PHASE3_ASSESSMENT_EXTRACTION = `Fully supported analysis mode: Standard EMDR — Phase 3 Assessment.

Extract ONLY what is established in this transcript segment for the current target assessment:
- target (memory / incident label)
- worstPart (worst part of the memory, if stated)
- image (picture that represents the worst part)
- negativeCognition (self-referential NC about the target)
- positiveCognition (preferred PC about the target — only if clearly established)
- voc + vocNumeric — ONLY when an explicit numeric Validity of Cognition is stated (typically 1–7). Never infer or estimate a number. If not stated: voc=null, vocNumeric=null, and add "VoC not established" to unansweredQuestions.
- emotion
- sud + sudNumeric — ONLY when an explicit numeric Subjective Units of Disturbance is stated (typically 0–10). Never infer or estimate a number. If not stated: sud=null, sudNumeric=null, and add "SUD not established" to unansweredQuestions.
- bodyLocation

Missing fields MUST be null (not invented) and listed under unansweredQuestions as "… not established".
Do not invent VoC or SUD from emotional intensity language.
Do not declare assessment complete.

Set analysisKind to "phase3-assessment".
Assign unique string ids. Set reviewStatus to "pending" on every suggestion object.
Keep evidence excerpts short.`;

export const PHASE4_DESENSITISATION_EXTRACTION = `Fully supported analysis mode: Standard EMDR — Phase 4 Desensitisation.

Extract an ordered processing sequence that preserves transcript order (sequence[].order ascending).
For each clinically notable change or association, add a sequence step with:
- sequenceLabel: ordinal narrative label (e.g. "Set 1", "After first channel", "Later association") — do NOT invent clock timestamps
- timestamp: null unless an explicit time is spoken in the transcript
- category: image | thought | emotion | body | association | new-memory | adaptive | sud | feeder | blocking-belief | intervention | other
- value: concise clinical note of what changed / was reported

Also populate parallel arrays (may overlap sequence content for review convenience):
- associations
- newMemories
- adaptiveInformation
- sudChanges (only when SUD is explicitly restated or compared — never invent numbers)
- feederMemories (possible feeder / earlier contributing memories — mark as suggested)
- blockingBeliefs (possible blocking beliefs — mark as suggested; do not declare established)
- therapistInterventions (e.g. "go with that", cognitive interweave, return to target)
- imageThoughtEmotionBodyChanges

resolutionStatus MUST be one of: not-established | in-progress | incomplete.
NEVER declare the target resolved / completed / SUD=0 as fact. Resolution is therapist-judged only.
If the transcript ends mid-processing, use in-progress or incomplete.

Set analysisKind to "phase4-desensitisation".
Assign unique string ids. Set reviewStatus to "pending".
Keep evidence excerpts short.`;

export function buildAnalyseUserInput(args: {
  transcript: string;
  clientContext: unknown;
  protocol: string;
  phase: string;
  sessionDate?: string;
  priorApprovedSummary?: unknown;
  isSegment?: boolean;
  reasoningMode?: string;
  primaryApproach?: string;
  includeLensConsiderations?: boolean;
  suppressTaConstructs?: boolean;
}): string {
  return [
    `Protocol: ${args.protocol}`,
    `Phase: ${args.phase}`,
    args.primaryApproach ? `Primary treatment approach: ${args.primaryApproach}` : null,
    args.reasoningMode ? `Reasoning mode: ${args.reasoningMode}` : null,
    args.includeLensConsiderations
      ? 'Include Clinical Lens Considerations (possible complementary lenses only — not full alternative formulations).'
      : 'Do not invent complementary lens formulations.',
    args.suppressTaConstructs
      ? 'CORE-ONLY MODE: leave all TA arrays empty; set noSufficientTaEvidence=true; summarise modality-neutral core material only.'
      : null,
    args.sessionDate ? `Session date: ${args.sessionDate}` : null,
    args.isSegment
      ? 'Mode: INCREMENTAL SEGMENT — extract only what is new or changed in this segment; do not restate already-approved material unless it is updated or in conflict.'
      : null,
    '',
    'Approved client context (therapist-approved only; may be empty):',
    JSON.stringify(args.clientContext ?? {}, null, 2),
    args.priorApprovedSummary
      ? `\nPreviously approved findings from parent analysis (do not duplicate):\n${JSON.stringify(args.priorApprovedSummary, null, 2)}`
      : null,
    '',
    args.isSegment ? 'NEW TRANSCRIPT SEGMENT (raw — do not rewrite; extract only):' : 'SESSION TRANSCRIPT (raw — do not rewrite; extract only):',
    args.transcript,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export const CONNECTION_TEST_PROMPT =
  'Return exactly the following four words and nothing else:\nHello Pathfinder';

export const STRUCTURED_REPAIR_PROMPT = `The previous response did not conform to the required JSON schema.
Return ONLY valid JSON matching the schema exactly.
Do not invent clinical facts that were not in the transcript.
Do not include markdown fences.`;
