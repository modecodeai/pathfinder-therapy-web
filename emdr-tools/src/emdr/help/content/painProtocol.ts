import type { EMDRScript } from '../types';

/** Pain protocol entries for the Script Library — point clinicians to /pain for the full workspace. */
export const PAIN_PROTOCOL_SCRIPTS: EMDRScript[] = [
  {
    id: 'pain-protocol-full',
    title: 'Pain Protocol — Full',
    phase: 'cross-phase',
    category: 'technique',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Mark Grant — EMDR Pain Protocol (Grant v4 full)',
    },
    tags: ['pain', 'mark-grant', 'chronic-pain'],
    clinicalNote:
      'Open EMDR Pain (/pain) for the full guided workspace. Scripts there preserve Mark Grant wording.',
    sections: [
      {
        type: 'instruction',
        text: 'Use the EMDR Pain workspace (EMDR PAIN in navigation) for the complete Mark Grant Pain Protocol workflow, continuous auditory BLS defaults, antidote imagery, and re-evaluation.',
      },
      {
        type: 'caution',
        text: 'EMDR pain work does not replace appropriate medical assessment, diagnosis or treatment.',
      },
    ],
  },
  {
    id: 'pain-protocol-short',
    title: 'Pain Protocol — Short',
    phase: 'cross-phase',
    category: 'technique',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Mark Grant — EMDR Pain Protocol (short version)',
    },
    tags: ['pain', 'short-protocol'],
    sections: [
      {
        type: 'instruction',
        text: 'The short protocol is available separately from the full protocol inside EMDR Pain → Scripts. Do not merge short and full wording into a hybrid.',
      },
    ],
  },
  {
    id: 'pain-reevaluation',
    title: 'Pain Re-evaluation',
    phase: 'cross-phase',
    category: 'technique',
    sourceType: 'source-derived',
    tags: ['pain', 're-evaluation'],
    sections: [
      {
        type: 'ask',
        text: 'So what have you noticed about your pain since our last session?',
      },
      {
        type: 'ask',
        text: 'Have you noticed any changes in your sleeping pattern? Activity levels? Mood? Anything different or unusual?',
      },
    ],
  },
  {
    id: 'pain-antidote',
    title: 'Pain Antidote Imagery',
    phase: 'cross-phase',
    category: 'technique',
    sourceType: 'source-derived',
    tags: ['pain', 'antidote'],
    sections: [
      {
        type: 'ask',
        text: 'So what’s come in the pain’s place? What’s there now where the pain was before?',
      },
      {
        type: 'ask',
        text: 'Is there a word that goes with how you feel when you think of that image?',
      },
    ],
  },
  {
    id: 'pain-closure',
    title: 'Pain Closure',
    phase: 'cross-phase',
    category: 'closure',
    sourceType: 'source-derived',
    tags: ['pain', 'closure'],
    sections: [
      {
        type: 'say',
        text: 'Now that you are feeling better you are probably wondering how long the effects will last… Of course if your pain persists beyond what you feel you can cope with you should always seek medical help.',
      },
    ],
  },
  {
    id: 'pain-variations-help',
    title: 'Variations from Standard EMDR for Chronic Pain',
    phase: 'cross-phase',
    category: 'decision-support',
    sourceType: 'source-derived',
    tags: ['pain', 'variations'],
    sections: [
      {
        type: 'instruction',
        text: 'Eight variations: present pain as target; sensations for emotions; track BLS effects; continuous BLS; auditory BLS; cognition themes; expectations/partial improvement; self-use of BLS as self-soothing (not DIY EMDR). Open EMDR Pain → Help for full source text.',
      },
    ],
  },
];
