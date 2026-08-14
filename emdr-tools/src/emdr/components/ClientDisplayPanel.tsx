import type { TherapistClientDisplay } from '../hooks/useTherapistClientDisplay';
import type { RoomState } from '../../types/room';

interface ClientDisplayPanelProps {
  display: TherapistClientDisplay;
  state: RoomState;
  onMuteTherapistChange: (muted: boolean) => void;
}

function statusLabel(display: TherapistClientDisplay): { text: string; tone: string } {
  if (!display.active) return { text: 'Not connected', tone: 'idle' };
  if (display.peerStatus === 'connected') return { text: 'Connected', tone: 'ok' };
  if (display.peerStatus === 'waiting') return { text: 'Waiting for client', tone: 'wait' };
  if (display.peerStatus === 'interrupted') return { text: 'Connection interrupted', tone: 'warn' };
  if (display.peerStatus === 'disconnected') return { text: 'Disconnected', tone: 'warn' };
  return { text: 'Not connected', tone: 'idle' };
}

export function ClientDisplayPanel({
  display,
  state,
  onMuteTherapistChange,
}: ClientDisplayPanelProps) {
  const status = statusLabel(display);

  return (
    <div className="panel client-display-panel" data-join-url={display.joinUrl ?? undefined}>
      <div className="client-display-head">
        <h2>Client Display</h2>
        <span className={`client-display-dot tone-${status.tone}`} title={status.text}>
          ● {status.text}
        </span>
      </div>

      {display.active && (
        <p className="hint client-display-meta">
          {display.peerStatus === 'connected'
            ? display.clientFullscreen === false
              ? 'Client connected · not full screen'
              : display.clientFullscreen
                ? 'Client connected · full screen'
                : 'Client connected'
            : 'Share link or open display window'}
          {' · '}
          Client stimulus: {display.stimulusSummary()}
        </p>
      )}

      {!display.active && (
        <p className="hint">Open a full-screen BLS window for a second monitor, or invite a remote client.</p>
      )}

      <div className="client-display-actions">
        <button type="button" className="btn primary" onClick={() => void display.openClientDisplay()}>
          Open Client Display
        </button>
        <button type="button" className="btn" onClick={() => void display.copyClientLink()}>
          {display.copied ? 'Copied' : 'Copy Client Link'}
        </button>
        <button type="button" className="btn ghost" onClick={() => display.togglePreview()}>
          {display.previewOpen ? 'Hide Preview' : 'Preview'}
        </button>
      </div>

      {display.active && (
        <div className="client-display-actions">
          <button type="button" className="btn danger" onClick={() => display.disconnectDisplay()}>
            Disconnect
          </button>
        </div>
      )}

      <label className="toggle block">
        <input
          type="checkbox"
          checked={state.muteTherapistAudio}
          onChange={(e) => onMuteTherapistChange(e.target.checked)}
        />
        Mute audio on therapist device
      </label>
      <p className="hint">Client audio is separate — mute here does not mute the client display.</p>

      {display.error && <p className="error">{display.error}</p>}
    </div>
  );
}
