/**
 * Pure helpers: build AIP formulation, theme strength, network graph, and
 * session-to-session change from therapist-approved client data only.
 * No AI inference.
 */

import {
  CLINICAL_THEME_LABELS,
  THEME_EVIDENCE_LABELS,
  type ClientRecord,
  type ClinicalThemeId,
  type ConfidenceLevel,
  type SessionChangeItem,
  type SessionChangeKind,
  type SessionChangeSummary,
  type TemporalProng,
  type ThemeEvidenceStrength,
} from '../types';

export type AipNodeType =
  | 'presenting-problem'
  | 'trigger'
  | 'memory'
  | 'touchstone-candidate'
  | 'nc'
  | 'clinical-theme'
  | 'pc'
  | 'resource'
  | 'future-template'
  | 'target';

export type AipEdgeType =
  | 'associated-with'
  | 'triggered-by'
  | 'linked-to'
  | 'supports'
  | 'target-of'
  | 'generalises-to';

export interface AipNode {
  id: string;
  type: AipNodeType;
  label: string;
  prong?: TemporalProng;
  /** Never auto-resolved */
  resolved: false;
}

export interface AipEdge {
  id: string;
  from: string;
  to: string;
  relation: AipEdgeType;
}

export interface ThemeSummaryRow {
  theme: ClinicalThemeId;
  label: string;
  strength: ThemeEvidenceStrength;
  strengthLabel: string;
  primary: boolean;
  notes?: string;
  relatedMemoryCount: number;
}

export interface ProngBucket {
  prong: TemporalProng;
  label: string;
  memories: Array<{ id: string; headline: string; approximateAge?: number }>;
  triggers: Array<{ id: string; text: string }>;
  futureWork: Array<{ id: string; text: string }>;
}

export interface AipFormulationView {
  presentingProblems: string[];
  currentTriggers: Array<{ id: string; text: string }>;
  memoryTimeline: Array<{
    id: string;
    headline: string;
    approximateAge?: number;
    description?: string;
    touchstone: boolean;
  }>;
  touchstoneCandidates: Array<{ id: string; headline: string; approximateAge?: number }>;
  themes: ThemeSummaryRow[];
  activeTargets: Array<{
    headline: string;
    image?: string;
    nc?: string;
    pc?: string;
    voc?: number | null;
    sud?: number | null;
    emotion?: string;
    body?: string;
  }>;
  targetCandidates: Array<{ id: string; headline: string; approximateAge?: number }>;
  ncPcNetwork: Array<{ id: string; polarity: 'negative' | 'positive'; text: string }>;
  internalResources: Array<{ id: string; text: string }>;
  externalResources: Array<{ id: string; text: string }>;
  adaptiveInformation: Array<{ id: string; text: string }>;
  futureTemplates: Array<{ id: string; text: string; desiredResponse?: string }>;
  prongs: ProngBucket[];
  network: { nodes: AipNode[]; edges: AipEdge[] };
  latestSessionChange: SessionChangeSummary | null;
  hasApprovedFormulation: boolean;
}

export function confidenceToEvidenceStrength(
  confidence?: ConfidenceLevel | null,
  established = false,
): ThemeEvidenceStrength {
  if (!established) return 'not-established';
  if (confidence === 'high') return 'strong-evidence';
  if (confidence === 'moderate') return 'moderate-evidence';
  if (confidence === 'low') return 'limited-evidence';
  return 'limited-evidence';
}

export function buildThemeSummary(client: ClientRecord): ThemeSummaryRow[] {
  const allThemes: ClinicalThemeId[] = [
    'responsibility-defectiveness',
    'belonging',
    'safety-vulnerability',
    'power-control',
  ];
  return allThemes.map((theme) => {
    const row = client.themes.find((t) => t.theme === theme);
    const relatedMemoryCount = client.memories.filter((m) => m.themes?.includes(theme)).length;
    const strength = confidenceToEvidenceStrength(row?.confidence, Boolean(row));
    return {
      theme,
      label: CLINICAL_THEME_LABELS[theme],
      strength,
      strengthLabel: THEME_EVIDENCE_LABELS[strength],
      primary: Boolean(row?.primary),
      notes: row?.notes,
      relatedMemoryCount,
    };
  });
}

function defaultProngForMemory(m: { approximateAge?: number }): TemporalProng {
  if (m.approximateAge != null && m.approximateAge < 18) return 'past';
  if (m.approximateAge != null) return 'past';
  return 'past';
}

export function resolveProng(
  client: ClientRecord,
  itemId: string,
  fallback: TemporalProng,
): TemporalProng {
  return client.prongAssignments?.[itemId] ?? fallback;
}

export function buildProngBuckets(client: ClientRecord): ProngBucket[] {
  const past: ProngBucket = { prong: 'past', label: 'PAST', memories: [], triggers: [], futureWork: [] };
  const present: ProngBucket = {
    prong: 'present',
    label: 'PRESENT',
    memories: [],
    triggers: [],
    futureWork: [],
  };
  const future: ProngBucket = {
    prong: 'future',
    label: 'FUTURE',
    memories: [],
    triggers: [],
    futureWork: [],
  };

  for (const m of client.memories) {
    const prong = resolveProng(client, m.id, defaultProngForMemory(m));
    const bucket = prong === 'present' ? present : prong === 'future' ? future : past;
    bucket.memories.push({
      id: m.id,
      headline: m.headline,
      approximateAge: m.approximateAge,
    });
  }
  for (const t of client.triggers) {
    const prong = resolveProng(client, t.id, 'present');
    const bucket = prong === 'past' ? past : prong === 'future' ? future : present;
    bucket.triggers.push({ id: t.id, text: t.text });
  }
  for (const f of client.futureTemplates ?? []) {
    const prong = resolveProng(client, f.id, 'future');
    const bucket = prong === 'past' ? past : prong === 'present' ? present : future;
    bucket.futureWork.push({ id: f.id, text: f.text });
  }
  return [past, present, future];
}

export function buildAipNetwork(client: ClientRecord): { nodes: AipNode[]; edges: AipEdge[] } {
  const nodes: AipNode[] = [];
  const edges: AipEdge[] = [];
  const pushNode = (n: AipNode) => {
    if (!nodes.some((x) => x.id === n.id)) nodes.push(n);
  };

  for (const p of client.presentingProblems) {
    pushNode({
      id: `pp_${hash(p)}`,
      type: 'presenting-problem',
      label: p,
      prong: 'present',
      resolved: false,
    });
  }
  for (const t of client.triggers) {
    pushNode({
      id: `tr_${t.id}`,
      type: 'trigger',
      label: t.text,
      prong: resolveProng(client, t.id, 'present'),
      resolved: false,
    });
  }
  for (const m of client.memories) {
    pushNode({
      id: `mem_${m.id}`,
      type: m.possibleTouchstoneCandidate ? 'touchstone-candidate' : 'memory',
      label: m.headline,
      prong: resolveProng(client, m.id, defaultProngForMemory(m)),
      resolved: false,
    });
  }
  for (const th of client.themes) {
    pushNode({
      id: `theme_${th.theme}`,
      type: 'clinical-theme',
      label: CLINICAL_THEME_LABELS[th.theme],
      resolved: false,
    });
  }
  const ncs = [
    ...(client.cognitions ?? []).filter((c) => c.polarity === 'negative'),
    ...(client.approvedNc
      ? [{ id: 'approved_nc', polarity: 'negative' as const, text: client.approvedNc }]
      : []),
  ];
  const pcs = [
    ...(client.cognitions ?? []).filter((c) => c.polarity === 'positive'),
    ...(client.approvedPc
      ? [{ id: 'approved_pc', polarity: 'positive' as const, text: client.approvedPc }]
      : []),
  ];
  for (const nc of ncs) {
    pushNode({ id: `nc_${nc.id}`, type: 'nc', label: nc.text, resolved: false });
  }
  for (const pc of pcs) {
    pushNode({ id: `pc_${pc.id}`, type: 'pc', label: pc.text, resolved: false });
  }
  for (const r of client.resources) {
    pushNode({
      id: `res_${r.id}`,
      type: 'resource',
      label: r.text,
      resolved: false,
    });
  }
  for (const f of client.futureTemplates ?? []) {
    pushNode({
      id: `fut_${f.id}`,
      type: 'future-template',
      label: f.text,
      prong: 'future',
      resolved: false,
    });
  }
  if (client.activeTarget) {
    pushNode({
      id: 'target_active',
      type: 'target',
      label: client.activeTarget.headline,
      prong: 'present',
      resolved: false,
    });
  }
  for (const tc of client.targetCandidates) {
    pushNode({
      id: `tc_${tc.id}`,
      type: 'target',
      label: tc.headline,
      resolved: false,
    });
  }

  // Relationships from approved structure only (no invented clinical links)
  for (const m of client.memories) {
    for (const theme of m.themes ?? []) {
      if (!client.themes.some((t) => t.theme === theme)) continue;
      edges.push({
        id: `e_${m.id}_${theme}`,
        from: `mem_${m.id}`,
        to: `theme_${theme}`,
        relation: 'linked-to',
      });
    }
  }
  for (const t of client.triggers) {
    for (const m of client.memories.slice(0, 1)) {
      edges.push({
        id: `e_tr_${t.id}_${m.id}`,
        from: `tr_${t.id}`,
        to: `mem_${m.id}`,
        relation: 'triggered-by',
      });
    }
  }
  if (client.activeTarget) {
    for (const th of client.themes.filter((t) => t.primary)) {
      edges.push({
        id: `e_target_theme_${th.theme}`,
        from: 'target_active',
        to: `theme_${th.theme}`,
        relation: 'target-of',
      });
    }
    if (client.activeTarget.nc) {
      const ncNode = nodes.find((n) => n.type === 'nc' && n.label === client.activeTarget!.nc);
      if (ncNode) {
        edges.push({
          id: 'e_target_nc',
          from: 'target_active',
          to: ncNode.id,
          relation: 'associated-with',
        });
      }
    }
    if (client.activeTarget.pc) {
      const pcNode = nodes.find((n) => n.type === 'pc' && n.label === client.activeTarget!.pc);
      if (pcNode) {
        edges.push({
          id: 'e_target_pc',
          from: 'target_active',
          to: pcNode.id,
          relation: 'supports',
        });
      }
    }
  }
  for (const r of client.resources) {
    for (const th of client.themes.slice(0, 1)) {
      edges.push({
        id: `e_res_${r.id}_${th.theme}`,
        from: `res_${r.id}`,
        to: `theme_${th.theme}`,
        relation: 'supports',
      });
    }
  }
  for (const f of client.futureTemplates ?? []) {
    if (client.activeTarget) {
      edges.push({
        id: `e_fut_${f.id}`,
        from: `fut_${f.id}`,
        to: 'target_active',
        relation: 'generalises-to',
      });
    }
  }

  return { nodes, edges };
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16);
}

export function buildAipFormulation(client: ClientRecord): AipFormulationView {
  const cognitions = [...(client.cognitions ?? [])];
  if (client.approvedNc && !cognitions.some((c) => c.polarity === 'negative' && c.text === client.approvedNc)) {
    cognitions.push({ id: 'approved_nc', polarity: 'negative', text: client.approvedNc });
  }
  if (client.approvedPc && !cognitions.some((c) => c.polarity === 'positive' && c.text === client.approvedPc)) {
    cognitions.push({ id: 'approved_pc', polarity: 'positive', text: client.approvedPc });
  }
  if (client.activeTarget?.nc && !cognitions.some((c) => c.text === client.activeTarget!.nc)) {
    cognitions.push({
      id: 'target_nc',
      polarity: 'negative',
      text: client.activeTarget.nc,
    });
  }
  if (client.activeTarget?.pc && !cognitions.some((c) => c.text === client.activeTarget!.pc)) {
    cognitions.push({
      id: 'target_pc',
      polarity: 'positive',
      text: client.activeTarget.pc,
    });
  }

  const themes = buildThemeSummary(client);
  const network = buildAipNetwork(client);
  const hasApprovedFormulation =
    client.presentingProblems.length > 0 ||
    client.memories.length > 0 ||
    client.themes.length > 0 ||
    client.triggers.length > 0 ||
    Boolean(client.activeTarget) ||
    client.resources.length > 0;

  const changes = client.sessionChanges ?? [];
  return {
    presentingProblems: client.presentingProblems.length
      ? client.presentingProblems
      : client.presentingProblem
        ? [client.presentingProblem]
        : [],
    currentTriggers: client.triggers.map((t) => ({ id: t.id, text: t.text })),
    memoryTimeline: [...client.memories]
      .sort((a, b) => (a.approximateAge ?? 99) - (b.approximateAge ?? 99))
      .map((m) => ({
        id: m.id,
        headline: m.headline,
        approximateAge: m.approximateAge,
        description: m.description,
        touchstone: Boolean(m.possibleTouchstoneCandidate),
      })),
    touchstoneCandidates: client.memories
      .filter((m) => m.possibleTouchstoneCandidate)
      .map((m) => ({ id: m.id, headline: m.headline, approximateAge: m.approximateAge })),
    themes,
    activeTargets: client.activeTarget ? [client.activeTarget] : [],
    targetCandidates: client.targetCandidates.map((t) => ({
      id: t.id,
      headline: t.headline,
      approximateAge: t.approximateAge,
    })),
    ncPcNetwork: cognitions.map((c) => ({ id: c.id, polarity: c.polarity, text: c.text })),
    internalResources: client.resources
      .filter((r) => r.kind === 'internal')
      .map((r) => ({ id: r.id, text: r.text })),
    externalResources: client.resources
      .filter((r) => r.kind === 'external')
      .map((r) => ({ id: r.id, text: r.text })),
    adaptiveInformation: (client.adaptiveInformation ?? []).map((a) => ({
      id: a.id,
      text: a.text,
    })),
    futureTemplates: (client.futureTemplates ?? []).map((f) => ({
      id: f.id,
      text: f.text,
      desiredResponse: f.desiredResponse,
    })),
    prongs: buildProngBuckets(client),
    network,
    latestSessionChange: changes.length ? changes[changes.length - 1]! : null,
    hasApprovedFormulation,
  };
}

/** Diff prior approved client vs next after apply — for Session-to-Session Change. */
export function computeSessionChange(
  prior: ClientRecord,
  next: ClientRecord,
  meta: { analysisId: string; phase: string; nowIso: string },
): SessionChangeSummary {
  const items: SessionChangeItem[] = [];

  const trackList = (
    category: string,
    before: string[],
    after: string[],
  ) => {
    const bset = new Set(before.map((x) => x.toLowerCase()));
    const aset = new Set(after.map((x) => x.toLowerCase()));
    for (const a of after) {
      if (!bset.has(a.toLowerCase())) {
        items.push({
          id: `new_${category}_${hash(a)}`,
          kind: 'new',
          category,
          label: a,
        });
      } else {
        items.push({
          id: `unchanged_${category}_${hash(a)}`,
          kind: 'unchanged',
          category,
          label: a,
        });
      }
    }
    for (const b of before) {
      if (!aset.has(b.toLowerCase())) {
        items.push({
          id: `conflict_${category}_${hash(b)}`,
          kind: 'possible-conflict',
          category,
          label: b,
          detail: 'Present in prior approved record but not in this session’s applied set',
        });
      }
    }
  };

  trackList('presentingProblems', prior.presentingProblems, next.presentingProblems);
  trackList(
    'triggers',
    prior.triggers.map((t) => t.text),
    next.triggers.map((t) => t.text),
  );
  trackList(
    'memories',
    prior.memories.map((m) => m.headline),
    next.memories.map((m) => m.headline),
  );
  trackList(
    'themes',
    prior.themes.map((t) => t.theme),
    next.themes.map((t) => t.theme),
  );
  trackList(
    'resources',
    prior.resources.map((r) => r.text),
    next.resources.map((r) => r.text),
  );
  trackList(
    'adaptiveInformation',
    (prior.adaptiveInformation ?? []).map((a) => a.text),
    (next.adaptiveInformation ?? []).map((a) => a.text),
  );
  trackList(
    'processingNotes',
    (prior.processingNotes ?? []).map((n) => n.value),
    (next.processingNotes ?? []).map((n) => n.value),
  );

  if (prior.activeTarget?.headline && next.activeTarget?.headline) {
    if (prior.activeTarget.headline !== next.activeTarget.headline) {
      items.push({
        id: 'updated_target',
        kind: 'updated',
        category: 'activeTarget',
        label: next.activeTarget.headline,
        detail: `Was: ${prior.activeTarget.headline}`,
      });
    } else if (
      prior.activeTarget.sud !== next.activeTarget.sud ||
      prior.activeTarget.voc !== next.activeTarget.voc
    ) {
      items.push({
        id: 'updated_target_metrics',
        kind: 'updated',
        category: 'activeTarget',
        label: next.activeTarget.headline,
        detail: `VoC/SUD updated`,
      });
    } else {
      items.push({
        id: 'unchanged_target',
        kind: 'unchanged',
        category: 'activeTarget',
        label: next.activeTarget.headline,
      });
    }
  } else if (!prior.activeTarget && next.activeTarget) {
    items.push({
      id: 'new_target',
      kind: 'new',
      category: 'activeTarget',
      label: next.activeTarget.headline,
    });
  }

  const unansweredish = (next.lastSessionSummary ?? '').toLowerCase();
  if (unansweredish.includes('not established') || unansweredish.includes('clarify')) {
    items.push({
      id: 'needs_clarification',
      kind: 'needs-clarification',
      category: 'summary',
      label: 'Information still needed from this session',
    });
  }

  // Prefer showing new/updated/conflict; keep a sample of unchanged for UI grouping
  const prioritized = [
    ...items.filter((i) => i.kind === 'new'),
    ...items.filter((i) => i.kind === 'updated'),
    ...items.filter((i) => i.kind === 'possible-conflict'),
    ...items.filter((i) => i.kind === 'needs-clarification'),
    ...items.filter((i) => i.kind === 'unchanged').slice(0, 12),
  ];

  return {
    id: `sc_${hash(meta.analysisId + meta.nowIso)}`,
    analysisId: meta.analysisId,
    phase: meta.phase,
    createdAt: meta.nowIso,
    items: prioritized,
  };
}

export function groupSessionChanges(items: SessionChangeItem[]): Record<SessionChangeKind, SessionChangeItem[]> {
  return {
    new: items.filter((i) => i.kind === 'new'),
    updated: items.filter((i) => i.kind === 'updated'),
    unchanged: items.filter((i) => i.kind === 'unchanged'),
    'possible-conflict': items.filter((i) => i.kind === 'possible-conflict'),
    'needs-clarification': items.filter((i) => i.kind === 'needs-clarification'),
  };
}
