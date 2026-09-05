import type { ProtocolScriptSection } from '../../types/painProtocol';

const SRC = 'Mark Grant — EMDR Pain Protocol (short version)';

/** Verbatim short protocol — kept separate from the full protocol; do not merge. */
export const GRANT_PAIN_SHORT: ProtocolScriptSection[] = [
  {
    id: 'short-target',
    title: 'Target',
    phase: 'target-selection',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Develop target based on whether pain is trauma-related or not.

a) Traumatic Pain
“When you think of the incident that led to your pain, what picture do you get?”

b) Non-Traumatic Pain
“Can you describe the pain in terms of how it feels physically?” (suggest size, color, etc if client needs help describing their pain)?

Where clients are really unable to find words or images to describe their pain, ask them to draw a picture of their pain. Do not be put off by clients’ objections that they are not artists; even a dark angry line can be a helpful tool in focusing the client and concretizing the pain.

The point of getting the client to describe their pain is to help them connect with it in preparation for the desensitization state. Once this has happened, there is no need to ask the client to describe it any further - in fact there is a risk the client will go into an intellectual mode or other form of avoidance.`,
  },
  {
    id: 'short-nc',
    title: 'Negative Cognition (NC)',
    phase: 'negative-cognition',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“What does the pain (or memory) make you believe about yourself ?”`,
  },
  {
    id: 'short-pc',
    title: 'Positive Cognition (PC)',
    phase: 'positive-cognition',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“When you bring up that picture/or incident, or when you think of your pain, what would you like to believe about yourself, now?”`,
  },
  {
    id: 'short-voc',
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
    id: 'short-emotion',
    title: 'Emotions',
    phase: 'emotion',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Elicit the emotions.

“When you think of the pain and those words_____ (clinician states the negative cognition), what emotion do you get now?” Note, if pain is the main presenting problem, you may skip this question.`,
  },
  {
    id: 'short-sud',
    title: 'SUD',
    phase: 'pain-sud',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Elicit the SUD.

“On a scale of 0 to 10, where 0 is no pain (or distress) or neutral and 10 is the worst you can imagine, how bad does your pain feel right now?”

0  1    2     3     4      5     6     7     8     10
(no disturbance)                             (highest disturbance)`,
  },
  {
    id: 'short-sensation',
    title: 'Sensation/Location',
    phase: 'sensation-location',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Elicit the sensation/location. If you have already done this (eg; when you asked the client to describe their pain earlier) you may go straight to desensitization.

“Where do you feel it (the pain) in your body?”`,
  },
  {
    id: 'short-desensitisation',
    title: 'Desensitization',
    phase: 'desensitisation',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“Now I’d like you to focus on the pain [or memory] the way you’ve just described it, and those words (NC), listen to the bilateral tones and just let whatever happens happen.” Commence Bls (preferably continuous audio and do not cease Bls when checking-in with client until after you notice a change or you feel like its been long enough for something to have happened).

Say, “What do you notice now?”
If client reports a positive difference, say,
“That’s fine, just go with that.”
Continue Bls and review until a relatively stable level of improvement is achieved.

When the pain is gone or the changes have plateaued review SUDs and Voc.
Say, “On a scale of 0 to 10, where 0 is no disturbance or neutral and 10 is the highest disturbance you can imagine, how bad does it feel now?”

“Does it feel like you can achieve any further improvement?”

If the pain (or distress) is still a SUD’s of more than zero ask;:
“What prevents the number from being a zero?”
“Go with that.” Discuss whatever response is given and ask the client whether or not they would like to continue working

Pause and ask client what they notice now. If they report feeling better ask,
“Do you want to continue?” If the client answers yes restimulate until the pain has resolved fully or the changes plateau and return to Voc. If no go to installation phase (either creating antidote imagery if client has residual pain or normal installation if pain is satisfactorily resolved).`,
  },
  {
    id: 'short-antidote',
    title: 'Installation (antidote imagery) — sensory changes',
    phase: 'antidote-imagery',
    source: SRC,
    guidanceKind: 'protocol',
    script: `1. Imagery based on sensory changes
Whats there now where the pain was before? Can you describe those feelings of comfort (eg; soft, loose, natural etc).
What do those feelings remind you of ? What do they feel like? (eg; a pool of water, a wet towel etc)
“Now think of a word that goes with that image and go with that.”
Re-stimulate.`,
  },
  {
    id: 'short-imaginal',
    title: 'Imaginal healing imagery',
    phase: 'imaginal-healing',
    source: SRC,
    guidanceKind: 'protocol',
    script: `2. Imaginal healing imagdery
“Think of something that could take the pain away or make it better, don’t worry about whether it seems realistic or not, just let your imagination run wild”.
Commence bls while the client is still searching for an answer to the question. Cease bls after 30 -45 seconds and ask “what did you get?” or “what came up?”
“How does that make you feel?”

Assuming its something positive, instruct client to “think of that” and restimulate with bls.
If the client cant think of anything advise them this is just an imaginal exercise and it doesn’t have to be realistic. But do not accept answers like an injection or an operation - these are not sufficiently client-based,

Once the client has focused on the healing image + bls a couple of times with it either holding or strengthening, ask;
“Is there a word that goes with how you feel when you think of that image?”
Resume bls until the client reports stable link between the image and the trigger word and instruct client to practice thinking of their healing imagery as often as they can when they are in pain and to try and find or add a new detail each time they do it so it becomes richer and stronger.`,
  },
  {
    id: 'short-pc-install',
    title: 'Installation phase — VoC / PC',
    phase: 'installation-pc',
    source: SRC,
    guidanceKind: 'protocol',
    script: `VoC
If you skipped the VoC in the set up say; So if I ask you to think of the changes that have happened here what belief do you have about your ability to manage the pain now?
If you did obtain a VoC in the set-up phase say “When you think of the pain now, how true do those words____ (clinician repeats the positive cognition) feel to you now on a scale of 1-7, where 1 feels completely false and 7 feels totally true?”

Sometimes the original VoC is not longer a good fit. Ask; “Is there another positive statement or cognition that fits better now? If so, what would it be?”

Instruct the client to “just think of your pain now and that thought and just notice.. ”
Perform 8 slow bilateral eye movements. Check again.
“So how does that feel now?”`,
  },
  {
    id: 'short-body-scan',
    title: 'Body Scan',
    phase: 'body-scan',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“So if I ask you to think of your original pain (or distress) now, how does it feel in your body?”
You should have already done this but if any significant discomfort is still reported restimulate with bls or create antidote resources if you havent already.
“OK, do you have any idea about what’s stopping the pain from changing?”
When the client reports no pain or it is apparent that the client cannot improve any further,
“Close your eyes and keep in mind the original memory/image and the positive cognition. Then bring your attention to the different parts of your body, starting with your head and working downward. Any place you find any tension, tightness or unusual sensation, tell me.”`,
  },
  {
    id: 'short-closure',
    title: 'Closure',
    phase: 'closure',
    source: SRC,
    guidanceKind: 'protocol',
    script: `“Now that you are feeling better you are probably wondering how long the effects will last. Experience suggests that these changes can last anywhere from a few hours to being permanent. Even if the pain comes back, it is often weaker because of the way EMDR effects memory. The most important thing is to just have an open mind and pay attention to what you are feeling in the present. Many people find that EMDR helps them feel more in touch with their feelings and this can lead to increased self-care and reduced stress and pain flare-ups.

You can also use the antidote imagery we created or bilateral stimulation by yourself to control your pain. I am going to give you a recording of this sound. Whenever you need relief from pain (or stress, or even insomnia) just play this app/audio download/CD etc (whatever applies). and concentrate on the negative feelings you want relief from, just like you did here today. The more you practice the more you will succeed. Of course if your pain persists beyond what you feel you can cope with you should always seek medical help”

Clients with on-going pain, will need resources to help control that pain. See the client resources section at the end of the manual for various ideas about how clients with unresolved pain can cope.`,
  },
  {
    id: 'short-reevaluation',
    title: 'Re-evaluation',
    phase: 're-evaluation',
    source: SRC,
    guidanceKind: 'protocol',
    script: `Reviewing the clients experience of their pain since the last session.
“So what have you noticed about your pain since our last session?”
If the client says nothing, ask more direct questions.
“Have you noticed any changes in your sleeping pattern?”
“Have you noticed any changes in your activity levels since last time?”
“Have you done anything different or unusual?
Have you noticed any changes in your mood since last time?”

Inquire about specific areas of the client’s life that they have identified as problematical or affected by their stress, trauma or pain, such as sleep, relationships, activity levels etc.
“Tell me about _______(state problem areas) since the last session. What have you noticed?”

It is not uncommon for clients to fail to notice changes because of depression, alexithymia or negative thinking. Asking detailed, change-oriented questions helps the client recognize those important changes, exceptions and new trends.`,
  },
];
