import {
  BACKGROUND_COLOURS,
  STIMULUS_COLOURS,
  type RoomState,
  type VisualMode,
} from '../../types/room';

const MODES: { id: VisualMode; label: string }[] = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'diagonal-up', label: 'Diagonal ↗︎↙︎' },
  { id: 'diagonal-down', label: 'Diagonal ↖︎↘︎' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'infinity', label: 'Infinity ∞' },
  { id: 'blink', label: 'Blink L/R' },
];

interface Props {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
  /** When true, trajectory changes are blocked with a message */
  running?: boolean;
  compact?: boolean;
}

export function TrajectorySelector({ state, onChange, running, compact }: Props) {
  return (
    <fieldset className={compact ? 'bls-fieldset compact' : 'bls-fieldset'}>
      <legend>Movement</legend>
      {running && (
        <p className="hint warn">Pause the set to change trajectory</p>
      )}
      <div className="traj-grid" role="listbox" aria-label="BLS trajectory">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={state.visualMode === m.id ? 'traj-btn is-active' : 'traj-btn'}
            disabled={!!running && state.visualMode !== m.id}
            onClick={() => {
              if (running && state.visualMode !== m.id) return;
              onChange({
                visualMode: m.id,
                ...(m.id === 'infinity'
                  ? { setMode: 'timed' as const, targetSeconds: 15, speed01: 0.05 }
                  : {}),
              });
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function StimulusAppearanceControls({ state, onChange, compact }: Props) {
  return (
    <div className={compact ? 'bls-fieldset compact' : 'bls-fieldset'}>
      <fieldset>
        <legend>Appearance</legend>
        <p className="field-label">Stimulus colour</p>
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

        <p className="field-label">Background</p>
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

        <p className="field-label">Vertical position</p>
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

export function InfinityControls({ state, onChange }: Props) {
  if (state.visualMode !== 'infinity') return null;
  return (
    <fieldset className="bls-fieldset">
      <legend>Infinity / De-arousal</legend>
      <p className="hint">Very slow figure-eight — separate from reprocessing feedback.</p>
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
      <label className="field">
        <span>Duration {state.targetSeconds ?? 15}s</span>
        <input
          type="range"
          min={10}
          max={30}
          value={state.targetSeconds ?? 15}
          onChange={(e) =>
            onChange({
              targetSeconds: Number(e.target.value),
              setMode: 'timed',
              continuous: false,
            })
          }
        />
      </label>
    </fieldset>
  );
}
