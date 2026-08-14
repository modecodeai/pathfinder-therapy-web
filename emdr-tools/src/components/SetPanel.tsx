import type { SessionSnapshot, SetMode } from '../lib/types';

interface SetPanelProps {
  snapshot: SessionSnapshot;
  onChange: (set: SessionSnapshot['set']) => void;
}

export function SetPanel({ snapshot, onChange }: SetPanelProps) {
  const s = snapshot.set;
  const set = (partial: Partial<typeof s>) => onChange({ ...s, ...partial });
  const modes: { id: SetMode; label: string }[] = [
    { id: 'manual', label: 'Manual' },
    { id: 'passes', label: 'Passes' },
    { id: 'timed', label: 'Timed' },
  ];

  return (
    <div className="panel">
      <h2>Auto stop</h2>
      <div className="segmented">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={s.mode === m.id ? 'is-active' : ''}
            onClick={() => set({ mode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      {s.mode === 'passes' && (
        <label className="slider-field">
          <span>Passes {s.passesTarget}</span>
          <input
            type="range"
            min={4}
            max={60}
            step={1}
            value={s.passesTarget}
            onChange={(e) => set({ passesTarget: Number(e.target.value) })}
          />
        </label>
      )}

      {s.mode === 'timed' && (
        <label className="slider-field">
          <span>Seconds {s.timedSeconds}</span>
          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={s.timedSeconds}
            onChange={(e) => set({ timedSeconds: Number(e.target.value) })}
          />
        </label>
      )}
    </div>
  );
}
