import type { EMDRScript } from '../types';

/** Working Memory Taxation & EMDR 2.0-informed practice — practitioner guidance */
export const WORKING_MEMORY_TAXATION_SCRIPTS: EMDRScript[] = [
  {
    id: 'wmt-overview',
    title: 'Working Memory Taxation & EMDR 2.0-Informed Practice',
    phase: 'desensitisation',
    category: 'technique',
    sourceType: 'pathfinder-original',
    tags: ['working-memory', 'taxation', 'emdr-2.0-informed', 'phase4', 'chaos'],
    clinicalNote:
      'EMDR 2.0-informed tools — not EMDR 2.0 training, not a validated app protocol, and not a replacement for standard EMDR.',
    sections: [
      {
        type: 'instruction',
        heading: 'What is working-memory taxation?',
        text: 'Working memory has limited capacity. During trauma processing, recalling a disturbing memory already requires working-memory resources. Performing another demanding task at the same time creates competition for those resources. Experimental research indicates that appropriately demanding secondary tasks during memory recall can reduce the vividness and emotionality of the recalled material. Eye movements themselves impose working-memory demand, and increasing eye-movement speed can increase that demand. Other studied tasks include mental arithmetic, verbal counting and other cognitively demanding activities.',
      },
      {
        type: 'instruction',
        heading: 'What is EMDR 2.0?',
        text: 'EMDR 2.0 builds upon standard EMDR and places greater emphasis on optimising memory activation and working-memory taxation. Examples described in the literature include rapid or complex eye movements, diagonal and vertical tracking, spelling forwards or backwards, reciting the alphabet, singing and complex rhythmic tapping. These tools should therefore be understood as EMDR 2.0-informed working-memory tools, rather than implying that the software itself constitutes EMDR 2.0 training or a validated EMDR 2.0 protocol.',
      },
      {
        type: 'decision-point',
        heading: 'Primary use: EMDR Phase 4 — Desensitisation',
        text: 'Chaos Mode and stronger Working Memory Taxation modes are intended principally for Phase 4 desensitisation, after the target has been assessed and activated. Do not activate Chaos Mode simply because a session has begun.',
      },
      {
        type: 'instruction',
        heading: 'Intended sequence',
        text: 'Target assessed → Memory activated → Phase 4 Desensitisation begins → Standard eye movements / BLS → Observe processing → If additional working-memory taxation is clinically appropriate → Introduce Variable / Colour / Pattern / Chaos taxation → Monitor memory access + client capacity → Increase or decrease taxation responsively → Return to Standard when appropriate.',
      },
      {
        type: 'instruction',
        heading: 'Matching difficulty to the client',
        text: 'The aim is not simply to make a task as difficult as possible. The task should demand attention whilst still allowing sufficient activation of the target memory. If the secondary task becomes so difficult that the client completely loses contact with the target memory, reduce the taxation. If the client can perform the task automatically with little effort, consider increasing taxation.',
      },
      {
        type: 'caution',
        heading: 'More taxation is not always better',
        text: 'The objective is sufficient competition for working-memory resources, not maximum difficulty. Reduce load or return to Standard if the client loses the memory, becomes overwhelmed, disengages, or shows signs of dissociation.',
      },
      {
        type: 'say',
        heading: 'Example: colour naming',
        text: 'Keep noticing the memory, follow the light with your eyes, and whenever the colour changes, say the colour aloud.',
      },
      {
        type: 'say',
        heading: 'Example: counting backwards',
        text: 'Keep the memory in mind, continue following the light, and count backwards from 20. Increase difficulty if appropriate: count backwards from 30 in threes, or from 100 in sevens.',
      },
      {
        type: 'say',
        heading: 'Example: spelling backwards',
        text: 'While continuing to notice the memory and follow the stimulus, spell the word HOUSE backwards. Do not automatically select personally significant or emotionally loaded words.',
      },
      {
        type: 'observe',
        heading: 'Clinical observation',
        text: 'Monitor the client’s ability to retain the target memory; emotional activation; vividness; attentional engagement; dissociation or disengagement; and ability to perform the competing task. Taxation should be adjusted responsively rather than treated as a fixed dose.',
      },
      {
        type: 'caution',
        heading: 'Practitioner Note',
        text: 'These functions are intended for use by appropriately trained EMDR practitioners as clinician-controlled adjuncts to treatment. They do not determine clinical suitability for EMDR; replace case conceptualisation; replace preparation or assessment; determine readiness for trauma processing; constitute EMDR 2.0 training; or automatically determine the appropriate level of working-memory taxation. The practitioner remains responsible for target selection, pacing, monitoring, dissociation assessment, clinical decision-making and adherence to their training and professional scope.',
      },
    ],
  },
  {
    id: 'wmt-phase-guide',
    title: 'Where Working Memory Taxation fits in the 8-phase protocol',
    phase: 'desensitisation',
    category: 'decision-support',
    sourceType: 'pathfinder-original',
    tags: ['phase-guide', 'chaos', 'working-memory'],
    sections: [
      {
        type: 'instruction',
        heading: 'Phase summary',
        text: '1 History — No. 2 Preparation — Generally no (prefer predictable stimulation where BLS is clinically indicated). 3 Assessment — Not during target setup. 4 Desensitisation — Primary use (RECOMMENDED STAGE FOR WORKING-MEMORY TAXATION). 5 Installation — Generally return to Standard. 6 Body Scan — Generally Standard. 7 Closure — No. 8 Re-evaluation — Only if returning to Phase 4 processing. The stage alone does not determine suitability; clinical judgement, client capacity, target activation and ongoing observation do.',
      },
      {
        type: 'caution',
        heading: 'Phase 2 note',
        text: 'Working-memory taxation intended for trauma desensitisation should not be confused with slower or predictable bilateral stimulation used in preparation or resourcing. Do not recommend Chaos Mode for Safe/Calm Place, resourcing, grounding, containment, or stabilisation exercises.',
      },
      {
        type: 'decision-point',
        heading: 'Phase 4 — how to introduce taxation',
        text: 'Begin with Standard → observe processing. Assess engagement before increasing load. Possible progression (not mandatory): Standard → Variable Speed → Colour Shift → Random Colour + naming → Pattern / Direction → Chaos 1 → Chaos 2 → Chaos 3. Skip, stay, reduce, or return to Standard at any time. Taxation should be individualised rather than progressed automatically.',
      },
      {
        type: 'instruction',
        heading: 'Chaos Mode help card',
        text: 'Chaos Mode is an optional clinician-controlled visual working-memory taxation tool intended principally for use during Phase 4 desensitisation. It combines bounded variations in stimulus movement, colour, speed and/or trajectory. Use while disturbing material is actively being processed when greater working-memory taxation is clinically appropriate. Usually avoid during history taking, resource development, Safe/Calm Place, initial target assessment, Installation, and Closure. Do not describe Chaos Mode as a new EMDR phase, an EMDR 2.0 protocol, a replacement for standard bilateral stimulation, universally more effective, or required for successful processing.',
      },
      {
        type: 'instruction',
        heading: 'Terminology',
        text: 'Where movement remains left–right, “bilateral visual stimulation” may be appropriate. Where random trajectories, vertical movements, figures or direction changes are used, describe this more generally as Visual Working-Memory Taxation — not simply “bilateral stimulation”.',
      },
    ],
  },
];
