import type { EMDRScript } from '../types';

/** Source-informed Pathfinder prompts — not verbatim proprietary scripts. */
export const PHASE3_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase3-assessment-sequence',
    title: 'Target Memory Assessment sequence',
    phase: 'assessment',
    category: 'assessment',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 3 Assessment',
    },
    tags: ['assessment', 'phase3', 'image', 'nc', 'pc', 'voc', 'sud', 'body'],
    clinicalNote: 'Complete assessment before starting BLS. Do not begin stimulation automatically.',
    sections: [
      {
        type: 'instruction',
        heading: 'Purpose',
        text: 'Activate the target memory network enough to begin reprocessing, while recording the key channels of the experience.',
      },
      {
        type: 'ask',
        heading: 'Target',
        text: 'What experience are we working with today?',
      },
      {
        type: 'ask',
        heading: 'Image',
        text: 'When you bring that experience to mind, what image or representation best captures it right now?',
      },
      {
        type: 'ask',
        heading: 'Negative Cognition',
        text: 'When you notice that image, what negative belief do you have about yourself now?',
      },
      {
        type: 'ask',
        heading: 'Positive Cognition',
        text: 'When you bring up that image, what would you prefer to believe about yourself instead?',
      },
      {
        type: 'ask',
        heading: 'VOC',
        text: 'When you think of the image and those preferred words, how true do they feel now, from 1 (completely false) to 7 (completely true)?',
      },
      {
        type: 'ask',
        heading: 'Emotion',
        text: 'When you notice the image and the negative belief, what emotion(s) do you feel now?',
      },
      {
        type: 'ask',
        heading: 'SUD',
        text: 'On a scale of 0 to 10, where 0 is no disturbance and 10 is the highest you can imagine, how disturbing does it feel right now?',
      },
      {
        type: 'ask',
        heading: 'Body',
        text: 'Where do you notice that in your body?',
      },
      {
        type: 'decision-point',
        text: 'Assessment complete — target network activated. Begin Desensitisation only when you choose to start a set.',
      },
    ],
  },
  {
    id: 'phase3-nc-help',
    title: 'Identifying a Negative Cognition',
    phase: 'assessment',
    category: 'assessment',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 3 Assessment — Negative Cognition',
    },
    tags: ['nc', 'negative cognition', 'assessment'],
    sections: [
      {
        type: 'instruction',
        text: 'Look for a present, self-referential negative belief tied to the activated target — not a historical description of the event alone.',
      },
      {
        type: 'observe',
        text: 'Useful NC themes often relate to responsibility/defectiveness, safety/vulnerability, or power/control — use these as formulation aids, not mandatory categories.',
      },
      {
        type: 'caution',
        text: 'Do not select an NC for the client. Stay with their words where possible.',
      },
    ],
  },
  {
    id: 'phase3-voc-help',
    title: 'VOC guidance',
    phase: 'assessment',
    category: 'assessment',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 3 — VOC',
    },
    tags: ['voc', 'assessment'],
    sections: [
      {
        type: 'ask',
        text: 'How true does that preferred belief feel right now, from 1 to 7?',
      },
      {
        type: 'observe',
        text: 'VOC reflects felt validity in the present, not intellectual agreement.',
      },
      {
        type: 'decision-point',
        text: 'A low initial VOC is expected when the target is activated. Do not “correct” the score.',
      },
    ],
  },
  {
    id: 'phase3-sud-help',
    title: 'What SUD measures',
    phase: 'assessment',
    category: 'assessment',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 3 — SUD',
    },
    tags: ['sud', 'assessment'],
    sections: [
      {
        type: 'instruction',
        text: 'SUD rates present disturbance associated with the activated target, from 0 (none) to 10 (highest imaginable).',
      },
      {
        type: 'caution',
        text: 'SUD is a clinical communication tool — not an automatic success/failure metric for the software.',
      },
    ],
  },
];
