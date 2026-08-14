import { useEffect, useId, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { TherapistClientDisplay } from '../hooks/useTherapistClientDisplay';
import type { RoomState } from '../../types/room';
import { ClientPreviewMirror } from './ClientPreviewMirror';

export function clientDisplayStatus(display: TherapistClientDisplay): {
  text: string;
  tone: 'idle' | 'wait' | 'ok' | 'warn';
} {
  if (display.peerStatus === 'connected') return { text: 'Connected', tone: 'ok' };
  if (display.peerStatus === 'waiting') return { text: 'Waiting for client', tone: 'wait' };
  if (display.peerStatus === 'interrupted') return { text: 'Connection interrupted', tone: 'warn' };
  if (display.peerStatus === 'disconnected') return { text: 'Connection interrupted', tone: 'warn' };
  if (display.active) return { text: 'Waiting for client', tone: 'wait' };
  return { text: 'Not connected', tone: 'idle' };
}

/** Shared actions — toolbar popover. */
export function ClientDisplayActions({
  display,
  state,
  onMuteTherapistChange,
  onClose,
}: {
  display: TherapistClientDisplay;
  state: RoomState;
  onMuteTherapistChange: (muted: boolean) => void;
  onClose?: () => void;
}) {
  const status = clientDisplayStatus(display);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!showQr || !display.joinUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(display.joinUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#172026', light: '#ffffff' },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [showQr, display.joinUrl]);

  return (
    <div className="client-display-actions-block" data-join-url={display.joinUrl ?? undefined}>
      <div className="client-display-status-row">
        <span className={`client-display-dot tone-${status.tone}`}>●</span>
        <strong>{status.text}</strong>
      </div>

      <p className="hint client-display-lede">
        Put BLS on a second screen or share a secure link. You stay in Session Companion — Start Set
        controls the client automatically.
      </p>

      <div className="client-display-section">
        <p className="client-display-section-label">Open on this device / second screen</p>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            void display.openClientDisplay();
            onClose?.();
          }}
        >
          Open Client Display
        </button>
      </div>

      <div className="client-display-section">
        <p className="client-display-section-label">Share remotely</p>
        <div className="client-display-actions">
          <button type="button" className="btn" onClick={() => void display.copyClientLink()}>
            {display.copied ? 'Client link copied' : 'Copy Client Link'}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              void display.ensureRoom({ markWaiting: true }).then(() => setShowQr((v) => !v));
            }}
          >
            {showQr ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        </div>
        {showQr && display.joinUrl && (
          <div className="client-display-qr">
            {qrDataUrl ? (
              <img src={qrDataUrl} width={160} height={160} alt="QR code for client display link" />
            ) : (
              <p className="hint">Preparing QR…</p>
            )}
            <p className="mono hint">{display.joinUrl}</p>
          </div>
        )}
      </div>

      <div className="client-display-section">
        <p className="client-display-section-label">Preview</p>
        <button type="button" className="btn" onClick={() => display.setPreviewOpen(true)}>
          Preview Client Screen
        </button>
      </div>

      {(display.active ||
        display.peerStatus === 'connected' ||
        display.peerStatus === 'waiting' ||
        display.peerStatus === 'interrupted') && (
        <div className="client-display-section">
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              display.disconnectDisplay();
              onClose?.();
            }}
          >
            Disconnect Client
          </button>
        </div>
      )}

      {display.active && (
        <p className="hint client-display-meta">
          Client stimulus: {display.stimulusSummary()}
          {display.clientFullscreen === true
            ? ' · Full screen'
            : display.clientFullscreen === false
              ? ' · Not full screen'
              : ''}
        </p>
      )}

      <label className="toggle block">
        <input
          type="checkbox"
          checked={state.muteTherapistAudio}
          onChange={(e) => onMuteTherapistChange(e.target.checked)}
        />
        Mute audio on therapist device
      </label>

      {display.copied && (
        <p className="client-display-toast" role="status">
          Client link copied
        </p>
      )}
      {display.error && <p className="error">{display.error}</p>}
    </div>
  );
}

/** Permanent top-toolbar control + popover. Visible in every phase. */
export function ClientDisplayToolbarButton({
  display,
  state,
  onMuteTherapistChange,
}: {
  display: TherapistClientDisplay;
  state: RoomState;
  onMuteTherapistChange: (muted: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const status = clientDisplayStatus(display);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="client-display-toolbar-wrap" ref={rootRef}>
      <button
        type="button"
        className={`btn client-display-toolbar-btn tone-${status.tone} ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="client-display-toolbar-title">Client Display</span>
        <span className={`client-display-toolbar-status tone-${status.tone}`}>
          <span aria-hidden>●</span> {status.text}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="client-display-popover"
          role="dialog"
          aria-label="Client Display"
        >
          <div className="client-display-popover-head">
            <h2>Client Display</h2>
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <ClientDisplayActions
            display={display}
            state={state}
            onMuteTherapistChange={onMuteTherapistChange}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

/** Modal preview — render once at Session Companion root. */
export function ClientDisplayPreviewModal({ display }: { display: TherapistClientDisplay }) {
  if (!display.previewOpen) return null;
  return (
    <div className="client-preview-modal" role="dialog" aria-label="Client screen preview">
      <div className="client-preview-modal-card">
        <div className="client-preview-modal-head">
          <h2>Preview Client Screen</h2>
          <button type="button" className="btn ghost" onClick={() => display.setPreviewOpen(false)}>
            Close
          </button>
        </div>
        <ClientPreviewMirror open />
        <p className="hint">Mirrors the client display only — does not create a set.</p>
      </div>
    </div>
  );
}

/** Compact card in the right BLS panel — deliberate second entry point. */
export function ClientDisplayPanel({
  display,
  state,
  onMuteTherapistChange,
}: {
  display: TherapistClientDisplay;
  state: RoomState;
  onMuteTherapistChange: (muted: boolean) => void;
}) {
  const status = clientDisplayStatus(display);

  return (
    <div className="panel client-display-panel" data-join-url={display.joinUrl ?? undefined}>
      <div className="client-display-head">
        <h2>Client Display</h2>
        <span className={`client-display-dot tone-${status.tone}`}>● {status.text}</span>
      </div>

      <div className="client-display-actions">
        <button type="button" className="btn primary" onClick={() => void display.openClientDisplay()}>
          Open Display
        </button>
        <button type="button" className="btn" onClick={() => void display.copyClientLink()}>
          {display.copied ? 'Link copied' : 'Copy Link'}
        </button>
        <button type="button" className="btn ghost" onClick={() => display.setPreviewOpen(true)}>
          Preview
        </button>
        {(display.peerStatus === 'connected' ||
          display.peerStatus === 'waiting' ||
          display.peerStatus === 'interrupted' ||
          display.peerStatus === 'disconnected') && (
          <button type="button" className="btn danger" onClick={() => display.disconnectDisplay()}>
            Disconnect
          </button>
        )}
      </div>

      <label className="toggle block">
        <input
          type="checkbox"
          checked={state.muteTherapistAudio}
          onChange={(e) => onMuteTherapistChange(e.target.checked)}
        />
        Mute therapist audio
      </label>

      {display.error && <p className="error">{display.error}</p>}
    </div>
  );
}
