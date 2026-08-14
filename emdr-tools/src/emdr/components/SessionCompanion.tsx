import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlsStage } from '../../components/BlsStage';
import { EMDR_PHASE_PRESETS } from '../config/phasePresets';
import {
  NO_CHANGE_REMINDER,
  nextNoChangeCount,
  shouldShowNoChangeReminder,
} from '../engine/noChangeTracker';
import { useBlsSession } from '../../hooks/useBlsSession';
import { presetCycleMs, withSpeed01 } from '../../types/room';
import type {
  AssessmentTarget,
  BLSSetRecord,
  CompanionSessionState,
  EMDRPhase,
  SetResponse,
} from '../types/emdr';
import { PHASE_LABELS, SPEED_PRESETS } from '../types/emdr';

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
  };
}

export function SessionCompanionPage() {
  const [companion, setCompanion] = useState<CompanionSessionState>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CompanionSessionState;
    } catch {
      /* ignore */
    }
    return newSession();
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
  const [customDirty, setCustomDirty] = useState(false);

  const session = useBlsSession({
    onSetComplete: (m) => {
      setLastCompleted({ passes: m.passes, durationMs: m.timeMs });
      setAwaitingFeedback(true);
      setFocusMode(false);
      setCompanion((c) => ({
        ...c,
        totalProcessingMs: c.totalProcessingMs + m.timeMs,
      }));
    },
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(companion));
  }, [companion]);

  useEffect(() => {
    const started = new Date(companion.sessionStartedAt).getTime();
    const t = window.setInterval(() => setSessionElapsed(Date.now() - started), 1000);
    return () => window.clearInterval(t);
  }, [companion.sessionStartedAt]);

  useEffect(() => {
    // Initial phase preset on mount once
    applyPhasePreset(companion.phase, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (awaitingFeedback) return;
        session.toggleSpace();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        session.stop();
        if (document.fullscreenElement) void document.exitFullscreen();
        setFocusMode(false);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        session.patchState({ speed01: Math.min(1, session.state.speed01 + 0.05) });
        setCustomDirty(true);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        session.patchState({ speed01: Math.max(0, session.state.speed01 - 0.05) });
        setCustomDirty(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, awaitingFeedback]);

  const preset = EMDR_PHASE_PRESETS[companion.phase];

  const applyPhasePreset = useCallback(
    (phase: EMDRPhase, force: boolean) => {
      const p = EMDR_PHASE_PRESETS[phase];
      if (!force && customDirty) {
        setApplyPresetPrompt(phase);
        setCompanion((c) => ({ ...c, phase }));
        return;
      }
      const cycle = presetCycleMs(p.speedPreset);
      const speedPatch = withSpeed01(session.stateRef.current, (5000 - cycle) / (5000 - 550));
      session.patchState({
        ...speedPatch,
        visualMode: p.trajectory,
        visualEnabled: p.blsActive,
        setMode: p.continuous ? 'continuous' : p.durationSeconds ? 'timed' : 'passes',
        continuous: !!p.continuous,
        targetPasses: p.passes,
        targetSeconds: p.durationSeconds ?? 15,
        running: false,
        paused: false,
      });
      setCustomDirty(false);
      setCompanion((c) => ({ ...c, phase }));
      setApplyPresetPrompt(null);
    },
    [customDirty, session],
  );

  const recordResponse = (response: SetResponse, note?: string) => {
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
      completedPasses: lastCompleted?.passes ?? metricsPasses(session.metrics.passes),
      targetDurationSeconds: session.state.targetSeconds,
      completedDurationSeconds: Math.round((lastCompleted?.durationMs ?? 0) / 1000),
      continuous: session.state.continuous,
      modality: session.state.audioOnly ? 'auditory' : 'visual',
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
  };

  const updateTarget = (partial: Partial<AssessmentTarget>) => {
    setCompanion((c) => ({ ...c, target: { ...c.target, ...partial } }));
  };

  const formatElapsed = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const showNoChange = shouldShowNoChangeReminder(companion.consecutiveNoChangeSets);

  const isActive = session.state.running && !session.state.paused;
  const hideForms = focusMode || isActive;

  const sudHistory = useMemo(
    () => companion.sets.filter((s) => s.sud != null).map((s) => s.sud as number),
    [companion.sets],
  );

  return (
    <div className={`companion ${focusMode ? 'is-focus' : ''}`}>
      <header className="companion-top">
        <div className="companion-title">
          <Link to="/" className="brand compact">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Pathfinder</strong> EMDR
            </span>
          </Link>
          <input
            className="session-ref"
            value={companion.referenceLabel}
            onChange={(e) => setCompanion((c) => ({ ...c, referenceLabel: e.target.value }))}
            aria-label="Session reference"
          />
        </div>
        <div className="companion-meta">
          <span>{PHASE_LABELS[companion.phase]}</span>
          <span className="timer" aria-label="Session elapsed">
            {formatElapsed(sessionElapsed)}
          </span>
          <Link className="btn ghost" to="/tools">
            BLS Studio
          </Link>
          <Link className="btn ghost" to="/account">
            Account
          </Link>
        </div>
      </header>

      <nav className="phase-nav" aria-label="EMDR phases">
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

      {applyPresetPrompt && (
        <div className="banner soft">
          <span>
            Phase changed. Apply suggested preset for {PHASE_LABELS[applyPresetPrompt]}?
          </span>
          <button
            type="button"
            className="btn primary"
            onClick={() => applyPhasePreset(applyPresetPrompt, true)}
          >
            Use phase preset
          </button>
          <button type="button" className="btn ghost" onClick={() => setApplyPresetPrompt(null)}>
            Keep current settings
          </button>
        </div>
      )}

      {showNoChange && (
        <div className="banner notice" role="status">
          {NO_CHANGE_REMINDER}
        </div>
      )}

      <div className="companion-body">
        {!hideForms && (
          <aside className="companion-side">
            <PhasePanel
              phase={companion.phase}
              target={companion.target}
              onTarget={updateTarget}
              onBeginReprocessing={() => applyPhasePreset('desensitisation', true)}
              why={preset.why}
              whyOpen={whyOpen}
              onToggleWhy={() => setWhyOpen((v) => !v)}
            />

            <div className="panel">
              <h2>Set history</h2>
              {companion.sets.length === 0 && <p className="hint">No sets yet.</p>}
              <ul className="set-history">
                {[...companion.sets].reverse().map((s, i) => (
                  <li key={s.id}>
                    <strong>{companion.sets.length - i}</strong>
                    <span>{s.mode}</span>
                    <span>{s.completedPasses}p</span>
                    <span>{s.response ?? '—'}</span>
                  </li>
                ))}
              </ul>
              {sudHistory.length > 0 && (
                <p className="hint">
                  SUD trail: {companion.target.initialSUD ?? '—'} → {sudHistory.join(' → ')} →{' '}
                  {companion.target.currentSUD ?? '—'}
                </p>
              )}
            </div>
          </aside>
        )}

        <section className="companion-stage">
          <BlsStage
            attachCanvas={session.attachCanvas}
            label={focusMode ? undefined : 'BLS'}
            fullscreen={focusMode}
          />
          {isActive && (
            <div className="live-hud">
              <span>{session.formatTime(session.metrics.timeMs)}</span>
              <span>{session.metrics.passes} passes</span>
              <button type="button" className="btn danger" onClick={() => session.stop()}>
                Stop
              </button>
            </div>
          )}
        </section>

        {!hideForms && (
          <aside className="companion-controls">
            <div className="panel">
              <h2>BLS controls</h2>
              <p className="hint">Suggested starting point — adjust clinically.</p>
              {preset.suggestedPassRange && (
                <p className="hint">
                  Suggested passes: ~{preset.suggestedPassRange[0]}–
                  {preset.suggestedPassRange[1]}
                </p>
              )}

              <label className="field">
                <span>Slower ←——→ Faster</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={session.state.speed01}
                  onChange={(e) => {
                    session.patchState({ speed01: Number(e.target.value) });
                    setCustomDirty(true);
                  }}
                />
              </label>

              <label className="field">
                <span>Passes {session.state.targetPasses ?? 30}</span>
                <input
                  type="range"
                  min={4}
                  max={60}
                  value={session.state.targetPasses ?? 30}
                  onChange={(e) => {
                    session.patchState({
                      targetPasses: Number(e.target.value),
                      setMode: 'passes',
                      continuous: false,
                    });
                    setCustomDirty(true);
                  }}
                />
              </label>

              {(companion.phase === 'closure' || session.state.visualMode === 'infinity') && (
                <>
                  <label className="field">
                    <span>Duration {session.state.targetSeconds ?? 15}s</span>
                    <input
                      type="range"
                      min={10}
                      max={30}
                      value={session.state.targetSeconds ?? 15}
                      onChange={(e) =>
                        session.patchState({
                          targetSeconds: Number(e.target.value),
                          setMode: 'timed',
                        })
                      }
                    />
                  </label>
                  <div className="segmented">
                    <button
                      type="button"
                      className={session.state.midlineDirection === 'up' ? 'is-active' : ''}
                      onClick={() => session.patchState({ midlineDirection: 'up' })}
                    >
                      Up midline
                    </button>
                    <button
                      type="button"
                      className={session.state.midlineDirection === 'down' ? 'is-active' : ''}
                      onClick={() => session.patchState({ midlineDirection: 'down' })}
                    >
                      Down midline
                    </button>
                  </div>
                </>
              )}

              <label className="toggle block">
                <input
                  type="checkbox"
                  checked={session.state.continuous}
                  onChange={(e) =>
                    session.patchState({
                      continuous: e.target.checked,
                      setMode: e.target.checked ? 'continuous' : 'passes',
                    })
                  }
                />
                <span>Continuous</span>
              </label>

              <div className="stack-btns">
                {!session.state.running ? (
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!preset.blsActive && companion.phase === 'history'}
                    onClick={() => {
                      setAwaitingFeedback(false);
                      setFocusMode(true);
                      void session.start();
                    }}
                  >
                    Start Set
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => (session.state.paused ? void session.resume() : session.pause())}
                    >
                      {session.state.paused ? 'Resume' : 'Pause'}
                    </button>
                    <button type="button" className="btn danger" onClick={() => session.stop()}>
                      Stop
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setFocusMode((v) => !v)}
                >
                  {focusMode ? 'Exit focus' : 'Focus Mode'}
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => void document.documentElement.requestFullscreen?.()}
                >
                  Fullscreen
                </button>
              </div>
              <p className="hint">Space start/pause · Esc stop · ↑↓ speed</p>
            </div>

            {awaitingFeedback && (
              <div className="panel check-in">
                <h2>What are you noticing now?</h2>
                <div className="chip-grid">
                  {(
                    [
                      ['change', 'Change / new material'],
                      ['no-change', 'No change'],
                      ['positive', 'Positive / adaptive'],
                      ['distress', 'Increased distress'],
                      ['pause', 'Need to pause'],
                      ['return-to-target', 'Return to target'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className="chip"
                      onClick={() => recordResponse(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    setAwaitingFeedback(false);
                    setFocusMode(true);
                    void session.start();
                  }}
                >
                  Start another set
                </button>
              </div>
            )}

            {(companion.phase === 'closure' || session.state.visualMode === 'infinity') &&
              awaitingFeedback && (
                <div className="panel">
                  <h2>Check in with client</h2>
                  <div className="stack-btns">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => {
                        setAwaitingFeedback(false);
                        void session.start();
                      }}
                    >
                      Repeat
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        session.patchState({
                          midlineDirection:
                            session.state.midlineDirection === 'up' ? 'down' : 'up',
                        })
                      }
                    >
                      Reverse midline direction
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setAwaitingFeedback(false)}
                    >
                      Finish
                    </button>
                  </div>
                </div>
              )}
          </aside>
        )}
      </div>
    </div>
  );
}

function metricsPasses(n: number): number {
  return n;
}

function PhasePanel({
  phase,
  target,
  onTarget,
  onBeginReprocessing,
  why,
  whyOpen,
  onToggleWhy,
}: {
  phase: EMDRPhase;
  target: AssessmentTarget;
  onTarget: (p: Partial<AssessmentTarget>) => void;
  onBeginReprocessing: () => void;
  why: string;
  whyOpen: boolean;
  onToggleWhy: () => void;
}) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Target</h2>
        <button type="button" className="btn ghost" onClick={onToggleWhy}>
          Why this preset?
        </button>
      </div>
      {whyOpen && <p className="hint why">{why}</p>}

      {(phase === 'history' || phase === 'assessment' || phase === 'desensitisation') && (
        <>
          {phase === 'history' && (
            <p className="hint">BLS not normally required during this phase.</p>
          )}
          <Field
            label="Target / image"
            value={target.image ?? ''}
            onChange={(v) => onTarget({ image: v })}
          />
          <Field
            label="Negative Cognition"
            value={target.negativeCognition ?? ''}
            onChange={(v) => onTarget({ negativeCognition: v })}
          />
          <Field
            label="Positive Cognition"
            value={target.positiveCognition ?? ''}
            onChange={(v) => onTarget({ positiveCognition: v })}
          />
          <Scale
            label="SUD 0–10"
            min={0}
            max={10}
            value={target.currentSUD ?? target.initialSUD}
            onChange={(v) =>
              onTarget({
                currentSUD: v,
                initialSUD: target.initialSUD ?? v,
              })
            }
          />
          <Scale
            label="VOC 1–7"
            min={1}
            max={7}
            value={target.currentVOC ?? target.initialVOC}
            onChange={(v) =>
              onTarget({
                currentVOC: v,
                initialVOC: target.initialVOC ?? v,
              })
            }
          />
          <Field
            label="Emotions"
            value={target.emotion ?? ''}
            onChange={(v) => onTarget({ emotion: v })}
          />
          <Field
            label="Body location / sensation"
            value={target.bodyLocation ?? ''}
            onChange={(v) => onTarget({ bodyLocation: v })}
          />
          {phase === 'assessment' && (
            <button type="button" className="btn primary" onClick={onBeginReprocessing}>
              Begin Reprocessing
            </button>
          )}
        </>
      )}

      {phase === 'installation' && (
        <>
          <Scale
            label="Current VOC 1–7"
            min={1}
            max={7}
            value={target.currentVOC}
            onChange={(v) => onTarget({ currentVOC: v })}
          />
          <label className="toggle block">
            <input
              type="checkbox"
              checked={!!target.ecologicalVOC}
              onChange={(e) => onTarget({ ecologicalVOC: e.target.checked })}
            />
            <span>Ecologically appropriate VOC</span>
          </label>
        </>
      )}

      {phase === 'body-scan' && (
        <>
          <Field
            label="Body sensation"
            value={target.bodyLocation ?? ''}
            onChange={(v) => onTarget({ bodyLocation: v })}
          />
          <div className="chip-grid">
            {['Clear / neutral', 'Positive sensation', 'Residual disturbance', 'New association'].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  className="chip"
                  onClick={() => onTarget({ bodyLocation: label })}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </>
      )}

      {phase === 'future-template' && (
        <>
          <Field
            label="Future scenario"
            value={target.title ?? ''}
            onChange={(v) => onTarget({ title: v })}
          />
          <Field
            label="Desired response / PC"
            value={target.positiveCognition ?? ''}
            onChange={(v) => onTarget({ positiveCognition: v })}
          />
          <Scale
            label="VOC 1–7"
            min={1}
            max={7}
            value={target.currentVOC}
            onChange={(v) => onTarget({ currentVOC: v })}
          />
        </>
      )}

      {phase === 'reevaluation' && (
        <>
          <Scale
            label="Current SUD"
            min={0}
            max={10}
            value={target.currentSUD}
            onChange={(v) => onTarget({ currentSUD: v })}
          />
          <Scale
            label="Current VOC"
            min={1}
            max={7}
            value={target.currentVOC}
            onChange={(v) => onTarget({ currentVOC: v })}
          />
          <Field
            label="Changes since previous session"
            value={target.memory ?? ''}
            onChange={(v) => onTarget({ memory: v })}
          />
        </>
      )}

      {phase === 'closure' && (
        <p className="hint">
          Options: Resource, Grounding, Container, Safe/Calm State, Infinity ∞, Manual BLS, or No
          BLS — select Infinity trajectory in controls for de-arousal.
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Scale({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="scale-block">
      <span>{label}</span>
      <div className="scale-btns">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <button
            key={n}
            type="button"
            className={value === n ? 'chip is-active' : 'chip'}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
