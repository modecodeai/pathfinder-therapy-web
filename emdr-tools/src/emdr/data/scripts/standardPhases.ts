import type { GuidedScriptStep, SourceReference } from '../../guided/types/guidedScript';

const SRC: SourceReference = {
  author: 'Deany Laliotis, LICSW',
  organisation: 'The Center for Excellence in EMDR Therapy',
  title: 'Basic Training Part I — Worksheets (Phase 3 Target Memory Assessment)',
  date: 'March 2026',
};

const SRC4: SourceReference = {
  ...SRC,
  title: 'Basic Training Part I — Worksheets (Phases 4–7 procedural prompts)',
};

function step(
  partial: Omit<GuidedScriptStep, 'protocol' | 'source'> & { source?: SourceReference },
): GuidedScriptStep {
  return {
    protocol: 'standard-emdr',
    source: partial.source ?? SRC,
    ...partial,
  };
}

export const PHASE3_ASSESSMENT_STEPS: GuidedScriptStep[] = [
  step({
    id: 'p3-target',
    phase: 'assessment',
    section: 'target',
    type: 'capture',
    text: 'Target memory selected for reprocessing (brief headline).',
    fieldKey: 'target',
  }),
  step({
    id: 'p3-image',
    phase: 'assessment',
    section: 'image',
    type: 'say',
    text: 'What picture represents the worst part of this experience?',
    fieldKey: 'image',
  }),
  step({
    id: 'p3-nc',
    phase: 'assessment',
    section: 'nc',
    type: 'say',
    text: 'What words go best with that picture that express your negative belief about yourself now? Or: When you bring up that image, how does it make you feel about yourself as a person?',
    fieldKey: 'nc',
  }),
  step({
    id: 'p3-pc',
    phase: 'assessment',
    section: 'pc',
    type: 'say',
    text: 'What would you prefer to believe about yourself instead?',
    fieldKey: 'pc',
  }),
  step({
    id: 'p3-voc',
    phase: 'assessment',
    section: 'voc',
    type: 'say',
    text: 'When you think of that picture, how true do the words (PC) feel to you now on a scale of 1–7, where 1 feels completely false and 7 feels completely true?',
    fieldKey: 'voc',
  }),
  step({
    id: 'p3-emotion',
    phase: 'assessment',
    section: 'emotion',
    type: 'say',
    text: 'When you bring up that picture and those words (NC), what emotions do you feel now?',
    fieldKey: 'emotion',
  }),
  step({
    id: 'p3-sud',
    phase: 'assessment',
    section: 'sud',
    type: 'say',
    text: 'On a scale from 0–10, where 0 is no disturbance and 10 is the highest disturbance you can imagine, how disturbing does it feel to you now?',
    fieldKey: 'sud',
  }),
  step({
    id: 'p3-body',
    phase: 'assessment',
    section: 'body',
    type: 'say',
    text: 'Where do you feel that in your body?',
    fieldKey: 'body',
  }),
  step({
    id: 'p3-begin',
    phase: 'assessment',
    section: 'transition',
    type: 'clinician-note',
    text: 'When assessment is complete and the target is fully accessed, proceed to Desensitisation.',
  }),
];

export const PHASE4_STEPS: GuidedScriptStep[] = [
  step({
    id: 'p4-initiate',
    phase: 'desensitisation',
    section: 'initiate',
    type: 'say',
    text: 'I\'d like you to bring up that picture, those negative words (NC), notice where you feel it in your body, and follow the stimulation.',
    source: SRC4,
    blsPreset: 'standardReprocessing',
  }),
  step({
    id: 'p4-bls',
    phase: 'desensitisation',
    section: 'bls',
    type: 'bls-action',
    text: 'Start a set of bilateral stimulation (Standard Reprocessing preset unless clinician chooses otherwise).',
    source: SRC4,
    blsPreset: 'standardReprocessing',
  }),
  step({
    id: 'p4-notice',
    phase: 'desensitisation',
    section: 'check-in',
    type: 'say',
    text: 'What do you notice now?',
    source: SRC4,
  }),
  step({
    id: 'p4-branches',
    phase: 'desensitisation',
    section: 'branches',
    type: 'decision',
    text: 'IF CHANGE / NEW ASSOCIATION: “Go with that.”\nIF SAME / NOTHING: Consider protocol-consistent strategies; do not accept vague “nothing” without clarifying experiencing.\nIF STOP SIGNAL: Stop BLS immediately.\nIF MORE INTENSE: Continue with clinical judgement; consider pacing / stabilisation helpers.',
    source: SRC4,
  }),
];

export const PHASE5_STEPS: GuidedScriptStep[] = [
  step({
    id: 'p5-check-pc',
    phase: 'installation',
    section: 'pc',
    type: 'say',
    text: 'Do the words (PC) still fit, or is there another positive statement that would be more suitable?',
    source: SRC4,
    fieldKey: 'pc',
  }),
  step({
    id: 'p5-voc',
    phase: 'installation',
    section: 'voc',
    type: 'say',
    text: 'Think about the original incident and those words (PC). From 1–7, how true do they feel now?',
    source: SRC4,
    fieldKey: 'voc',
  }),
  step({
    id: 'p5-install',
    phase: 'installation',
    section: 'bls',
    type: 'bls-action',
    text: 'Hold the incident and PC together and install with BLS (Installation preset — advanced taxation off).',
    source: SRC4,
    blsPreset: 'installation',
  }),
];

export const PHASE6_STEPS: GuidedScriptStep[] = [
  step({
    id: 'p6-scan',
    phase: 'body-scan',
    section: 'scan',
    type: 'say',
    text: 'Close your eyes, think of the original incident and the PC, and notice your body from head to feet. Tell me if you notice anything.',
    source: SRC4,
  }),
  step({
    id: 'p6-decision',
    phase: 'body-scan',
    section: 'branches',
    type: 'decision',
    text: 'IF NEUTRAL / POSITIVE: Strengthen as clinically indicated.\nIF RESIDUAL DISTURBANCE: Continue body-scan processing with BLS, or return to Phase 4 — clinician chooses; software does not decide automatically.',
    source: SRC4,
  }),
];

export const PHASE7_COMPLETE_STEPS: GuidedScriptStep[] = [
  step({
    id: 'p7c-1',
    phase: 'closure',
    section: 'complete',
    type: 'clinician-note',
    text: 'Completed target session — use closure appropriate to a finished reprocessing set (debrief, self-care, what to expect between sessions). Clinician selects completion; do not infer solely from SUD.',
    source: SRC4,
  }),
];

export const PHASE7_INCOMPLETE_STEPS: GuidedScriptStep[] = [
  step({
    id: 'p7i-1',
    phase: 'closure',
    section: 'incomplete',
    type: 'clinician-note',
    text: 'Incomplete target session — contain, use Safe/Calm or other resource, and orient to what will resume next time. Preserve target data for Resume Incomplete Target.',
    source: SRC4,
  }),
];

export const STANDARD_SOURCE_LABEL =
  'The Center for Excellence in EMDR Therapy — Basic Training Part I Worksheets (March 2026)';
