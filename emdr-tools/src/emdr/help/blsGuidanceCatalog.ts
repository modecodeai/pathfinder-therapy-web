import type { EMDRPhase } from '../types/emdr';
import type { PhasePreset } from '../config/phasePresets';
import { EMDR_PHASE_PRESETS, CLOSURE_INFINITY_PRESET } from '../config/phasePresets';
import type {
  BLSGuidance,
  BlsGuidanceContext,
  ClinicalBlsPresetId,
} from './blsGuidanceTypes';

/** Static BLS guidance keyed by script id — source-informed Pathfinder wording */
export const SCRIPT_BLS_GUIDANCE: Record<string, BLSGuidance> = {
  'phase1-presenting-issue': {
    status: 'not-yet',
    title: 'BLS is not routinely required during history taking',
    rationale:
      'Identify presenting problems, relevant past events, current triggers, future concerns and treatment targets without introducing BLS.',
    instructions: [
      'BLS controls stay minimised in the Phase 1 workflow.',
      'Open BLS manually only if the therapist chooses.',
    ],
    sourceSection: 'History Taking and Treatment Planning',
  },
  'phase1-aip-mapping': {
    status: 'not-yet',
    title: 'BLS is not required to construct the treatment map',
    rationale:
      'Use this stage to organise relevant experiences and treatment targets. Do not pair target identification with stimulation automatically.',
    sourceSection: 'AIP History Taking and Treatment Planning',
  },
  'phase1-direct-questioning': {
    status: 'not-yet',
    title: 'Identify experiences — do not start BLS yet',
    rationale:
      'The purpose is to identify relevant experiences or associations. Do not start BLS simply because an earlier memory is identified.',
    instructions: ['Add to Target Map', 'Proceed to Assessment when appropriate'],
    sourceSection: 'Direct Questioning',
  },
  'phase1-floatback': {
    status: 'not-yet',
    title: 'Floatback identifies memory — not reprocessing',
    rationale:
      'Use Floatback to identify an earlier associated memory. Do not automatically begin reprocessing during Floatback.',
    instructions: [
      'Once an appropriate target is identified, complete Phase 3 Assessment before reprocessing BLS.',
      'Do not assume the memory located through Floatback is automatically ready for processing.',
    ],
    sourceSection: 'Floatback',
  },
  'phase2-emdr-orientation': {
    status: 'optional',
    title: 'Orientation first — BLS is explained, not required yet',
    rationale:
      'Orient the client to attention, bilateral stimulation, dual awareness and control. Establishing understanding does not require running a set.',
    sourceSection: 'Phase 2 Preparation',
  },
  'phase2-stop-signal': {
    status: 'not-yet',
    title: 'Establish the stop signal before reprocessing',
    rationale: 'Do not require BLS to establish the stop signal.',
    instructions: ['Mark Stop signal established before Phase 4 where appropriate.'],
    sourceSection: 'Phase 2 Preparation — Stop Signal',
  },
  'phase2-safe-calm-place': {
    status: 'optional',
    title: 'Brief slower BLS may strengthen a stable positive resource',
    rationale:
      'If the Safe/Calm Place or State remains positively associated, brief slower BLS may be used to strengthen it. BLS is not necessary for successful resourcing.',
    suggestedPreset: 'Resource / Stabilisation · Slower · ~8 passes (range ~6–10)',
    presetId: 'resource',
    instructions: [
      'Shorter sets if clinically indicated.',
      'Safe/Calm Place can be established without BLS (breathing between steps if BLS is omitted).',
    ],
    caution:
      'If BLS increases disturbance or activating associations emerge: stop BLS, redirect attention, ground and reorient. The source permits omitting BLS altogether.',
    action: { label: 'Load Resource BLS', presetId: 'resource' },
    sourceSection: 'Phase 2 Safe/Calm Place or State',
  },
  'phase2-container': {
    status: 'optional',
    title: 'Container is a state-shift strategy — BLS optional',
    rationale:
      'Container temporarily sets aside unfinished material. BLS is not required to establish Container.',
    sourceSection: 'Container',
  },
  'phase2-rdi-placeholder': {
    status: 'optional',
    title: 'Advanced RDI — Part II',
    rationale: 'CONTENT_REQUIRES_CLINICAL_REVIEW — do not mix advanced RDI into Standard Protocol automatically.',
    sourceSection: 'Part II Resource Development (reserved)',
  },
  'phase3-assessment-sequence': {
    status: 'not-yet',
    title: 'Complete target assessment before reprocessing BLS',
    rationale:
      'Do not start BLS after selecting NC, while obtaining VOC, while taking baseline SUD, or simply because the target is activated.',
    instructions: [
      'Sequence: Image → NC → PC → VOC → Emotion → SUD → Body.',
      'Begin Desensitisation changes phase only — therapist must separately press Start Set.',
    ],
    sourceSection: 'Phase 3 Assessment',
  },
  'phase3-nc-help': {
    status: 'not-yet',
    title: 'Identifying NC does not start BLS',
    rationale: 'Complete the full assessment sequence before reprocessing stimulation.',
    sourceSection: 'Phase 3 Assessment',
  },
  'phase3-voc-help': {
    status: 'not-yet',
    title: 'Do not apply BLS while obtaining VOC',
    rationale: 'VOC is an assessment rating. Stimulation begins only after assessment and therapist Start Set.',
    sourceSection: 'Phase 3 Assessment',
  },
  'phase3-sud-help': {
    status: 'not-yet',
    title: 'Do not apply BLS while taking baseline SUD',
    rationale: 'Obtain the rating first. Reprocessing BLS follows therapist decision after assessment.',
    sourceSection: 'Phase 3 Assessment',
  },
  'phase4-processing-checkin': {
    status: 'paused-between-sets',
    title: 'BLS stops after every set — check in',
    rationale:
      'Client feedback is elicited after each set. Do not run set after set automatically without check-in.',
    instructions: ['Ask: What are you noticing now?', 'Therapist decides whether another set occurs.'],
    sourceSection: 'Phase 4 Desensitisation',
  },
  'phase4-change-path': {
    status: 'use',
    title: 'Follow emerging material with another set when appropriate',
    rationale: 'While change/new associations continue, additional sets are supported.',
    suggestedPreset: 'Desensitisation · Faster · ~30 passes (typical ~30–36)',
    presetId: 'desensitisation',
    instructions: ['Notice that. / Go with that. (brief)', 'Then Start next set — never auto-start.'],
    action: { label: 'Load Desensitisation BLS', presetId: 'desensitisation' },
    sourceSection: 'Phase 4 Desensitisation',
  },
  'phase4-no-change-once': {
    status: 'optional',
    title: 'One no-change set recorded',
    rationale: 'Do not immediately assume processing is blocked. Another set may be appropriate clinically.',
    instructions: ['No intervention should be forced.'],
    sourceSection: 'Phase 4 Desensitisation',
  },
  'phase4-no-change-twice': {
    status: 'pause-reassess',
    title: 'No change across two consecutive sets',
    rationale:
      'Consider returning attention to the original Target Memory and reassessing what is now present.',
    instructions: [
      'Do not keep firing identical BLS sets indefinitely.',
      'Do not automatically prescribe an interweave.',
    ],
    action: { label: 'Adjust BLS Settings', presetId: 'manual' },
    sourceSection: 'Phase 4 Desensitisation',
  },
  'phase4-return-to-target': {
    status: 'not-yet',
    title: 'Reassess the target before starting BLS',
    rationale:
      'Bring attention back to the original experience and identify what is present now. Do not start BLS before hearing the client’s response.',
    instructions: [
      'After client response: Go with that → Start BLS, or reassess SUD where indicated.',
    ],
    sourceSection: 'Phase 4 — Return to Target',
  },
  'phase5-installation': {
    status: 'use',
    title: 'Install PC with Target Memory using BLS',
    rationale:
      'Link Target Memory and Positive Cognition, then apply BLS. Source starting point: same speed and duration as Desensitisation.',
    suggestedPreset: 'Installation · same style as Desensitisation · adjust clinically',
    presetId: 'installation',
    instructions: [
      'Check VOC between sets — do not run continuously without checking.',
      'Continue until VOC 7 or ecologically appropriate — do not auto-complete from the number alone.',
    ],
    action: { label: 'Load Installation BLS', presetId: 'installation' },
    sourceSection: 'Phase 5 Installation',
  },
  'phase6-body-scan': {
    status: 'not-yet',
    title: 'Complete the body scan before deciding on BLS',
    rationale:
      'Bring Target Memory and PC to mind and scan through the body. Proceed with Body Scan only if sufficient time is available.',
    caution:
      'If inadequate time remains, do not begin extended new processing simply to complete the workflow — close safely.',
    instructions: [
      'Clear/neutral → BLS not required; proceed toward Closure.',
      'Positive → optional strengthening BLS.',
      'Disturbing residual → process with standard BLS sets.',
    ],
    sourceSection: 'Phase 6 Body Scan',
  },
  'phase7-completed-closure': {
    status: 'not-required',
    title: 'Completed-target closure does not routinely require BLS',
    rationale:
      'Focus on acknowledging resolution, validation and debriefing. Do not automatically run additional BLS because Closure was reached.',
    sourceSection: 'Phase 7 Closure — Completed Target',
  },
  'phase7-incomplete-closure': {
    status: 'optional',
    title: 'State-shift / de-arousal — not continued trauma reprocessing',
    rationale:
      'Do not continue active trauma reprocessing merely because the session is ending. Use Container, Safe/Calm State, another resource, grounding, or Infinity where appropriate.',
    suggestedPreset: 'Infinity / Resource — very slow when de-arousing',
    instructions: ['BLS only where it supports the chosen resource or de-arousal strategy.'],
    action: { label: 'Load Infinity (de-arousal)', presetId: 'infinity' },
    sourceSection: 'Phase 7 Closure — Incomplete Session',
  },
  'phase8-global-reevaluation': {
    status: 'not-yet',
    title: 'Reevaluate changes before BLS',
    rationale:
      'First assess symptoms, behaviour, triggers, perspectives, body experience and adaptive change since last session.',
    instructions: [
      'Positive changes may later be strengthened with slower continuous BLS where clinically appropriate.',
    ],
    sourceSection: 'Phase 8 Reevaluation — Global',
  },
  'phase8-target-reevaluation': {
    status: 'not-yet',
    title: 'Reassess the target before resuming BLS',
    rationale:
      'If SUD > 0: reassess image, emotions, SUD and body, then resume reprocessing. If SUD 0 / VOC < 7: resume Installation. Body Scan findings determine further BLS.',
    instructions: ['Do not skip into stimulation without reassessment.'],
    sourceSection: 'Phase 8 Reevaluation — Target-specific / Resume Reprocessing',
  },
  'future-template-sequence': {
    status: 'not-yet',
    title: 'Prepare the future scenario before BLS',
    rationale:
      'First identify future situation, desired response, PC and develop the scenario. Only then begin BLS-supported rehearsal.',
    suggestedPreset: 'Future Template · faster / continuous as clinically appropriate',
    presetId: 'future-template',
    instructions: [
      'If rehearsal is positive: additional faster BLS may strengthen the response.',
      'If significant disturbance emerges and does not resolve: consider separate assessment/reprocessing.',
    ],
    action: { label: 'Load Future Template BLS', presetId: 'future-template' },
    sourceSection: 'Future Template',
  },
  'infinity-figure-eight': {
    status: 'optional',
    title: 'Figure Eight / Infinity for de-arousal',
    rationale: 'Very slow movement · approximately 10–20 seconds · check in between sets.',
    suggestedPreset: 'Infinity · Very slow · ~15 sec (range 10–20)',
    presetId: 'infinity',
    instructions: [
      'Separate from active trauma reprocessing.',
      'Do not use the fast Phase 4 reprocessing preset here.',
    ],
    action: { label: 'Load Infinity set', presetId: 'infinity' },
    sourceSection: 'Figure Eight Eye Movements for De-Arousal',
  },
  'cross-container': {
    status: 'optional',
    title: 'Container — BLS not required',
    rationale: 'Temporarily set aside unfinished material. Do not describe as erasing or suppressing.',
    sourceSection: 'Container',
  },
  'wmt-overview': {
    status: 'optional',
    title: 'Working Memory Taxation — Phase 4 adjunct (clinician-controlled)',
    rationale:
      'EMDR 2.0-informed visual/cognitive taxation tools are optional adjuncts during desensitisation. They are not a replacement for standard EMDR, not EMDR 2.0 training, and not automatically more effective.',
    suggestedPreset:
      'Desensitisation · start with Standard bilateral, then tax only if clinically appropriate',
    presetId: 'desensitisation',
    instructions: [
      'Primary use: Phase 4 — Desensitisation after target activation.',
      'Begin with Standard bilateral visual stimulation; increase taxation responsively.',
      'Return to Standard when installation, closure, or client capacity indicates lower load.',
    ],
    caution:
      'Do not activate Chaos or high taxation simply because a session has begun. Monitor dual attention and dissociation risk.',
    action: { label: 'Load Desensitisation BLS', presetId: 'desensitisation' },
    sourceSection: 'Working Memory Taxation (EMDR 2.0-informed)',
  },
  'wmt-phase-guide': {
    status: 'optional',
    title: 'Phase fit for Chaos / high taxation',
    rationale:
      'High working-memory taxation is principally associated with Phase 4 desensitisation. Other phases generally prefer Standard / predictable stimulation where BLS is used at all.',
    instructions: [
      'History / Closure: not indicated.',
      'Preparation / Installation / Body Scan: generally return to Standard.',
      'Assessment: complete target setup before advanced taxation.',
      'Re-evaluation: only if explicitly returning to Phase 4 processing.',
    ],
    caution:
      'Never hard-lock a qualified practitioner out of a setting solely because of selected phase — guidance is advisory.',
    sourceSection: 'Working Memory Taxation (EMDR 2.0-informed)',
  },
};

/** Default phase-level activation guidance (when opening Help without a specific card) */
export const PHASE_ACTIVATION_GUIDANCE: Partial<Record<EMDRPhase, BLSGuidance>> = {
  desensitisation: {
    status: 'use',
    title: 'Activate target, then Start BLS',
    rationale:
      'After assessment, bring up target image, NC and body sensation, then Start Set. Adjust speed and set length to the client’s response.',
    suggestedPreset:
      'Desensitisation · Faster · ~30 passes default (typical ~30–36; 20+ when assessing tolerance)',
    presetId: 'desensitisation',
    instructions: [
      'During a set: minimal verbal interference; Stop/Pause always available.',
      'Help drawer minimises during active stimulation.',
    ],
    caution:
      'If the client becomes overwhelmed or cannot track: stop the set — clinical Stop overrides the pass counter.',
    action: { label: 'Load Desensitisation BLS', presetId: 'desensitisation' },
    sourceSection: 'Phase 4 Desensitisation',
  },
  preparation: {
    status: 'optional',
    title: 'BLS may strengthen resources — not required for every client',
    suggestedPreset: 'Resource / Stabilisation · Slower · ~8 passes (range ~6–10)',
    presetId: 'resource',
    action: { label: 'Load Resource BLS', presetId: 'resource' },
    sourceSection: 'Phase 2 Preparation',
  },
};

/**
 * Resolve effective BLS guidance for a script given runtime session context.
 * Condition-driven overlays — does not invent indications beyond source-supported branches.
 */
export function resolveBlsGuidance(
  scriptId: string,
  base: BLSGuidance | undefined,
  ctx: BlsGuidanceContext = {},
): BLSGuidance | undefined {
  let g = base ?? SCRIPT_BLS_GUIDANCE[scriptId];
  if (!g && ctx.phase) g = PHASE_ACTIVATION_GUIDANCE[ctx.phase];
  if (!g) return undefined;

  // During active set — keep USE but remind to observe (drawer should be minimised)
  if (ctx.processingActive && (g.status === 'use' || scriptId.startsWith('phase4'))) {
    return {
      ...g,
      status: 'use',
      title: 'BLS running — observe the client',
      instructions: [
        'Keep verbal interference minimal.',
        'Stop and Pause remain available.',
        'Do not overlay extra script prompts on the active stimulus.',
      ],
    };
  }

  // After every set
  if (ctx.awaitingFeedback && (ctx.phase === 'desensitisation' || ctx.phase === 'installation')) {
    if (ctx.lastResponse === 'change') {
      return SCRIPT_BLS_GUIDANCE['phase4-change-path'];
    }
    if ((ctx.consecutiveNoChange ?? 0) >= 2 || ctx.lastResponse === 'no-change') {
      if ((ctx.consecutiveNoChange ?? 0) >= 2) {
        return SCRIPT_BLS_GUIDANCE['phase4-no-change-twice'];
      }
      if (ctx.lastResponse === 'no-change') {
        return SCRIPT_BLS_GUIDANCE['phase4-no-change-once'];
      }
    }
    if (ctx.returningToTarget || ctx.lastResponse === 'return-to-target') {
      return SCRIPT_BLS_GUIDANCE['phase4-return-to-target'];
    }
    return {
      status: 'paused-between-sets',
      title: 'BLS paused — what are you noticing now?',
      rationale: 'Obtain client feedback before deciding on another set.',
      sourceSection: g.sourceSection,
    };
  }

  // Safe/Calm response branches
  if (scriptId === 'phase2-safe-calm-place') {
    if (ctx.resourceResponse === 'positive') {
      return {
        status: 'optional',
        title: 'Positive response — another brief slower set may strengthen it',
        suggestedPreset: 'Resource · Slower · short set',
        presetId: 'resource',
        action: { label: 'Another short resource set', presetId: 'resource' },
        sourceSection: 'Phase 2 Safe/Calm Place or State',
      };
    }
    if (ctx.resourceResponse === 'negative') {
      return {
        status: 'do-not-continue',
        title: 'Stop strengthening this resource with BLS',
        rationale:
          'Redirect attention away from the experience and ground/reorient before deciding whether to resume.',
        caution: 'Do not continue repetitive resource BLS when activation is increasing. BLS may be omitted.',
        sourceSection: 'Phase 2 Safe/Calm Place or State',
      };
    }
  }

  // Body scan findings
  if (scriptId === 'phase6-body-scan' || ctx.phase === 'body-scan') {
    if (ctx.bodyScanFinding === 'clear') {
      return {
        status: 'not-required',
        title: 'Body clear/neutral — further BLS not required',
        rationale: 'Proceed towards Closure.',
        sourceSection: 'Phase 6 Body Scan',
      };
    }
    if (ctx.bodyScanFinding === 'positive') {
      return {
        status: 'optional',
        title: 'Positive sensation may be strengthened with BLS',
        presetId: 'body-scan',
        action: { label: 'Strengthen positive sensation', presetId: 'body-scan' },
        sourceSection: 'Phase 6 Body Scan',
      };
    }
    if (ctx.bodyScanFinding === 'disturbing') {
      return {
        status: 'use',
        title: 'Process residual disturbance with standard BLS',
        rationale: 'Continue sets until no further change is reported, as clinically appropriate.',
        presetId: 'desensitisation',
        action: { label: 'Process residual sensation', presetId: 'desensitisation' },
        sourceSection: 'Phase 6 Body Scan',
      };
    }
  }

  // Closure path
  if (ctx.closurePath === 'completed' && (scriptId.includes('closure') || ctx.phase === 'closure')) {
    return SCRIPT_BLS_GUIDANCE['phase7-completed-closure'];
  }
  if (ctx.closurePath === 'incomplete' && (scriptId.includes('closure') || ctx.phase === 'closure')) {
    return ctx.infinityMode
      ? SCRIPT_BLS_GUIDANCE['infinity-figure-eight']
      : SCRIPT_BLS_GUIDANCE['phase7-incomplete-closure'];
  }

  // Mid Phase 4 SUD
  if (ctx.obtainingSud && ctx.phase === 'desensitisation') {
    return {
      status: 'not-yet',
      title: 'Obtain the SUD rating before further BLS',
      rationale:
        'After SUD is recorded, additional BLS may follow while focusing on what remains of the Target Memory.',
      instructions: ['Then: Process what remains → Start BLS'],
      action: { label: 'Load processing BLS', presetId: 'desensitisation' },
      sourceSection: 'Phase 4 Desensitisation',
    };
  }

  if (ctx.infinityMode && scriptId === 'infinity-figure-eight') {
    return SCRIPT_BLS_GUIDANCE['infinity-figure-eight'];
  }

  return g;
}

/** Map clinical preset id → phase timing patch source */
export function clinicalPresetToPhase(presetId: ClinicalBlsPresetId): {
  phasePreset?: PhasePreset;
  infinity?: boolean;
} {
  switch (presetId) {
    case 'resource':
      return { phasePreset: EMDR_PHASE_PRESETS.preparation };
    case 'desensitisation':
      return { phasePreset: EMDR_PHASE_PRESETS.desensitisation };
    case 'installation':
      return { phasePreset: EMDR_PHASE_PRESETS.installation };
    case 'body-scan':
      return { phasePreset: EMDR_PHASE_PRESETS['body-scan'] };
    case 'positive-strengthening':
      return { phasePreset: EMDR_PHASE_PRESETS.reevaluation };
    case 'future-template':
      return { phasePreset: EMDR_PHASE_PRESETS['future-template'] };
    case 'infinity':
      return {
        phasePreset: {
          ...EMDR_PHASE_PRESETS.closure,
          trajectory: CLOSURE_INFINITY_PRESET.trajectory,
          speedPreset: CLOSURE_INFINITY_PRESET.speedPreset,
          durationSeconds: CLOSURE_INFINITY_PRESET.durationSeconds,
          continuous: false,
          passes: undefined,
        },
        infinity: true,
      };
    default:
      return {};
  }
}
