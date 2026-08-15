import type { SourceReference } from '../../guided/types/guidedScript';

export interface LibraryItem {
  id: string;
  section: string;
  title: string;
  summary: string;
  href?: string;
  guidedRoute?: string;
  source: SourceReference;
  kind: 'overview' | 'tool' | 'protocol' | 'screening' | 'caution';
}

const CENTER: Pick<SourceReference, 'organisation' | 'author'> = {
  organisation: 'The Center for Excellence in EMDR Therapy',
  author: 'Deany Laliotis, LICSW',
};

export const CLINICAL_LIBRARY: LibraryItem[] = [
  {
    id: 'std-eight-phase',
    section: 'Standard EMDR',
    title: 'Eight Phase Overview',
    summary: 'EMDR as an eight-phase, three-pronged, clinician-led psychotherapy with BLS.',
    guidedRoute: '/practice/standard',
    kind: 'overview',
    source: { title: 'EMDRIA Definition of EMDR', organisation: 'EMDRIA' },
  },
  {
    id: 'std-three-prong',
    section: 'Standard EMDR',
    title: 'Three-Pronged Protocol',
    summary: 'Past / Present / Future targeting structure.',
    kind: 'overview',
    source: { ...CENTER, title: 'Basic Training Part I', date: 'March 2026' },
  },
  {
    id: 'std-aip',
    section: 'Standard EMDR',
    title: 'AIP Model',
    summary: 'Adaptive Information Processing as the organising model for history and targeting.',
    kind: 'overview',
    source: { ...CENTER, title: 'Basic Training Part I', date: 'March 2026' },
  },
  {
    id: 'std-nc-pc',
    section: 'Standard EMDR',
    title: 'Negative / Positive Cognitions',
    summary: 'Searchable NC/PC helper organised by clinical theme.',
    guidedRoute: '/practice/standard?helper=cognitions',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — Examples of Negative and Positive Beliefs', date: 'March 2026' },
  },
  {
    id: 'p1-history',
    section: 'Phase 1',
    title: 'AIP History Taking',
    summary: 'Guided history / treatment planning fields with script visible.',
    guidedRoute: '/practice/standard?phase=history',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — AIP History Taking Script', date: 'March 2026' },
  },
  {
    id: 'p1-floatback',
    section: 'Phase 1',
    title: 'Floatback',
    summary: 'Guided floatback with memory map and clinical caution panel.',
    guidedRoute: '/practice/floatback',
    kind: 'tool',
    source: { ...CENTER, title: 'Appendix B — Floatback Technique', date: 'March 2026' },
  },
  {
    id: 'p1-themes',
    section: 'Phase 1',
    title: 'Clinical Themes',
    summary: 'Responsibility / Belonging / Safety / Power — multi-select helper.',
    guidedRoute: '/practice/standard?helper=themes',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets', date: 'March 2026' },
  },
  {
    id: 'p1-screening',
    section: 'Phase 1',
    title: 'Screening & Measures',
    summary: 'Toolkit index of common measures — purpose and external source only.',
    guidedRoute: '/practice/library#screening',
    kind: 'screening',
    source: { title: 'EMDRIA Phase One Toolkit', organisation: 'EMDRIA' },
  },
  {
    id: 'p2-safe-calm',
    section: 'Phase 2',
    title: 'Safe / Calm State',
    summary: 'Guided script with recommended slow BLS (8–10 passes).',
    guidedRoute: '/practice/safe-calm',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — Creating a Safe/Calm Place or State', date: 'March 2026' },
  },
  {
    id: 'p2-rdi',
    section: 'Phase 2',
    title: 'Resource Development & Installation',
    summary: 'RDI workflow with slower BLS throughout.',
    guidedRoute: '/practice/rdi',
    kind: 'tool',
    source: { ...CENTER, title: 'Appendix B — RDI', date: 'March 2026' },
  },
  {
    id: 'p3-assessment',
    section: 'Phases 3–7',
    title: 'Target Memory Assessment',
    summary: 'Guided Phase 3 with persistent target card into Phases 4–7.',
    guidedRoute: '/practice/standard?phase=assessment',
    kind: 'tool',
    source: { ...CENTER, title: 'Part I Worksheets — Phase 3', date: 'March 2026' },
  },
  {
    id: 'emd',
    section: 'Phases 3–7',
    title: 'EMD',
    summary: 'Focused desensitisation / stabilisation with short sets and return to target.',
    guidedRoute: '/practice/emd',
    kind: 'protocol',
    source: { ...CENTER, title: 'Part II-A — EMD Procedural Steps', date: 'January 2026' },
  },
  {
    id: 'future-template',
    section: 'Phases 3–7',
    title: 'Future Template',
    summary: 'Guided future template workflow (training script architecture).',
    guidedRoute: '/practice/future-template',
    kind: 'protocol',
    source: { ...CENTER, title: 'Appendix B — Procedural Steps for Installing Future Templates', date: 'March 2026' },
  },
  {
    id: 'recent-events',
    section: 'Phases 3–7',
    title: 'Recent Traumatic Events',
    summary: 'Protocol slot — open source-labelled worksheet reference; do not invent missing steps.',
    guidedRoute: '/practice/recent-events',
    kind: 'protocol',
    source: { ...CENTER, title: 'Appendix B — Recent Traumatic Events Protocol Worksheet', date: 'March 2026' },
  },
  {
    id: 'p8-reeval',
    section: 'Phase 8',
    title: 'Re-evaluation',
    summary: 'Load previous target summary; capture present SUD/VOC and next steps.',
    guidedRoute: '/practice/standard?phase=reevaluation',
    kind: 'tool',
    source: { ...CENTER, title: 'Appendix B — Reevaluation Worksheet', date: 'March 2026' },
  },
  {
    id: 'pain',
    section: 'Pain',
    title: 'EMDR Pain Protocol',
    summary: 'Mark Grant-informed pain workspace on the same clinical console architecture.',
    guidedRoute: '/pain',
    kind: 'protocol',
    source: { author: 'Mark Grant', title: 'EMDR Pain Protocol' },
  },
];

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
