import { useMemo, useState } from 'react';
import type { EMDRPhase } from '../../types/emdr';
import type { TaxationMode } from '../../types/emdrTaxation';
import {
  DEFAULT_TAXATION_PALETTE,
  TAXATION_MODE_LABELS,
} from '../../types/emdrTaxation';
import {
  estimateWorkingMemoryLoad,
  modeTooltip,
  reduceTaxationOneStep,
  increaseTaxationOneStep,
  taxationConfigPatchToRoom,
} from '../../engine/taxationPresets';
import { taxationModeDisplayLabel } from '../../engine/taxationEngine';
import { roomStateToTaxationConfig, type RoomState } from '../../../types/room';
import { STIMULUS_COLOURS } from '../../../types/room';
import { TaxationIndicator } from './TaxationIndicator';

const STAGE1_MODES: TaxationMode[] = [
  'standard',
  'variable-speed',
  'colour-shift',
  'random-colour',
  'direction-shift',
  'pattern-switch',
  'chaos',
  'custom',
];

const STAGE1_READY = new Set<TaxationMode>([
  'standard',
  'variable-speed',
  'colour-shift',
  'random-colour',
]);

interface Props {
  phase: EMDRPhase;
  state: RoomState;
  running: boolean;
  setSeconds: number;
  secondaryTaskPrompt: string | null;
  colourPrompt: string | null;
  onChange: (partial: Partial<RoomState>) => void;
  onReturnToStandard: () => void;
  onClearSecondaryTask: () => void;
  onOpenHelpArticle?: () => void;
}

export function TaxationControls({
  phase,
  state,
  running,
  setSeconds,
  secondaryTaskPrompt,
  colourPrompt,
  onChange,
  onReturnToStandard,
  onClearSecondaryTask,
  onOpenHelpArticle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [phaseAdvisoryDismissed, setPhaseAdvisoryDismissed] = useState(false);
  const config = useMemo(() => roomStateToTaxationConfig(state), [state]);
  const load = estimateWorkingMemoryLoad(config);
  const isPhase4 = phase === 'desensitisation';
  const advancedActive = config.mode !== 'standard';
  const showPhaseAdvisory =
    advancedActive && !isPhase4 && !phaseAdvisoryDismissed;

  const patchMode = (mode: TaxationMode) => {
    if (!STAGE1_READY.has(mode) && mode !== 'chaos') {
      // Stage 2/3/4 modes selectable but Chaos capped / Custom deferred messaging
      if (mode === 'direction-shift' || mode === 'pattern-switch' || mode === 'custom') {
        // Allow selection for UI completeness; engine Stage 1 treats unknown as mild colour/speed-safe
      }
    }
    let chaosLevel = state.taxationChaosLevel;
    if (mode === 'chaos' && state.taxationReduceVisualVariation) chaosLevel = 1;
    onChange({ taxationMode: mode, taxationChaosLevel: chaosLevel });
    if (mode !== 'standard' && !isPhase4) setPhaseAdvisoryDismissed(false);
  };

  return (
    <div className="taxation-controls panel">
      <header className="taxation-head">
        <div>
          <h3>Working Memory Taxation</h3>
          <p className="hint">EMDR 2.0-informed tools · clinician-controlled</p>
        </div>
        <button type="button" className="btn ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show'}
        </button>
      </header>

      <div className="taxation-live-strip" aria-live="polite">
        <span>
          Current Mode: <strong>{taxationModeDisplayLabel(config)}</strong>
        </span>
        <TaxationIndicator load={load} compact />
        {isPhase4 && advancedActive && (
          <span className="taxation-phase-badge">Phase 4 · Working Memory Taxation</span>
        )}
        {secondaryTaskPrompt && (
          <span className="taxation-task-line">Additional Task: {secondaryTaskPrompt}</span>
        )}
        {running && <span className="taxation-set-line">Set: {setSeconds} seconds</span>}
      </div>

      {isPhase4 ? (
        <p className="taxation-phase-ok hint">
          Primary use: EMDR Phase 4 — Desensitisation · Working Memory Taxation available
        </p>
      ) : (
        <p className="taxation-phase-guidance hint">
          Higher working-memory taxation is principally intended for Phase 4 desensitisation.
          Controls remain available; clinical judgement applies.
        </p>
      )}

      {showPhaseAdvisory && (
        <div className="taxation-advisory" role="status">
          <p>
            Clinical check: enhanced working-memory taxation is primarily designed for Phase 4
            desensitisation.
          </p>
          <div className="stack-btns horizontal">
            <button type="button" className="btn" onClick={() => setPhaseAdvisoryDismissed(true)}>
              Continue
            </button>
            <button type="button" className="btn primary" onClick={onReturnToStandard}>
              Return to Standard
            </button>
          </div>
        </div>
      )}

      {colourPrompt && state.taxationColourNamingMode && (
        <div className="taxation-clinician-prompt" role="status">
          <strong>Colour naming</strong>
          <p>{colourPrompt}</p>
        </div>
      )}

      {open && (
        <div className="taxation-body">
          <label className="field">
            <span>Taxation Mode</span>
            <select
              value={state.taxationMode}
              onChange={(e) => patchMode(e.target.value as TaxationMode)}
              aria-label="Taxation mode"
            >
              {STAGE1_MODES.map((m) => (
                <option key={m} value={m} title={modeTooltip(m)}>
                  {TAXATION_MODE_LABELS[m]}
                  {!STAGE1_READY.has(m) && m !== 'chaos' ? ' (coming soon)' : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="hint">{modeTooltip(state.taxationMode)}</p>

          {state.taxationMode === 'variable-speed' && (
            <fieldset className="taxation-fieldset">
              <legend>Speed variation</legend>
              <div className="segmented">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={state.taxationVariableSpeedPreset === p ? 'is-active' : ''}
                    onClick={() => onChange({ taxationVariableSpeedPreset: p })}
                  >
                    {p === 'low' ? 'Low' : p === 'medium' ? 'Medium' : 'High'}
                  </button>
                ))}
              </div>
              <p className="hint">
                {state.taxationVariableSpeedPreset === 'low' && 'Small speed variation.'}
                {state.taxationVariableSpeedPreset === 'medium' && 'Moderate variation.'}
                {state.taxationVariableSpeedPreset === 'high' && 'Large variation.'}
              </p>
            </fieldset>
          )}

          {state.taxationMode === 'colour-shift' && (
            <fieldset className="taxation-fieldset">
              <legend>Colour change interval</legend>
              <div className="segmented wrap">
                {([2, 4, 6, 'random'] as const).map((n) => (
                  <button
                    key={String(n)}
                    type="button"
                    className={state.taxationColourShiftInterval === n ? 'is-active' : ''}
                    onClick={() => onChange({ taxationColourShiftInterval: n })}
                  >
                    {n === 'random' ? 'Random' : `Every ${n} passes`}
                  </button>
                ))}
              </div>
              <PalettePicker state={state} onChange={onChange} />
            </fieldset>
          )}

          {state.taxationMode === 'random-colour' && (
            <fieldset className="taxation-fieldset">
              <legend>Random colour</legend>
              <div className="segmented">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={state.taxationColourChangeFrequency === p ? 'is-active' : ''}
                    onClick={() => onChange({ taxationColourChangeFrequency: p })}
                  >
                    {p === 'low' ? 'Low' : p === 'medium' ? 'Medium' : 'High'}
                  </button>
                ))}
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={state.taxationColourNamingMode}
                  onChange={(e) => onChange({ taxationColourNamingMode: e.target.checked })}
                />
                <span>Colour Naming Mode (clinician prompt only)</span>
              </label>
              <PalettePicker state={state} onChange={onChange} />
            </fieldset>
          )}

          {state.taxationMode === 'chaos' && (
            <fieldset className="taxation-fieldset">
              <legend>Chaos Mode</legend>
              <p className="hint">
                Primary stage: Phase 4 — Desensitisation. Bounded variation — stimulus remains
                trackable. Not a replacement for standard bilateral stimulation.
              </p>
              <div className="segmented">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={state.taxationChaosLevel === n ? 'is-active' : ''}
                    disabled={state.taxationReduceVisualVariation && n > 1}
                    onClick={() => onChange({ taxationChaosLevel: n })}
                  >
                    Chaos {n}
                  </button>
                ))}
              </div>
              {state.taxationChaosLevel === 3 && (
                <p className="caution-text">
                  Higher cognitive load. Clinician monitoring recommended throughout the set.
                </p>
              )}
            </fieldset>
          )}

          {(state.taxationMode === 'direction-shift' ||
            state.taxationMode === 'pattern-switch' ||
            state.taxationMode === 'custom') && (
            <p className="hint">
              Full behaviour for this mode arrives in a later stage. Mode can be selected for
              workflow planning; visual engine currently applies Stage 1-safe behaviour where
              available, otherwise Standard tracking with your base settings.
            </p>
          )}

          <fieldset className="taxation-fieldset">
            <legend>Accessibility</legend>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.taxationReduceVisualVariation}
                onChange={(e) =>
                  onChange({
                    taxationReduceVisualVariation: e.target.checked,
                    ...(e.target.checked && state.taxationChaosLevel > 1
                      ? { taxationChaosLevel: 1 }
                      : {}),
                  })
                }
              />
              <span>Reduce Visual Variation</span>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.taxationDisableColour}
                onChange={(e) => onChange({ taxationDisableColour: e.target.checked })}
              />
              <span>Disable Colour Taxation</span>
            </label>
          </fieldset>

          <div className="taxation-actions">
            <button
              type="button"
              className="btn"
              onClick={() => onChange(taxationConfigPatchToRoom(reduceTaxationOneStep(config)))}
              disabled={config.mode === 'standard'}
            >
              ↓ Reduce Taxation
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onChange(taxationConfigPatchToRoom(increaseTaxationOneStep(config)))}
            >
              Increase load
            </button>
            <button type="button" className="btn primary" onClick={onReturnToStandard}>
              Return to Standard
            </button>
            {secondaryTaskPrompt && (
              <button type="button" className="btn ghost" onClick={onClearSecondaryTask}>
                Stop secondary task
              </button>
            )}
            {onOpenHelpArticle && (
              <button type="button" className="btn ghost" onClick={onOpenHelpArticle}>
                Help: Working Memory Taxation
              </button>
            )}
          </div>
        </div>
      )}

      {!open && advancedActive && (
        <div className="taxation-actions compact">
          <button type="button" className="btn primary" onClick={onReturnToStandard}>
            Return to Standard
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onChange(taxationConfigPatchToRoom(reduceTaxationOneStep(config)))}
          >
            ↓ Reduce Taxation
          </button>
        </div>
      )}
    </div>
  );
}

function PalettePicker({
  state,
  onChange,
}: {
  state: RoomState;
  onChange: (p: Partial<RoomState>) => void;
}) {
  const selected = new Set(state.taxationColourPalette);
  const options = [
    ...DEFAULT_TAXATION_PALETTE,
    ...STIMULUS_COLOURS.map((c) => c.value),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="taxation-palette" role="group" aria-label="Colours in rotation">
      {options.map((c) => {
        const on = selected.has(c);
        return (
          <button
            key={c}
            type="button"
            className={`swatch${on ? ' is-active' : ''}`}
            style={{ background: c }}
            title={c}
            aria-pressed={on}
            onClick={() => {
              const next = on
                ? state.taxationColourPalette.filter((x) => x !== c)
                : [...state.taxationColourPalette, c];
              if (next.length === 0) return;
              onChange({ taxationColourPalette: next });
            }}
          />
        );
      })}
    </div>
  );
}
