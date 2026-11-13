/**
 * De-identified TA golden fixture — "Lisa" case family.
 *
 * Derived from clinical reference material for regression testing only.
 * NOT the original clinical recording. Names of third parties are placeholders.
 * Must never be imported into client/browser bundles — tests/fixtures only.
 *
 * Context: Primary Approach = Transactional Analysis; EMDR inactive.
 */

/** De-identified timed transcript with intentional speaker-label noise. */
export const LISA_GOLDEN_TRANSCRIPT_DEIDENTIFIED = `
[00:05:12] Brent: What's been most present for you this week?
[00:05:28] Speaker 1: Marta is deteriorating. I keep thinking about unfinished things between us. There's guilt, and I don't know how to find closure.
[00:06:40] Speaker 1: It also brings Solomon back — that bereavement — and my university friend who was killed by a drunk driver. Sudden. Incomplete.
[00:08:10] Brent: What happens in you when those losses sit together?
[00:08:30] Speaker 1: I become highly functional when everything is chaotic. I manage tasks and other people. I postpone my own feelings. Outwardly capable. Privately crushing.
[00:10:02] Speaker 1: I scan the room. I adapt or withdraw when I expect limited emotional space. Then I get reactive when I'm dysregulated.
[00:12:15] Ashley: My feelings do not seem to factor. I have to shrink and adapt. Their feelings take up all the room.
[00:13:40] Speaker 1: I withdraw when I believe there's no space for me. I cannot rely on other people to see, hear, or value me.
[00:15:05] Brent: And usefulness?
[00:15:20] Speaker 1: I'm highly available. Being useful. Wanting mutual recognition without overpowering the other person. Sensitivity to criticism. Difficulty communicating hurt early.
[00:18:00] Speaker 1: Being quiet and swallowing it. The things that have to be done can distract you from the feelings you have. I've cried in the shower since adolescence or earlier.
[00:20:30] Speaker 4: I don't like totally break down in front of people, maybe I do that more privately.
[00:21:10] Speaker 1: I can handle it, even if it's fucking crushing me. But I'll do that by myself.
[00:24:00] Brent: What are you wanting for yourself in this work?
[00:24:30] Speaker 1: I want to remain visible, authentic and emotionally present without either disappearing, adapting excessively or overpowering others.
[00:26:00] Speaker 1: I notice what belongs to me and what belongs to other people. I speak rather than yell. I trust my own perception.
[00:27:20] Speaker 1: Adult Lisa remains patiently available to little Lisa.
[00:29:44] Speaker 1: I need to get it right before I let myself be heard.
[00:30:14] Speaker 1: I need perfection before I act.
[00:33:12] Speaker 1: I wait for work to feel perfect before submitting or publishing it. The perfectionism becomes immobilising.
[00:36:00] Brent: And belonging?
[00:36:20] Speaker 1: Sometimes I withdraw and expect there's no room. And also — when I travelled — there are people who think like I do. Find your people. That mattered.
[00:40:00] Speaker 1: My feelings have a place. I can always see and recognize myself. I can trust my judgment and perception.
[00:41:10] Speaker 1: I can enter the conversation before everything feels perfect. I can protect myself without absorbing another person's emotional state.
[00:43:00] Speaker 1: This is acknowledging this allows you the freedom to choose this other thing. This is my decision.
[00:45:00] Brent: So the contract is yours.
[00:45:15] Speaker 1: Yes. From external orientation toward internal reference. Reactivity toward response. Perfection toward sufficiently-good action. Withdrawal toward communication.
`.trim();

export const LISA_GOLDEN_CONTEXT = {
  primaryTreatmentApproach: 'transactional-analysis' as const,
  reasoningMode: 'primary-lens-only' as const,
  secondaryLenses: [] as const,
  emdrActive: false,
  clientDisplayName: 'Lisa',
  therapistDisplayName: 'Brent',
};

/** Quotes that must remain findable for evidence-linked TA hypotheses. */
export const LISA_KEY_QUOTES = {
  bePerfect: [
    'I need to get it right before I let myself be heard.',
    'I need perfection before I act.',
    'I wait for work to feel perfect before submitting or publishing it.',
  ],
  beStrong: [
    "I don't like totally break down in front of people, maybe I do that more privately.",
    "I can handle it, even if it's fucking crushing me. But I'll do that by myself.",
    'The things that have to be done can distract you from the feelings you have.',
  ],
  dontFeel: [
    'being quiet and swallowing it',
    'The things that have to be done can distract you from the feelings you have',
    'cried in the shower',
  ],
  shrinkAdapt: ['I have to shrink and adapt', 'My feelings do not seem to factor'],
  permissions: [
    'My feelings have a place.',
    'I can trust my judgment and perception.',
    'I can enter the conversation before everything feels perfect.',
    'Adult Lisa remains patiently available to little Lisa.',
  ],
  belongingMixed: [
    'there are people who think like I do',
    'Find your people',
    'I withdraw when I believe there\'s no space for me',
  ],
  grief: ['Marta is deteriorating', 'Solomon', 'killed by a drunk driver'],
  contract: ['This is my decision.'],
} as const;

/** Terms that must NOT appear in automatic TA-primary analysis output. */
export const EMDR_LEAKAGE_FORBIDDEN_TERMS = [
  'Responsibility / Defectiveness',
  'responsibility-defectiveness',
  'Safety / Vulnerability',
  'safety-vulnerability',
  'Power / Control',
  'power-control',
  'Negative Cognition',
  'Positive Cognition',
  'touchstone',
  'Touchstone',
  'feeder memory',
  'Feeder Memory',
  'AIP Network',
  'memory network',
  'target memory',
  'Target Memory',
  'VoC',
  'VOC',
  'SUD',
] as const;

/** Soft EMDR theme word "Belonging" alone is ambiguous with TA Don't Belong — check structured fields instead. */
export const EMDR_LEAKAGE_STRUCTURED_KEYS = [
  'negativeCognitions',
  'positiveCognitions',
  'targetCandidates',
  'themes',
  'sudNumeric',
  'vocNumeric',
  'possibleTouchstoneCandidate',
] as const;
