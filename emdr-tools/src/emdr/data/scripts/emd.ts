import type { GuidedScriptStep, SourceReference } from '../../guided/types/guidedScript';

const SRC: SourceReference = {
  author: 'Deany Laliotis, LICSW',
  organisation: 'The Center for Excellence in EMDR Therapy',
  title: 'Basic Training Part II-A',
  date: 'January 2026',
};

const base = {
  protocol: 'emd',
  phase: 'desensitisation',
  source: SRC,
} as const;

export const EMD_STEPS: GuidedScriptStep[] = [
  {
    ...base,
    id: 'emd-purpose',
    section: 'orientation',
    type: 'clinician-note',
    text:
      'EMD (Eye Movement Desensitization) is a circumscribed protocol used to desensitise part(s) of a memory, reduce intrusive symptoms, reduce arousal, and increase stability. It is not full Standard EMDR free association.',
  },
  {
    ...base,
    id: 'emd-1',
    section: 'target',
    type: 'capture',
    text: 'Identify the part of the memory that is most disturbing, or that the client can tolerate.',
    fieldKey: 'focusedTarget',
  },
  {
    ...base,
    id: 'emd-2',
    section: 'assessment',
    type: 'clinician-note',
    text:
      'Use standard Assessment phase procedures to identify components of the experience. This version omits the negative belief in order to reduce the likelihood of associating to other memories.',
  },
  {
    ...base,
    id: 'emd-image',
    section: 'assessment',
    type: 'say',
    text: 'What picture represents the worst part of this part of the experience?',
    fieldKey: 'image',
  },
  {
    ...base,
    id: 'emd-emotion',
    section: 'assessment',
    type: 'say',
    text: 'When you bring up that picture, what emotions do you feel now?',
    fieldKey: 'emotion',
  },
  {
    ...base,
    id: 'emd-sud',
    section: 'assessment',
    type: 'say',
    text: 'On a scale from 0–10, how disturbing does it feel now?',
    fieldKey: 'sud',
  },
  {
    ...base,
    id: 'emd-body',
    section: 'assessment',
    type: 'say',
    text: 'Where do you feel that in your body?',
    fieldKey: 'body',
  },
  {
    ...base,
    id: 'emd-instruct',
    section: 'processing',
    type: 'say',
    text: 'Stay focused on the most disturbing part.',
  },
  {
    ...base,
    id: 'emd-bls',
    section: 'processing',
    type: 'bls-action',
    text: 'Apply a shorter set of BLS (12–15 passes). EMD Short Set preset recommended.',
    blsPreset: 'emdShortSet',
  },
  {
    ...base,
    id: 'emd-feedback',
    section: 'processing',
    type: 'say',
    text: 'What do you notice now?',
  },
  {
    ...base,
    id: 'emd-return',
    section: 'processing',
    type: 'decision',
    text:
      'Return to the target image/memory (or most intrusive aspect) and take a SUD after each set. If the client associates to other experiences, stop BLS and consider half as many repetitions in subsequent sets. Do not encourage free association away from the focused target.',
  },
  {
    ...base,
    id: 'emd-repeat',
    section: 'processing',
    type: 'clinician-note',
    text: 'Return to target after each set until the desired shift has occurred. Complete desensitization of the whole experience may require later full targeting.',
  },
  {
    ...base,
    id: 'emd-pc',
    section: 'installation',
    type: 'say',
    text:
      'Once the desired effect is achieved, identify a positive belief that reflects the shift (e.g., “I can handle the situation,” or “I can be calmer now that it’s over.”).',
    fieldKey: 'pc',
  },
  {
    ...base,
    id: 'emd-install',
    section: 'installation',
    type: 'bls-action',
    text: 'Install until VOC is 7 or as strong as ecologically appropriate.',
    blsPreset: 'installation',
  },
  {
    ...base,
    id: 'emd-body-scan-note',
    section: 'closure',
    type: 'warning',
    text: 'Do not apply Body Scan procedures unless SUD is 0.',
  },
  {
    ...base,
    id: 'emd-close',
    section: 'closure',
    type: 'clinician-note',
    text: 'Apply a state-shift strategy such as containment, Safe/Calm Place, or another pre-established resource.',
  },
];

export const EMD_SOURCE_LABEL =
  'The Center for Excellence in EMDR Therapy — Basic Training Part II-A (January 2026); Francine Shapiro (original EMD)';
