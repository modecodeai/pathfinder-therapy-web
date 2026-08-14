import { SPEED_MAX_HZ, SPEED_MIN_HZ, SPEED_STEP_HZ } from '../lib/types';
import type { SessionController } from '../hooks/useSessionController';

interface TransportBarProps {
  session: SessionController;
  onFullscreen?: () => void;
  onClientView?: () => void;
}

export function TransportBar({ session, onFullscreen, onClientView }: TransportBarProps) {
  const { snapshot, pause, stop, setSpeed, formatTime } = session;
  const running = snapshot.running && !snapshot.paused;

  return (
    <footer className="transport">
      <div className="transport-stats">
        <div>
          <span className="stat-label">Time</span>
          <strong>{formatTime(snapshot.timeMs)}</strong>
        </div>
        <div>
          <span className="stat-label">Passes</span>
          <strong>{snapshot.passes}</strong>
        </div>
        <div>
          <span className="stat-label">Sets</span>
          <strong>{snapshot.sets}</strong>
        </div>
      </div>

      <div className="transport-actions">
        <button type="button" className="btn ghost" onClick={onClientView} title="Open client view">
          Client view
        </button>
        <button type="button" className="btn ghost" onClick={onFullscreen} title="Fullscreen (F)">
          Fullscreen
        </button>
        <button
          type="button"
          className="btn"
          disabled={!snapshot.running || snapshot.paused}
          onClick={pause}
        >
          Pause
        </button>
        <button type="button" className="btn danger" onClick={stop} disabled={!snapshot.running && snapshot.timeMs === 0}>
          Stop
        </button>
        <button
          type="button"
          className="btn primary play"
          disabled={snapshot.running && !snapshot.paused}
          onClick={() => {
            if (!snapshot.running) void session.start();
            else if (snapshot.paused) void session.resume();
          }}
        >
          {!snapshot.running ? 'Start' : 'Resume'}
        </button>
      </div>

      <label className="speed-slider">
        <span>
          Speed {snapshot.speedHz.toFixed(1)} Hz
          <em>{running ? ' · live' : ''}</em>
        </span>
        <input
          type="range"
          min={SPEED_MIN_HZ}
          max={SPEED_MAX_HZ}
          step={SPEED_STEP_HZ}
          value={snapshot.speedHz}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
      </label>
    </footer>
  );
}
