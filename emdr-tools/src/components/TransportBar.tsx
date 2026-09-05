import type { ReactNode } from 'react';
import type { BlsSession } from '../hooks/useBlsSession';

interface TransportBarProps {
  session: BlsSession;
  onClientView?: () => void;
  onFullscreen?: () => void;
  checkInSlot?: ReactNode;
}

export function TransportBar({
  session,
  onClientView,
  onFullscreen,
  checkInSlot,
}: TransportBarProps) {
  const { state, metrics, start, pause, resume, stop, patchState, formatTime, resetCounters } =
    session;
  const active = state.running && !state.paused;

  return (
    <footer className="transport">
      <div className="bls-rate">
        <div className="bls-rate-label">
          <span>Speed</span>
          <strong>
            Slower <span aria-hidden>←</span>
            <span className="sr-only">to</span>
            <span aria-hidden>→</span> Faster
          </strong>
        </div>
        <div className="bls-rate-controls">
          <button
            type="button"
            className="btn icon"
            aria-label="Slower"
            onClick={() => patchState({ speed01: Math.max(0, state.speed01 - 0.05) })}
          >
            −
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.speed01}
            aria-label="BLS speed from slower to faster"
            onChange={(e) => patchState({ speed01: Number(e.target.value) })}
          />
          <button
            type="button"
            className="btn icon"
            aria-label="Faster"
            onClick={() => patchState({ speed01: Math.min(1, state.speed01 + 0.05) })}
          >
            +
          </button>
        </div>
        <p className="hint speed-hint">
          Suggested starting point — adjust clinically. Movement should be as fast as the client can
          comfortably manage without strain.
        </p>
      </div>

      {checkInSlot}

      <div className="transport-row">
        <div className="metrics" aria-live="polite">
          <Metric label="Time" value={formatTime(metrics.timeMs)} />
          <Metric label="Passes" value={String(metrics.passes)} />
          <Metric label="Sets" value={String(metrics.sets)} />
        </div>
        <div className="transport-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (window.confirm('Reset time, passes and sets counters?')) resetCounters();
            }}
          >
            Reset Counters
          </button>
          <button type="button" className="btn ghost" onClick={onClientView}>
            Client View
          </button>
          <button type="button" className="btn ghost" onClick={onFullscreen}>
            Fullscreen
          </button>
          <button type="button" className="btn" disabled={!active} onClick={() => pause()}>
            Pause
          </button>
          <button
            type="button"
            className="btn"
            disabled={!state.running || !state.paused}
            onClick={() => void resume()}
          >
            Resume
          </button>
          {!state.running ? (
            <button type="button" className="btn primary" onClick={() => void start()}>
              Start Set
            </button>
          ) : (
            <button type="button" className="btn danger" onClick={() => stop()}>
              Stop
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
