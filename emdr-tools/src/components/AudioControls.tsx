import type { AudioSound, RoomState } from '../types/room';

const SOUNDS: { id: AudioSound; label: string }[] = [
  { id: 'soft-click', label: 'Soft Click' },
  { id: 'soft-tone', label: 'Soft Tone' },
  { id: 'pulse', label: 'Pulse' },
];

interface AudioControlsProps {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
  isClient?: boolean;
}

export function AudioControls({ state, onChange, isClient = false }: AudioControlsProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Audio</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={state.audioEnabled}
            onChange={(e) => onChange({ audioEnabled: e.target.checked })}
            aria-label="Audio stimulation on"
          />
          <span>On</span>
        </label>
      </div>

      <fieldset>
        <legend>Sound</legend>
        <div className="segmented wrap">
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={state.audioSound === s.id ? 'is-active' : ''}
              onClick={() => onChange({ audioSound: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Volume {Math.round(state.audioVolume * 100)}%</span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(state.audioVolume * 100)}
          onChange={(e) => onChange({ audioVolume: Number(e.target.value) / 100 })}
        />
      </label>

      <label className="toggle block">
        <input
          type="checkbox"
          checked={state.syncAudioWithVisual}
          onChange={(e) => onChange({ syncAudioWithVisual: e.target.checked })}
        />
        <span>Synchronise with visual</span>
      </label>

      <label className="toggle block">
        <input
          type="checkbox"
          checked={state.audioOnly}
          onChange={(e) =>
            onChange({
              audioOnly: e.target.checked,
              audioEnabled: e.target.checked ? true : state.audioEnabled,
              visualEnabled: e.target.checked ? false : state.visualEnabled,
            })
          }
        />
        <span>Audio-only mode</span>
      </label>

      {!isClient && (
        <label className="toggle block">
          <input
            type="checkbox"
            checked={state.muteTherapistAudio}
            onChange={(e) => onChange({ muteTherapistAudio: e.target.checked })}
          />
          <span>Mute audio for therapist</span>
        </label>
      )}
    </div>
  );
}
