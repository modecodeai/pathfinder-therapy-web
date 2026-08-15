import { useMemo, useState } from 'react';
import type { EMDRPhase } from '../../types/emdr';
import type {
  CustomTaxationToggles,
  TaxationMode,
  TaxationTrajectory,
} from '../../types/emdrTaxation';
import {
  DEFAULT_TAXATION_PALETTE,
  TAXATION_MODE_LABELS,
  TAXATION_MODE_ORDER,
  TRAJECTORY_LABELS,
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

interface Props {
  phase: EMDRPhase;
  state: RoomState;
  running: boolean;
  setSeconds: number;
  secondaryTaskPrompt: string | null;
  colourPrompt: string | null;
  onChange: (partial: Partial<RoomState>) => void;
  onReturnToStandard: (opts?: { keepTask?: boolean }) => void;
  onClearSecondaryTask: () => void;
  onOpenHelpArticle?: () => void;
}

const ADVANCED: TaxationMode[] = [
  'direction-shift',
  'pattern-switch',
  'chaos',
  'custom',
];

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
  const [open, setOpen] = useState(true);
  const [phaseAdvisoryDismissed, setPhaseAdvisoryDismissed] = useState(false);
  const [returnPromptOpen, setReturnPromptOpen] = useState(false);
  const config = useMemo(() => roomStateToTaxationConfig(state), [state]);
  const load = estimateWorkingMemoryLoad(config);
  const isPhase4 = phase === 'desensitisation';
  const advancedActive = config.mode !== 'standard';
  const showPhaseAdvisory =
    advancedActive && !isPhase4 && !phaseAdvisoryDismissed && ADVANCED.includes(config.mode);

  const requestReturnToStandard = () => {
    if (secondaryTaskPrompt) {
      setReturnPromptOpen(true);
      return;
    }
    onReturnToStandard({ keepTask: false });
  };

  const patchMode = (mode: TaxationMode) => {
    let chaosLevel = state.taxationChaosLevel;
    if (mode === 'chaos' && state.taxationReduceVisualVariation) chaosLevel = 1;
    const patch: Partial<RoomState> = { taxationMode: mode, taxationChaosLevel: chaosLevel };
    if (mode === 'pattern-switch' && !state.taxationEnabledTrajectories?.length) {
      patch.taxationEnabledTrajectories = ['horizontal', 'diagonal-a', 'vertical'];
    }
    if (mode === 'custom' && state.taxationCustomIntensity < 1) {
      patch.taxationCustomIntensity = 4;
    }
    onChange(patch);
    if (mode !== 'standard' && !isPhase4) setPhaseAdvisoryDismissed(false);
  };

  const toggleTrajectory = (t: TaxationTrajectory) => {
    const cur = state.taxationEnabledTrajectories ?? ['horizontal'];
    const has = cur.includes(t);
    let next = has ? cur.filter((x) => x !== t) : [...cur, t];
    if (next.length === 0) next = ['horizontal'];
    onChange({ taxationEnabledTrajectories: next });
  };

  const patchCustomToggle = (key: keyof CustomTaxationToggles, value: boolean) => {
    const next = { ...state.taxationCustomToggles, [key]: value };
    // Keep at least one trajectory
    const trajKeys: (keyof CustomTaxationToggles)[] = [
      'horizontal',
      'vertical',
      'diagonalA',
      'diagonalB',
      'wideArc',
      'figureEight',
    ];
    if (trajKeys.includes(key) && !value) {
      const anyOn = trajKeys.some((k) => (k === key ? false : next[k]));
      if (!anyOn) next.horizontal = true;
    }
    onChange({ taxationCustomToggles: next });
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
        <p className="taxation-phase-ok hint">Working Memory Taxation Available</p>
      ) : (
        <p className="taxation-phase-guidance hint">
          Higher working-memory taxation is principally intended for Phase 4 desensitisation.
          Controls remain available; clinical judgement applies.
        </p>
      )}

      {ADVANCED.includes(config.mode) && (
        <p className="hint">
          Primarily intended for clinician-controlled working-memory taxation during Phase 4
          Desensitisation.
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
            <button type="button" className="btn primary" onClick={requestReturnToStandard}>
              Return to Standard
            </button>
          </div>
        </div>
      )}

      {returnPromptOpen && (
        <div className="taxation-advisory" role="dialog">
          <p>
            <strong>Keep cognitive task running?</strong>
          </p>
          <div className="stack-btns horizontal">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setReturnPromptOpen(false);
                onReturnToStandard({ keepTask: true });
              }}
            >
              Keep Task
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setReturnPromptOpen(false);
                onReturnToStandard({ keepTask: false });
              }}
            >
              Stop Task
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
              {TAXATION_MODE_ORDER.map((m) => (
                <option key={m} value={m} title={modeTooltip(m)}>
                  {TAXATION_MODE_LABELS[m]}
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

          {state.taxationMode === 'direction-shift' && (
            <fieldset className="taxation-fieldset">
              <legend>Reversal Frequency</legend>
              <div className="segmented">
                {(['low', 'moderate', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={state.taxationDirectionShiftRate === p ? 'is-active' : ''}
                    onClick={() => onChange({ taxationDirectionShiftRate: p })}
                  >
                    {p === 'low' ? 'Low' : p === 'moderate' ? 'Moderate' : 'High'}
                  </button>
                ))}
              </div>
              <p className="hint">
                Low ≈ every 6–10 traversals · Moderate ≈ 3–6 · High ≈ 2–4. Reversals occur within
                ~20–80% of travel width — never at the edge.
              </p>
            </fieldset>
          )}

          {state.taxationMode === 'pattern-switch' && (
            <>
              <fieldset className="taxation-fieldset">
                <legend>Enabled Patterns</legend>
                <div className="taxation-check-grid">
                  {(
                    [
                      'horizontal',
                      'vertical',
                      'diagonal-a',
                      'diagonal-b',
                      'wide-arc',
                      'figure-eight',
                    ] as TaxationTrajectory[]
                  ).map((t) => (
                    <label key={t} className="check-row">
                      <input
                        type="checkbox"
                        checked={(state.taxationEnabledTrajectories ?? []).includes(t)}
                        onChange={() => toggleTrajectory(t)}
                      />
                      <span>{TRAJECTORY_LABELS[t]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="taxation-fieldset">
                <legend>Pattern Change Frequency</legend>
                <div className="segmented wrap">
                  {(['low', 'moderate', 'high', 'random'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={state.taxationPatternSwitchRate === p ? 'is-active' : ''}
                      onClick={() => onChange({ taxationPatternSwitchRate: p })}
                    >
                      {p === 'low'
                        ? 'Low'
                        : p === 'moderate'
                          ? 'Moderate'
                          : p === 'high'
                            ? 'High'
                            : 'Random'}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {state.taxationMode === 'chaos' && (
            <fieldset className="taxation-fieldset">
              <legend>Chaos Mode</legend>
              <p className="hint">
                Primary stage: Phase 4 — Desensitisation. Bounded variation — stimulus remains
                trackable. Visual Working-Memory Taxation (not unrestricted coordinates).
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
                    {n === 1 ? ' — Mild' : n === 2 ? ' — Moderate' : ' — High Taxation'}
                  </button>
                ))}
              </div>
              {state.taxationChaosLevel === 1 && (
                <p className="hint">Predominantly horizontal with occasional speed and colour changes.</p>
              )}
              {state.taxationChaosLevel === 2 && (
                <p className="hint">
                  Adds unexpected reversals, occasional trajectory changes, greater variation.
                </p>
              )}
              {state.taxationChaosLevel === 3 && (
                <p className="caution-text">
                  Higher cognitive load. Clinician monitoring recommended throughout the set.
                  Concurrent speed, trajectory, direction, colour and timing variation — still
                  trackable.
                </p>
              )}
            </fieldset>
          )}

          {state.taxationMode === 'custom' && (
            <>
              <fieldset className="taxation-fieldset">
                <legend>Working Memory Load (intensity)</legend>
                <label className="field">
                  <span>
                    Intensity · <strong>{state.taxationCustomIntensity}</strong>
                    {state.taxationCustomIntensity <= 2
                      ? ' — Minimal'
                      : state.taxationCustomIntensity <= 4
                        ? ' — Low'
                        : state.taxationCustomIntensity <= 6
                          ? ' — Moderate'
                          : state.taxationCustomIntensity <= 8
                            ? ' — High'
                            : ' — Very High'}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={state.taxationCustomIntensity}
                    onChange={(e) =>
                      onChange({ taxationCustomIntensity: Number(e.target.value) })
                    }
                  />
                </label>
                <p className="hint">
                  Drives speed variation breadth and how assertive active modifiers are — not merely
                  a label.
                </p>
              </fieldset>
              <fieldset className="taxation-fieldset">
                <legend>Change Frequency</legend>
                <label className="field">
                  <span>
                    Frequency · <strong>{state.taxationCustomChangeFrequency}</strong>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={state.taxationCustomChangeFrequency}
                    onChange={(e) =>
                      onChange({ taxationCustomChangeFrequency: Number(e.target.value) })
                    }
                  />
                </label>
                <p className="hint">
                  How often active variables change — independent of intensity (e.g. high intensity +
                  low frequency = large but infrequent changes).
                </p>
              </fieldset>
              <fieldset className="taxation-fieldset">
                <legend>Visual Taxation</legend>
                {(
                  [
                    ['variableSpeed', 'Variable Speed'],
                    ['randomSpeedChanges', 'Random Speed Changes'],
                    ['earlyDirectionReversal', 'Early Direction Reversal'],
                    ['colourChanges', 'Colour Changes'],
                    ['randomColour', 'Random Colour'],
                    ['patternSwitching', 'Pattern Switching'],
                    ['randomPatternSelection', 'Random Pattern Selection'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="check-row">
                    <input
                      type="checkbox"
                      checked={!!state.taxationCustomToggles[key]}
                      onChange={(e) => patchCustomToggle(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="taxation-fieldset">
                <legend>Available Trajectories</legend>
                {(
                  [
                    ['horizontal', 'Horizontal'],
                    ['vertical', 'Vertical'],
                    ['diagonalA', 'Diagonal A'],
                    ['diagonalB', 'Diagonal B'],
                    ['wideArc', 'Wide Arc'],
                    ['figureEight', 'Figure Eight'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="check-row">
                    <input
                      type="checkbox"
                      checked={!!state.taxationCustomToggles[key]}
                      onChange={(e) => patchCustomToggle(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="taxation-fieldset">
                <legend>Cognitive Task Assistance</legend>
                <p className="hint">Practitioner-facing prompts only — not sent to the client display.</p>
                {(
                  [
                    ['showCognitivePrompts', 'Show clinician cognitive prompts'],
                    ['colourNaming', 'Colour naming'],
                    ['numberTask', 'Number task'],
                    ['verbalTask', 'Verbal task'],
                    ['cognitiveSwitching', 'Cognitive switching'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="check-row">
                    <input
                      type="checkbox"
                      checked={!!state.taxationCustomToggles[key]}
                      onChange={(e) => patchCustomToggle(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              {(state.taxationCustomToggles.colourChanges ||
                state.taxationCustomToggles.randomColour) && (
                <PalettePicker state={state} onChange={onChange} />
              )}
            </>
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
            <button type="button" className="btn primary" onClick={requestReturnToStandard}>
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
          <button type="button" className="btn primary" onClick={requestReturnToStandard}>
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
