import type { AudioSound, SessionSnapshot } from '../lib/types';

interface AudioPanelProps {
  snapshot: SessionSnapshot;
  onChange: (audio: SessionSnapshot['audio']) => void;
  clientMode?: boolean;
}

const SOUNDS: { id: AudioSound; label: string }[] = [
  { id: 'soft-click', label: 'Soft click' },
  { id: 'tone', label: 'Tone' },
  { id: 'pulse', label: 'Pulse' },
];

export function AudioPanel({ snapshot, onChange, clientMode = false }: AudioPanelProps) {
  const a = snapshot.audio;
  const set = (partial: Partial<typeof a>) => onChange({ ...a, ...partial });

  return (
    <div className="panel">
      <div className="panel-row between">
        <h2>Audio</h2>
        <label className="switch">
          <input
            type="checkbox"
            checked={a.enabled}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          <span>On</span>
        </label>
      </div>

      {!clientMode && (
        <label className="switch block">
          <input
            type="checkbox"
            checked={a.muteTherapist}
            onChange={(e) => set({ muteTherapist: e.target.checked })}
          />
          <span>Mute audio for therapist</span>
        </label>
      )}

      <fieldset className="control-block">
        <legend>Sound</legend>
        <div className="segmented wrap">
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={a.sound === s.id ? 'is-active' : ''}
              onClick={() => set({ sound: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="hint">Stereo pans left/right with visual BLS. Uses the Web Audio API.</p>
    </div>
  );
}
