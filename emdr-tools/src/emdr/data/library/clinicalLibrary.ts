import type { SourceReference } from '../../guided/types/guidedScript';
import { FLOATBACK_CAUTION, FLOATBACK_STEPS } from '../../guided/lib/standardSession';
import { COGNITION_PAIRS, COGNITION_THEME_LABELS, type CognitionTheme } from '../scripts/cognitions';
import { SAFE_CALM_STEPS } from '../scripts/safeCalm';
import { RDI_STEPS } from '../scripts/rdi';
import {
  PHASE3_ASSESSMENT_STEPS,
  PHASE4_STEPS,
  PHASE5_STEPS,
  PHASE6_STEPS,
  PHASE7_COMPLETE_STEPS,
  PHASE7_INCOMPLETE_STEPS,
} from '../scripts/standardPhases';
import { EMD_STEPS } from '../scripts/emd';

export interface LibraryItem {
  id: string;
  section: string;
  title: string;
  /** Short card description */
  description: string;
  /** @deprecated alias of description */
  summary: string;
  phaseLabel?: string;
  category: string;
  guidedRoute?: string;
  source: SourceReference;
  kind: 'overview' | 'tool' | 'protocol' | 'screening' | 'caution';
  overview: string;
  therapistScript: string[];
  considerations: string[];
  relatedIds: string[];
}

const CENTER: Pick<SourceReference, 'organisation' | 'author'> = {
  organisation: 'The Center for Excellence in EMDR Therapy',
  author: 'Deany Laliotis, LICSW',
};

function sayLines(
  steps: { type: string; text: string; section?: string }[],
  includeNotes = true,
): string[] {
  return steps
    .filter((s) => s.type === 'say' || s.type === 'decision' || (includeNotes && (s.type === 'clinician-note' || s.type === 'warning' || s.type === 'bls-action')))
    .map((s) => {
      const prefix =
        s.type === 'clinician-note' || s.type === 'warning'
          ? '[Clinician] '
          : s.type === 'bls-action'
            ? '[BLS] '
            : s.type === 'decision'
              ? '[Decision] '
              : '';
      return `${prefix}${s.text}`;
    });
}

function cognitionScriptSample(): string[] {
  const themes = Object.keys(COGNITION_THEME_LABELS) as CognitionTheme[];
  const lines: string[] = [
    'Ask: “What words go best with that picture that express your negative belief about yourself now?”',
    'Ask: “What would you prefer to believe about yourself instead?”',
    'Organise NC/PC pairs by clinical theme (Responsibility / Belonging / Safety / Power).',
    '',
    'Example pairs from training worksheets:',
  ];
  for (const theme of themes) {
    const pair = COGNITION_PAIRS.find((p) => p.theme === theme);
    if (!pair) continue;
    lines.push(`• ${COGNITION_THEME_LABELS[theme]} — NC: “${pair.nc}” → PC: “${pair.pc}”`);
  }
  lines.push('', `Full searchable helper includes ${COGNITION_PAIRS.length} NC/PC pairs.`);
  return lines;
}

function item(
  partial: Omit<LibraryItem, 'summary' | 'category' | 'description'> & {
    description: string;
    category?: string;
  },
): LibraryItem {
  return {
    ...partial,
    summary: partial.description,
    category: partial.category ?? partial.section,
  };
}

export const CLINICAL_LIBRARY: LibraryItem[] = [
  item({
    id: 'eight-phase-overview',
    section: 'Standard EMDR',
    title: 'Eight Phase Overview',
    description:
      'EMDR as an eight-phase, three-pronged, clinician-led psychotherapy that resumes adaptive information processing.',
    phaseLabel: 'Standard protocol · Phases 1–8',
    guidedRoute: '/practice/standard',
    kind: 'overview',
    source: { title: 'EMDRIA Definition of EMDR', organisation: 'EMDRIA', date: 'Effective 9/2019' },
    overview:
      'EMDR is an evidence-based, clinician-led psychotherapy. The Adaptive Information Processing (AIP) model posits that much of psychopathology relates to maladaptive encoding and/or incomplete processing of traumatic or disturbing adverse life experiences. The eight-phase, three-pronged process facilitates resumption of normal information processing and integration, targeting past experience, current triggers, and future potential challenges.\n\nPhases: (1) History / treatment planning, (2) Preparation, (3) Assessment, (4) Desensitisation, (5) Installation, (6) Body scan, (7) Closure, (8) Re-evaluation.',
    therapistScript: [
      '[Orientation to client — training worksheet phrasing]',
      'When something happens to us that is disturbing, we are frequently unable to process it fully when it occurs. As a result, we can be triggered by similar situations in the present that resemble these past experiences.',
      'EMDR therapy stimulates our brain to reprocess these memories that continue to have a negative impact on us. We create the conditions for your physiology to do now what it couldn’t do at the time, so it can be completely over and in the past. It will be your system that will be doing the work, and I will be there with you through this healing process.',
    ],
    considerations: [
      'Must be administered by an EMDR-trained clinician (or trainee in an approved training).',
      'Maintain client stability; pacing and preparation precede reprocessing.',
      'Use Standard EMDR Guided Mode for live phase scripts and BLS.',
    ],
    relatedIds: ['three-pronged-protocol', 'aip-model', 'target-assessment'],
  }),
  item({
    id: 'three-pronged-protocol',
    section: 'Standard EMDR',
    title: 'Three-Pronged Protocol',
    description: 'Past / Present / Future targeting structure that organises comprehensive EMDR treatment.',
    phaseLabel: 'Standard protocol · Past–Present–Future',
    guidedRoute: '/practice/standard',
    kind: 'overview',
    source: { ...CENTER, title: 'Basic Training Part I — EMDR Therapy’s Three-Pronged Approach', date: 'March 2026' },
    overview:
      'EMDR’s three-pronged approach addresses (1) past experiences that laid down maladaptive memory networks, (2) present triggers that activate those networks, and (3) future templates so the client can handle anticipated challenges with newly adaptive responses.\n\nTreatment planning maps past–present connections, then sequences reprocessing so that present reactivity and future functioning shift as earlier material resolves.',
    therapistScript: [
      '[Planning language]',
      'We will look at what happened in the past that still informs today’s reactions, the present situations that trigger those reactions, and how you would like to respond in the future.',
      'When past–present connections that drive reactivity are identified and reprocessed, clients typically develop more adaptive responses to similar future situations.',
    ],
    considerations: [
      'Do not skip future work when clinically indicated — templates consolidate adaptive responding.',
      'Recent events may require specialised sequencing (see Recent Traumatic Events protocol materials).',
      'Re-evaluation (Phase 8) reviews effects across all three prongs.',
    ],
    relatedIds: ['eight-phase-overview', 'aip-model', 'future-template', 'reevaluation'],
  }),
  item({
    id: 'aip-model',
    section: 'Standard EMDR',
    title: 'AIP Model',
    description:
      'Adaptive Information Processing as the organising model for history taking, targeting, and reprocessing.',
    phaseLabel: 'Model · Case conceptualisation',
    guidedRoute: '/practice/standard?phase=history',
    kind: 'overview',
    source: { ...CENTER, title: 'Basic Training Part I — The Adaptive Information Processing Model', date: 'March 2026' },
    overview:
      'AIP holds that, under optimal conditions, new experiences are assimilated into memory networks associated with similar information. Pathology is thought to result when adaptive information processing is blocked or incomplete, leaving disturbing experiences maladaptively stored — with images, beliefs, emotions, and sensations that can be triggered in the present.\n\nClinically, AIP guides history taking (mapping memory networks), target selection (touchstone / foundational experiences), and the expectation that dual attention plus bilateral stimulation can resume adaptive processing.',
    therapistScript: [
      '[Clinician framing]',
      'Present-day difficulties are often informed by past experiences that were inadequately processed and maladaptively stored.',
      'Our work identifies those memory networks, prepares the client’s system, then reprocesses targets so adaptive information can link and the present response can change.',
    ],
    considerations: [
      'Identify clinical themes (Responsibility / Belonging / Safety / Power) that show where the client is stuck.',
      'Use Direct Questioning, Floatback, and/or Affect Scan for memory mapping — choose by client capacity.',
      'Screen for dissociation and window-of-tolerance limits before associative techniques.',
    ],
    relatedIds: ['aip-history', 'floatback', 'clinical-themes', 'eight-phase-overview'],
  }),
  item({
    id: 'cognitions',
    section: 'Standard EMDR',
    title: 'Negative / Positive Cognitions',
    description: 'Searchable NC/PC helper organised by clinical theme (Responsibility, Belonging, Safety, Power).',
    phaseLabel: 'Phase 3 · Assessment',
    guidedRoute: '/practice/standard?helper=cognitions',
    kind: 'tool',
    source: {
      ...CENTER,
      title: 'Part I Worksheets — Examples of Negative and Positive Beliefs',
      date: 'March 2026',
    },
    overview:
      'Negative cognitions (NC) are presently held negative beliefs about the self linked to the target image. Positive cognitions (PC) are preferred adaptive beliefs. Validity of Cognition (VOC) rates how true the PC feels now (1–7) while holding the target picture.\n\nTraining materials organise example NC/PC pairs by informational plateaus: Responsibility/Defectiveness, Belonging, Responsibility—Action, Safety/Vulnerability, and Power/Control/Choices.',
    therapistScript: cognitionScriptSample(),
    considerations: [
      'NC should be presently held and about the self — not merely a description of the event.',
      'PC should be believable as a preferred belief; VOC guides installation readiness.',
      'Open Guided Mode for the full searchable helper during Phase 3.',
    ],
    relatedIds: ['clinical-themes', 'target-assessment', 'aip-history'],
  }),
  item({
    id: 'aip-history',
    section: 'Phase 1',
    title: 'AIP History Taking',
    description: 'Guided history / treatment planning fields with presenting complaint, memory mapping, resources, and target selection.',
    phaseLabel: 'Phase 1 · Target Identification',
    guidedRoute: '/practice/standard?phase=history',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — AIP History Taking and Treatment Planning Script', date: 'March 2026' },
    overview:
      'An abbreviated AIP-informed history script for training and clinical use. It guides case conceptualisation by identifying past–present connections and the predominant clinical theme, then selecting a first target (often a touchstone or foundational memory that remains disturbing now).',
    therapistScript: [
      '1. PRESENTING COMPLAINT: Let’s talk about the issue you would like to work on. Tell me more about it.',
      'Recent example: What recent experience have you had as an example of this issue in your life?',
      'Other present triggers: Are there other situations, people, or places in your life now that bring up these negative reactions?',
      '2. MAPPING PAST EXPERIENCES: Use Floatback, Direct Questioning, and/or Affect Scan to identify associated past experiences.',
      '3. SELF-IDENTITY: Do matters of race, ethnicity, culture, sexual or gender identity impact your sense of self? How?',
      '4. EXISTING SKILLS AND RESOURCES: Who are the people most important to you? What activities support you? Note affect tolerance, dual attention, and access to adaptive information.',
      '5. FUTURE GOALS: When you think about the current situations we discussed, how would you like to be able to handle them in the future?',
      '6. TARGET MEMORY: Identify the Target Memory selected for the first reprocessing session (touchstone or other foundational memory disturbing in the present).',
      'End by redirecting attention to Safe/Calm State as needed.',
    ],
    considerations: [
      'Predominant theme: Responsibility/Belonging – Safety – Power.',
      'Observer/facilitator support is expected in training rotations; in clinic, consult when stuck.',
      'Do not force Floatback when the client is outside window of tolerance — use Direct Questioning.',
    ],
    relatedIds: ['floatback', 'clinical-themes', 'safe-calm', 'aip-model'],
  }),
  item({
    id: 'floatback',
    section: 'Phase 1',
    title: 'Floatback',
    description: 'Guided floatback with memory map and clinical caution panel for associative history taking.',
    phaseLabel: 'Phase 1 · Target Identification',
    guidedRoute: '/practice/floatback',
    kind: 'tool',
    source: { ...CENTER, title: 'Appendix B — Floatback Technique', date: 'March 2026' },
    overview:
      'The Floatback technique (adapted from Browning, 1999) brings memories and associations into awareness that automatically link into current difficulties. Clients often know they are triggered but not why. Because the brain is associative, present disturbance can connect to earlier experiences with similar components.\n\nIn EMDR, Floatback facilitates unconscious memory mapping of earlier negative experiences linking to the current situation. Associations become potential reprocessing targets within a comprehensive plan. It can also be used when a client arrives disturbed by a recent trigger.',
    therapistScript: sayLines(FLOATBACK_STEPS),
    considerations: [
      FLOATBACK_CAUTION.text,
      'When working with dissociative disorder or clients easily overwhelmed / outside window of tolerance, Floatback is not advisable — prefer grounding and Direct Questioning for conscious mapping.',
      'After each association while mapping: “As you focus on the last association, let your mind float back to yet another time… What comes to mind now?”',
      'Record memory/association and age; mark first, worst, and potential targets as clinically indicated.',
    ],
    relatedIds: ['aip-history', 'clinical-themes', 'target-assessment', 'safe-calm'],
  }),
  item({
    id: 'clinical-themes',
    section: 'Phase 1',
    title: 'Clinical Themes',
    description: 'Responsibility / Belonging / Safety / Power — multi-select helper for case conceptualisation.',
    phaseLabel: 'Phase 1 · Case conceptualisation',
    guidedRoute: '/practice/standard?helper=themes',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — Informational Plateaus', date: 'March 2026' },
    overview:
      'Informational plateaus of Responsibility–Safety–Power (Choices) organise AIP-informed case conceptualisation. Identifying the predominant theme represented in the target memory clarifies where the client is stuck and guides NC/PC selection and treatment sequencing.',
    therapistScript: [
      'After mapping the presenting issue and associated memories, ask (clinician reflection):',
      'What is the predominant clinical theme represented in this Target Memory?',
      '• Responsibility / Defectiveness / Belonging',
      '• Safety / Vulnerability',
      '• Power / Control / Choices',
      'Use the theme to narrow NC/PC options and to check coherence across past–present–future targets.',
    ],
    considerations: [
      'Themes are clinical organisers — not diagnostic labels.',
      'A single case may show multiple themes; note the predominant stuck point for the selected target.',
      'Link to the NC/PC helper when moving into Phase 3.',
    ],
    relatedIds: ['cognitions', 'aip-history', 'floatback'],
  }),
  item({
    id: 'screening',
    section: 'Phase 1',
    title: 'Screening & Measures',
    description: 'Toolkit index of common measures — purpose and external source only; do not reproduce proprietary instruments.',
    phaseLabel: 'Phase 1 · Readiness & baseline',
    guidedRoute: '/practice/library/screening',
    kind: 'screening',
    source: { title: 'EMDRIA Phase One Toolkit', organisation: 'EMDRIA' },
    overview:
      'Screening and outcome measures support readiness decisions, baseline symptom tracking, and formulation. This library lists common instruments referenced in Phase One toolkits. Proprietary forms must be obtained under appropriate licence — Pathfinder does not reproduce scored instruments.',
    therapistScript: [
      '[Clinician checklist — not a substitute for licensed forms]',
      '• Dissociation screen as indicated (e.g. DES-II / related toolkit listings) before associative history or reprocessing.',
      '• Trauma symptom measures (e.g. PCL-5, ITQ, CAPS-5) for diagnostic clarity / progress where licensed.',
      '• Anxiety / depression screens (GAD-7, PHQ-9) for baseline and monitoring.',
      '• Exposure inventory (LEC-5) and ACEs/BCEs where clinically useful.',
      'See the Screening & Measures table on this page for purpose and status of each listing.',
    ],
    considerations: [
      'Dissociative disorder rules out EMDR therapy by Part One-trained clinicians without specialised preparation.',
      'Measures inform clinical judgement — they do not automatically gate Floatback or reprocessing.',
      'Identity / race / culture interview fields are clinician-led and optional.',
    ],
    relatedIds: ['aip-history', 'safe-calm', 'eight-phase-overview'],
  }),
  item({
    id: 'safe-calm',
    section: 'Phase 2',
    title: 'Safe / Calm State',
    description: 'Guided script with recommended slow BLS (approximately 8–10 passes) for state change and self-soothing.',
    phaseLabel: 'Phase 2 · Preparation',
    guidedRoute: '/practice/safe-calm',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — Creating a Safe/Calm Place or State', date: 'March 2026' },
    overview:
      'Safe/Calm Place or State develops a positive sensory association the client can use for dual awareness, closure, and between-session self-soothing. Use slower, alternating tactile taps or eye movements for ~8–10 passes. Use fewer passes if the client has trouble staying focused or is triggered by a negative association. If BLS is omitted, instruct the client to take a breath between sets of instructions.',
    therapistScript: sayLines(SAFE_CALM_STEPS),
    considerations: [
      'If the experience turns negative: redirect attention completely away, ground and reorient; try again or choose another association.',
      'Install a cue word/phrase and practice self-cuing with mild distress (SUD 1–2, then 2–3).',
      'Invite practice between sessions when triggered and needing to self-soothe.',
      'Open Guided Mode for live BLS with the Safe/Calm preset.',
    ],
    relatedIds: ['rdi', 'aip-history', 'target-assessment'],
  }),
  item({
    id: 'rdi',
    section: 'Phase 2',
    title: 'Resource Development & Installation',
    description: 'RDI workflow with slower BLS throughout — mastery, relational, or symbolic resources.',
    phaseLabel: 'Phase 2 · Preparation',
    guidedRoute: '/practice/rdi',
    kind: 'tool',
    source: { ...CENTER, title: 'Appendix B — Resource Development Installation (RDI)', date: 'March 2026' },
    overview:
      'Resource Development & Installation (RDI) strengthens needed qualities before or alongside memory work. Use slower, predictable BLS. In preparation for memory reprocessing, do not install a quality that is part of the issue being worked (e.g., feeling good about oneself when the issue is low self-esteem).\n\nResource types: Mastery / Relational / Symbolic — selected with the client.',
    therapistScript: sayLines(RDI_STEPS),
    considerations: [
      'Typical strengthening sets: ~6–12 slower BLS.',
      'If negative material emerges, redirect to another experience of that resource or choose another resource.',
      'Future rehearsal: run a movie of the desired response using the resource, then add slower BLS sets.',
      'Open Guided Mode for the full RDI console with Live BLS.',
    ],
    relatedIds: ['safe-calm', 'future-template', 'aip-history'],
  }),
  item({
    id: 'target-assessment',
    section: 'Phases 3–7',
    title: 'Target Memory Assessment',
    description: 'Guided Phase 3: image, NC/PC, VOC, emotion, SUD, and body location with persistent target card.',
    phaseLabel: 'Phase 3 · Assessment',
    guidedRoute: '/practice/standard?phase=assessment',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — Phase 3 Target Memory Assessment', date: 'March 2026' },
    overview:
      'Phase 3 fully accesses the target memory components before desensitisation: representative image, negative cognition, preferred positive cognition, VOC, emotion, SUD, and body location. Complete assessment before starting Phase 4 BLS sets.',
    therapistScript: sayLines(PHASE3_ASSESSMENT_STEPS),
    considerations: [
      'Keep the target card visible through Phases 4–7.',
      'Use the NC/PC helper when the client struggles to find words.',
      'Proceed to Desensitisation only when the target is fully accessed.',
    ],
    relatedIds: ['cognitions', 'floatback', 'emd'],
  }),
  item({
    id: 'emd',
    section: 'Phases 3–7',
    title: 'EMD',
    description: 'Focused desensitisation / stabilisation with short sets and return to target.',
    phaseLabel: 'Phases 3–7 · Focused protocol',
    guidedRoute: '/practice/emd',
    kind: 'protocol',
    source: { ...CENTER, title: 'Part II-A / Appendix B — Eye Movement Desensitization (EMD)', date: 'January–March 2026' },
    overview:
      'EMD is a focused desensitisation approach used when broader free association is not indicated. It typically uses shorter BLS sets with return to the target, supporting stabilisation and contained processing. Follow your licensed Part II / Appendix B procedural steps in Guided Mode.',
    therapistScript: sayLines(EMD_STEPS),
    considerations: [
      'Distinguish EMD from standard EMDR desensitisation — do not mix free-association expectations with EMD constraints.',
      'Use when clinical judgement calls for tighter focus / stabilisation.',
      'Open Guided Mode for live steps and BLS presets.',
    ],
    relatedIds: ['target-assessment', 'safe-calm', 'recent-events'],
  }),
  item({
    id: 'future-template',
    section: 'Phases 3–7',
    title: 'Future Template',
    description: 'Guided future template workflow for installing adaptive future responding (three-pronged future work).',
    phaseLabel: 'Future prong · Installation',
    guidedRoute: '/practice/future-template',
    kind: 'protocol',
    source: { ...CENTER, title: 'Appendix B — Procedural Steps for Installing Future Templates', date: 'March 2026' },
    overview:
      'Future templates help the client rehearse handling anticipated challenges with adaptive responses after past and present material has been addressed (or as clinically sequenced). Follow the training-suite procedural steps in Guided Mode rather than improvising missing worksheet detail.',
    therapistScript: [
      '[High-level sequence — open Guided Mode for full training steps]',
      'Identify the future situation the client wants to handle more effectively.',
      'Run an imaginal “movie” of the desired response, incorporating needed resources / PC as indicated.',
      'Add BLS sets while the adaptive future response holds; check for residual disturbance or blocking material.',
      'If disturbance arises, address per protocol (return to past/present targets or resources as indicated).',
    ],
    considerations: [
      'Future work consolidates the third prong of the standard approach.',
      'Use licensed Appendix B steps for complete procedural detail.',
    ],
    relatedIds: ['three-pronged-protocol', 'rdi', 'reevaluation'],
  }),
  item({
    id: 'recent-events',
    section: 'Phases 3–7',
    title: 'Recent Traumatic Events',
    description: 'Protocol slot referencing the training-suite Recent Traumatic Events worksheet — do not invent missing steps.',
    phaseLabel: 'Specialised protocol',
    guidedRoute: '/practice/recent-events',
    kind: 'protocol',
    source: { ...CENTER, title: 'Appendix B — Recent Traumatic Events Protocol Worksheet', date: 'March 2026' },
    overview:
      'Recent traumatic events may require specialised sequencing distinct from single-event standard targeting. This entry points to the licensed Appendix B worksheet. Pathfinder provides a protocol slot and related tools (Standard phases, EMD, Safe/Calm) rather than fabricating unpublished step text.',
    therapistScript: [
      '[Clinician note]',
      'Open the licensed Recent Traumatic Events Protocol Worksheet from your training packet.',
      'Use Standard EMDR Phase tools, EMD, or Safe/Calm as clinically indicated while following that worksheet.',
      'Do not invent procedural steps that are not in your source materials.',
    ],
    considerations: [
      'Placeholder for missing proprietary worksheet detail is intentional — incomplete inventing would be unsafe.',
      'Consult your Facilitator / EMDR Consultant when sequencing recent events.',
    ],
    relatedIds: ['emd', 'safe-calm', 'eight-phase-overview'],
  }),
  item({
    id: 'reevaluation',
    section: 'Phase 8',
    title: 'Re-evaluation',
    description: 'Load previous target summary; capture present SUD/VOC and choose next clinical steps.',
    phaseLabel: 'Phase 8 · Re-evaluation',
    guidedRoute: '/practice/standard?phase=reevaluation',
    kind: 'tool',
    source: { ...CENTER, title: 'Appendix B — Reevaluation Worksheet', date: 'March 2026' },
    overview:
      'Phase 8 reviews effects of previous reprocessing, checks residual disturbance on prior targets, and plans next steps across the three-pronged protocol (additional past targets, present triggers, future templates).',
    therapistScript: [
      'Review the previous target: What do you notice when you bring up that memory now?',
      'Check present SUD and VOC as indicated.',
      'Ask what is most important from the work so far and what still needs attention.',
      'Update the treatment plan: next past target, present trigger, and/or future template.',
      'If an incomplete target remains, resume from the appropriate phase using your reevaluation worksheet.',
    ],
    considerations: [
      'Re-evaluation is not optional busywork — it verifies ecological validity of prior work.',
      'Watch for feeder memories or new channels that emerged between sessions.',
    ],
    relatedIds: ['three-pronged-protocol', 'target-assessment', 'future-template'],
  }),
  item({
    id: 'pain',
    section: 'Pain',
    title: 'EMDR Pain Protocol',
    description: 'Mark Grant-informed pain workspace on the same clinical console architecture.',
    phaseLabel: 'Pain protocol',
    guidedRoute: '/pain',
    kind: 'protocol',
    source: { author: 'Mark Grant', title: 'EMDR Pain Protocol' },
    overview:
      'The EMDR Pain Protocol workspace adapts guided-practice console patterns (therapist script, live BLS, response capture) for persistent pain presentations following Mark Grant–informed structure. Use only within your scope of training and clinical judgement.',
    therapistScript: [
      '[Open the Pain Protocol console for full live workflow]',
      'Orient to pain-related target components as structured in the Pain workspace.',
      'Use Live BLS with clinically appropriate presets; monitor STOP / dual awareness.',
      'Record client responses between sets; do not skip stabilisation when arousal rises.',
    ],
    considerations: [
      'Distinct from standard trauma targeting — follow the Pain Protocol UI and source guidance.',
      'Medical red flags and multidisciplinary care remain outside this tool’s scope.',
    ],
    relatedIds: ['safe-calm', 'eight-phase-overview'],
  }),
];

/** Legacy / alternate slugs → canonical id */
const SLUG_ALIASES: Record<string, string> = {
  'std-eight-phase': 'eight-phase-overview',
  'std-three-prong': 'three-pronged-protocol',
  'std-aip': 'aip-model',
  'std-nc-pc': 'cognitions',
  'nc-pc': 'cognitions',
  'negative-positive-cognitions': 'cognitions',
  'p1-history': 'aip-history',
  'p1-floatback': 'floatback',
  'p1-themes': 'clinical-themes',
  'p1-screening': 'screening',
  'p2-safe-calm': 'safe-calm',
  'p2-rdi': 'rdi',
  'p3-assessment': 'target-assessment',
  'p8-reeval': 'reevaluation',
  'resource-development': 'rdi',
  'safe-calm-state': 'safe-calm',
};

export function resolveLibraryId(slug: string | undefined): string | null {
  if (!slug) return null;
  if (CLINICAL_LIBRARY.some((i) => i.id === slug)) return slug;
  return SLUG_ALIASES[slug] ?? null;
}

export function getLibraryItem(slug: string | undefined): LibraryItem | null {
  const id = resolveLibraryId(slug);
  if (!id) return null;
  return CLINICAL_LIBRARY.find((i) => i.id === id) ?? null;
}

export function libraryResourceHasContent(item: LibraryItem): boolean {
  const overview = item.overview?.trim();
  const script = item.therapistScript?.filter((l) => l.trim()).length ?? 0;
  const considerations = item.considerations?.filter((l) => l.trim()).length ?? 0;
  return Boolean(overview && overview.length > 40 && (script > 0 || considerations > 0));
}

export interface LibraryDiagnostics {
  resourcesLoaded: number;
  guidedScriptsLoaded: number;
  referenceResourcesLoaded: number;
  missingContentIds: string[];
}

export function getLibraryDiagnostics(): LibraryDiagnostics {
  const missingContentIds = CLINICAL_LIBRARY.filter((i) => !libraryResourceHasContent(i)).map((i) => i.id);
  const guidedScriptsLoaded = CLINICAL_LIBRARY.filter((i) => i.guidedRoute && (i.therapistScript?.length ?? 0) > 0).length;
  const referenceResourcesLoaded = CLINICAL_LIBRARY.filter((i) => libraryResourceHasContent(i)).length;
  return {
    resourcesLoaded: CLINICAL_LIBRARY.length,
    guidedScriptsLoaded,
    referenceResourcesLoaded,
    missingContentIds,
  };
}

/** Ensure phase scripts are referenced so tree-shaking does not drop clinical bodies. */
export const _LIBRARY_SCRIPT_TOUCH = {
  phase4: PHASE4_STEPS.length,
  phase5: PHASE5_STEPS.length,
  phase6: PHASE6_STEPS.length,
  phase7: PHASE7_COMPLETE_STEPS.length + PHASE7_INCOMPLETE_STEPS.length,
};

export interface ScreeningToolRef {
  id: string;
  name: string;
  purpose: string;
  whenUseful: string;
  status: string;
}

/** EMDRIA Phase One Toolkit — index only; do not reproduce proprietary instruments. */
export const SCREENING_TOOL_INDEX: ScreeningToolRef[] = [
  { id: 'aces', name: 'ACEs', purpose: 'Adverse childhood experiences screen', whenUseful: 'History / formulation', status: 'External instrument — obtain licensed copy' },
  { id: 'bces', name: 'BCEs', purpose: 'Benevolent childhood experiences', whenUseful: 'Resource / protective factors', status: 'External instrument — obtain licensed copy' },
  { id: 'gad7', name: 'GAD-7', purpose: 'Anxiety symptom severity', whenUseful: 'Baseline / progress', status: 'External instrument — check licence' },
  { id: 'phq9', name: 'PHQ-9', purpose: 'Depression symptom severity', whenUseful: 'Baseline / progress', status: 'External instrument — check licence' },
  { id: 'des2', name: 'DES-II', purpose: 'Dissociative experiences', whenUseful: 'Readiness / dissociation screen', status: 'External instrument — obtain licensed copy' },
  { id: 'ades', name: 'A-DES', purpose: 'Adolescent dissociative experiences', whenUseful: 'Youth presentations', status: 'External instrument — obtain licensed copy' },
  { id: 'cdc', name: 'CDC', purpose: 'Dissociation screen (toolkit listing)', whenUseful: 'As clinically indicated', status: 'See EMDRIA Phase One Toolkit' },
  { id: 'mid', name: 'MID / MID-60', purpose: 'Multidimensional inventory of dissociation', whenUseful: 'Complex dissociation concerns', status: 'External instrument — obtain licensed copy' },
  { id: 'caps5', name: 'CAPS-5', purpose: 'PTSD structured interview', whenUseful: 'Diagnostic clarity', status: 'External instrument — obtain licensed copy' },
  { id: 'itq', name: 'ITQ', purpose: 'ICD-11 PTSD / CPTSD', whenUseful: 'Trauma symptom profile', status: 'External instrument — check licence' },
  { id: 'pcl5', name: 'PCL-5', purpose: 'PTSD checklist', whenUseful: 'Baseline / progress', status: 'External instrument — check licence' },
  { id: 'iesr', name: 'IES-R', purpose: 'Impact of Event Scale — Revised', whenUseful: 'Intrusion / avoidance / hyperarousal', status: 'External instrument — check licence' },
  { id: 'lec5', name: 'LEC-5', purpose: 'Life Events Checklist', whenUseful: 'Trauma exposure inventory', status: 'External instrument — check licence' },
  {
    id: 'identity-race',
    name: 'Identity / Race / Culture Interview',
    purpose: 'Social location / contextual safety',
    whenUseful: 'Phase 1 formulation — optional clinician-led fields',
    status: 'See toolkit / training materials — clinician-led; not an auto-gate',
  },
];

export const LIBRARY_SECTIONS = [
  'Standard EMDR',
  'Phase 1',
  'Phase 2',
  'Phases 3–7',
  'Phase 8',
  'Pain',
] as const;
