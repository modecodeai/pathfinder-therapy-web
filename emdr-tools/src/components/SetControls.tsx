import { PASS_PRESETS, TIME_PRESETS, type RoomState, type SetMode } from '../types/room';

interface SetControlsProps {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
}

export function SetControls({ state, onChange }: SetControlsProps) {
  const modes: { id: SetMode; label: string }[] = [
    { id: 'manual', label: 'Manual' },
    { id: 'passes', label: 'Passes' },
    { id: 'timed', label: 'Timed' },
  ];

  return (
    <div className="panel">
      <h2>Sets</h2>
      <div className="segmented">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={state.setMode === m.id ? 'is-active' : ''}
            onClick={() => onChange({ setMode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      {state.setMode === 'passes' && (
        <>
          <div className="chip-grid" style={{ marginTop: '0.75rem' }}>
            {PASS_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={state.targetPasses === n ? 'chip is-active' : 'chip'}
                onClick={() => onChange({ targetPasses: n })}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="field">
            <span>Custom passes</span>
            <input
              type="number"
              min={1}
              max={200}
              value={state.targetPasses ?? 24}
              onChange={(e) => onChange({ targetPasses: Number(e.target.value) || 1 })}
            />
          </label>
        </>
      )}

      {state.setMode === 'timed' && (
        <>
          <div className="chip-grid" style={{ marginTop: '0.75rem' }}>
            {TIME_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={state.targetSeconds === n ? 'chip is-active' : 'chip'}
                onClick={() => onChange({ targetSeconds: n })}
              >
                {n}s
              </button>
            ))}
          </div>
          <label className="field">
            <span>Custom seconds</span>
            <input
              type="number"
              min={1}
              max={600}
              value={state.targetSeconds ?? 30}
              onChange={(e) => onChange({ targetSeconds: Number(e.target.value) || 1 })}
            />
          </label>
        </>
      )}

      {state.setMode === 'manual' && (
        <p className="hint">Runs until you press Stop.</p>
      )}
    </div>
  );
}
