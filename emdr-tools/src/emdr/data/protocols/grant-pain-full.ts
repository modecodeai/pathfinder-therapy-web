import type { ProtocolScriptSection } from '../../types/painProtocol';

const SRC = 'Mark Grant — EMDR Pain Protocol (Pain Protocol Grant v4 full)';

/** Verbatim therapist-script sections from Pain Protocol Grant v4 full.pdf */
export const GRANT_PAIN_FULL: ProtocolScriptSection[] = [
  {
    id: 'full-aip',
    title: 'Pain and the Adaptive Information Processing Model',
    phase: 'orientation',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“Pain can occur for many reasons. We generally understand pain as a signal that something is wrong physically. However, sometimes pain can continue longer than expected, despite medical treatment. Pain can persist because of fatigue, stress, and biochemical and neurological changes. As a result of these changes, the pain becomes “locked” in the nervous system. EMDR is a way of stimulating the nervous system to facilitate healing. Even though we might not be able to completely eliminate your pain, EMDR often stimulates feelings of relaxation, which always reduces pain.

We can’t predict how your nervous system will respond to the EMDR stimulation, so try and adopt an open mind and just notice the sensations of your pain as best you can. Initially, the intensity of the pain may not seem to change, or it may even increase, this is just the pain response shifting in response to the stimulation. In the unlikely event that the pain increases to an intolerable level, just raise your hand like this (show stop signal). Remember your nervous system knows what to do, so there’s no need to try and make it happen, just notice and just let whatever happens happen.

What we will be doing often is a simple check on what you are experiencing. I need to know from you exactly what is going on, with as clear feedback as possible. Sometimes things will change and sometimes they won’t. There are no ‘supposed to’s’ . Just notice and just let whatever happens happen.”`,
    clinicalNotes: [
      'Begin by explaining chronic pain in terms of the Adaptive Information Processing model.',
    ],
  },
  {
    id: 'full-target-traumatic',
    title: 'EMDR Target — Traumatic Pain',
    phase: 'target-selection',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“When you think of the incident that led to your pain, what picture do you get?”`,
  },
  {
    id: 'full-target-present',
    title: 'EMDR Target — Non-Traumatic Pain',
    phase: 'target-selection',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“Can you describe the pain in terms of how it feels physically?” (suggest size, color, etc if client needs help describing their pain)?

Where clients are really unable to find words or images to describe their pain, ask them to draw a picture of their pain. Do not be put off by clients’ objections that they are not artists; even a dark angry line can be a helpful tool in focusing the client and concretizing the pain.

The point of getting the client to describe their pain is to help them connect with it in preparation for the desensitization state. Once this has happened, there is no need to ask the client to describe it any further - in fact there is a risk the client will go into an intellectual mode or other form of avoidance.`,
  },
  {
    id: 'full-nc',
    title: 'Negative Cognition (NC)',
    phase: 'negative-cognition',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“What does the pain (or memory) make you believe about yourself ?”`,
  },
  {
    id: 'full-pc',
    title: 'Positive Cognition (PC)',
    phase: 'positive-cognition',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“When you bring up that picture/or incident, or when you think of your pain, what would you like to believe about yourself, now?”`,
  },
  {
    id: 'full-voc',
    title: 'VoC',
    phase: 'voc',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Elicit a Validity of Cognition.

“When you think of the pain, how true do those words____ (clinician repeats the positive cognition) feel to you now on a scale of 1-7, where 1 feels completely false and 7 feels totally true?”

1      2      3      4       5      6      7
(completely false)       (completely true)`,
  },
  {
    id: 'full-emotion',
    title: 'Emotions',
    phase: 'emotion',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Elicit the emotions.

“When you think of the pain and those words_____ (clinician states the negative cognition), what emotion do you get now?”

Note, if pain is the main presenting problem, you may skip this question.`,
  },
  {
    id: 'full-sud',
    title: 'SUD',
    phase: 'pain-sud',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Elicit the SUD.

“On a scale of 0 to 10, where 0 is no pain or neutral and 10 is the worst you can imagine, how bad does your pain feel right now?”

0  1    2     3     4      5     6     7     8     10
(no disturbance)                             (highest disturbance)`,
  },
  {
    id: 'full-sensation',
    title: 'Sensation/Location',
    phase: 'sensation-location',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Elicit the sensation/location. If you have already done this (eg; when you asked the client to describe their pain earlier) you may go straight to desensitization.

“Where do you feel it (the pain) in your body?”`,
  },
  {
    id: 'full-desensitisation',
    title: 'Desensitization',
    phase: 'desensitisation',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“Now I’d like you to focus on the pain [or memory] the way you’ve just described it, and those words (NC), listen to the bilateral tones and just let whatever happens happen.” Commence DAS/Bls (preferably audio, with eyes closed or fixated on upright finger or pen in centre of clients vision, and either continuous or 30 – 60 seconds. If using continuous DAS/Bls do not cease Bls when checking-in with client).

Say, “What do you notice now?”

If client reports a positive difference, elicit details and re-stimulate using what they reported as a target.
“That’s fine, just go with that.”
Continue Bls and review until a relatively stable level of improvement is achieved.

Responses like “It feels better,” are okay, but asking for more details will elicit better target for reprocessing, as in the following:
“But how does it feel better? What feels different about it?”

When you get a response that is something concrete, such as, “softer, smaller”, you have a better target with which to continue processing.
Then say, “Notice that.”
And re-stimulate.

Never accept responses like “Nothing” or “It’s the same”. These are analyses rather than direct reports, and give you nothing to reprocess.
Say, “Yes, okay, but I need to know exactly what you are experiencing, like when you described it before we started.”

NB. Stop the Bls if it is making the pain worse, use other methods (e.g., hypnosis, imagery, pacing, emotional containment techniques, support, etc.) to manage the pain.

As long as the pain is changing, keeping saying, “Notice that.” after each set of Bls

Continue Bls and reviewing the clients’ responses until the clients’ SUD has decreased to an acceptable level for the clients before proceeding to the Installation Phase. An acceptable level of pain may be anywhere between zero and a four or five. The best way to determine this is to ask clients whether they think they can achieve any further improvement or not and whether they feel like continuing.

Say, “On a scale of 0 to 10, where 0 is no disturbance or neutral and 10 is the highest disturbance you can imagine, how bad does it feel now?”

“Does it feel like you can achieve any further improvement?”

When the number is higher than zero ask:
“What prevents the number from being a zero?”
Or
“If you focus on the number ____(state the number given), what is behind it?

“Go with that.”
Pause and ask client what they notice now. If they report feeling better ask,
“Do you want to continue?”

Also look for physical signs of progress such as changes in posture, facial expression, and so forth. If you are ‘in-tune’ with your client you should be able to sense their energy levels and capacity for further work versus needing to finish.

Note: If the client has a medical condition, you need to understand the implications of this when deciding how low the pain SUD’s can go. a zero may not be realistic.`,
  },
  {
    id: 'full-installation-intro',
    title: 'Installation',
    phase: 'installation-route',
    source: SRC,
    guidanceKind: 'protocol',
    script: `When working with pain control, depending on whether the pain is trauma-related or not, positive cognitions and/or antidote imagery are installed to assist in controlling pain. The most effective antidote imagery is derived from mental associations based on how the client feels rather than suggestions from the therapist.

“Think of something that reminds you of that feeling of relaxation or pain relief.”
“What is it?”

The idea is to link the feeling of relief to a memory association. Clients will say things like ‘”a wet blanket,” “ a pac-man,” ‘”an absorbent sponge.” Once clients have identified a healing image, ask them to think of a word that goes with that image and install it by pairing it with DAS.
“Now think of a word that goes with that image and go with that.”
Re-stimulate.`,
  },
  {
    id: 'full-installation-pc',
    title: 'Installation — Positive Cognition',
    phase: 'installation-pc',
    source: SRC,
    guidanceKind: 'protocol',
    script: `If the client has a cessation of pain, with SUD = 0 and VOC = 7, follow the normal installation directions.

“How does ____(repeat the PC) sound?”

“Do the words ____(repeat the PC) still fit, or is there another positive statement that feels better?”

If the client accepts the original positive cognition, the clinician should ask for a VOC rating to see if it has improved:

“ As you think of the pain (or memory), how do the words feel, from 1 (completely false) to 7 (completely true?)?”

“Think of the pain (or memory), and hold it together with the words ________________ _____________________(repeat the PC) .”

Do a long set of BLS to see if there is more processing to be done.`,
  },
  {
    id: 'full-antidote',
    title: 'Installation (antidote imagery)',
    phase: 'antidote-imagery',
    source: SRC,
    guidanceKind: 'protocol',
    script: `When the client reports differences in pain or changes in way it’s perceived, ask questions to build a resource out of the change.

“So what’s come in the pain’s place? What’s there now where the pain was before?”

Sometimes, when the pain doesn’t change of its own accord, it may be necessary to instruct the client to do the following:

“Think of something that could take the pain away or make it better, don’t worry about whether it seems realistic or not, just let your imagination run wild”.

Once you obtain something concrete, (e.g., smooth, softer, smaller, etc) re-stimulate. If change continues, after a couple more sets, ask the following:

Say, “What’s that like? What does it remind you of?”
Pair a word with the metaphor and install.

“Is there a word that goes with how you feel when you think of that image?”
Resume DAS until the client reports stable link between the image and the trigger word.

Note: The last two steps can be used as an alternative to eliciting the positive cognition prior to the desensitization (as per normal trauma protocol).
Note: quite a bit of review and reinforcement of pain-management skills may be necessary before the client is ready to endorse the positive cognition.`,
  },
  {
    id: 'full-voc-review',
    title: 'VoC (review)',
    phase: 'voc-review',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“When you think of the pain now, how true do those words____ (clinician repeats the positive cognition) feel to you now on a scale of 1-7, where 1 feels completely false and 7 feels totally true?”

1      2      3      4       5      6      7

“Is there another positive statement or cognition that fits better now? If so, what would it be?”`,
  },
  {
    id: 'full-body-scan',
    title: 'Body Scan',
    phase: 'body-scan',
    source: SRC,
    guidanceKind: 'protocol',
    script: `If clients report, “No change” following the DAS, use a cognitive interweave as in the following:
“Are you sure it is really no different?”

If the client answers ‘yes’ say,
“OK, do you have any idea about what’s stopping the pain from changing?”

When the client reports no pain or it is apparent that the client cannot improve any further,

“Close your eyes and keep in mind the original memory/image and the positive cognition. Then bring your attention to the different parts of your body, starting with your head and working downward. Any place you find any tension, tightness or unusual sensation, tell me .”`,
  },
  {
    id: 'full-closure',
    title: 'Closure',
    phase: 'closure',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“Now that you are feeling better you are probably wondering how long the effects will last. Experience suggests that these changes can last anywhere from a few hours to being permanent. Even if the pain comes back, it is often weaker because of the way EMDR effects memory. The most important thing is to just have an open mind and pay attention to what you are feeling in the present. Many people find that EMDR helps them feel more in touch with their feelings and this can lead to increased self-care and reduced stress and pain flare-ups.

You can also use the bilateral stimulation by yourself to control your pain. I am going to give you a recording of this sound. Whenever you need relief from pain (or stress, or even insomnia) just play this CD and concentrate on the negative feelings you want relief from, just like you did here today. The more you practice the more you will succeed. Of course if your pain persists beyond what you feel you can cope with you should always seek medical help”

Clients with on-going pain, will need resources to help control that pain. You may teach them visualization strategies such as healing light or anaesthetic mist (both of which are on my pain control with EMDR CD) or you can use the positive changes following DAS/Bls to construct antidote imagery. I prefer the latter because it is more grounded in the clients own sensory experience. Resource development can happen anytime the client has achieved a reasonable stable change.`,
  },
  {
    id: 'full-reevaluation',
    title: 'Re-evaluation',
    phase: 're-evaluation',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Each session should begin by reviewing client’s experience of their pain and related stress or trauma over the period since the last session. Changes in sleeping patterns, physiological arousal and activity levels need to be screened for, identified and feed-back to clients to avoid a false perception that nothing has changed.

“So what have you noticed about your pain since our last session?”

If the client says nothing, ask more direct questions.
“Have you noticed any changes in your sleeping pattern?”
“Have you noticed any changes in your activity levels since last time?”
“Have you done anything different or unusual?
Have you noticed any changes in your mood since last time?”

Inquire about specific areas of the client’s life that they have identified as problematical or affected by their stress, trauma or pain, such as sleep, relationships, activity levels etc.
“Tell me about _______(state problem areas) since the last session. What have you noticed?”

It is not uncommon for clients to fail to notice changes because of depression, alexithymia or negative thinking. Asking detailed, change-oriented questions helps the client recognize those important changes, exceptions and new trends. The therapist needs to check with clients for any changes in how they have been feeling in terms of the material that was processed at the previous session and use this as a basis for constructing new targets for EMDR reprocessing. It is not uncommon for the image of the pain to change between sessions, as the clients experience changes, particularly if progress is being made.

EMDR treatment of chronic pain is often less ‘successful’ in terms of the kinds of dramatic treatment gains that can be expected from EMDR treatment of simple PTSD. This is not surprising; chronic pain is maintained by injury processes which are not as amenable to change as mental or emotional phenomena. Where the client is left with residual pain to any significant degree, EMDR may need to be supplemented by adjunctive pain management strategies such as sleep management strategies, exercise, resilience building etc.

This protocol is based on the original EMDR trauma protocol, as developed by Francine Shapiro Phd.`,
  },
];

export function getFullSectionForStage(phase: string): ProtocolScriptSection | undefined {
  return GRANT_PAIN_FULL.find((s) => s.phase === phase);
}
