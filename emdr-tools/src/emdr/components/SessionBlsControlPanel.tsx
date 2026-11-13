import { TimingControls } from '../../components/bls/TimingControls';
import { TrajectorySelector } from '../../components/bls/VisualBlsControls';
import { BlsConfigurationPanel } from '../../components/bls/BlsConfigurationPanel';
import type { PhasePreset } from '../config/phasePresets';
import type { EMDRPhase } from '../types/emdr';
import { SPEED_PRESETS } from '../types/emdr';
import type { RoomState } from '../../types/room';
import { ClientDisplayPanel } from './ClientDisplayPanel';
import type { TherapistClientDisplay } from '../hooks/useTherapistClientDisplay';
import { TaxationControls } from './taxation/TaxationControls';
import { CognitiveTaskPanel } from './taxation/CognitiveTaskPanel';

interface Props {
  phase: EMDRPhase;
  preset: PhasePreset;
  state: RoomState;
  running: boolean;
  paused: boolean;
  isActive: boolean;
  blsMinimised: boolean;
  settingsOpen: boolean;
  bodyScanFinding: 'clear' | 'positive' | 'disturbing' | 'new' | null;
  awaitingFeedback: boolean;
  setSeconds: number;
  secondaryTaskPrompt: string | null;
  colourPrompt: string | null;
  onChange: (partial: Partial<RoomState>) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOpenManual: () => void;
  onBeginDesensitisation: () => void;
  onToggleSettings: () => void;
  onOpenHelp: () => void;
  onOpenWmtHelp?: () => void;
  onSelectInfinity: () => void;
  onEnablePositiveStrengthening: () => void;
  onRecordResponse?: (id: 'change' | 'no-change' | 'positive' | 'distress' | 'pause' | 'return-to-target') => void;
  onDismissFeedback?: () => void;
  onEndSession: () => void;
  onReturnToStandardTaxation: (opts?: { keepTask?: boolean }) => void;
  onSecondaryTaskPrompt: (prompt: string | null) => void;
  clientDisplay: TherapistClientDisplay;
  onMuteTherapistChange: (muted: boolean) => void;
}

function phaseTitle(phase: EMDRPhase, infinity: boolean): string {
  switch (phase) {
    case 'history':
      return 'BLS — History';
    case 'preparation':
      return 'BLS — Resource';
    case 'assessment':
      return 'BLS — Not yet';
    case 'desensitisation':
      return 'BLS — Reprocessing';
    case 'installation':
      return 'BLS — Installation';
    case 'body-scan':
      return 'BLS — Body Scan';
    case 'closure':
      return infinity ? 'BLS — Infinity / De-arousal' : 'BLS — Closure';
    case 'reevaluation':
      return 'BLS — Reevaluation';
    case 'future-template':
      return 'BLS — Future Template';
    default:
      return 'BLS';
  }
}

function speedWord(speed01: number): string {
  const nearest = SPEED_PRESETS.reduce((best, p) => {
    const cycle = 5000 + (550 - 5000) * speed01;
    return Math.abs(p.cycleDurationMs - cycle) < Math.abs(best.cycleDurationMs - cycle) ? p : best;
  }, SPEED_PRESETS[2]);
  const map: Record<string, string> = {
    'very-slow': 'Very slow',
    slow: 'Slower',
    moderate: 'Moderate',
    fast: 'Faster',
  };
  return map[nearest.id] ?? 'Custom';
}

export function SessionBlsControlPanel({
  phase,
  preset: _preset,
  state,
  running,
  paused,
  isActive,
  blsMinimised,
  settingsOpen,
  bodyScanFinding,
  awaitingFeedback,
  setSeconds,
  secondaryTaskPrompt,
  colourPrompt,
  onChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onOpenManual,
  onBeginDesensitisation,
  onToggleSettings,
  onOpenHelp,
  onOpenWmtHelp,
  onSelectInfinity,
  onEnablePositiveStrengthening,
  onRecordResponse,
  onDismissFeedback,
  onEndSession,
  onReturnToStandardTaxation,
  onSecondaryTaskPrompt,
  clientDisplay,
  onMuteTherapistChange,
}: Props) {
  const infinity = state.visualMode === 'infinity';
  const assessmentGate = phase === 'assessment';
  const historyGate = phase === 'history' && blsMinimised;
  const bodyScanAwait =
    phase === 'body-scan' && !bodyScanFinding && !running && !awaitingFeedback;
  const bodyScanResidual =
    phase === 'body-scan' &&
    (bodyScanFinding === 'disturbing' || bodyScanFinding === 'new');

  const startDisabled = historyGate || assessmentGate || bodyScanAwait;

  const startLabel = infinity
    ? running
      ? null
      : 'Start Infinity Set'
    : awaitingFeedback
      ? 'Continue'
      : 'Start Set';

  return (
    <aside className="companion-controls session-bls-controls" aria-label="BLS controls">
      <div className="panel bls-control-panel">
        <header className="bls-control-head">
          <h2>{phaseTitle(phase, infinity)}</h2>
          {!historyGate && !assessmentGate && (
            <p className="bls-control-sub">
              {speedWord(state.speed01)}
              {' · '}
              {state.continuous
                ? 'Continuous'
                : state.setMode === 'timed'
                  ? `${state.targetSeconds ?? 15} sec`
                  : `${state.targetPasses ?? 30} passes`}
            </p>
          )}
        </header>

        {historyGate && (
          <div className="bls-phase-gate">
            <p>Not routinely used in this phase.</p>
            <button type="button" className="btn" onClick={onOpenManual}>
              Open BLS manually
            </button>
          </div>
        )}

        {assessmentGate && (
          <div className="bls-phase-gate">
            <p>Complete Assessment before beginning reprocessing.</p>
            <button type="button" className="btn primary" onClick={onBeginDesensitisation}>
              Begin Desensitisation
            </button>
          </div>
        )}

        {bodyScanAwait && (
          <div className="bls-phase-gate">
            <p>Await scan result before deciding on further BLS.</p>
          </div>
        )}

        {phase === 'body-scan' && bodyScanResidual && !running && (
          <p className="hint bls-phase-hint">BLS — Process residual sensation</p>
        )}

        {phase === 'reevaluation' && (
          <div className="bls-phase-actions">
            <p className="hint">Assess first. Strengthen positive material when indicated.</p>
            <button type="button" className="btn ghost" onClick={onEnablePositiveStrengthening}>
              Use positive strengthening BLS
            </button>
          </div>
        )}

        {phase === 'closure' && !infinity && (
          <div className="bls-phase-actions">
            <button type="button" className="btn" onClick={onSelectInfinity}>
              Use Infinity / De-arousal
            </button>
          </div>
        )}

        {!historyGate && (
          <>
            <div className="bls-live-speed">
              <label className="field speed-field">
                <span>
                  Speed · <strong>{speedWord(state.speed01)}</strong>
                </span>
                <span className="speed-ends">
                  <span>Slower</span>
                  <span>Faster</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={state.speed01}
                  aria-label="BLS speed"
                  onChange={(e) => onChange({ speed01: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="bls-transport-primary" aria-label="BLS transport">
              {!running ? (
                <button
                  type="button"
                  className="btn primary large bls-start-btn"
                  disabled={!!startDisabled || assessmentGate}
                  onClick={onStart}
                >
                  {startLabel}
                </button>
              ) : (
                <div className="bls-transport-running">
                  <button
                    type="button"
                    className="btn large"
                    onClick={() => (paused ? onResume() : onPause())}
                  >
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  <button type="button" className="btn danger large" onClick={onStop}>
                    Stop
                  </button>
                </div>
              )}
              {clientDisplay.peerStatus === 'connected' && (
                <p className="hint bls-client-hint">
                  Start Set also runs the connected client display.
                </p>
              )}
            </div>

            <TimingControls state={state} onChange={onChange} compact hideSpeed />

            {awaitingFeedback && (
              <div className="panel check-in">
                <h2>{infinity ? 'Check in' : 'What are you noticing now?'}</h2>
                {!infinity ? (
                  <div className="chip-grid">
                    {(
                      [
                        ['change', 'Change / new material'],
                        ['no-change', 'No change'],
                        ['positive', 'Positive material'],
                        ['distress', 'Increased disturbance'],
                        ['pause', 'Pause'],
                        ['return-to-target', 'Return to target'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className="chip"
                        onClick={() => onRecordResponse?.(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="stack-btns">
                    <button type="button" className="btn primary" onClick={onStart}>
                      Repeat
                    </button>
                    <button type="button" className="btn ghost" onClick={onDismissFeedback}>
                      Finish
                    </button>
                  </div>
                )}
              </div>
            )}

            <TrajectorySelector state={state} onChange={onChange} running={isActive} compact />

            {infinity && (
              <div className="segmented">
                <button
                  type="button"
                  className={state.midlineDirection === 'up' ? 'is-active' : ''}
                  onClick={() => onChange({ midlineDirection: 'up' })}
                >
                  Up
                </button>
                <button
                  type="button"
                  className={state.midlineDirection === 'down' ? 'is-active' : ''}
                  onClick={() => onChange({ midlineDirection: 'down' })}
                >
                  Down
                </button>
              </div>
            )}

            <TaxationControls
              phase={phase}
              state={state}
              running={running}
              setSeconds={setSeconds}
              secondaryTaskPrompt={secondaryTaskPrompt}
              colourPrompt={colourPrompt}
              onChange={onChange}
              onReturnToStandard={onReturnToStandardTaxation}
              onClearSecondaryTask={() => onSecondaryTaskPrompt(null)}
              onOpenHelpArticle={onOpenWmtHelp}
            />

            <CognitiveTaskPanel
              activePrompt={secondaryTaskPrompt}
              onSelectPrompt={onSecondaryTaskPrompt}
            />

            <div className="bls-control-secondary">
              <button type="button" className="btn" onClick={onToggleSettings}>
                {settingsOpen ? 'Hide BLS Settings' : 'BLS Settings'}
              </button>
              <button type="button" className="btn ghost" onClick={onOpenHelp}>
                Help & Scripts
              </button>
            </div>
          </>
        )}
      </div>

      {settingsOpen && !historyGate && (
        <div className="panel bls-settings-expanded">
          <BlsConfigurationPanel
            state={state}
            onChange={onChange}
            section="all"
            running={isActive}
            compact
          />
        </div>
      )}

      <ClientDisplayPanel
        display={clientDisplay}
        state={state}
        onMuteTherapistChange={onMuteTherapistChange}
      />

      <div className="panel">
        <button type="button" className="btn ghost" onClick={onEndSession}>
          End Session
        </button>
      </div>
    </aside>
  );
}
