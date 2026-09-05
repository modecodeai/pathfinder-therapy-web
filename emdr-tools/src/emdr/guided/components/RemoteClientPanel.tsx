import { useEffect, useState } from 'react';
import type { TherapistClientDisplay } from '../../hooks/useTherapistClientDisplay';
import { ClientDisplayActions, clientDisplayStatus } from '../../components/ClientDisplayPanel';
import type { RoomState } from '../../../types/room';

interface Props {
  open: boolean;
  onClose: () => void;
  display: TherapistClientDisplay;
  state: RoomState;
  onMuteTherapistChange: (muted: boolean) => void;
  outputMode: 'local' | 'remote' | 'both';
  onOutputMode: (m: 'local' | 'remote' | 'both') => void;
  therapistPreview: boolean;
  onTherapistPreview: (v: boolean) => void;
}

export function RemoteClientPanel({
  open,
  onClose,
  display,
  state,
  onMuteTherapistChange,
  outputMode,
  onOutputMode,
  therapistPreview,
  onTherapistPreview,
}: Props) {
  const [expiresLabel, setExpiresLabel] = useState('—');
  const status = clientDisplayStatus(display);

  useEffect(() => {
    if (!open || !display.roomId) return;
    let cancelled = false;
    void fetch(`/api/rooms/${encodeURIComponent(display.roomId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { expiresAt?: number } | null) => {
        if (cancelled || !data?.expiresAt) return;
        setExpiresLabel(new Date(data.expiresAt).toLocaleString());
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, display.roomId]);

  if (!open) return null;

  return (
    <div className="pf-remote-panel-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="pf-remote-panel"
        role="dialog"
        aria-label="Remote client display"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="pf-remote-panel-head">
          <h2>Remote Client Display</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <p className={`pf-remote-status tone-${status.tone}`}>
          <span aria-hidden>●</span> {status.text}
        </p>

        {display.clientPressedStop && (
          <div className="banner notice" role="alert">
            <strong>CLIENT PRESSED STOP</strong> — BLS stopped. Restart manually when ready.
            <button type="button" className="btn ghost" onClick={display.clearClientStopBanner}>
              Dismiss
            </button>
          </div>
        )}

        {display.banner && (
          <div className="banner soft" role="status">
            {display.banner}
            <button type="button" className="btn ghost" onClick={() => display.setBanner(null)}>
              Dismiss
            </button>
          </div>
        )}

        <dl className="pf-remote-meta">
          <div>
            <dt>Session ID</dt>
            <dd className="mono">{display.roomId ?? '—'}</dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>{expiresLabel}</dd>
          </div>
          <div>
            <dt>Link</dt>
            <dd className="mono pf-remote-link">{display.joinUrl ?? 'Create a session to generate a link'}</dd>
          </div>
        </dl>

        <ClientDisplayActions
          display={display}
          state={state}
          onMuteTherapistChange={onMuteTherapistChange}
        />

        <fieldset className="live-bls-fieldset">
          <legend>Output</legend>
          {(
            [
              ['local', 'This device'],
              ['remote', 'Remote client'],
              ['both', 'This device + remote client'],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="check-row">
              <input
                type="radio"
                name="bls-output"
                checked={outputMode === id}
                onChange={() => onOutputMode(id)}
              />
              <span>{label}</span>
            </label>
          ))}
          {outputMode !== 'local' && display.peerStatus !== 'connected' && (
            <p className="hint">
              No remote client connected. Create or copy a client link — output will not silently
              fall back to this device alone.
            </p>
          )}
        </fieldset>

        <label className="check-row">
          <input
            type="checkbox"
            checked={therapistPreview}
            onChange={(e) => onTherapistPreview(e.target.checked)}
          />
          <span>Therapist Preview (small local representation)</span>
        </label>

        <p className="hint">
          Client pages show stimulation only — never scripts, targets, SUD, or notes. No client
          account required.
        </p>
      </aside>
    </div>
  );
}
