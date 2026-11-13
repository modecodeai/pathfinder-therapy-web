import type { EMDRScript } from '../types';

export const PHASE8_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase8-global-reevaluation',
    title: 'Global reevaluation',
    phase: 'reevaluation',
    category: 'standard',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 8 Reevaluation',
    },
    tags: ['reevaluation', 'phase8', 'global'],
    sections: [
      {
        type: 'instruction',
        text: 'Evaluate positive changes and emerging material across the course of treatment — not only a single target.',
      },
      {
        type: 'ask',
        text: 'What has changed since last session — in symptoms, behaviour, relationships, insights, or triggers?',
      },
      {
        type: 'observe',
        text: 'Notice increased adaptive functioning as well as new material that may need targeting.',
      },
    ],
  },
  {
    id: 'phase8-target-reevaluation',
    title: 'Target-specific reevaluation',
    phase: 'reevaluation',
    category: 'standard',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 8 — target reevaluation',
    },
    tags: ['reevaluation', 'target', 'sud', 'voc'],
    sections: [
      {
        type: 'instruction',
        text: 'Return to the previous target and reassess present response.',
      },
      {
        type: 'ask',
        text: 'When you bring up that earlier target now, what do you notice? SUD? Preferred belief and VOC? Body?',
      },
      {
        type: 'decision-point',
        text: 'Decide whether to resume Desensitisation, Installation, Body Scan, address present triggers, create a Future Template, or select another target. The application does not decide this for you.',
      },
    ],
  },
];

export const FUTURE_TEMPLATE_SCRIPTS: EMDRScript[] = [
  {
    id: 'future-template-sequence',
    title: 'Future Template',
    phase: 'future-template',
    category: 'standard',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Future Template',
      page: 57,
    },
    tags: ['future template', 'future movie'],
    sections: [
      {
        type: 'instruction',
        text: '1) Identify a future situation related to the resolved trigger/target. 2) Establish the desired adaptive response. 3) Identify an appropriate positive cognition. 4) Mentally rehearse. 5) Introduce BLS. 6) Notice disturbance, hesitation, or blocking material. 7) Process difficulties when indicated. 8) Rerun the future scenario. 9) Strengthen adaptive responding.',
      },
      {
        type: 'ask',
        text: 'What future situation would you like to handle differently, and how would you prefer to respond?',
      },
      {
        type: 'decision-point',
        heading: 'Run Future Movie',
        text: 'Continuous BLS may be used while the client rehearses the future scenario — start only when you choose.',
      },
      {
        type: 'caution',
        text: 'If significant disturbing material emerges, consider whether it requires separate assessment and reprocessing rather than simply continuing the Future Template.',
      },
    ],
  },
];

export const INFINITY_SCRIPTS: EMDRScript[] = [
  {
    id: 'infinity-figure-eight',
    title: 'Figure Eight / Infinity — de-arousal',
    phase: 'closure',
    category: 'technique',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Figure Eight Eye Movements for De-Arousal',
      page: 72,
    },
    tags: ['infinity', 'figure eight', 'de-arousal', 'closure'],
    sections: [
      {
        type: 'instruction',
        heading: 'Purpose',
        text: 'Slow figure-eight movement for de-arousal / quieting — separate from active trauma reprocessing.',
      },
      {
        type: 'instruction',
        heading: 'Starting parameters',
        text: 'Very slow movement · approximately 10–20 seconds per set · check the client’s response between sets.',
      },
      {
        type: 'ask',
        heading: 'Midline preference',
        text: 'Does it feel more settling when the movement travels upward through the centre, or downward through the centre?',
      },
      {
        type: 'ask',
        text: 'How is that now?',
      },
      {
        type: 'decision-point',
        text: 'Repeat, adjust speed, reverse midline direction, or finish — do not auto-repeat indefinitely.',
      },
    ],
  },
];

export const CROSS_PHASE_SCRIPTS: EMDRScript[] = [
  {
    id: 'cross-container',
    title: 'Container (cross-phase)',
    phase: 'cross-phase',
    category: 'resource',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Container',
    },
    tags: ['container', 'closure', 'preparation'],
    sections: [
      {
        type: 'instruction',
        text: 'Temporarily set aside unfinished material until it can safely be returned to in treatment.',
      },
      {
        type: 'caution',
        text: 'Not erasing, suppressing, or permanently discarding material.',
      },
    ],
  },
];
