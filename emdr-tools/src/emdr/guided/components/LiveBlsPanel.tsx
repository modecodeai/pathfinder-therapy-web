import { useState } from 'react';
import type { BlsSession } from '../../../hooks/useBlsSession';
import type { RoomState } from '../../../types/room';
import type { TaxationMode } from '../../types/emdrTaxation';
import { TAXATION_MODE_LABELS, TAXATION_MODE_ORDER } from '../../types/emdrTaxation';
import { applyBlsPreset, BLS_PRESETS, type BlsPresetId } from '../lib/blsPresets';

interface Props {
  session: BlsSession;
  recommendedPreset?: BlsPresetId;
  presetOptions?: BlsPresetId[];
  showAdvancedTaxation?: boolean;
  onOpenClientDisplay?: () => void;
  onEmergencyStop: () => void;
  title?: string;
  children?: React.ReactNode;
}

const DURATION_OPTIONS: Array<{ label: string; patch: Partial<RoomState> }> = [
  { label: 'Manual', patch: { continuous: false, setMode: 'manual' } },
  { label: '8 passes', patch: { continuous: false, setMode: 'passes', targetPasses: 8 } },
  { label: '10 passes', patch: { continuous: false, setMode: 'passes', targetPasses: 10 } },
  { label: '12 passes', patch: { continuous: false, setMode: 'passes', targetPasses: 12 } },
  { label: '15 passes', patch: { continuous: false, setMode: 'passes', targetPasses: 15 } },
  { label: '20 passes', patch: { continuous: false, setMode: 'passes', targetPasses: 20 } },
  { label: '30 sec', patch: { continuous: false, setMode: 'timed', targetSeconds: 30 } },
  { label: '45 sec', patch: { continuous: false, setMode: 'timed', targetSeconds: 45 } },
  { label: '60 sec', patch: { continuous: false, setMode: 'timed', targetSeconds: 60 } },
  { label: 'Continuous', patch: { continuous: true, setMode: 'continuous' } },
];

/**
 * Persistent Live BLS panel for the clinical console.
 * Never silently changes active settings — presets require explicit Use Recommended / Keep Current.
 */
export function LiveBlsPanel({
  session,
  recommendedPreset,
  presetOptions,
  showAdvancedTaxation = true,
  onOpenClientDisplay,
  onEmergencyStop,
  title = 'Live BLS',
  children,
}: Props) {
  const s = session.state;
  const running = s.running && !s.paused;
  const [pendingPreset, setPendingPreset] = useState<BlsPresetId | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const options =
    presetOptions ??
    (['standardReprocessing', 'safeCalm', 'installation', 'emdShortSet', 'grantPainAuditory', 'rdi'] as BlsPresetId[]);

  const apply = (patch: Partial<RoomState>) => session.patchState(patch);

  const modalityLabel = s.audioOnly
    ? 'Auditory'
    : s.visualEnabled && s.audioEnabled
      ? 'Visual + Auditory'
      : s.visualEnabled
        ? 'Visual'
        : s.audioEnabled
          ? 'Auditory'
          : 'Off';

  return (
    <div className="live-bls-panel panel" aria-label="Live BLS controls">
      <header className="live-bls-head">
        <h3>{title}</h3>
        <p className={`live-bls-status${running ? ' is-active' : ''}`}>
          <span aria-hidden>{running ? '●' : '○'}</span> {running ? 'BLS ACTIVE' : 'BLS STOPPED'}
        </p>
      </header>

      <div className="live-bls-transport" aria-label="BLS transport">
        {!running ? (
          <button type="button" className="btn primary large" onClick={() => void session.start()}>
            START
          </button>
        ) : (
          <button
            type="button"
            className="btn large"
            onClick={() => (s.paused ? void session.resume() : session.pause())}
          >
            {s.paused ? 'Resume' : 'Pause'}
          </button>
        )}
        <button type="button" className="btn danger large" onClick={() => session.stop()}>
          STOP
        </button>
        <button type="button" className="btn danger" onClick={onEmergencyStop}>
          Emergency stop
        </button>
      </div>

      <p className="hint">
        {modalityLabel}
        {s.taxationMode && s.taxationMode !== 'standard' ? ` · ${s.taxationMode}` : ' · Standard'}
        {' · '}
        {session.formatTime(session.metrics.timeMs)}
        {s.continuous || s.setMode === 'continuous' ? ' · Continuous' : ''}
      </p>

      {recommendedPreset && (
        <div className="live-bls-recommended">
          <p>
            <strong>Recommended:</strong> {BLS_PRESETS[recommendedPreset].label}
          </p>
          <p className="hint">{BLS_PRESETS[recommendedPreset].summary}</p>
          <div className="stack-btns horizontal wrap">
            <button
              type="button"
              className="btn primary"
              onClick={() => apply(applyBlsPreset(recommendedPreset, s))}
              disabled={running}
            >
              Use Recommended
            </button>
            <button type="button" className="btn ghost" onClick={() => setPendingPreset(null)}>
              Keep Current
            </button>
          </div>
          {running && (
            <p className="hint">Stop BLS before applying a preset — settings never change silently mid-set.</p>
          )}
        </div>
      )}

      <fieldset className="live-bls-fieldset">
        <legend>Modality</legend>
        <div className="stack-btns horizontal wrap">
          <button
            type="button"
            className={`btn ghost${s.visualEnabled && !s.audioEnabled ? ' is-active' : ''}`}
            onClick={() => apply({ visualEnabled: true, audioEnabled: false, audioOnly: false })}
          >
            Visual
          </button>
          <button
            type="button"
            className={`btn ghost${s.audioOnly || (!s.visualEnabled && s.audioEnabled) ? ' is-active' : ''}`}
            onClick={() => apply({ visualEnabled: false, audioEnabled: true, audioOnly: true })}
          >
            Auditory
          </button>
          <button
            type="button"
            className={`btn ghost${s.visualEnabled && s.audioEnabled && !s.audioOnly ? ' is-active' : ''}`}
            onClick={() => apply({ visualEnabled: true, audioEnabled: true, audioOnly: false })}
          >
            Visual + Auditory
          </button>
        </div>
      </fieldset>

      <label className="field">
        <span>Speed</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={s.speed01}
          onChange={(e) => apply({ speed01: Number(e.target.value) })}
        />
      </label>

      <fieldset className="live-bls-fieldset">
        <legend>Duration</legend>
        <div className="stack-btns horizontal wrap">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              className="btn ghost"
              onClick={() => apply(opt.patch)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Preset</span>
        <select
          value={pendingPreset ?? ''}
          onChange={(e) => setPendingPreset((e.target.value || null) as BlsPresetId | null)}
        >
          <option value="">Select preset…</option>
          {options.map((id) => (
            <option key={id} value={id}>
              {BLS_PRESETS[id].label}
            </option>
          ))}
        </select>
      </label>
      {pendingPreset && (
        <div className="stack-btns horizontal">
          <button
            type="button"
            className="btn primary"
            disabled={running}
            onClick={() => {
              apply(applyBlsPreset(pendingPreset, s));
              setPendingPreset(null);
            }}
          >
            Apply {BLS_PRESETS[pendingPreset].label}
          </button>
          <button type="button" className="btn ghost" onClick={() => setPendingPreset(null)}>
            Cancel
          </button>
        </div>
      )}

      {s.audioEnabled && (
        <fieldset className="live-bls-fieldset">
          <legend>Auditory</legend>
          <label className="field">
            <span>Tone</span>
            <select
              value={s.audioSound}
              onChange={(e) => apply({ audioSound: e.target.value as RoomState['audioSound'] })}
            >
              <option value="soft-tone">Soft tone</option>
              <option value="soft-click">Soft click</option>
              <option value="pulse">Pulse</option>
            </select>
          </label>
          <label className="field">
            <span>Volume · {Math.round(s.audioVolume * 100)}%</span>
            <input
              type="range"
              min={0.05}
              max={0.85}
              step={0.01}
              value={s.audioVolume}
              onChange={(e) => apply({ audioVolume: Number(e.target.value) })}
            />
          </label>
        </fieldset>
      )}

      {onOpenClientDisplay && s.visualEnabled && !s.audioOnly && (
        <button type="button" className="btn" onClick={onOpenClientDisplay}>
          Open Client Display
        </button>
      )}

      {showAdvancedTaxation && (
        <div className="live-bls-advanced">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            Advanced Taxation {advancedOpen ? '▾' : '▸'}
          </button>
          {advancedOpen && (
            <div className="live-bls-taxation" role="group" aria-label="Working memory taxation modes">
              <p className="hint">
                Switch modes without leaving the script. Does not reset target or processing notes.
                Prefer intentional selection — Standard is the default predictable path.
              </p>
              <div className="stack-btns horizontal wrap">
                {TAXATION_MODE_ORDER.map((mode: TaxationMode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`btn ghost${s.taxationMode === mode ? ' is-active' : ''}`}
                    onClick={() => apply({ taxationMode: mode })}
                  >
                    {TAXATION_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn primary"
                onClick={() =>
                  apply({
                    taxationMode: 'standard',
                  })
                }
              >
                Return to Standard
              </button>
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
