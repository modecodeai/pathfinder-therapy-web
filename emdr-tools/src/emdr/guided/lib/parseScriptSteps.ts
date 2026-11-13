import type { GuidedScriptStep, SourceReference } from '../types/guidedScript';

/** Heuristic conversion of free-text protocol scripts into scannable steps. */
export function parsePlainScriptToSteps(
  raw: string,
  meta: {
    protocol: string;
    phase: string;
    section: string;
    source?: SourceReference;
    idPrefix?: string;
  },
): GuidedScriptStep[] {
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const steps: GuidedScriptStep[] = [];
  const prefix = meta.idPrefix ?? `${meta.protocol}-${meta.phase}`;
  let i = 0;

  for (const line of lines) {
    const type = classifyLine(line);
    steps.push({
      id: `${prefix}-${i++}`,
      protocol: meta.protocol,
      phase: meta.phase,
      section: meta.section,
      type,
      text: stripLabel(line),
      source: meta.source,
      blsPreset: type === 'bls-action' ? suggestPreset(meta.protocol) : undefined,
    });
  }
  return steps;
}

function classifyLine(line: string): GuidedScriptStep['type'] {
  const l = line.toLowerCase();
  if (
    l.startsWith('warning') ||
    l.startsWith('caution') ||
    l.includes('stop bls') ||
    l.includes('do not ')
  ) {
    return 'warning';
  }
  if (
    l.includes('start') &&
    (l.includes('bls') || l.includes('bilateral') || l.includes('eye movement'))
  ) {
    return 'bls-action';
  }
  if (l.startsWith('if ') || l.includes('if positive') || l.includes('if negative') || l.includes('if no')) {
    return 'decision';
  }
  if (
    (line.startsWith('"') && line.endsWith('"')) ||
    l.startsWith('say ') ||
    l.startsWith('ask ') ||
    l.startsWith('what ') ||
    l.startsWith('notice ') ||
    l.startsWith('focus on') ||
    l.startsWith('bring up') ||
    l.startsWith('think about') ||
    l.startsWith('tell me') ||
    l.startsWith('go with') ||
    l.startsWith('on a scale')
  ) {
    return 'say';
  }
  if (
    l.startsWith('pause') ||
    l.startsWith('note') ||
    l.startsWith('clinician') ||
    l.startsWith('record') ||
    l.includes('wait for')
  ) {
    return 'clinician-note';
  }
  if (l.includes('sud') || l.includes('voc') || l.includes('capture') || l.includes('record')) {
    return 'capture';
  }
  // Quoted therapist wording mid-line
  if (line.includes('"') && line.length < 220) return 'say';
  return 'clinician-note';
}

function stripLabel(line: string): string {
  return line.replace(/^(SAY|CLINICIAN NOTE|NOTE|BLS|WARNING|CAUTION)\s*[:\-–]?\s*/i, '').trim();
}

function suggestPreset(protocol: string): string | undefined {
  const p = protocol.toLowerCase();
  if (p.includes('pain')) return 'grantPainAuditory';
  if (p.includes('safe') || p.includes('calm')) return 'safeCalm';
  if (p.includes('emd')) return 'emdShortSet';
  if (p.includes('rdi')) return 'rdi';
  return 'standardReprocessing';
}
