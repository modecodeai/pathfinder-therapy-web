import type { GuidedScriptStep, SourceReference } from '../../guided/types/guidedScript';

const SRC: SourceReference = {
  author: 'Deany Laliotis, LICSW',
  organisation: 'The Center for Excellence in EMDR Therapy',
  title: 'Basic Training Part I — Worksheets',
  date: 'March 2026',
  page: '6–7',
};

const base = {
  protocol: 'safe-calm',
  phase: 'preparation',
  source: SRC,
} as const;

export const SAFE_CALM_STEPS: GuidedScriptStep[] = [
  {
    ...base,
    id: 'sc-guide',
    section: 'guidelines',
    type: 'clinician-note',
    text:
      'Use slower, alternating tactile taps or eye movements for approximately 8–10 passes. Use fewer passes if the client has trouble staying focused or is triggered by a negative association. If BLS is omitted, instruct the client to take a breath between sets of instructions.',
    blsPreset: 'safeCalm',
  },
  {
    ...base,
    id: 'sc-image-1',
    section: 'image',
    type: 'say',
    text: 'Think about an experience you have had or a symbol that comes to mind that makes you feel safe or calm. What comes to mind?',
    fieldKey: 'image',
  },
  {
    ...base,
    id: 'sc-image-2',
    section: 'image',
    type: 'say',
    text: 'What image represents this place, this activity or symbol? Describe what you see.',
    fieldKey: 'imageDetail',
  },
  {
    ...base,
    id: 'sc-emotions',
    section: 'emotions',
    type: 'say',
    text: 'As you think of that experience, notice what you see, hear, and feel. What emotions are you experiencing? What sensations do you have in your body?',
    fieldKey: 'emotionsSensations',
  },
  {
    ...base,
    id: 'sc-enhance',
    section: 'enhancement',
    type: 'say',
    text: 'Focus on your safe/calm place/state — its sights, sounds, smells, and sensations. Tell me more about what you are experiencing.',
  },
  {
    ...base,
    id: 'sc-bls-instruct',
    section: 'bls',
    type: 'say',
    text: 'Bring up the image of this place/state. Concentrate on where you feel the pleasant sensations in your body and allow yourself to fully enjoy them. Concentrate on those sensations and follow the bilateral stimulation.',
  },
  {
    ...base,
    id: 'sc-bls-action',
    section: 'bls',
    type: 'bls-action',
    text: 'Start Safe/Calm BLS (slow · alternating · ~8–10 passes).',
    blsPreset: 'safeCalm',
  },
  {
    ...base,
    id: 'sc-after',
    section: 'bls',
    type: 'say',
    text: 'What are you noticing now?',
  },
  {
    ...base,
    id: 'sc-decision',
    section: 'bls',
    type: 'decision',
    text: 'IF POSITIVE: “Focus on that.” (Add additional set of BLS.) What do you notice now?\nIF NEGATIVE: Redirect attention completely away from the experience. Ground and reorient. If successful, bring it up again: “Focus on that. What comes up now?” If still unsuccessful, identify another calm or safe association and repeat.',
  },
  {
    ...base,
    id: 'sc-cue',
    section: 'cue',
    type: 'say',
    text: 'Is there a word or phrase that represents your safe/calm place/state?',
    fieldKey: 'cueWord',
  },
  {
    ...base,
    id: 'sc-cue-bls',
    section: 'cue',
    type: 'say',
    text: 'Think of that word/phrase and notice the positive feelings and sensations. Concentrate on those sensations and the word/phrase, and follow the BLS.',
  },
  {
    ...base,
    id: 'sc-cue-bls-action',
    section: 'cue',
    type: 'bls-action',
    text: 'Run another slow BLS set while holding cue word + sensations.',
    blsPreset: 'safeCalm',
  },
  {
    ...base,
    id: 'sc-self-cue',
    section: 'self-cuing',
    type: 'say',
    text: 'Now say that word/phrase and notice how you feel.',
  },
  {
    ...base,
    id: 'sc-mild',
    section: 'self-cuing',
    type: 'say',
    text: 'Now imagine a minor annoyance (SUD 1–2) and notice how you feel. Bring up the cue word/phrase and notice any shifts. What do you notice?',
  },
  {
    ...base,
    id: 'sc-more',
    section: 'self-cuing',
    type: 'say',
    text: 'Think of another mildly annoying incident (SUD 2–3), notice how you feel, then bring up that word by yourself. Notice the changes in your body when you redirect attention to your cue word/phrase.',
  },
  {
    ...base,
    id: 'sc-practice',
    section: 'practice',
    type: 'clinician-note',
    text: 'Invite the client to practice self-use between sessions when triggered and needing to self-soothe — shifting from distress toward relative calm.',
  },
];

export const SAFE_CALM_SOURCE_LABEL =
  'The Center for Excellence in EMDR Therapy — Basic Training Part I Worksheets (March 2026)';
