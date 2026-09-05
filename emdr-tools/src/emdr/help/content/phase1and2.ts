import type { EMDRScript } from '../types';

export const PHASE1_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase1-presenting-issue',
    title: 'Presenting issue',
    phase: 'history',
    category: 'standard',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'History Taking and Treatment Planning',
    },
    tags: ['history', 'presenting issue', 'phase1'],
    sections: [
      {
        type: 'ask',
        text: 'What brings you to therapy now? What symptoms, triggers, or difficulties are most present?',
      },
      {
        type: 'ask',
        text: 'What would you like to be different as a result of this work?',
      },
      {
        type: 'observe',
        text: 'Listen for current triggers, desired change, and treatment goals without rushing into target selection.',
      },
    ],
  },
  {
    id: 'phase1-aip-mapping',
    title: 'AIP Past → Present → Future mapping',
    phase: 'history',
    category: 'technique',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'AIP History Taking and Treatment Planning',
    },
    tags: ['aip', 'treatment planning', 'past present future'],
    sections: [
      {
        type: 'instruction',
        text: 'Map clinically relevant earlier experiences, current triggers/symptoms, and desired future responses.',
      },
      {
        type: 'ask',
        heading: 'Past',
        text: 'What earlier experiences seem connected to this present difficulty?',
      },
      {
        type: 'ask',
        heading: 'Present',
        text: 'What current situations, symptoms, or triggers keep this alive now?',
      },
      {
        type: 'ask',
        heading: 'Future',
        text: 'How would you like to respond differently in those future situations?',
      },
      {
        type: 'observe',
        heading: 'Clinical themes (optional aids)',
        text: 'Responsibility / Defectiveness · Safety / Vulnerability · Power / Control — formulation aids, not mandatory classifications.',
      },
    ],
  },
  {
    id: 'phase1-direct-questioning',
    title: 'Direct Questioning',
    phase: 'history',
    category: 'technique',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Direct Questioning',
    },
    tags: ['direct questioning', 'floatback', 'targets'],
    sections: [
      {
        type: 'ask',
        text: 'When did you first notice this kind of reaction? Are there earlier times that feel similar?',
      },
      {
        type: 'decision-point',
        text: 'Use Direct Questioning to identify candidate memories for the target map — not to force a single “cause”.',
      },
    ],
  },
  {
    id: 'phase1-floatback',
    title: 'Floatback',
    phase: 'history',
    category: 'technique',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Floatback',
    },
    tags: ['floatback', 'history', 'targets'],
    sections: [
      {
        type: 'instruction',
        heading: 'Purpose',
        text: 'From a present difficulty, allow attention to move backwards toward an earlier related experience that may inform treatment planning.',
      },
      {
        type: 'instruction',
        text: '1) Activate the present difficulty. 2) Identify associated emotion, body sensation, and/or cognition. 3) Invite attention to float back. 4) Identify an earlier related memory. 5) Decide whether it is clinically appropriate for the target map.',
      },
      {
        type: 'ask',
        text: 'As you notice that feeling/belief/body sensation, let your mind float back to an earlier time that feels connected — what comes up?',
      },
      {
        type: 'caution',
        text: 'Do not automatically designate the earliest memory as the definitive causal event.',
      },
      {
        type: 'decision-point',
        text: 'If appropriate, add the memory to the Target Map as a candidate — therapist judgement remains primary.',
      },
    ],
  },
];

export const PHASE2_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase2-emdr-orientation',
    title: 'EMDR orientation',
    phase: 'preparation',
    category: 'resource',
    sourceType: 'pathfinder-original',
    tags: ['preparation', 'orientation', 'stop signal'],
    sections: [
      {
        type: 'say',
        text: 'In this work we may notice a difficult experience while using bilateral stimulation. You remain in control — we can pause, stop, or change the stimulation at any time.',
      },
      {
        type: 'instruction',
        text: 'Cover: attention to material · bilateral stimulation · remaining present and aware · client control · therapist may stop or modify stimulation.',
      },
    ],
  },
  {
    id: 'phase2-stop-signal',
    title: 'Stop signal',
    phase: 'preparation',
    category: 'resource',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 2 Preparation',
    },
    tags: ['stop signal', 'preparation', 'safety'],
    sections: [
      {
        type: 'ask',
        text: 'What clear signal will you use if you want us to stop or pause the stimulation?',
      },
      {
        type: 'decision-point',
        text: 'Establish and confirm the stop signal before reprocessing.',
      },
    ],
  },
  {
    id: 'phase2-safe-calm-place',
    title: 'Safe / Calm Place or State',
    phase: 'preparation',
    category: 'resource',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Safe/Calm Place or State',
    },
    tags: ['safe place', 'calm place', 'resource', 'preparation'],
    caution:
      'If the resource increases activation rather than settling the client, stop and reassess rather than continuing BLS automatically.',
    sections: [
      {
        type: 'instruction',
        text: '1) Identify an experience/place/state associated with relative calm or safety. 2) Notice sensory qualities. 3) Notice associated body experience. 4) Enhance the experience. 5) Apply slower brief BLS where clinically appropriate. 6) Check what the client notices. 7) Establish a cue word. 8) Practise intentional access. 9) Check that the resource actually shifts state.',
      },
      {
        type: 'ask',
        text: 'What place, memory, or state helps you feel relatively calm or safe?',
      },
      {
        type: 'ask',
        text: 'What do you see, hear, sense, or feel in your body as you bring that to mind?',
      },
      {
        type: 'caution',
        text: 'If the resource increases activation rather than settling the client, stop and reassess rather than continuing BLS automatically.',
      },
    ],
  },
  {
    id: 'phase2-container',
    title: 'Container',
    phase: 'preparation',
    category: 'resource',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Container',
    },
    tags: ['container', 'preparation', 'closure'],
    sections: [
      {
        type: 'instruction',
        text: 'A Container strategy temporarily sets aside unfinished material until it can safely be returned to in treatment.',
      },
      {
        type: 'say',
        text: 'We can place what is unfinished somewhere secure for now, knowing we can return to it when we choose to work with it again.',
      },
      {
        type: 'caution',
        text: 'Container is not erasing, suppressing, or permanently getting rid of material — and it is not avoidance when used as a temporary clinical strategy.',
      },
    ],
  },
  {
    id: 'phase2-rdi-placeholder',
    title: 'Resource Development (Part II)',
    phase: 'preparation',
    category: 'resource',
    sourceType: 'pathfinder-original',
    requiresClinicalReview: true,
    tags: ['rdi', 'part ii'],
    sections: [
      {
        type: 'instruction',
        text: 'CONTENT_REQUIRES_CLINICAL_REVIEW — Advanced Resource Development and Installation belongs with Part II–informed materials and is not mixed into Standard Protocol workflow in this release.',
      },
    ],
  },
];
