/**
 * De-identified TA-first Kat golden fixture.
 * Derived clinical reference material for regression only — not original recording.
 * Test-only: never import into client/browser bundles.
 */

export const KAT_GOLDEN_CONTEXT = {
  primaryTreatmentApproach: 'transactional-analysis' as const,
  reasoningMode: 'primary-lens-only' as const,
  secondaryLenses: [] as const,
  emdrActive: false,
  clientDisplayName: 'Kat',
  therapistDisplayName: 'Brent',
  suggestedClinicalEndTimestamp: '01:17:33',
};

export const KAT_GOLDEN_TRANSCRIPT_DEIDENTIFIED = `
[00:04:10] Brent: What's been happening for you?
[00:04:40] Speaker 1: I've been dating someone. When it gets closer I feel cornered. I need time after contact. I pull back.
[00:06:20] Speaker 1: I laugh about it, but underneath I'm scared of repeating old experiences.
[00:08:00] Brent: What's happening for you when closeness increases?
[00:08:30] Speaker 1: I get hyper-attuned to the other person. Then overstimulated. Then I withdraw and need to explain myself. Exhausted. Angry.
[00:12:00] Speaker 1: After sexual harassment I left the table when people showed empathy. It was too much. Empathy made it more real than I could sit with.
[00:15:40] Speaker 1: There was sexual assault earlier. And not being believed. Social exclusion. I fear being labelled.
[00:18:20] Speaker 1: It's kind of like I'm watching myself doing things. At times it was not me, it was her.
[00:20:00] Brent: Who is scared?
[00:20:30] Speaker 1: Little Kat doesn't feel safe when people get too close. Adult me knows more now.
[00:22:10] Brent: Little Kat doesn't feel safe — is that how it lands for you?
[00:22:40] Speaker 1: Something like that. Protective one steps in. Critical Parent says understand everything first.
[00:26:00] Speaker 1: I used to need to dissect every single thing. Now I don't have to dissect every single thing.
[00:28:30] Speaker 1: I can notice feelings and where they are in the body more than before. Still, understanding is easier than sitting with it.
[00:32:00] Speaker 1: I'm concerned about falling back into a hole. I have stronger social support now though.
[00:35:00] Ashley: I want closeness and I also need autonomy. I care deeply and then get dismissive when I feel more invested.
[00:38:00] Speaker 1: Humour helps. Sometimes I over-rationalise so I don't get flooded.
[00:42:00] Brent: What do you think is going on underneath the withdrawal?
[00:42:40] Speaker 1: If I get close, I may lose freedom or get hurt. Other people's reactions tell me whether I am safe.
[00:48:00] Speaker 1: Contract for change — I want to feel safe, seen, playful, understood, content, peaceful, hopeful.
[00:50:00] Speaker 1: I am enough. I am loved. I am smart. I am beautiful. I can ask for help. I can enforce boundaries.
[00:52:30] Speaker 1: Be more open. Let people know me. Trust selectively. Sit with emotions. Use humour without masking emotion. Remain optimistic.
[00:55:00] Speaker 1: Stop self-harm. Not think about not wanting to live.
[01:00:00] Speaker 1: I'm communicating more directly and keeping boundaries. Still cautious.
[01:10:00] Brent: So there's choice — Adult capacity growing.
[01:10:40] Speaker 1: Yes. I want Free Child spontaneity without losing safety.
[01:17:33] Speaker 1: That's enough for today.
[01:18:10] Speaker 2: Continue straight for 200 metres then turn left.
[01:19:00] ChatGPT: Here's a summary of your conversation tips.
[01:20:00] Speaker 5: Can you play some music?
`.trim();

export const KAT_KEY_OBSERVATIONS = [
  'I feel cornered',
  'I pull back',
  'watching myself doing things',
  'it was not me, it was her',
  'left the table when people showed empathy',
  'falling back into a hole',
  'I don\'t have to dissect every single thing',
] as const;

export const KAT_RISK_PHRASES = ['Stop self-harm', 'not wanting to live'] as const;

export const KAT_CONTRACT_PHRASES = [
  'I am enough',
  'I can ask for help',
  'I can enforce boundaries',
  'Sit with emotions',
] as const;

export const EMDR_LEAKAGE_FORBIDDEN_FOR_KAT = [
  'Responsibility / Defectiveness',
  'responsibility-defectiveness',
  'safety-vulnerability',
  'power-control',
  'touchstone',
  'Touchstone',
  'feeder memory',
  'AIP Network',
  'target memory',
  'Target Memory',
  'negativeCognitions',
  'positiveCognitions',
  'sudNumeric',
  'vocNumeric',
] as const;
