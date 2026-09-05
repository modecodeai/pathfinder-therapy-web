/**
 * Session vs non-session transcript segmentation.
 * Raw transcript stays intact — segments are a separate analysis aid.
 */

export type TranscriptSegmentKind =
  | 'session'
  | 'non-session-audio'
  | 'post-session'
  | 'uncertain';

export interface TranscriptSegment {
  kind: TranscriptSegmentKind;
  startOffset: number;
  endOffset: number;
  startTimestamp?: string;
  endTimestamp?: string;
  preview: string;
  reason: string;
  /** Therapist must review before exclusion from clinical analysis */
  excludeFromClinicalAnalysisSuggested: boolean;
}

export interface SessionSegmentationResult {
  originalTranscript: string;
  segments: TranscriptSegment[];
  /** Concatenation of segments with kind === 'session' only */
  sessionOnlyText: string;
  suggestedClinicalEndTimestamp?: string;
}

const NAV_PATTERNS =
  /\b(turn (left|right)|continue (straight|for)|destination|in \d+ (metres|meters|yards|feet)|recalculating|gps|navigation)\b/i;

const POST_SESSION_PATTERNS =
  /\b(chatgpt|openai|hey siri|ok google|alexa|after (the )?session|post[- ]session)\b/i;

const TECH_CHATTER =
  /\b(can you hear me|you're on mute|wifi|bluetooth|screen share|recording (started|stopped))\b/i;

function parseTimestampToSeconds(ts: string): number | null {
  const parts = ts.split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return null;
}

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * Segment a timed transcript. Default clinical end hint: 01:17:33 (Kat golden case).
 * Does not delete anything — marks non-session / post-session for therapist review.
 */
export function segmentTranscriptSession(
  transcript: string,
  opts?: { clinicalEndTimestamp?: string },
): SessionSegmentationResult {
  const clinicalEnd = opts?.clinicalEndTimestamp ?? '01:17:33';
  const endSec = parseTimestampToSeconds(clinicalEnd) ?? 4653;
  const lines = transcript.split(/\r?\n/);
  const segments: TranscriptSegment[] = [];
  let offset = 0;
  let sessionChunks: string[] = [];
  let currentKind: TranscriptSegmentKind | null = null;
  let segStart = 0;
  let segPreview: string[] = [];
  let segStartTs: string | undefined;
  let segEndTs: string | undefined;
  let segReason = '';

  const flush = (endOffset: number) => {
    if (currentKind == null || segPreview.length === 0) return;
    segments.push({
      kind: currentKind,
      startOffset: segStart,
      endOffset,
      startTimestamp: segStartTs,
      endTimestamp: segEndTs,
      preview: segPreview.slice(0, 3).join(' · ').slice(0, 240),
      reason: segReason,
      excludeFromClinicalAnalysisSuggested: currentKind !== 'session',
    });
    currentKind = null;
    segPreview = [];
    segStartTs = undefined;
    segEndTs = undefined;
    segReason = '';
  };

  for (const line of lines) {
    const lineStart = offset;
    offset += line.length + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;

    const tsMatch = trimmed.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/);
    const ts = tsMatch?.[1];
    const sec = ts ? parseTimestampToSeconds(ts) : null;

    let kind: TranscriptSegmentKind = 'session';
    let reason = 'Within clinical session window';

    if (sec != null && sec > endSec) {
      kind = 'post-session';
      reason = `After suggested clinical end (${clinicalEnd})`;
    } else if (NAV_PATTERNS.test(trimmed)) {
      kind = 'non-session-audio';
      reason = 'Likely navigation / phone-assistant audio';
    } else if (POST_SESSION_PATTERNS.test(trimmed)) {
      kind = 'post-session';
      reason = 'Likely post-session AI or personal conversation';
    } else if (TECH_CHATTER.test(trimmed) && (sec == null || sec < 120)) {
      kind = 'non-session-audio';
      reason = 'Likely technical / connection chatter';
    }

    if (currentKind != null && kind !== currentKind) {
      flush(lineStart);
      segStart = lineStart;
    }
    if (currentKind == null) {
      currentKind = kind;
      segStart = lineStart;
      segReason = reason;
      segStartTs = ts;
    }
    segEndTs = ts ?? segEndTs;
    segPreview.push(trimmed);
    if (kind === 'session') sessionChunks.push(trimmed);
  }
  flush(offset);

  return {
    originalTranscript: transcript,
    segments,
    sessionOnlyText: sessionChunks.join('\n'),
    suggestedClinicalEndTimestamp: clinicalEnd,
  };
}

/** Detect risk-related language without inventing severity. */
export function detectRiskLanguage(transcript: string): Array<{
  excerpt: string;
  kind: 'self-harm' | 'not-wanting-to-live' | 'other-risk-language';
}> {
  const findings: Array<{
    excerpt: string;
    kind: 'self-harm' | 'not-wanting-to-live' | 'other-risk-language';
  }> = [];
  const lines = transcript.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/\bself[- ]?harm\b|\bcut(ting)? myself\b|\bhurt myself\b/i.test(line)) {
      findings.push({ excerpt: line.slice(0, 200), kind: 'self-harm' });
    }
    if (
      /\bnot wanting to live\b|\bdon'?t want to (be )?alive\b|\bsuicid/i.test(line)
    ) {
      findings.push({ excerpt: line.slice(0, 200), kind: 'not-wanting-to-live' });
    }
  }
  return findings;
}

export { formatSeconds, parseTimestampToSeconds };
