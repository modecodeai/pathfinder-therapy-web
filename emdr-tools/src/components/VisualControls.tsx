import {
  BACKGROUND_COLOURS,
  STIMULUS_COLOURS,
  type RoomState,
  type VisualMode,
} from '../types/room';

const MODES: { id: VisualMode; label: string }[] = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'diagonal-up', label: 'Diagonal ↗︎↙︎' },
  { id: 'diagonal-down', label: 'Diagonal ↖︎↘︎' },
  { id: 'infinity', label: 'Infinity ∞' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'blink', label: 'Blink L/R' },
];

interface VisualControlsProps {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
}

export function VisualControls({ state, onChange }: VisualControlsProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Visual</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={state.visualEnabled}
            onChange={(e) =>
              onChange({
                visualEnabled: e.target.checked,
                audioOnly: e.target.checked ? false : state.audioOnly,
              })
            }
            aria-label="Visual stimulation on"
          />
          <span>On</span>
        </label>
      </div>

      <fieldset>
        <legend>Trajectory</legend>
        <div className="chip-grid">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={state.visualMode === m.id ? 'chip is-active' : 'chip'}
              onClick={() =>
                onChange({
                  visualMode: m.id,
                  ...(m.id === 'infinity'
                    ? { setMode: 'timed' as const, targetSeconds: 15, speed01: 0.05 }
                    : {}),
                })
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      {state.visualMode === 'infinity' && (
        <fieldset>
          <legend>Midline direction</legend>
          <div className="segmented">
            <button
              type="button"
              className={state.midlineDirection === 'up' ? 'is-active' : ''}
              onClick={() => onChange({ midlineDirection: 'up' })}
            >
              Up through centre
            </button>
            <button
              type="button"
              className={state.midlineDirection === 'down' ? 'is-active' : ''}
              onClick={() => onChange({ midlineDirection: 'down' })}
            >
              Down through centre
            </button>
          </div>
          <p className="hint">
            Slow figure-eight for de-arousal — check which midline direction feels more soothing.
          </p>
        </fieldset>
      )}

      <fieldset>
        <legend>Stimulus colour</legend>
        <div className="swatches" role="listbox" aria-label="Stimulus colour">
          {STIMULUS_COLOURS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`swatch ${state.stimulusColour.toLowerCase() === c.value.toLowerCase() ? 'is-active' : ''}`}
              style={{ background: c.value }}
              aria-label={c.id}
              onClick={() => onChange({ stimulusColour: c.value })}
            />
          ))}
          <label className="swatch custom" title="Custom colour">
            <input
              type="color"
              value={state.stimulusColour}
              onChange={(e) => onChange({ stimulusColour: e.target.value })}
              aria-label="Custom stimulus colour"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Background</legend>
        <div className="swatches">
          {BACKGROUND_COLOURS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`swatch ${state.backgroundColour.toLowerCase() === c.value.toLowerCase() ? 'is-active' : ''}`}
              style={{ background: c.value }}
              aria-label={c.id}
              onClick={() => onChange({ backgroundColour: c.value })}
            />
          ))}
          <label className="swatch custom">
            <input
              type="color"
              value={state.backgroundColour}
              onChange={(e) => onChange({ backgroundColour: e.target.value })}
              aria-label="Custom background colour"
            />
          </label>
        </div>
      </fieldset>

      <label className="field">
        <span>Stimulus size {state.stimulusSize}px</span>
        <input
          type="range"
          min={8}
          max={40}
          step={1}
          value={state.stimulusSize}
          onChange={(e) => onChange({ stimulusSize: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span>Travel width {Math.round(state.travelWidth * 100)}%</span>
        <input
          type="range"
          min={30}
          max={100}
          step={5}
          value={Math.round(state.travelWidth * 100)}
          onChange={(e) => onChange({ travelWidth: Number(e.target.value) / 100 })}
        />
      </label>

      <fieldset>
        <legend>Position</legend>
        <div className="segmented">
          {(
            [
              ['Top', 0.15],
              ['Centre', 0.5],
              ['Bottom', 0.85],
            ] as const
          ).map(([label, value]) => (
            <button
              key={label}
              type="button"
              className={Math.abs(state.verticalPosition - value) < 0.05 ? 'is-active' : ''}
              onClick={() => onChange({ verticalPosition: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
