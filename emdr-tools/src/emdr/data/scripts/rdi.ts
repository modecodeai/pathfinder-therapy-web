import type { GuidedScriptStep, SourceReference } from '../../guided/types/guidedScript';

const SRC: SourceReference = {
  author: 'Deany Laliotis, LICSW',
  organisation: 'The Center for Excellence in EMDR Therapy',
  title: 'Appendix B — Forms, Scripts and Worksheets',
  date: 'March 2026',
};

const base = {
  protocol: 'rdi',
  phase: 'preparation',
  source: SRC,
} as const;

export const RDI_STEPS: GuidedScriptStep[] = [
  {
    ...base,
    id: 'rdi-intro',
    section: 'orientation',
    type: 'clinician-note',
    text:
      'Resource Development & Installation (RDI). Use slower predictable BLS. In preparation for memory reprocessing, do not install a quality that is part of the issue being worked (e.g., feeling good about oneself when the issue is low self-esteem).',
    blsPreset: 'rdi',
  },
  {
    ...base,
    id: 'rdi-quality',
    section: 'quality',
    type: 'say',
    text: 'What quality do you need or need more of as you consider approaching this memory (or set of experiences)? Describe this quality.',
    fieldKey: 'desiredQuality',
  },
  {
    ...base,
    id: 'rdi-type',
    section: 'resource-type',
    type: 'clinician-note',
    text: 'Resource type: Mastery / Relational / Symbolic — clinician selects with the client.',
    fieldKey: 'resourceType',
  },
  {
    ...base,
    id: 'rdi-experience',
    section: 'experience',
    type: 'say',
    text: 'Can you remember a time when you have used this quality before? If not: Can you think of someone you know or know of, or something that represents this needed quality?',
    fieldKey: 'resourceExperience',
  },
  {
    ...base,
    id: 'rdi-image',
    section: 'image',
    type: 'say',
    text: 'What image represents this quality?',
    fieldKey: 'image',
  },
  {
    ...base,
    id: 'rdi-soma',
    section: 'somatic',
    type: 'say',
    text: 'As you think about this quality, notice what you feel and where you feel it in your body right now. What do you notice?',
    fieldKey: 'body',
  },
  {
    ...base,
    id: 'rdi-enhance',
    section: 'enhancement',
    type: 'say',
    text: 'Focus on this quality—what you see, what you feel—notice where you feel it in your body. Take a moment to be with your experience. Tell me more about it.',
  },
  {
    ...base,
    id: 'rdi-bls',
    section: 'strengthen',
    type: 'say',
    text: 'Bring up the image of this quality. Notice where you feel those sensations in your body and allow yourself to experience them fully. Concentrate on the experience and follow my fingers.',
  },
  {
    ...base,
    id: 'rdi-bls-action',
    section: 'strengthen',
    type: 'bls-action',
    text: '6–12 slower BLS (RDI preset).',
    blsPreset: 'rdi',
  },
  {
    ...base,
    id: 'rdi-after',
    section: 'strengthen',
    type: 'say',
    text: 'How does it feel to you now?',
  },
  {
    ...base,
    id: 'rdi-decision',
    section: 'strengthen',
    type: 'decision',
    text: 'IF POSITIVE: “Focus on that.” (BLS) What do you notice now? Repeat until strengthened.\nIF NEGATIVE: Redirect to another experience associated with that resource, or consider another resource.',
  },
  {
    ...base,
    id: 'rdi-cue',
    section: 'cue',
    type: 'say',
    text: 'Is there a word or a phrase that represents this resource?',
    fieldKey: 'cueWord',
  },
  {
    ...base,
    id: 'rdi-cue-bls',
    section: 'cue',
    type: 'bls-action',
    text: 'Cue word + sensations with 6–12 slower BLS.',
    blsPreset: 'rdi',
  },
  {
    ...base,
    id: 'rdi-self',
    section: 'self-cuing',
    type: 'say',
    text: 'Now I would like you to say that word and notice how it feels in your body.',
  },
  {
    ...base,
    id: 'rdi-future',
    section: 'future-rehearsal',
    type: 'say',
    text: 'Imagine the situation that you would like to respond to more effectively. Run a movie of your desired response using your resource as a needed quality. What do you notice?',
    fieldKey: 'futureScenario',
  },
  {
    ...base,
    id: 'rdi-future-bls',
    section: 'future-rehearsal',
    type: 'bls-action',
    text: 'Once the movie runs with an appropriate response, add one or more sets of slower BLS (~6–12). After each set: What are you noticing now?',
    blsPreset: 'rdi',
  },
];

export const RDI_SOURCE_LABEL =
  'The Center for Excellence in EMDR Therapy — Appendix B Forms (March 2026) / Part II-A';
