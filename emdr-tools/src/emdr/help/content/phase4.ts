import type { EMDRScript } from '../types';

export const PHASE4_SCRIPTS: EMDRScript[] = [
  {
    id: 'phase4-processing-checkin',
    title: 'After a set — check in',
    phase: 'desensitisation',
    category: 'reprocessing',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 4 Desensitisation',
      page: 41,
    },
    tags: ['desensitisation', 'phase4', 'check-in', 'processing'],
    sections: [
      {
        type: 'ask',
        heading: 'Primary check-in',
        text: 'What are you noticing now?',
      },
      {
        type: 'say',
        heading: 'Minimal follow-up (when clinically appropriate)',
        text: 'Notice that. / Stay with that. / Go with that.',
      },
      {
        type: 'instruction',
        text: 'Follow the client’s processing rather than attempting to intellectually interpret each association.',
      },
      {
        type: 'caution',
        text: 'Keep interventions brief during active channels. Stop or modify stimulation if the client signals stop or becomes overwhelmed.',
      },
    ],
  },
  {
    id: 'phase4-change-path',
    title: 'When there is change / new material',
    phase: 'desensitisation',
    category: 'decision-support',
    sourceType: 'pathfinder-original',
    tags: ['change', 'phase4'],
    sections: [
      {
        type: 'decision-point',
        text: 'Continue following the emerging material with another set when clinically appropriate.',
      },
      {
        type: 'observe',
        text: 'Track whether associations remain connected to the target network or shift into a new channel.',
      },
    ],
  },
  {
    id: 'phase4-no-change-once',
    title: 'No change after one set',
    phase: 'desensitisation',
    category: 'decision-support',
    sourceType: 'pathfinder-original',
    tags: ['no change', 'phase4'],
    sections: [
      {
        type: 'instruction',
        text: 'A single set with no reported change does not by itself require intervention. Consider another set if clinically indicated.',
      },
    ],
  },
  {
    id: 'phase4-no-change-twice',
    title: 'No change across two consecutive sets',
    phase: 'desensitisation',
    category: 'decision-support',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 4 — clinical decision points',
    },
    tags: ['no change', 'phase4', 'blocking'],
    clinicalNote:
      'Reminder only. Do not auto-select an interweave or terminate processing.',
    sections: [
      {
        type: 'decision-point',
        text: 'No change has been recorded across two consecutive sets. Consider whether you are at the end of a channel or whether further assessment/intervention is indicated.',
      },
      {
        type: 'observe',
        heading: 'Possible areas to consider',
        text: 'Target activation · blocking belief · current safety · dissociation · developmental needs · information deficit · need for an interweave.',
      },
      {
        type: 'caution',
        text: 'These are considerations for your clinical judgement — not automated recommendations. Advanced interweave material belongs in later Part II–informed content.',
      },
    ],
  },
  {
    id: 'phase4-return-to-target',
    title: 'Return to target',
    phase: 'desensitisation',
    category: 'reprocessing',
    sourceType: 'source-derived',
    sourceReference: {
      document: 'Part 1 Basic Training Manual 03-2026',
      section: 'Phase 4 — returning to target',
    },
    tags: ['return to target', 'phase4', 'sud'],
    sections: [
      {
        type: 'instruction',
        text: 'After a channel changes or plateaus, you may return to the original target to reassess present disturbance without discarding processing history.',
      },
      {
        type: 'ask',
        text: 'When you go back to the original experience (or image), what do you notice now? How disturbing does it feel from 0–10?',
      },
    ],
  },
];
