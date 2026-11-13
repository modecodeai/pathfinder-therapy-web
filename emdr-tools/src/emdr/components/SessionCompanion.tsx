import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BlsStage } from '../../components/BlsStage';
import { EMDR_PHASE_PRESETS } from '../config/phasePresets';
import { phaseTimingPatch } from '../bls/config';
import { resolveInitialBlsState } from '../bls/persistence';
import {
  NO_CHANGE_REMINDER,
  nextNoChangeCount,
  shouldShowNoChangeReminder,
} from '../engine/noChangeTracker';
import { HelpDrawer } from '../help/HelpDrawer';
import { clinicalPresetToPhase } from '../help/library';
import type { ClinicalBlsPresetId } from '../help/blsGuidanceTypes';
import { useBlsSession } from '../../hooks/useBlsSession';
import type { RoomState } from '../../types/room';
import type {
  AssessmentTarget,
  BLSSetRecord,
  CompanionSessionState,
  EMDRPhase,
  SetResponse,
} from '../types/emdr';
import { PHASE_LABELS, SPEED_PRESETS } from '../types/emdr';
import { ClinicalPhasePanel } from './ClinicalPhasePanel';
import { ClientDisplayPreviewModal, ClientDisplayToolbarButton } from './ClientDisplayPanel';
import { SessionBlsControlPanel } from './SessionBlsControlPanel';
import { useTherapistClientDisplay } from '../hooks/useTherapistClientDisplay';

const PHASES: EMDRPhase[] = [
  'history',
  'preparation',
  'assessment',
  'desensitisation',
  'installation',
  'body-scan',
  'closure',
  'reevaluation',
  'future-template',
];

const STORAGE_KEY = 'pf-emdr-companion-v1';

function newSession(): CompanionSessionState {
  return {
    id: `s_${Date.now().toString(36)}`,
    referenceLabel: 'Anonymous session',
    phase: 'preparation',
    target: {},
    sets: [],
    consecutiveNoChangeSets: 0,
    sessionStartedAt: new Date().toISOString(),
    totalProcessingMs: 0,
    closurePath: null,
  };
}

function loadCompanion(): CompanionSessionState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CompanionSessionState;
  } catch {
    /* ignore */
  }
  return newSession();
}

export function SessionCompanionPage() {
  const [params] = useSearchParams();
  const fromStudio = params.get('fromStudio') === '1';

  const [companion, setCompanion] = useState<CompanionSessionState>(() => {
    if (fromStudio) {
      // Fresh clinical shell when carrying Studio setup; keep anonymous label
      const base = newSession();
      return base;
    }
    return loadCompanion();
  });
  const [focusMode, setFocusMode] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const [lastCompleted, setLastCompleted] = useState<{
    passes: number;
    durationMs: number;
  } | null>(null);
  const [applyPresetPrompt, setApplyPresetPrompt] = useState<EMDRPhase | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [timingDirty, setTimingDirty] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpFocusId, setHelpFocusId] = useState<string | null>(null);
  const [blsSettingsOpen, setBlsSettingsOpen] = useState(false);
  const [stopSignalEstablished, setStopSignalEstablished] = useState(false);
  const [focusField, setFocusField] = useState<'sud' | 'voc' | 'nc' | null>(null);
  const [returnToTargetOpen, setReturnToTargetOpen] = useState(false);
  const [lastResponse, setLastResponse] = useState<SetResponse | null>(null);
  const [blsManualOpen, setBlsManualOpen] = useState(false);
  const [resourceResponse, setResourceResponse] = useState<'positive' | 'negative' | null>(null);
  const [clinicalCollapsed, setClinicalCollapsed] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [secondaryTaskPrompt, setSecondaryTaskPrompt] = useState<string | null>(null);
  const [colourPrompt, setColourPrompt] = useState<string | null>(null);
  const [installationTaxPrompt, setInstallationTaxPrompt] = useState(false);
  const publishRemoteRef = useRef<(state: RoomState) => void>(() => undefined);
  const colourNamingRef = useRef(false);
  const taxationBaselineRef = useRef<{
    speed01: number;
    stimulusColour: string;
    visualMode: RoomState['visualMode'];
  } | null>(null);

  const session = useBlsSession({
    onSetComplete: (m) => {
      setLastCompleted({ passes: m.passes, durationMs: m.timeMs });
      setAwaitingFeedback(true);
      setFocusMode(false);
      setColourPrompt(null);
      setCompanion((c) => ({
        ...c,
        totalProcessingMs: c.totalProcessingMs + m.timeMs,
      }));
    },
    onStateChange: (state) => {
      colourNamingRef.current = !!state.taxationColourNamingMode;
      setCompanion((c) => ({
        ...c,
        blsSnapshot: snapshotBls(state),
      }));
      publishRemoteRef.current(state);
    },
    onTaxationColourChange: (colour) => {
      if (!colourNamingRef.current) return;
      setColourPrompt(
        `Ask the client to say the new colour aloud. Current stimulus colour: ${colour}`,
      );
    },
  });

  const clientDisplay = useTherapistClientDisplay(session);

  useEffect(() => {
    publishRemoteRef.current = clientDisplay.publishState;
  }, [clientDisplay.publishState]);

  // Prepare a client-display room token in the background (inactive until open/share)
  useEffect(() => {
    const t = window.setTimeout(() => clientDisplay.prepareRoom(), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClinicalBlsPreset = useCallback(
    (presetId: ClinicalBlsPresetId) => {
      if (presetId === 'manual') {
        setBlsSettingsOpen(true);
        return;
      }
      const { phasePreset, infinity } = clinicalPresetToPhase(presetId);
      if (!phasePreset) return;
      const patch = phaseTimingPatch(phasePreset, session.stateRef.current, {
        forceTrajectory: !!infinity,
      });
      session.patchState(patch);
      setTimingDirty(true);
      setBlsSettingsOpen(true);
      // Never starts BLS — therapist must press Start Set
    },
    [session],
  );

  // Initialise BLS: handoff → therapist default → resumed snapshot → system
  useEffect(() => {
    const resumed = fromStudio ? null : companion.blsSnapshot;
    const initial = resolveInitialBlsState(resumed);
    // Apply current phase timing without overwriting Studio appearance
    const withPhase = {
      ...initial,
      ...phaseTimingPatch(EMDR_PHASE_PRESETS[companion.phase], initial),
    };
    session.replaceState(withPhase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(companion));
  }, [companion]);

  useEffect(() => {
    const started = new Date(companion.sessionStartedAt).getTime();
    const t = window.setInterval(() => setSessionElapsed(Date.now() - started), 1000);
    return () => window.clearInterval(t);
  }, [companion.sessionStartedAt]);

  useEffect(() => {
    if (session.state.visualMode === 'infinity') {
      setHelpOpen(true);
    }
  }, [session.state.visualMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (awaitingFeedback) return;
        clientDisplay.toggleSpace();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        clientDisplay.stop();
        if (document.fullscreenElement) void document.exitFullscreen();
        setFocusMode(false);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        session.patchState({ speed01: Math.min(1, session.state.speed01 + 0.05) });
        setTimingDirty(true);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        session.patchState({ speed01: Math.max(0, session.state.speed01 - 0.05) });
        setTimingDirty(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, awaitingFeedback, clientDisplay]);

  const preset = EMDR_PHASE_PRESETS[companion.phase];
  const isActive = session.state.running && !session.state.paused;
  const hideForms = (focusMode && isActive) || compactMode;
  const showClinical = !hideForms && !clinicalCollapsed;
  const showNoChange = shouldShowNoChangeReminder(companion.consecutiveNoChangeSets);
  const blsMinimised = companion.phase === 'history' && !blsManualOpen;
  const infinityMode = session.state.visualMode === 'infinity';

  const applyPhasePreset = useCallback(
    (phase: EMDRPhase, force: boolean) => {
      const taxationActive = session.stateRef.current.taxationMode !== 'standard';
      if (phase === 'installation' && taxationActive) {
        setInstallationTaxPrompt(true);
      } else {
        setInstallationTaxPrompt(false);
      }
      const p = EMDR_PHASE_PRESETS[phase];
      if (!force && timingDirty) {
        setApplyPresetPrompt(phase);
        setCompanion((c) => ({ ...c, phase }));
        return;
      }
      const patch = phaseTimingPatch(p, session.stateRef.current);
      session.patchState(patch);
      setTimingDirty(false);
      setCompanion((c) => ({ ...c, phase }));
      setApplyPresetPrompt(null);
      if (phase === 'closure' && p.trajectory === 'infinity') {
        setHelpOpen(true);
      }
    },
    [timingDirty, session],
  );

  const returnToStandardTaxation = useCallback(
    (opts?: { keepTask?: boolean }) => {
      const baseline = taxationBaselineRef.current;
      session.patchState({
        taxationMode: 'standard',
        ...(baseline
          ? {
              speed01: baseline.speed01,
              stimulusColour: baseline.stimulusColour,
              visualMode: baseline.visualMode,
            }
          : { visualMode: 'horizontal' as const }),
      });
      setColourPrompt(null);
      setInstallationTaxPrompt(false);
      if (!opts?.keepTask) setSecondaryTaskPrompt(null);
    },
    [session],
  );

  const recordResponse = (response: SetResponse, note?: string) => {
    const tax = session.state;
    const colourMode =
      tax.taxationDisableColour || tax.taxationMode === 'standard'
        ? 'fixed'
        : tax.taxationMode === 'random-colour'
          ? 'random'
          : tax.taxationMode === 'colour-shift' || tax.taxationMode === 'chaos'
            ? 'shift'
            : 'fixed';
    const record: BLSSetRecord = {
      id: `set_${Date.now().toString(36)}`,
      phase: companion.phase,
      mode: preset.mode,
      trajectory: session.state.visualMode,
      speed: session.state.speed01,
      speedLabel: SPEED_PRESETS.find(
        (s) => Math.abs(s.cycleDurationMs - session.state.cycleDurationMs) < 200,
      )?.id,
      targetPasses: session.state.targetPasses,
      completedPasses: lastCompleted?.passes ?? session.metrics.passes,
      targetDurationSeconds: session.state.targetSeconds,
      completedDurationSeconds: Math.round((lastCompleted?.durationMs ?? 0) / 1000),
      continuous: session.state.continuous,
      modality: session.state.audioOnly ? 'auditory' : 'visual',
      taxationMode: tax.taxationMode,
      taxationLevel:
        tax.taxationMode === 'standard'
          ? 'standard'
          : tax.taxationMode === 'chaos'
            ? `chaos-${tax.taxationChaosLevel}`
            : tax.taxationMode,
      speedVariation:
        tax.taxationMode === 'variable-speed' || tax.taxationMode === 'chaos'
          ? tax.taxationVariableSpeedPreset
          : null,
      trajectoryVariation:
        tax.taxationMode === 'pattern-switch' || tax.taxationMode === 'chaos',
      colourMode,
      colourChangeFrequency:
        tax.taxationMode === 'colour-shift'
          ? tax.taxationColourShiftInterval
          : tax.taxationMode === 'random-colour'
            ? tax.taxationColourChangeFrequency
            : null,
      directionReversals: tax.taxationMode === 'direction-shift' || tax.taxationMode === 'chaos',
      secondaryTaskType: secondaryTaskPrompt ? 'clinician-prompt' : null,
      secondaryTaskPrompt,
      stimulusKind:
        tax.taxationMode === 'pattern-switch' ||
        tax.taxationMode === 'direction-shift' ||
        tax.taxationMode === 'chaos'
          ? 'visual-working-memory-taxation'
          : 'bilateral-visual',
      response,
      sud: companion.target.currentSUD,
      voc: companion.target.currentVOC,
      note,
      completedAt: new Date().toISOString(),
    };
    setCompanion((c) => ({
      ...c,
      sets: [...c.sets, record],
      consecutiveNoChangeSets: nextNoChangeCount(c.consecutiveNoChangeSets, response),
    }));
    setAwaitingFeedback(false);
    setLastCompleted(null);
    setLastResponse(response);
    if (response === 'return-to-target') {
      setReturnToTargetOpen(true);
      setHelpOpen(true);
    } else if (response === 'change' || response === 'no-change') {
      setHelpOpen(true);
    }
  };

  const updateTarget = (partial: Partial<AssessmentTarget>) => {
    setCompanion((c) => ({ ...c, target: { ...c.target, ...partial } }));
  };

  const patchCompanion = (partial: Partial<CompanionSessionState>) => {
    setCompanion((c) => ({ ...c, ...partial }));
  };

  const onBlsChange = (partial: Partial<RoomState>) => {
    if (partial.visualMode !== undefined && isActive && partial.visualMode !== session.state.visualMode) {
      return;
    }
    // Snapshot clinician baseline when first leaving Standard taxation
    if (
      partial.taxationMode &&
      partial.taxationMode !== 'standard' &&
      session.state.taxationMode === 'standard' &&
      !taxationBaselineRef.current
    ) {
      taxationBaselineRef.current = {
        speed01: session.state.speed01,
        stimulusColour: session.state.stimulusColour,
        visualMode: session.state.visualMode,
      };
    }
    if (partial.taxationMode === 'standard') {
      // keep baseline for subsequent returns
    }
    if (
      partial.speed01 !== undefined ||
      partial.targetPasses !== undefined ||
      partial.targetSeconds !== undefined ||
      partial.continuous !== undefined ||
      partial.setMode !== undefined
    ) {
      setTimingDirty(true);
    }
    session.patchState(partial);
  };

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div
      className={`companion companion-v3 app-shell ${focusMode ? 'is-focus' : ''} ${compactMode ? 'is-compact-mode' : ''} ${isActive ? 'is-bls-active' : ''}`}
    >
      {!focusMode && (
        <header className="companion-top">
          <div className="companion-brand">
            <Link to="/" className="brand">
              <span className="brand-mark" aria-hidden />
              <span>
                <strong>Pathfinder</strong> Clinical
              </span>
            </Link>
            <input
              className="session-ref"
              value={companion.referenceLabel}
              onChange={(e) => setCompanion((c) => ({ ...c, referenceLabel: e.target.value }))}
              aria-label="Session reference"
            />
            <span className="phase-chip">{PHASE_LABELS[companion.phase]}</span>
          </div>
          <div className="companion-meta">
            <span className="timer" title="Session elapsed">
              Session {formatElapsed(sessionElapsed)}
            </span>
            <ClientDisplayToolbarButton
              display={clientDisplay}
              state={session.state}
              onMuteTherapistChange={(muted) => session.patchState({ muteTherapistAudio: muted })}
            />
            <button type="button" className="btn ghost" onClick={() => setHelpOpen((v) => !v)}>
              {helpOpen ? 'Hide Help' : 'Help & Scripts'}
            </button>
            <button type="button" className="btn ghost" onClick={() => setCompactMode((v) => !v)}>
              {compactMode ? 'Exit compact' : 'Compact'}
            </button>
            <Link className="btn ghost" to="/pain">
              EMDR Pain
            </Link>
            <Link className="btn ghost" to="/tools">
              Studio
            </Link>
          </div>
        </header>
      )}

      {/* Always render chrome row so grid tracks stay: header | chrome | workspace | action */}
      {!focusMode && (
        <div className="companion-chrome">
          {!compactMode && (
            <nav className="phase-nav phase-nav-v3" aria-label="EMDR phases">
              {PHASES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={companion.phase === p ? 'is-active' : ''}
                  onClick={() => applyPhasePreset(p, false)}
                >
                  {PHASE_LABELS[p]}
                </button>
              ))}
            </nav>
          )}
          {(applyPresetPrompt || showNoChange || returnToTargetOpen || clientDisplay.banner) && (
            <div className="companion-banners">
              {clientDisplay.banner && (
                <div className="banner notice" role="status">
                  <span>{clientDisplay.banner}</span>
                  <button type="button" className="btn ghost" onClick={() => clientDisplay.setBanner(null)}>
                    Dismiss
                  </button>
                </div>
              )}
              {applyPresetPrompt && (
                <div className="banner soft">
                  <span>Use suggested {PHASE_LABELS[applyPresetPrompt]} timing?</span>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => applyPhasePreset(applyPresetPrompt, true)}
                  >
                    Use suggested
                  </button>
                  <button type="button" className="btn ghost" onClick={() => setApplyPresetPrompt(null)}>
                    Keep current
                  </button>
                </div>
              )}
              {showNoChange && (
                <div className="banner notice" role="status">
                  {NO_CHANGE_REMINDER}
                </div>
              )}
              {returnToTargetOpen && (
                <div className="banner soft" role="status">
                  <span>
                    Return to target · {companion.target.image || companion.target.title || '—'} · SUD{' '}
                    {companion.target.currentSUD ?? '—'}
                  </span>
                  <button type="button" className="btn ghost" onClick={() => setReturnToTargetOpen(false)}>
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="companion-workspace">
        <div className={`companion-body ${showClinical ? '' : 'clinical-hidden'} ${helpOpen ? 'help-overlay-open' : ''}`}>
          {showClinical && (
            <aside className="companion-side">
              <div className="panel-toolbar">
                <button type="button" className="btn ghost" onClick={() => setClinicalCollapsed(true)}>
                  Hide clinical
                </button>
              </div>
              <ClinicalPhasePanel
                phase={companion.phase}
                companion={companion}
                target={companion.target}
                onTarget={updateTarget}
                onCompanion={patchCompanion}
                onBeginDesensitisation={() => applyPhasePreset('desensitisation', true)}
                why={preset.why}
                whyOpen={whyOpen}
                onToggleWhy={() => setWhyOpen((v) => !v)}
                stopSignalEstablished={stopSignalEstablished}
                onStopSignal={setStopSignalEstablished}
                onFocusField={setFocusField}
                onOpenHelp={() => setHelpOpen(true)}
                onSelectInfinity={() => {
                  session.patchState({
                    ...phaseTimingPatch(EMDR_PHASE_PRESETS.closure, session.stateRef.current, {
                      forceTrajectory: true,
                    }),
                    visualMode: 'infinity',
                  });
                  setHelpOpen(true);
                }}
                resourceResponse={resourceResponse}
                onResourceResponse={setResourceResponse}
              />
              {companion.sets.length > 0 && (
                <div className="panel">
                  <button type="button" className="btn ghost" onClick={() => setHistoryOpen((v) => !v)}>
                    {historyOpen ? 'Hide set history' : `Set history (${companion.sets.length})`}
                  </button>
                  {historyOpen && (
                    <table className="set-table">
                      <thead>
                        <tr>
                          <th>SET</th>
                          <th>MODE</th>
                          <th>PASSES</th>
                          <th>RESPONSE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companion.sets.map((s, i) => (
                          <tr key={s.id}>
                            <td>{String(i + 1).padStart(2, '0')}</td>
                            <td>{s.mode}</td>
                            <td>{s.completedPasses}</td>
                            <td>{s.response ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </aside>
          )}

          {!showClinical && !focusMode && (
            <button
              type="button"
              className="btn ghost clinical-restore"
              onClick={() => {
                setClinicalCollapsed(false);
                setCompactMode(false);
              }}
            >
              Show clinical
            </button>
          )}

          <section className="companion-stage">
            {!blsMinimised ? (
              <BlsStage
                attachCanvas={session.attachCanvas}
                label={focusMode ? undefined : 'BLS'}
                fullscreen={focusMode}
                trajectory={session.state.visualMode}
                lockSize={isActive}
              />
            ) : (
              <div className="bls-minimised">
                <p>BLS is not routinely used during this phase.</p>
                <button type="button" className="btn" onClick={() => setBlsManualOpen(true)}>
                  Open BLS manually
                </button>
              </div>
            )}
            {isActive && (
              <div className="live-hud">
                <span>{session.formatTime(session.metrics.timeMs)}</span>
                <span>{session.metrics.passes} passes</span>
                <button type="button" className="btn danger" onClick={() => clientDisplay.stop()}>
                  Stop
                </button>
              </div>
            )}
            {compactMode && companion.target.image && (
              <p className="target-reminder">
                {companion.target.image}
                {companion.target.negativeCognition ? ` · ${companion.target.negativeCognition}` : ''}
              </p>
            )}
          </section>

          {!focusMode && (
            <SessionBlsControlPanel
              phase={companion.phase}
              preset={preset}
              state={session.state}
              running={session.state.running}
              paused={session.state.paused}
              isActive={isActive}
              blsMinimised={blsMinimised}
              settingsOpen={blsSettingsOpen}
              bodyScanFinding={bodyScanFindingFromTarget(companion.target.bodyLocation)}
              awaitingFeedback={awaitingFeedback}
              setSeconds={Math.floor(session.metrics.timeMs / 1000)}
              secondaryTaskPrompt={secondaryTaskPrompt}
              colourPrompt={colourPrompt}
              onChange={onBlsChange}
              onStart={() => {
                setAwaitingFeedback(false);
                void clientDisplay.start();
              }}
              onPause={() => clientDisplay.pause()}
              onResume={() => void clientDisplay.resume()}
              onStop={() => clientDisplay.stop()}
              onOpenManual={() => setBlsManualOpen(true)}
              onBeginDesensitisation={() => applyPhasePreset('desensitisation', true)}
              onToggleSettings={() => setBlsSettingsOpen((v) => !v)}
              onOpenHelp={() => {
                setHelpFocusId(null);
                setHelpOpen(true);
              }}
              onOpenWmtHelp={() => {
                setHelpFocusId('wmt-overview');
                setHelpOpen(true);
              }}
              onSelectInfinity={() => {
                session.patchState({
                  ...phaseTimingPatch(EMDR_PHASE_PRESETS.closure, session.stateRef.current, {
                    forceTrajectory: true,
                  }),
                  visualMode: 'infinity',
                });
                setHelpOpen(true);
              }}
              onEnablePositiveStrengthening={() => {
                session.patchState({
                  continuous: true,
                  setMode: 'continuous',
                  speed01: 0.25,
                  visualMode: 'horizontal',
                });
                setTimingDirty(true);
              }}
              onRecordResponse={(id) => recordResponse(id)}
              onDismissFeedback={() => setAwaitingFeedback(false)}
              onEndSession={() => {
                if (
                  clientDisplay.active &&
                  !window.confirm('Client display is connected. End session and disconnect client?')
                ) {
                  return;
                }
                clientDisplay.endSessionWithClient();
              }}
              onReturnToStandardTaxation={returnToStandardTaxation}
              onSecondaryTaskPrompt={setSecondaryTaskPrompt}
              clientDisplay={clientDisplay}
              onMuteTherapistChange={(muted) => session.patchState({ muteTherapistAudio: muted })}
            />
          )}

          {installationTaxPrompt && companion.phase === 'installation' && (
            <div className="taxation-advisory floating-advisory" role="dialog" aria-modal="true">
              <p>
                <strong>Desensitisation taxation is active</strong>
              </p>
              <p>
                You are moving into Installation. Would you like to return to Standard stimulation?
                Default recommendation: Standard predictable stimulation.
              </p>
              <div className="stack-btns horizontal">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => returnToStandardTaxation({ keepTask: false })}
                >
                  Return to Standard
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setInstallationTaxPrompt(false)}
                >
                  Keep Current Setting
                </button>
              </div>
            </div>
          )}

          <HelpDrawer
            open={helpOpen && !focusMode}
            onClose={() => {
              setHelpOpen(false);
              setHelpFocusId(null);
            }}
            phase={companion.phase}
            awaitingFeedback={awaitingFeedback}
            consecutiveNoChange={companion.consecutiveNoChangeSets}
            infinityMode={infinityMode}
            focusField={focusField}
            lastResponse={lastResponse}
            processingActive={isActive}
            focusScriptId={helpFocusId}
            guidanceContext={{
              resourceResponse,
              bodyScanFinding: bodyScanFindingFromTarget(companion.target.bodyLocation),
              closurePath: companion.closurePath ?? null,
              returningToTarget: returnToTargetOpen,
              obtainingSud: focusField === 'sud' && companion.phase === 'desensitisation',
            }}
            onLoadBlsPreset={loadClinicalBlsPreset}
            onOpenBlsSettings={() => setBlsSettingsOpen(true)}
          />
        </div>
      </div>

      {!focusMode && (
        <footer className="companion-action-bar" aria-label="Session status">
          <div className="action-metrics">
            <span>
              Session <strong>{formatElapsed(sessionElapsed)}</strong>
            </span>
            <span>
              Set <strong>{session.formatTime(session.metrics.timeMs)}</strong>
            </span>
            <span>
              Pass{' '}
              <strong>
                {session.metrics.passes}
                {session.state.targetPasses && !session.state.continuous
                  ? `/${session.state.targetPasses}`
                  : ''}
              </strong>
            </span>
            {clientDisplay.peerStatus === 'connected' && (
              <span className="action-client-live">Client ● Connected</span>
            )}
          </div>
          {session.state.running && (
            <div className="action-btns">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  session.state.paused ? void clientDisplay.resume() : clientDisplay.pause()
                }
              >
                {session.state.paused ? 'Resume' : 'Pause'}
              </button>
              <button type="button" className="btn danger" onClick={() => clientDisplay.stop()}>
                Stop
              </button>
            </div>
          )}
        </footer>
      )}

      {focusMode && isActive && (
        <aside className="focus-controls">
          <label className="field">
            <span>Speed</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={session.state.speed01}
              onChange={(e) => session.patchState({ speed01: Number(e.target.value) })}
            />
          </label>
          <button
            type="button"
            className="btn large"
            onClick={() => (session.state.paused ? void clientDisplay.resume() : clientDisplay.pause())}
          >
            {session.state.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="btn danger large" onClick={() => clientDisplay.stop()}>
            Stop
          </button>
          <button type="button" className="btn ghost" onClick={() => setFocusMode(false)}>
            Exit focus
          </button>
        </aside>
      )}

      <ClientDisplayPreviewModal display={clientDisplay} />
    </div>
  );
}

function bodyScanFindingFromTarget(
  body?: string,
): 'clear' | 'positive' | 'disturbing' | 'new' | null {
  if (!body) return null;
  const b = body.toLowerCase();
  if (b.includes('clear') || b.includes('neutral')) return 'clear';
  if (b.includes('positive')) return 'positive';
  if (b.includes('residual') || b.includes('disturb')) return 'disturbing';
  if (b.includes('new')) return 'new';
  return null;
}

function snapshotBls(state: RoomState): Partial<RoomState> {
  const { running: _r, paused: _p, sequence: _s, ...rest } = state;
  void _r;
  void _p;
  void _s;
  return rest;
}
