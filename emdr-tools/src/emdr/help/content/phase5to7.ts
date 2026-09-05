import type { EMDRScript } from '../types';

export const PHASE5_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase5-installation',
    title: 'Installation',
    phase: 'installation',
    category: 'standard',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 5 Installation',
      page: 48,
    },
    tags: ['installation', 'phase5', 'pc', 'voc'],
    sections: [
      {
        type: 'instruction',
        heading: 'Purpose',
        text: 'Strengthen the preferred positive cognition in connection with the target memory.',
      },
      {
        type: 'ask',
        heading: 'Recheck Positive Cognition',
        text: 'Do the preferred words from earlier still fit, or is there a more accurate preferred belief now?',
      },
      {
        type: 'ask',
        heading: 'VOC',
        text: 'When you bring up the original experience and those words, how true do they feel from 1 to 7?',
      },
      {
        type: 'say',
        heading: 'Installation focus',
        text: 'Hold together the target memory and the chosen positive cognition, then begin a set when ready.',
      },
      {
        type: 'ask',
        text: 'What do you notice now?',
      },
      {
        type: 'decision-point',
        text: 'Continue while clinically useful until VOC reaches 7, or until an ecologically appropriate level for this client/context. The application does not mark completion automatically.',
      },
    ],
  },
];

export const PHASE6_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase6-body-scan',
    title: 'Body Scan',
    phase: 'body-scan',
    category: 'standard',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 6 Body Scan',
    },
    tags: ['body scan', 'phase6'],
    sections: [
      {
        type: 'instruction',
        text: 'Bring the target memory to mind together with the positive cognition, then invite a scan through the body for residual sensation.',
      },
      {
        type: 'ask',
        text: 'As you hold that experience and those words, scan through your body — what do you notice?',
      },
      {
        type: 'decision-point',
        heading: 'If clear / neutral',
        text: 'Proceed towards Closure when clinically appropriate.',
      },
      {
        type: 'decision-point',
        heading: 'If positive',
        text: 'Optional strengthening BLS may be used if that fits your clinical judgement.',
      },
      {
        type: 'decision-point',
        heading: 'If disturbing sensation remains',
        text: 'Resume processing with BLS as clinically appropriate.',
      },
      {
        type: 'caution',
        text: 'Do not automatically classify every physical sensation as unresolved trauma.',
      },
    ],
  },
];

export const PHASE7_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase7-completed-closure',
    title: 'Closure — completed target',
    phase: 'closure',
    category: 'closure',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 7: Closure',
      page: 51,
    },
    tags: ['closure', 'completed', 'phase7'],
    sections: [
      {
        type: 'instruction',
        heading: 'Purpose',
        text: 'Bring the session to an appropriate close after SUD is resolved, the PC is installed appropriately, and the body scan is clear.',
      },
      {
        type: 'say',
        text: 'We can close this piece of work for today. Notice what has shifted, and we will reevaluate when we next meet.',
      },
      {
        type: 'observe',
        text: 'Confirm orientation to the present and any between-session guidance that fits your practice.',
      },
    ],
  },
  {
    id: 'phase7-incomplete-closure',
    title: 'Closure — incomplete session',
    phase: 'closure',
    category: 'closure',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 7 — incomplete session closure',
    },
    tags: ['closure', 'incomplete', 'phase7', 'container', 'infinity'],
    caution: 'Do not attempt to force SUD to zero simply because session time has ended.',
    sections: [
      {
        type: 'instruction',
        text: 'If processing is unfinished, prioritise present orientation, containment of unfinished material, and regulation — not completing the target at all costs.',
      },
      {
        type: 'decision-point',
        heading: 'Possible options',
        text: 'Orient to present · acknowledge work done · contain unfinished material · Safe/Calm State or other resource · Figure Eight / Infinity de-arousal · grounding · agree what to notice between sessions.',
      },
      {
        type: 'caution',
        text: 'Do not force SUD to zero simply because the session is ending.',
      },
    ],
  },
];
