import type { RoomState, SetMode } from '../../types/room';

interface Props {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
  compact?: boolean;
}

export function TimingControls({ state, onChange, compact }: Props) {
  const mode: SetMode = state.continuous
    ? 'continuous'
    : state.setMode === 'timed'
      ? 'timed'
      : state.setMode === 'manual'
        ? 'continuous'
        : 'passes';

  const setTimingMode = (next: 'passes' | 'timed' | 'continuous') => {
    if (next === 'continuous') {
      onChange({ continuous: true, setMode: 'continuous' });
    } else if (next === 'timed') {
      onChange({ continuous: false, setMode: 'timed', targetSeconds: state.targetSeconds ?? 15 });
    } else {
      onChange({ continuous: false, setMode: 'passes', targetPasses: state.targetPasses ?? 30 });
    }
  };

  return (
    <div className={compact ? 'bls-fieldset compact' : 'bls-fieldset'}>
      <fieldset>
        <legend>Timing</legend>
        <p className="hint">Suggested starting point — adjust clinically</p>

        <label className="field speed-field">
          <span>Slower ←————————→ Faster</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={state.speed01}
            aria-label="BLS speed from slower to faster"
            onChange={(e) => onChange({ speed01: Number(e.target.value) })}
          />
        </label>

        <div className="segmented timing-modes">
          {(
            [
              ['passes', 'Passes'],
              ['timed', 'Time'],
              ['continuous', 'Continuous'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={mode === id || (id === 'continuous' && mode === 'continuous') ? 'is-active' : ''}
              onClick={() => setTimingMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'passes' && (
          <div className="stepper">
            <button
              type="button"
              className="btn"
              aria-label="Fewer passes"
              onClick={() =>
                onChange({ targetPasses: Math.max(1, (state.targetPasses ?? 30) - 1) })
              }
            >
              −
            </button>
            <strong aria-live="polite">{state.targetPasses ?? 30}</strong>
            <button
              type="button"
              className="btn"
              aria-label="More passes"
              onClick={() =>
                onChange({ targetPasses: Math.min(200, (state.targetPasses ?? 30) + 1) })
              }
            >
              +
            </button>
          </div>
        )}

        {mode === 'timed' && (
          <div className="stepper">
            <button
              type="button"
              className="btn"
              aria-label="Shorter duration"
              onClick={() =>
                onChange({ targetSeconds: Math.max(5, (state.targetSeconds ?? 15) - 1) })
              }
            >
              −
            </button>
            <strong aria-live="polite">{state.targetSeconds ?? 15} sec</strong>
            <button
              type="button"
              className="btn"
              aria-label="Longer duration"
              onClick={() =>
                onChange({ targetSeconds: Math.min(600, (state.targetSeconds ?? 15) + 1) })
              }
            >
              +
            </button>
          </div>
        )}

        {mode === 'continuous' && (
          <p className="hint">Runs until you press Stop.</p>
        )}
      </fieldset>
    </div>
  );
}
