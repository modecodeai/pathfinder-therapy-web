import type { BlsMode, SessionSnapshot, VerticalPosition } from '../lib/types';

const COLORS = ['#2f6f6a', '#c45c26', '#d4a017', '#3d7ea6', '#8b5cf6', '#e8e4dc', '#f07167', '#ffffff'];
const BACKGROUNDS = ['#0e1418', '#1a2228', '#f4f1ea', '#000000'];

interface VisualPanelProps {
  snapshot: SessionSnapshot;
  onChange: (visual: SessionSnapshot['visual']) => void;
}

export function VisualPanel({ snapshot, onChange }: VisualPanelProps) {
  const v = snapshot.visual;
  const set = (partial: Partial<typeof v>) => onChange({ ...v, ...partial });

  const modes: { id: BlsMode; label: string }[] = [
    { id: 'horizontal', label: 'Horizontal' },
    { id: 'vertical', label: 'Vertical' },
    { id: 'diagonal-up', label: 'Diagonal ↑' },
    { id: 'diagonal-down', label: 'Diagonal ↓' },
    { id: 'blink', label: 'Blink L/R' },
  ];

  const positions: VerticalPosition[] = ['top', 'center', 'bottom'];

  return (
    <div className="panel">
      <div className="panel-row between">
        <h2>Visual</h2>
        <label className="switch">
          <input
            type="checkbox"
            checked={v.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          <span>On</span>
        </label>
      </div>

      <fieldset className="control-block">
        <legend>Colour</legend>
        <div className="swatches">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${v.color === c ? 'is-active' : ''}`}
              style={{ background: c }}
              aria-label={`Colour ${c}`}
              onClick={() => set({ color: c })}
            />
          ))}
          <label className="swatch custom">
            <input
              type="color"
              value={v.color}
              onChange={(e) => set({ color: e.target.value })}
              aria-label="Custom colour"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="control-block">
        <legend>Background</legend>
        <div className="swatches">
          {BACKGROUNDS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${v.background === c ? 'is-active' : ''}`}
              style={{ background: c }}
              aria-label={`Background ${c}`}
              onClick={() => set({ background: c })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="control-block">
        <legend>Mode</legend>
        <div className="segmented wrap">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              className={v.mode === m.id ? 'is-active' : ''}
              onClick={() => set({ mode: m.id })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="control-block">
        <legend>Position</legend>
        <div className="segmented">
          {positions.map((p) => (
            <button
              key={p}
              type="button"
              className={v.verticalPosition === p ? 'is-active' : ''}
              onClick={() => set({ verticalPosition: p })}
            >
              {p}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="slider-field">
        <span>Size {v.size.toFixed(1)}</span>
        <input
          type="range"
          min={0.4}
          max={3}
          step={0.1}
          value={v.size}
          onChange={(e) => set({ size: Number(e.target.value) })}
        />
      </label>

      <label className="slider-field">
        <span>Travel width {Math.round(v.travelWidth * 100)}%</span>
        <input
          type="range"
          min={0.25}
          max={1}
          step={0.05}
          value={v.travelWidth}
          onChange={(e) => set({ travelWidth: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}
