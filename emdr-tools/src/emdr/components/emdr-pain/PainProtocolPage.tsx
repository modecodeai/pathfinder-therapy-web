import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BlsStage } from '../../../components/BlsStage';
import { useBlsSession, type BlsSession } from '../../../hooks/useBlsSession';
import {
  GRANT_PAIN_FULL,
  GRANT_PAIN_INTEGRATIVE,
  GRANT_PAIN_SHORT,
  GRANT_PAIN_VARIATIONS,
  buildSessionRecord,
  loadPainWorkspace,
  markStageComplete,
  savePainWorkspace,
  scriptForStage,
} from '../../lib/emdr-pain/painHelpers';
import { grantPainDefaultPatch } from '../../lib/emdr-pain/painBlsPresets';
import {
  BODY_AREAS,
  PAIN_CHANGE_LABELS,
  PAIN_NAVIGATOR_STAGES,
  PAIN_STAGE_LABELS,
  type InstallationRoute,
  type PainChangeTag,
  type PainProtocolStage,
  type PainWorkspaceState,
  type ProtocolScriptSection,
} from '../../types/painProtocol';
import { PainBlsControls } from './PainBlsControls';
import { PainProtocolNavigator } from './PainProtocolNavigator';
import { PainScriptPanel } from './PainScriptPanel';

const PROTOCOL_TITLE = 'Mark Grant EMDR Pain Protocol';

const PROTOCOL_SOURCES = [
  'Mark Grant — EMDR Pain Protocol (Pain Protocol Grant v4 full)',
  'Mark Grant — EMDR Pain Protocol (short version)',
  'Mark Grant — Pain Protocol Variations (2018 / protocol materials)',
  'Mark Grant — Trauma-informed integrative approach',
] as const;

const PROCESSING_STAGES: PainProtocolStage[] = [
  'desensitisation',
  'installation-pc',
  'antidote-imagery',
  'imaginal-healing',
  'voc-review',
  'body-scan',
  'between-session',
];

const NC_THEME_HINTS = [
  'Lack of safety / vulnerability',
  'Control / power',
  'Responsibility / feeling defective (pain-related)',
] as const;

const NO_CHANGE_HELPER =
  'Never accept responses like “Nothing” or “It’s the same”. Ask for exact experiencing, as when the pain was first described.';

const PAIN_INCREASED_NOTE =
  'Stop BLS if stimulation is making the pain worse. Consider hypnosis, imagery, pacing, containment, or medical escalation as clinically indicated.';

function guidanceBadge(kind: ProtocolScriptSection['guidanceKind']): string {
  return kind === 'protocol' ? 'Protocol Guidance' : 'Practice Tool';
}

function formatSud(value: number | undefined): string {
  return value == null ? '—' : String(value);
}

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function nextNavigatorStage(stage: PainProtocolStage): PainProtocolStage | null {
  const idx = PAIN_NAVIGATOR_STAGES.indexOf(stage);
  if (idx < 0 || idx >= PAIN_NAVIGATOR_STAGES.length - 1) return null;
  return PAIN_NAVIGATOR_STAGES[idx + 1] ?? null;
}

function prevNavigatorStage(stage: PainProtocolStage): PainProtocolStage | null {
  const idx = PAIN_NAVIGATOR_STAGES.indexOf(stage);
  if (idx <= 0) return null;
  return PAIN_NAVIGATOR_STAGES[idx - 1] ?? null;
}

function firstOpenStage(ws: PainWorkspaceState): PainProtocolStage {
  const incomplete = PAIN_NAVIGATOR_STAGES.find((s) => !ws.completedStages.includes(s));
  return incomplete ?? 'orientation';
}

interface StagePanelProps {
  title: string;
  children: ReactNode;
  badge?: 'protocol' | 'practice-tool';
}

function StagePanel({ title, children, badge = 'protocol' }: StagePanelProps) {
  return (
    <section className="panel pain-stage-panel">
      <header className="panel-head">
        <h2>{title}</h2>
        <span className={badge === 'protocol' ? 'badge-protocol' : 'badge-practice'}>
          {badge === 'protocol' ? 'Protocol Guidance' : 'Practice Tool'}
        </span>
      </header>
      {children}
    </section>
  );
}

export function PainProtocolPage() {
  const navigate = useNavigate();
  const [ws, setWs] = useState<PainWorkspaceState>(() => loadPainWorkspace());
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [aipExpanded, setAipExpanded] = useState(false);
  const [wmtDismissed, setWmtDismissed] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const mountedRef = useRef(false);

  const bls = useBlsSession();

  const blsForControls: BlsSession = useMemo(
    () => ({
      ...bls,
      start: async () => {
        bls.patchState(grantPainDefaultPatch(bls.stateRef.current));
        return bls.start();
      },
    }),
    [bls],
  );

  const patchWs = useCallback(
    (updater: Partial<PainWorkspaceState> | ((prev: PainWorkspaceState) => PainWorkspaceState)) => {
      setWs((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }));
    },
    [],
  );

  const patchAssessment = useCallback(
    (partial: Partial<PainWorkspaceState['assessment']>) => {
      patchWs((prev) => ({
        ...prev,
        assessment: { ...prev.assessment, ...partial },
      }));
    },
    [patchWs],
  );

  const goStage = useCallback(
    (stage: PainProtocolStage) => {
      patchWs({ stage });
    },
    [patchWs],
  );

  const completeStage = useCallback(
    (stage: PainProtocolStage) => {
      patchWs((prev) => markStageComplete(prev, stage));
    },
    [patchWs],
  );

  const setStageNote = useCallback(
    (stage: PainProtocolStage, note: string) => {
      patchWs((prev) => ({
        ...prev,
        stageNotes: { ...prev.stageNotes, [stage]: note },
      }));
    },
    [patchWs],
  );

  const applyPainDefault = useCallback(() => {
    bls.patchState(grantPainDefaultPatch(bls.stateRef.current));
  }, [bls]);

  const startProtocol = useCallback(() => {
    applyPainDefault();
    patchWs((prev) => ({
      ...prev,
      stage: 'orientation',
      orientationComplete: false,
    }));
  }, [applyPainDefault, patchWs]);

  const continueSession = useCallback(() => {
    patchWs((prev) => ({
      ...prev,
      stage: prev.stage === 'dashboard' ? firstOpenStage(prev) : prev.stage,
    }));
  }, [patchWs]);

  const leaveForStandard = useCallback(() => {
    const ok = window.confirm(
      'Leave the EMDR Pain workspace and open Standard EMDR? Session data remains in this browser.',
    );
    if (ok) navigate('/session');
  }, [navigate]);

  const returnPainDefault = useCallback(() => {
    applyPainDefault();
    setWmtDismissed(false);
  }, [applyPainDefault]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      applyPainDefault();
      return;
    }
    savePainWorkspace(ws);
  }, [ws, applyPainDefault]);

  const showWmtWarning = bls.state.taxationMode !== 'standard' && !wmtDismissed;

  const inProcessing = PROCESSING_STAGES.includes(ws.stage);
  const showVisual = bls.state.visualEnabled && !bls.state.audioOnly;
  const blsRunning = bls.state.running && !bls.state.paused;

  const currentScript = useMemo(() => {
    if (ws.pinnedScriptId) {
      const pinned =
        GRANT_PAIN_FULL.find((s) => s.id === ws.pinnedScriptId) ??
        GRANT_PAIN_SHORT.find((s) => s.id === ws.pinnedScriptId);
      if (pinned) return pinned;
    }
    if (ws.stage === 'script-full' || ws.stage === 'script-short') return null;
    return scriptForStage(ws.stage, 'full');
  }, [ws.pinnedScriptId, ws.stage]);

  const handleCheckIn = useCallback(() => {
    setCheckInCount((c) => c + 1);
  }, []);

  const toggleChangeTag = useCallback(
    (tag: PainChangeTag) => {
      patchWs((prev) => ({
        ...prev,
        changeTags: toggleInList(prev.changeTags, tag),
      }));
    },
    [patchWs],
  );

  const toggleBodyArea = useCallback(
    (area: string) => {
      patchWs((prev) => {
        const locations = prev.assessment.bodyLocations;
        const next = locations.includes(area)
          ? locations.filter((a) => a !== area)
          : [...locations, area];
        return {
          ...prev,
          assessment: { ...prev.assessment, bodyLocations: next },
        };
      });
    },
    [patchWs],
  );

  const updateSud = useCallback(
    (value: number | undefined) => {
      patchWs((prev) => {
        const a = prev.assessment;
        const baselineSud = a.baselineSud ?? value;
        const lowestSud =
          value != null && (a.lowestSud == null || value < a.lowestSud) ? value : a.lowestSud;
        return {
          ...prev,
          assessment: {
            ...a,
            currentSud: value,
            baselineSud: a.baselineSud ?? baselineSud,
            lowestSud,
          },
        };
      });
    },
    [patchWs],
  );

  const saveSessionRecord = useCallback(() => {
    const record = buildSessionRecord(ws);
    if (!record) return;
    patchWs((prev) => ({
      ...prev,
      sessions: [...prev.sessions, record],
    }));
  }, [patchWs, ws]);

  const copyScript = useCallback((section: ProtocolScriptSection | null | undefined) => {
    if (!section) return;
    void navigator.clipboard.writeText(section.script);
  }, []);

  const renderDashboard = () => (
    <div className="pain-dashboard">
      <div className="pain-dashboard-metrics panel">
        <h2>Current session</h2>
        <dl className="pain-metrics-grid">
          <div>
            <dt>Current Protocol</dt>
            <dd>{PROTOCOL_TITLE}</dd>
          </div>
          <div>
            <dt>Current Phase</dt>
            <dd>{ws.stage === 'dashboard' ? 'Dashboard' : PAIN_STAGE_LABELS[ws.stage]}</dd>
          </div>
          <div>
            <dt>Current Pain SUD</dt>
            <dd>{formatSud(ws.assessment.currentSud ?? ws.assessment.baselineSud)}</dd>
          </div>
          <div>
            <dt>Current VoC</dt>
            <dd>{formatSud(ws.assessment.voc)}</dd>
          </div>
        </dl>
      </div>

      <div className="chip-grid pain-dashboard-cards">
        <button type="button" className="panel pain-dash-card" onClick={startProtocol}>
          <h3>Start Pain Protocol</h3>
          <p className="hint">Orientation, target selection, and Grant Pain Default BLS.</p>
        </button>
        <button type="button" className="panel pain-dash-card" onClick={continueSession}>
          <h3>Continue Current Pain Session</h3>
          <p className="hint">
            Resume at {PAIN_STAGE_LABELS[ws.stage === 'dashboard' ? firstOpenStage(ws) : ws.stage]}.
          </p>
        </button>
        <button type="button" className="panel pain-dash-card" onClick={() => goStage('script-full')}>
          <h3>Pain Protocol Script</h3>
          <p className="hint">Browse full and short Mark Grant scripts.</p>
        </button>
        <button type="button" className="panel pain-dash-card" onClick={() => goStage('help')}>
          <h3>Pain Help &amp; Guidance</h3>
          <p className="hint">Variations, integrative approach, and resourcing menus.</p>
        </button>
      </div>
    </div>
  );

  const renderOrientation = () => {
    const section = GRANT_PAIN_FULL.find((s) => s.id === 'full-aip');
    return (
      <StagePanel title="Orientation / AIP">
        <p className="hint">
          Source: Mark Grant EMDR Pain Protocol ·{' '}
          <span className="badge-protocol">Protocol Guidance</span>
        </p>
        <button type="button" className="btn ghost" onClick={() => setAipExpanded((v) => !v)}>
          {aipExpanded ? 'Collapse AIP script' : 'Expand full AIP script'}
        </button>
        {aipExpanded && section && (
          <pre className="pain-script-text">{section.script}</pre>
        )}
        {section?.clinicalNotes?.map((n) => (
          <p key={n} className="hint">
            {n}
          </p>
        ))}
        <label className="field">
          <span>Private clinician notes</span>
          <textarea
            rows={3}
            value={ws.privateNotes}
            onChange={(e) => patchWs({ privateNotes: e.target.value })}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={ws.orientationComplete}
            onChange={(e) => {
              patchWs({ orientationComplete: e.target.checked });
              if (e.target.checked) completeStage('orientation');
            }}
          />
          <span>Orientation complete — client understands AIP framing and stop signal</span>
        </label>
        <div className="stack-btns horizontal">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              completeStage('orientation');
              goStage('target-selection');
            }}
          >
            Continue to target selection
          </button>
        </div>
      </StagePanel>
    );
  };

  const renderTargetSelection = () => (
    <StagePanel title="Target Selection">
      <p className="hint">Choose traumatic pain memory vs present-pain sensory target.</p>
      <div className="segmented stack-btns">
        <button
          type="button"
          className={ws.assessment.targetType === 'traumatic-pain' ? 'is-active' : ''}
          onClick={() => patchAssessment({ targetType: 'traumatic-pain' })}
        >
          Traumatic pain
        </button>
        <button
          type="button"
          className={ws.assessment.targetType === 'present-pain' ? 'is-active' : ''}
          onClick={() => patchAssessment({ targetType: 'present-pain' })}
        >
          Non-traumatic / present pain
        </button>
      </div>
      <label className="field">
        <span>Target description / image</span>
        <textarea
          rows={3}
          value={ws.assessment.targetDescription}
          onChange={(e) => patchAssessment({ targetDescription: e.target.value })}
          placeholder="Incident image or present pain description"
        />
      </label>
      <div className="banner soft">
        <p>
          <strong>Present Pain as Target</strong> —{' '}
          {GRANT_PAIN_VARIATIONS.find((v) => v.id === 'var-present-pain')?.script.slice(0, 280)}…
        </p>
        <p className="hint warn">
          Client retains choice. Keep focus on present affect when using present-pain targeting; track
          physical changes closely.
        </p>
      </div>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('target-selection');
          goStage('pain-description');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderPainDescription = () => (
    <StagePanel title="Pain Description">
      {(
        [
          ['painImageMetaphor', 'Image / metaphor'],
          ['painColour', 'Colour'],
          ['painShape', 'Shape'],
          ['painSize', 'Size'],
          ['painTexture', 'Texture'],
          ['painMovement', 'Movement'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="field">
          <span>{label}</span>
          <input
            value={ws.assessment[key]}
            onChange={(e) => patchAssessment({ [key]: e.target.value })}
          />
        </label>
      ))}
      <label className="field">
        <span>Additional description</span>
        <textarea
          rows={2}
          value={ws.assessment.additionalDescription}
          onChange={(e) => patchAssessment({ additionalDescription: e.target.value })}
        />
      </label>
      <div className="panel pain-drawing-placeholder" aria-label="Drawing placeholder">
        <p className="hint">
          <span className="badge-protocol">Protocol Guidance</span> — Drawing placeholder: invite the
          client to sketch pain if words are difficult. Even a simple line can concretize the target.
        </p>
        <div className="pain-drawing-box" role="img" aria-label="Client drawing area placeholder">
          <span className="hint">Client drawing area (paper/whiteboard in room)</span>
        </div>
      </div>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('pain-description');
          goStage('negative-cognition');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderNegativeCognition = () => (
    <StagePanel title="Negative Cognition">
      <label className="field">
        <span>NC — client words</span>
        <input
          value={ws.assessment.nc}
          onChange={(e) => patchAssessment({ nc: e.target.value })}
          placeholder="What does the pain (or memory) make you believe about yourself?"
        />
      </label>
      <fieldset className="taxation-fieldset">
        <legend>Common themes (not definitive)</legend>
        <p className="hint">Shapiro themes plus pain-related responsibility/defectiveness — prompts only.</p>
        <ul className="hint-list">
          {NC_THEME_HINTS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </fieldset>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('negative-cognition');
          goStage('positive-cognition');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderPositiveCognition = () => (
    <StagePanel title="Positive Cognition">
      <label className="field">
        <span>PC — desired belief</span>
        <input
          value={ws.assessment.pc}
          onChange={(e) => patchAssessment({ pc: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Revised PC (if updated later)</span>
        <input
          value={ws.assessment.revisedPc}
          onChange={(e) => patchAssessment({ revisedPc: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('positive-cognition');
          goStage('voc');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderVoc = () => (
    <StagePanel title="Validity of Cognition (1–7)">
      <label className="field">
        <span>VoC rating</span>
        <input
          type="number"
          min={1}
          max={7}
          value={ws.assessment.voc ?? ''}
          onChange={(e) =>
            patchAssessment({
              voc: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
        />
      </label>
      <div className="segmented">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            className={ws.assessment.voc === n ? 'is-active' : ''}
            onClick={() => patchAssessment({ voc: n })}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('voc');
          goStage('emotion');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderEmotion = () => (
    <StagePanel title="Emotion (skippable)">
      <label className="check-row">
        <input
          type="checkbox"
          checked={ws.assessment.skipEmotion}
          onChange={(e) => patchAssessment({ skipEmotion: e.target.checked })}
        />
        <span>Skip emotion elicitation (pain is primary presenting problem)</span>
      </label>
      {!ws.assessment.skipEmotion && (
        <label className="field">
          <span>Emotion</span>
          <input
            value={ws.assessment.emotion}
            onChange={(e) => patchAssessment({ emotion: e.target.value })}
          />
        </label>
      )}
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('emotion');
          goStage('pain-sud');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderPainSud = () => (
    <StagePanel title="Pain SUD (0–10)">
      <label className="field">
        <span>Current pain SUD</span>
        <input
          type="number"
          min={0}
          max={10}
          value={ws.assessment.currentSud ?? ''}
          onChange={(e) =>
            updateSud(e.target.value === '' ? undefined : Number(e.target.value))
          }
        />
      </label>
      <p className="hint">
        Baseline: {formatSud(ws.assessment.baselineSud)} · Lowest this session:{' '}
        {formatSud(ws.assessment.lowestSud)}
      </p>
      <div className="segmented wrap">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            className={ws.assessment.currentSud === n ? 'is-active' : ''}
            onClick={() => updateSud(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('pain-sud');
          goStage('sensation-location');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderSensationLocation = () => (
    <StagePanel title="Sensation / Location">
      <p className="hint">Select body areas; add notes per area if helpful.</p>
      <div className="chip-grid">
        {BODY_AREAS.map((area) => (
          <button
            key={area}
            type="button"
            className={`chip${ws.assessment.bodyLocations.includes(area) ? ' is-active' : ''}`}
            onClick={() => toggleBodyArea(area)}
          >
            {area}
          </button>
        ))}
      </div>
      {ws.assessment.bodyLocations.map((area) => (
        <label key={area} className="field">
          <span>{area} notes</span>
          <input
            value={ws.assessment.bodyLocationNotes[area] ?? ''}
            onChange={(e) =>
              patchWs((prev) => ({
                ...prev,
                assessment: {
                  ...prev.assessment,
                  bodyLocationNotes: {
                    ...prev.assessment.bodyLocationNotes,
                    [area]: e.target.value,
                  },
                },
              }))
            }
          />
        </label>
      ))}
      <label className="field">
        <span>Sensation notes</span>
        <textarea
          rows={2}
          value={ws.assessment.sensationNotes}
          onChange={(e) => patchAssessment({ sensationNotes: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('sensation-location');
          applyPainDefault();
          goStage('desensitisation');
        }}
      >
        Begin desensitisation
      </button>
    </StagePanel>
  );

  const renderDesensitisation = () => (
    <StagePanel title="Desensitisation">
      <div className="pain-desens-summary">
        <p>
          <strong>Target:</strong> {ws.assessment.targetDescription || ws.assessment.painImageMetaphor || '—'}
        </p>
        <p>
          <strong>NC:</strong> {ws.assessment.nc || '—'}
        </p>
        <p>
          <strong>SUD:</strong> {formatSud(ws.assessment.currentSud)} (lowest{' '}
          {formatSud(ws.assessment.lowestSud)})
        </p>
        <p>
          <strong>Description:</strong>{' '}
          {[ws.assessment.painColour, ws.assessment.painShape, ws.assessment.painSize]
            .filter(Boolean)
            .join(', ') || '—'}
        </p>
        <p>
          <strong>Location:</strong> {ws.assessment.bodyLocations.join(', ') || '—'}
        </p>
        <p>
          <strong>BLS:</strong>{' '}
          {blsRunning ? 'Running' : bls.state.running ? 'Paused' : 'Stopped'} ·{' '}
          {bls.formatTime(bls.metrics.timeMs)}
        </p>
        <p>
          <strong>Check-ins this set:</strong> {checkInCount}
        </p>
      </div>

      <div className="stack-btns horizontal">
        <button type="button" className="btn primary" onClick={handleCheckIn}>
          “What do you notice now?” (check-in — BLS continues)
        </button>
      </div>

      <fieldset className="taxation-fieldset">
        <legend>Change tags</legend>
        <div className="chip-grid">
          {(Object.keys(PAIN_CHANGE_LABELS) as PainChangeTag[]).map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip${ws.changeTags.includes(tag) ? ' is-active' : ''}`}
              onClick={() => toggleChangeTag(tag)}
            >
              {PAIN_CHANGE_LABELS[tag]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Client exact words</span>
        <textarea
          rows={2}
          value={ws.clientExactWords}
          onChange={(e) => patchWs({ clientExactWords: e.target.value })}
          placeholder="Record concrete sensory language — not analysis"
        />
      </label>

      <div className="banner notice">
        <p>{NO_CHANGE_HELPER}</p>
      </div>

      {ws.changeTags.includes('pain-increased') && (
        <div className="taxation-advisory">
          <p>
            <strong>Clinical check — pain increased</strong>
          </p>
          <p>{PAIN_INCREASED_NOTE}</p>
          <button type="button" className="btn danger" onClick={() => bls.stop()}>
            Stop BLS
          </button>
        </div>
      )}

      <fieldset className="taxation-fieldset">
        <legend>Plateau / further improvement</legend>
        <p className="hint">“Does it feel like you can achieve any further improvement?”</p>
        <div className="segmented">
          {(['yes', 'no', 'unsure'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={ws.plateauFurtherPossible === v ? 'is-active' : ''}
              onClick={() => patchWs({ plateauFurtherPossible: v })}
            >
              {v}
            </button>
          ))}
        </div>
        <label className="field">
          <span>What prevents zero?</span>
          <input
            value={ws.whatPreventsZero}
            onChange={(e) => patchWs({ whatPreventsZero: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Updated SUD</span>
          <input
            type="number"
            min={0}
            max={10}
            value={ws.assessment.currentSud ?? ''}
            onChange={(e) =>
              updateSud(e.target.value === '' ? undefined : Number(e.target.value))
            }
          />
        </label>
      </fieldset>

      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('desensitisation');
          goStage('installation-route');
        }}
      >
        Move to installation route
      </button>
    </StagePanel>
  );

  const renderInstallationRoute = () => (
    <StagePanel title="Installation Route">
      <p className="hint">Standard PC, antidote imagery, or both — per clinical picture.</p>
      <div className="segmented stack-btns">
        {(
          [
            ['standard-pc', 'Standard PC'],
            ['antidote', 'Antidote imagery'],
            ['both', 'Both'],
          ] as const
        ).map(([route, label]) => (
          <button
            key={route}
            type="button"
            className={ws.installationRoute === route ? 'is-active' : ''}
            onClick={() => patchWs({ installationRoute: route as InstallationRoute })}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn ghost"
        onClick={() => goStage('imaginal-healing')}
      >
        Imaginal healing (alternative install)
      </button>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('installation-route');
          const route = ws.installationRoute;
          if (route === 'antidote') goStage('antidote-imagery');
          else if (route === 'both') goStage('antidote-imagery');
          else goStage('installation-pc');
        }}
        disabled={!ws.installationRoute}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderAntidoteImagery = () => (
    <StagePanel title="Antidote Imagery Builder">
      {(
        [
          ['sensoryChange', 'Sensory change noted'],
          ['whatIsThereNow', 'What is there now?'],
          ['howDoesThatFeel', 'How does that feel?'],
          ['remindsOf', 'What does it remind you of?'],
          ['imageMetaphor', 'Image / metaphor'],
          ['associatedWord', 'Associated word'],
          ['emotionalState', 'Emotional state'],
          ['installationNotes', 'Installation notes'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="field">
          <span>{label}</span>
          {key === 'installationNotes' ? (
            <textarea
              rows={2}
              value={ws.antidote[key]}
              onChange={(e) =>
                patchWs((prev) => ({
                  ...prev,
                  antidote: { ...prev.antidote, [key]: e.target.value },
                }))
              }
            />
          ) : (
            <input
              value={ws.antidote[key]}
              onChange={(e) =>
                patchWs((prev) => ({
                  ...prev,
                  antidote: { ...prev.antidote, [key]: e.target.value },
                }))
              }
            />
          )}
        </label>
      ))}
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('antidote-imagery');
          if (ws.installationRoute === 'both') goStage('installation-pc');
          else goStage('voc-review');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderImaginalHealing = () => (
    <StagePanel title="Imaginal Healing">
      {(
        [
          ['image', 'Healing image'],
          ['sensations', 'Sensations'],
          ['emotionalResponse', 'Emotional response'],
          ['associatedWord', 'Associated word'],
          ['blsDurationNote', 'BLS duration note'],
          ['strengthNotes', 'Strength / practice notes'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="field">
          <span>{label}</span>
          {key === 'blsDurationNote' || key === 'strengthNotes' ? (
            <textarea
              rows={2}
              value={ws.imaginal[key]}
              onChange={(e) =>
                patchWs((prev) => ({
                  ...prev,
                  imaginal: { ...prev.imaginal, [key]: e.target.value },
                }))
              }
            />
          ) : (
            <input
              value={ws.imaginal[key]}
              onChange={(e) =>
                patchWs((prev) => ({
                  ...prev,
                  imaginal: { ...prev.imaginal, [key]: e.target.value },
                }))
              }
            />
          )}
        </label>
      ))}
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('imaginal-healing');
          goStage('voc-review');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderInstallationPc = () => (
    <StagePanel title="PC Installation">
      <p className="hint">Install PC with slow BLS as clinically indicated.</p>
      <label className="field">
        <span>PC to install</span>
        <input
          value={ws.assessment.revisedPc || ws.assessment.pc}
          onChange={(e) => patchAssessment({ revisedPc: e.target.value })}
        />
      </label>
      <label className="field">
        <span>Installation VoC (1–7)</span>
        <input
          type="number"
          min={1}
          max={7}
          value={ws.assessment.endVoc ?? ''}
          onChange={(e) =>
            patchAssessment({
              endVoc: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
        />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('installation-pc');
          goStage(ws.installationRoute === 'both' ? 'voc-review' : 'body-scan');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderVocReview = () => (
    <StagePanel title="VoC Review">
      <label className="field">
        <span>End VoC (1–7)</span>
        <input
          type="number"
          min={1}
          max={7}
          value={ws.assessment.endVoc ?? ws.assessment.voc ?? ''}
          onChange={(e) =>
            patchAssessment({
              endVoc: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
        />
      </label>
      <label className="field">
        <span>Revised PC if better fit</span>
        <input
          value={ws.assessment.revisedPc}
          onChange={(e) => patchAssessment({ revisedPc: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('voc-review');
          goStage('body-scan');
        }}
      >
        Continue
      </button>
    </StagePanel>
  );

  const renderBodyScan = () => (
    <StagePanel title="Body Scan">
      <p className="hint">Scan head to feet; note tension or unusual sensation per area.</p>
      <div className="chip-grid">
        {BODY_AREAS.map((area) => (
          <button
            key={area}
            type="button"
            className={`chip${ws.assessment.bodyLocations.includes(area) ? ' is-active' : ''}`}
            onClick={() => toggleBodyArea(area)}
          >
            {area}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Body scan notes</span>
        <textarea
          rows={3}
          value={ws.assessment.sensationNotes}
          onChange={(e) => patchAssessment({ sensationNotes: e.target.value })}
        />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          completeStage('body-scan');
          goStage('closure');
        }}
      >
        Continue to closure
      </button>
    </StagePanel>
  );

  const renderClosure = () => (
    <StagePanel title="Closure">
      {(
        [
          ['painStateReviewed', 'Pain state reviewed with client'],
          ['orientationStable', 'Orientation stable'],
          ['resourcesReviewed', 'Resources reviewed'],
          ['healingImageReviewed', 'Healing / antidote image reviewed'],
          ['betweenSessionPlan', 'Between-session plan discussed'],
          ['medicalEscalationDiscussed', 'Medical escalation pathway discussed'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="check-row">
          <input
            type="checkbox"
            checked={ws.closure[key]}
            onChange={(e) =>
              patchWs((prev) => ({
                ...prev,
                closure: { ...prev.closure, [key]: e.target.checked },
              }))
            }
          />
          <span>{label}</span>
        </label>
      ))}
      <div className="stack-btns horizontal">
        <button type="button" className="btn" onClick={() => goStage('between-session')}>
          Between-session BLS guidance
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => {
            patchAssessment({ endSud: ws.assessment.currentSud });
            saveSessionRecord();
            completeStage('closure');
            goStage('re-evaluation');
          }}
        >
          Complete closure
        </button>
      </div>
    </StagePanel>
  );

  const renderBetweenSession = () => {
    const selfUse = GRANT_PAIN_VARIATIONS.find((v) => v.id === 'var-self-use');
    return (
      <StagePanel title="Between-Session BLS">
        {selfUse && (
          <>
            <p className="hint">
              <span className="badge-protocol">{guidanceBadge(selfUse.guidanceKind)}</span> ·{' '}
              {selfUse.source}
            </p>
            <pre className="pain-script-text">{selfUse.script}</pre>
          </>
        )}
        <label className="check-row">
          <input
            type="checkbox"
            checked={ws.continuousBlsPreferred}
            onChange={(e) => patchWs({ continuousBlsPreferred: e.target.checked })}
          />
          <span>Client prefers continuous auditory BLS for self-use</span>
        </label>
        <button type="button" className="btn" onClick={() => goStage('closure')}>
          Back to closure
        </button>
      </StagePanel>
    );
  };

  const renderReevaluation = () => (
    <StagePanel title="Re-evaluation" badge="practice-tool">
      {(
        [
          ['painSinceLast', 'Pain since last session'],
          ['sleepChanges', 'Sleep changes'],
          ['activityChanges', 'Activity changes'],
          ['moodChanges', 'Mood changes'],
          ['anythingDifferent', 'Anything different'],
          ['newUnusualActivity', 'New / unusual activity'],
          ['stressChanges', 'Stress changes'],
          ['traumaRelatedChanges', 'Trauma-related changes'],
          ['relationshipFunctioning', 'Relationship / functioning'],
          ['medicationChanges', 'Medication changes'],
          ['medicalChanges', 'Medical changes'],
          ['newPainImage', 'New pain image'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="field">
          <span>{label}</span>
          <input
            value={ws.reevaluation[key]}
            onChange={(e) =>
              patchWs((prev) => ({
                ...prev,
                reevaluation: { ...prev.reevaluation, [key]: e.target.value },
              }))
            }
          />
        </label>
      ))}
      <label className="field">
        <span>Current SUD at re-evaluation</span>
        <input
          type="number"
          min={0}
          max={10}
          value={ws.reevaluation.currentSud ?? ''}
          onChange={(e) =>
            patchWs((prev) => ({
              ...prev,
              reevaluation: {
                ...prev.reevaluation,
                currentSud: e.target.value === '' ? undefined : Number(e.target.value),
              },
            }))
          }
        />
      </label>
      <fieldset className="taxation-fieldset">
        <legend>New target required?</legend>
        <div className="segmented">
          <button
            type="button"
            className={ws.reevaluation.newTargetRequired === true ? 'is-active' : ''}
            onClick={() =>
              patchWs((prev) => ({
                ...prev,
                reevaluation: { ...prev.reevaluation, newTargetRequired: true },
              }))
            }
          >
            Yes
          </button>
          <button
            type="button"
            className={ws.reevaluation.newTargetRequired === false ? 'is-active' : ''}
            onClick={() =>
              patchWs((prev) => ({
                ...prev,
                reevaluation: { ...prev.reevaluation, newTargetRequired: false },
              }))
            }
          >
            No
          </button>
        </div>
      </fieldset>
      <button type="button" className="btn primary" onClick={() => goStage('dashboard')}>
        Return to dashboard
      </button>
    </StagePanel>
  );

  const renderHelp = () => (
    <div className="pain-help-stack">
      <StagePanel title="Protocol Variations">
        {GRANT_PAIN_VARIATIONS.map((section) => (
          <details key={section.id} className="panel pain-help-section">
            <summary>
              {section.title}{' '}
              <span className="badge-protocol">{guidanceBadge(section.guidanceKind)}</span>
            </summary>
            <pre className="pain-script-text">{section.script}</pre>
          </details>
        ))}
      </StagePanel>
      <StagePanel title="Integrative Approach">
        {GRANT_PAIN_INTEGRATIVE.map((section) => (
          <details key={section.id} className="panel pain-help-section">
            <summary>
              {section.title}{' '}
              <span className="badge-protocol">{guidanceBadge(section.guidanceKind)}</span>
            </summary>
            <pre className="pain-script-text">{section.script}</pre>
          </details>
        ))}
      </StagePanel>
      <StagePanel title="Resourcing menu">
        <p className="hint">
          From integrative materials — clinician selects; do not auto-apply interventions.
        </p>
        <pre className="pain-script-text">
          {GRANT_PAIN_INTEGRATIVE.find((s) => s.id === 'int-resourcing')?.script}
        </pre>
      </StagePanel>
      <button type="button" className="btn" onClick={() => goStage('dashboard')}>
        Back to dashboard
      </button>
    </div>
  );

  const renderOverview = () => (
    <StagePanel title="Pain Overview — Session List" badge="practice-tool">
      {ws.sessions.length === 0 ? (
        <p className="hint">No saved pain sessions yet. Complete closure to add a record.</p>
      ) : (
        <table className="set-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Target</th>
              <th>Type</th>
              <th>SUD</th>
              <th>VoC</th>
            </tr>
          </thead>
          <tbody>
            {ws.sessions.map((s, i) => (
              <tr key={`${s.date}-${i}`}>
                <td>{new Date(s.date).toLocaleString()}</td>
                <td>{s.target}</td>
                <td>{s.targetType}</td>
                <td>
                  {s.baselinePainSUD} → {s.endPainSUD}
                </td>
                <td>
                  {s.baselineVoC ?? '—'} → {s.endVoC ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button type="button" className="btn" onClick={() => goStage('dashboard')}>
        Back to dashboard
      </button>
    </StagePanel>
  );

  const renderScriptBrowser = (sections: ProtocolScriptSection[], title: string) => (
    <StagePanel title={title}>
      <div className="stack-btns horizontal">
        <button type="button" className="btn" onClick={() => goStage('script-full')}>
          Full script
        </button>
        <button type="button" className="btn" onClick={() => goStage('script-short')}>
          Short script
        </button>
      </div>
      {sections.map((section) => (
        <details key={section.id} className="panel pain-script-browser-item">
          <summary>
            {section.title}{' '}
            <span
              className={
                section.guidanceKind === 'protocol' ? 'badge-protocol' : 'badge-practice'
              }
            >
              {guidanceBadge(section.guidanceKind)}
            </span>
          </summary>
          <p className="hint">{section.source}</p>
          <pre className="pain-script-text">{section.script}</pre>
          <button type="button" className="btn ghost" onClick={() => copyScript(section)}>
            Copy section
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => patchWs({ pinnedScriptId: section.id })}
          >
            Pin to script panel
          </button>
        </details>
      ))}
      <button type="button" className="btn" onClick={() => goStage('dashboard')}>
        Back to dashboard
      </button>
    </StagePanel>
  );

  const renderStageContent = () => {
    switch (ws.stage) {
      case 'dashboard':
        return renderDashboard();
      case 'orientation':
        return renderOrientation();
      case 'target-selection':
        return renderTargetSelection();
      case 'pain-description':
        return renderPainDescription();
      case 'negative-cognition':
        return renderNegativeCognition();
      case 'positive-cognition':
        return renderPositiveCognition();
      case 'voc':
        return renderVoc();
      case 'emotion':
        return renderEmotion();
      case 'pain-sud':
        return renderPainSud();
      case 'sensation-location':
        return renderSensationLocation();
      case 'desensitisation':
        return renderDesensitisation();
      case 'installation-route':
        return renderInstallationRoute();
      case 'antidote-imagery':
        return renderAntidoteImagery();
      case 'imaginal-healing':
        return renderImaginalHealing();
      case 'installation-pc':
        return renderInstallationPc();
      case 'voc-review':
        return renderVocReview();
      case 'body-scan':
        return renderBodyScan();
      case 'closure':
        return renderClosure();
      case 'between-session':
        return renderBetweenSession();
      case 're-evaluation':
        return renderReevaluation();
      case 'help':
        return renderHelp();
      case 'overview':
        return renderOverview();
      case 'script-full':
        return renderScriptBrowser(GRANT_PAIN_FULL, 'Full Protocol Script');
      case 'script-short':
        return renderScriptBrowser(GRANT_PAIN_SHORT, 'Short Protocol Script');
      default:
        return renderDashboard();
    }
  };

  const scriptPrev = ws.stage !== 'dashboard' ? prevNavigatorStage(ws.stage) : null;
  const scriptNext = ws.stage !== 'dashboard' ? nextNavigatorStage(ws.stage) : null;

  return (
    <div className="companion companion-v3 app-shell pain-protocol-page">
      <header className="companion-top">
        <div className="companion-brand">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Pathfinder</strong> EMDR Pain
            </span>
          </Link>
          <button
            type="button"
            className="chip protocol-source-badge"
            onClick={() => setSourcesOpen((v) => !v)}
            aria-expanded={sourcesOpen}
          >
            {PROTOCOL_TITLE}
          </button>
        </div>
        <nav className="companion-meta pain-top-nav" aria-label="Workspace navigation">
          <button type="button" className="btn ghost" onClick={leaveForStandard}>
            Standard EMDR
          </button>
          <Link className="btn ghost" to="/session">
            Working Memory Taxation
          </Link>
          <Link className="btn ghost" to="/pain" aria-current="page">
            EMDR Pain
          </Link>
          <Link className="btn ghost" to="/resources">
            Scripts
          </Link>
          <button type="button" className="btn ghost" onClick={() => goStage('help')}>
            Help
          </button>
          <Link className="btn ghost" to="/account">
            Settings
          </Link>
        </nav>
      </header>

      <div className="companion-chrome">
        <div className="segmented protocol-mode-selector" role="group" aria-label="Protocol mode">
          <button type="button" className="btn ghost" onClick={leaveForStandard}>
            Standard EMDR
          </button>
          <button type="button" className="is-active" aria-pressed>
            EMDR Pain
          </button>
        </div>
        {sourcesOpen && (
          <div className="banner soft pain-sources-list" role="region" aria-label="Protocol sources">
            <p>
              <strong>Source materials</strong>
            </p>
            <ul>
              {PROTOCOL_SOURCES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <button type="button" className="btn ghost" onClick={() => setSourcesOpen(false)}>
              Close
            </button>
          </div>
        )}
        <div className="banner notice medical-safety-note" role="note">
          <strong>Medical safety:</strong> EMDR pain work does not replace appropriate medical
          assessment, diagnosis or treatment. New, unexplained, rapidly worsening or otherwise
          concerning pain requires appropriate medical evaluation. Do not diagnose pain origin in
          this app. Stop BLS if pain becomes intolerable.
        </div>
      </div>

      <div className="companion-workspace">
        {ws.stage === 'dashboard' ? (
          <main className="pain-dashboard-main">{renderStageContent()}</main>
        ) : (
          <div className="companion-body pain-workspace-body">
            <aside className="companion-side">
              <PainProtocolNavigator
                stage={ws.stage}
                completed={ws.completedStages}
                onSelect={goStage}
              />
              <div className="stack-btns">
                <button type="button" className="btn ghost" onClick={() => goStage('dashboard')}>
                  Dashboard
                </button>
                <button type="button" className="btn ghost" onClick={() => goStage('overview')}>
                  Overview
                </button>
                <button type="button" className="btn ghost" onClick={() => goStage('script-full')}>
                  Scripts
                </button>
              </div>
            </aside>

            <section className="companion-stage pain-stage-center">
              {showVisual && inProcessing && (
                <BlsStage
                  attachCanvas={bls.attachCanvas}
                  label="Pain BLS"
                  trajectory={bls.state.visualMode}
                  lockSize={blsRunning}
                />
              )}
              {inProcessing && !showVisual && (
                <div className="panel pain-audio-only-stage">
                  <p className="hint">
                    Auditory BLS active — visual stage hidden per Grant Pain Default.
                  </p>
                  <p>
                    Status: {blsRunning ? 'Running' : bls.state.running ? 'Paused' : 'Ready'} ·{' '}
                    {bls.formatTime(bls.metrics.timeMs)}
                  </p>
                </div>
              )}
              {renderStageContent()}
            </section>

            <aside className="companion-controls pain-stage-right">
              <PainScriptPanel
                section={currentScript}
                open={ws.scriptPanelOpen}
                onToggle={() => patchWs({ scriptPanelOpen: !ws.scriptPanelOpen })}
                pinned={!!ws.pinnedScriptId}
                onPin={() =>
                  patchWs({
                    pinnedScriptId: ws.pinnedScriptId ? null : (currentScript?.id ?? null),
                  })
                }
                onCopy={() => copyScript(currentScript)}
                note={ws.stageNotes[ws.stage] ?? ''}
                onNote={(v) => setStageNote(ws.stage, v)}
                onMarkComplete={() => completeStage(ws.stage)}
                onPrev={scriptPrev ? () => goStage(scriptPrev) : undefined}
                onNext={scriptNext ? () => goStage(scriptNext) : undefined}
              />
              {inProcessing && (
                <PainBlsControls
                  session={blsForControls}
                  showWmtWarning={showWmtWarning}
                  onDismissWmt={() => setWmtDismissed(true)}
                  onReturnPainDefault={returnPainDefault}
                  continuousPreferred={ws.continuousBlsPreferred}
                  onContinuousPreferred={(v) => patchWs({ continuousBlsPreferred: v })}
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
