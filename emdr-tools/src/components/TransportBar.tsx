import type { BlsSession } from '../hooks/useBlsSession';
import {
  SPEED_MAX_HZ,
  SPEED_MIN_HZ,
  SPEED_STEP_HZ,
} from '../types/room';

interface TransportBarProps {
  session: BlsSession;
  onClientView?: () => void;
  onFullscreen?: () => void;
}

export function TransportBar({ session, onClientView, onFullscreen }: TransportBarProps) {
  const { state, metrics, start, pause, resume, stop, patchState, formatTime, resetCounters } =
    session;
  const active = state.running && !state.paused;

  return (
    <footer className="transport">
      <div className="bls-rate">
        <div className="bls-rate-label">
          <span>BLS Rate</span>
          <strong>{state.speedHz.toFixed(1)} Hz</strong>
        </div>
        <div className="bls-rate-controls">
          <button
            type="button"
            className="btn icon"
            aria-label="Decrease rate"
            onClick={() => patchState({ speedHz: state.speedHz - SPEED_STEP_HZ })}
          >
            −
          </button>
          <input
            type="range"
            min={SPEED_MIN_HZ}
            max={SPEED_MAX_HZ}
            step={SPEED_STEP_HZ}
            value={state.speedHz}
            aria-label="BLS rate in hertz"
            onChange={(e) => patchState({ speedHz: Number(e.target.value) })}
          />
          <button
            type="button"
            className="btn icon"
            aria-label="Increase rate"
            onClick={() => patchState({ speedHz: state.speedHz + SPEED_STEP_HZ })}
          >
            +
          </button>
        </div>
      </div>

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
