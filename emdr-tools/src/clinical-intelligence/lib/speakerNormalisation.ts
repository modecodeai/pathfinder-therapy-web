/**
 * Conservative speaker normalisation for clinical transcripts.
 * Original transcript is never mutated — a separate map is produced.
 */

export type NormalisedRole = 'therapist' | 'client' | 'unknown' | 'other';

export type SpeakerAttributionConfidence = 'high' | 'moderate' | 'low' | 'uncertain';

export interface SpeakerUtterance {
  /** 0-based index in the parsed utterance list */
  index: number;
  rawLabel: string;
  text: string;
  timestamp?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface SpeakerMapEntry {
  rawLabel: string;
  normalisedRole: NormalisedRole;
  displayName?: string;
  confidence: SpeakerAttributionConfidence;
  note?: string;
}

export interface SpeakerNormalisationResult {
  /** Original transcript unchanged */
  originalTranscript: string;
  utterances: SpeakerUtterance[];
  speakerMap: SpeakerMapEntry[];
  /** Analysis-only view — never replaces stored raw transcript */
  normalisedView: string;
}

const THERAPIST_LABELS = new Set(['brent', 'therapist', 't', 'dr', 'counsellor', 'counselor']);

/** Labels that strongly indicate the primary client. */
const LIKELY_CLIENT_LABELS = new Set(['speaker 1', 'speaker1', 'client', 'lisa']);

/**
 * Labels that may be the client (labelling errors) but must stay uncertain.
 * Do not invent extra client participants.
 */
const POSSIBLE_CLIENT_ALIASES = new Set(['ashley', 'speaker 4', 'speaker4']);

function normLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parse timed or labelled transcript lines.
 * Supports:
 *   [00:29:44] Speaker 1: text
 *   Speaker 1: text
 *   Brent: text
 */
export function parseTranscriptUtterances(transcript: string): SpeakerUtterance[] {
  const lines = transcript.split(/\r?\n/);
  const out: SpeakerUtterance[] = [];
  let offset = 0;
  let index = 0;
  for (const line of lines) {
    const startOffset = offset;
    offset += line.length + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;
    const timed = trimmed.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*([^:]{1,40}):\s*(.+)$/);
    const plain = trimmed.match(/^([^:]{1,40}):\s*(.+)$/);
    let timestamp: string | undefined;
    let rawLabel: string;
    let text: string;
    if (timed && /^\d/.test(timed[1])) {
      timestamp = timed[1];
      rawLabel = timed[2].trim();
      text = timed[3].trim();
    } else if (plain) {
      rawLabel = plain[1].trim();
      text = plain[2].trim();
    } else {
      continue;
    }
    if (!rawLabel || !text) continue;
    out.push({
      index: index++,
      rawLabel,
      text,
      timestamp,
      startOffset,
      endOffset: startOffset + line.length,
    });
  }
  return out;
}

export function buildSpeakerMap(
  utterances: SpeakerUtterance[],
  opts?: { therapistNames?: string[]; clientNames?: string[] },
): SpeakerMapEntry[] {
  const therapistExtra = new Set((opts?.therapistNames ?? []).map(normLabel));
  const clientExtra = new Set((opts?.clientNames ?? []).map(normLabel));
  const labels = [...new Set(utterances.map((u) => u.rawLabel))];
  return labels.map((rawLabel) => {
    const key = normLabel(rawLabel);
    if (THERAPIST_LABELS.has(key) || therapistExtra.has(key)) {
      return {
        rawLabel,
        normalisedRole: 'therapist' as const,
        displayName: rawLabel,
        confidence: 'high' as const,
        note: 'Matched known therapist label',
      };
    }
    if (LIKELY_CLIENT_LABELS.has(key) || clientExtra.has(key)) {
      return {
        rawLabel,
        normalisedRole: 'client' as const,
        displayName: opts?.clientNames?.[0] ?? rawLabel,
        confidence:
          key === 'speaker 1' || key === 'speaker1' || clientExtra.has(key) ? 'high' : 'moderate',
        note: 'Primary client label',
      };
    }
    if (POSSIBLE_CLIENT_ALIASES.has(key)) {
      return {
        rawLabel,
        normalisedRole: 'client' as const,
        displayName: opts?.clientNames?.[0],
        confidence: 'uncertain' as const,
        note: 'Possible client mislabel — attribution uncertain; do not invent additional participants',
      };
    }
    return {
      rawLabel,
      normalisedRole: 'unknown' as const,
      confidence: 'uncertain' as const,
      note: 'Uncertain attribution — left unresolved',
    };
  });
}

export function normaliseTranscriptSpeakers(
  transcript: string,
  opts?: { therapistNames?: string[]; clientNames?: string[] },
): SpeakerNormalisationResult {
  const utterances = parseTranscriptUtterances(transcript);
  const speakerMap = buildSpeakerMap(utterances, opts);
  const byLabel = new Map(speakerMap.map((e) => [normLabel(e.rawLabel), e]));
  const normalisedView = utterances
    .map((u) => {
      const entry = byLabel.get(normLabel(u.rawLabel));
      const role = entry?.normalisedRole ?? 'unknown';
      const conf = entry?.confidence ?? 'uncertain';
      const tag =
        role === 'therapist'
          ? 'Therapist'
          : role === 'client'
            ? entry?.displayName
              ? `Client (${entry.displayName}${conf === 'uncertain' ? ', uncertain label' : ''})`
              : 'Client'
            : `Unknown (${u.rawLabel})`;
      const ts = u.timestamp ? `[${u.timestamp}] ` : '';
      return `${ts}${tag}: ${u.text}`;
    })
    .join('\n');
  return {
    originalTranscript: transcript,
    utterances,
    speakerMap,
    normalisedView,
  };
}

export function resolveEvidenceSpeaker(
  rawLabel: string | undefined,
  speakerMap: SpeakerMapEntry[],
): 'client' | 'therapist' | 'unknown' {
  if (!rawLabel) return 'unknown';
  const entry = speakerMap.find((e) => normLabel(e.rawLabel) === normLabel(rawLabel));
  if (!entry) return 'unknown';
  if (entry.normalisedRole === 'therapist') return 'therapist';
  if (entry.normalisedRole === 'client') return 'client';
  return 'unknown';
}
