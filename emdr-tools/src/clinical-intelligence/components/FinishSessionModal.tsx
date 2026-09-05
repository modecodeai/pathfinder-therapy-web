import type { ClinicalCycleState } from '../types';

function formatMs(ms?: number): string {
  if (ms == null || ms <= 0) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function FinishSessionModal({
  open,
  onClose,
  cycle,
  protocol,
  phase,
  target,
  sud,
  voc,
  blsElapsedMs,
  unsavedNotes,
  onContinue,
  onFinishWithTranscript,
  onFinishWithoutTranscript,
}: {
  open: boolean;
  onClose: () => void;
  cycle?: ClinicalCycleState | null;
  protocol: string;
  phase: string;
  target?: string;
  sud?: number | null;
  voc?: number | null;
  blsElapsedMs?: number;
  unsavedNotes?: boolean;
  onContinue: () => void;
  onFinishWithTranscript: () => void;
  onFinishWithoutTranscript: () => void;
}) {
  if (!open) return null;
  return (
    <div className="pf-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="pf-modal finish-session-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-session-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="finish-session-title">Session complete?</h2>
        <p className="pf-meta">Review the current session state before closing.</p>
        <dl className="ci-kv">
          <dt>Protocol</dt>
          <dd>{protocol}</dd>
          <dt>Phase</dt>
          <dd>{phase}</dd>
          <dt>Target</dt>
          <dd>{target || '—'}</dd>
          <dt>SUD / VoC</dt>
          <dd>
            {sud ?? '—'} / {voc ?? '—'}
          </dd>
          <dt>BLS elapsed</dt>
          <dd>{formatMs(blsElapsedMs)}</dd>
          <dt>Unsaved notes</dt>
          <dd>{unsavedNotes ? 'Yes — save or discard before leaving if needed' : 'None detected'}</dd>
          <dt>Transcript</dt>
          <dd>{cycle?.transcriptStatus === 'no-transcript' ? 'No transcript yet' : 'Present'}</dd>
          <dt>Session ID</dt>
          <dd className="pf-meta">{cycle?.sessionId || 'Will attach on save'}</dd>
        </dl>
        <div className="stack-btns finish-session-actions">
          <button type="button" className="btn primary" onClick={onFinishWithTranscript}>
            Finish and add transcript
          </button>
          <button type="button" className="btn secondary" onClick={onFinishWithoutTranscript}>
            Finish without transcript
          </button>
          <button type="button" className="btn tertiary" onClick={onContinue}>
            Continue session
          </button>
        </div>
        <p className="pf-meta" style={{ marginTop: 12 }}>
          Transcript and Clinical Reasoning are optional. Pathfinder remains fully usable without
          AI.
        </p>
      </div>
    </div>
  );
}
