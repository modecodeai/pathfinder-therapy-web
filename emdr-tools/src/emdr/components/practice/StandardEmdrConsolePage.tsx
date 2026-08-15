import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BlsStage } from '../../../components/BlsStage';
import { GuidedPracticeConsole } from '../../guided/components/GuidedPracticeConsole';
import { LiveBlsPanel } from '../../guided/components/LiveBlsPanel';
import { ProcessingTimeline } from '../../guided/components/ProcessingTimeline';
import { QuickResponsePanel } from '../../guided/components/QuickResponsePanel';
import { AppHeader } from '../../guided/components/AppHeader';
import { SessionStatusStrip } from '../../guided/components/SessionStatusStrip';
import { RemoteClientPanel } from '../../guided/components/RemoteClientPanel';
import { TargetSummaryCard } from '../../guided/components/TargetSummaryCard';
import { TherapistScriptPanel } from '../../guided/components/TherapistScriptPanel';
import { useGuidedKeyboard } from '../../guided/hooks/useGuidedKeyboard';
import { useGuidedRemoteBls } from '../../guided/hooks/useGuidedRemoteBls';
import { ClientDisplayPreviewModal } from '../ClientDisplayPanel';
import { applyBlsPreset } from '../../guided/lib/blsPresets';
import {
  FLOATBACK_STEPS,
  READINESS_FLAGS,
  STANDARD_PHASE_LABELS,
  loadStandardSession,
  saveStandardSession,
  type StandardPhaseId,
  type StandardSessionState,
} from '../../guided/lib/standardSession';
import {
  COGNITION_PAIRS,
  COGNITION_SOURCE,
  COGNITION_THEME_LABELS,
  searchCognitions,
  type CognitionTheme,
} from '../../data/scripts/cognitions';
import {
  PHASE3_ASSESSMENT_STEPS,
  PHASE4_STEPS,
  PHASE5_STEPS,
  PHASE6_STEPS,
  PHASE7_COMPLETE_STEPS,
  PHASE7_INCOMPLETE_STEPS,
  STANDARD_SOURCE_LABEL,
} from '../../data/scripts/standardPhases';
import { ClinicalIntelligencePanel } from '../../../clinical-intelligence/components/ClinicalIntelligencePanel';
import type { ConsoleViewMode, GuidedScriptStep } from '../../guided/types/guidedScript';

const PHASES = Object.keys(STANDARD_PHASE_LABELS) as StandardPhaseId[];

const PHASE4_TAGS = [
  'New association',
  'Same',
  'Nothing',
  'More intense',
  'Less intense',
  'New memory',
  'Body change',
  'Insight',
  'Emotion',
  'Stop signal',
  'Other',
] as const;

function stepsForPhase(state: StandardSessionState): GuidedScriptStep[] {
  switch (state.phase) {
    case 'assessment':
      return PHASE3_ASSESSMENT_STEPS;
    case 'desensitisation':
      return PHASE4_STEPS;
    case 'installation':
      return PHASE5_STEPS;
    case 'body-scan':
      return PHASE6_STEPS;
    case 'closure':
      return state.closureBranch === 'incomplete' ? PHASE7_INCOMPLETE_STEPS : PHASE7_COMPLETE_STEPS;
    case 'history':
      return FLOATBACK_STEPS.slice(0, 1);
    default:
      return [];
  }
}

export function StandardEmdrConsolePage() {
  const [searchParams] = useSearchParams();
  const linkedClientId = searchParams.get('clientId');
  const {
    bls,
    clientDisplay,
    remotePanelOpen,
    setRemotePanelOpen,
    outputMode,
    setOutputMode,
    therapistPreview,
    setTherapistPreview,
    emergencyStop,
    startBls,
    stopBls,
    showLocalVisual,
  } = useGuidedRemoteBls();
  const [ws, setWs] = useState<StandardSessionState>(() => loadStandardSession());
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [viewMode] = useState<ConsoleViewMode>('processing');
  const [followMode, setFollowMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [helper, setHelper] = useState<'none' | 'cognitions' | 'themes'>('none');
  const [cogQuery, setCogQuery] = useState('');
  const [showPhasePicker, setShowPhasePicker] = useState(true);

  const finishSessionHref = linkedClientId
    ? `/clients/${encodeURIComponent(linkedClientId)}/clinical-intelligence?finish=1`
    : '/clients';


  useEffect(() => {
    saveStandardSession(ws);
  }, [ws]);

  const patch = useCallback((partial: Partial<StandardSessionState>) => {
    setWs((prev) => ({ ...prev, ...partial }));
  }, []);

  const blsRunning = bls.state.running && !bls.state.paused;
  const steps = useMemo(() => stepsForPhase(ws), [ws]);

  useEffect(() => {
    setStepIndex(0);
  }, [ws.phase, ws.closureBranch]);

  useGuidedKeyboard({
    enabled: followMode,
    blsRunning,
    onToggleBls: () => {
      if (blsRunning) stopBls();
      else void startBls();
    },
    onNext: () => setStepIndex((i) => Math.min(i + 1, Math.max(0, steps.length - 1))),
    onPrev: () => setStepIndex((i) => Math.max(0, i - 1)),
    onRecord: () => {
      /* focus handled by quick panel */
    },
    onEmergencyStop: emergencyStop,
  });

  const headerModel = {
    protocol: 'Standard EMDR',
    phase: STANDARD_PHASE_LABELS[ws.phase],
    target: ws.target.label || ws.target.image || undefined,
    sud: ws.target.sud,
    voc: ws.target.voc,
    blsSummary: `${bls.state.audioOnly ? 'Auditory' : bls.state.visualEnabled ? 'Visual' : 'Off'} · ${
      bls.state.taxationMode === 'standard' ? 'Standard' : bls.state.taxationMode
    } · ${bls.state.speedHz?.toFixed?.(1) ?? '?'} Hz`,
    setCount: ws.setCount,
  };

  const enterPhase = (phase: StandardPhaseId) => {
    setShowPhasePicker(false);
    patch({ phase });
    if (phase === 'desensitisation') {
      bls.patchState(applyBlsPreset('standardReprocessing', bls.stateRef.current));
    } else if (phase === 'installation') {
      bls.patchState(applyBlsPreset('installation', bls.stateRef.current));
    } else if (phase === 'preparation') {
      bls.patchState(applyBlsPreset('safeCalm', bls.stateRef.current));
    }
  };

  const addTimeline = (note: string) => {
    const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    patch({
      timeline: [
        ...ws.timeline,
        {
          id: `${Date.now()}`,
          at,
          setNumber: ws.setCount || undefined,
          modality: bls.state.audioOnly ? 'auditory' : 'visual',
          mode: bls.state.taxationMode,
          note,
        },
      ],
    });
  };

  if (showPhasePicker) {
    const PHASE_BLURBS: Record<StandardPhaseId, string> = {
      history: 'AIP-informed history, treatment planning and target identification.',
      preparation: 'Consent, dual awareness, stop signal, Safe/Calm and resources.',
      assessment: 'Image, NC/PC, VOC, emotion, SUD and body location.',
      desensitisation: 'Reprocessing with live BLS, response capture and timeline.',
      installation: 'Strengthen the positive cognition with BLS.',
      'body-scan': 'Scan for residual disturbance linked to the target.',
      closure: 'Complete or incomplete session closure scripts.',
      reevaluation: 'Review previous target and choose next clinical step.',
    };
    return (
      <div className="practice-shell">
        <AppHeader activeNav="practice" protocolLabel="Standard EMDR" />
        <main className="practice-main">
          <header className="pf-page-header">
            <p className="pf-breadcrumb">
              <Link to="/practice">Practice</Link>
              <span aria-hidden> › </span>
              Standard EMDR
            </p>
            <h1>Start Guided Standard EMDR</h1>
            <p className="lede">
              Choose where you want to enter the protocol. Completion order is not forced.
            </p>
          </header>
          <div className="pf-phase-rail" aria-hidden>
            {PHASES.map((p, i) => (
              <span key={p}>
                {i + 1}
                {i < PHASES.length - 1 ? ' — ' : ''}
              </span>
            ))}
          </div>
          <div className="pf-phase-grid">
            {PHASES.map((p, i) => (
              <button
                key={p}
                type="button"
                className="pf-phase-card"
                onClick={() => enterPhase(p)}
              >
                <span className="pf-phase-num">{String(i + 1).padStart(2, '0')}</span>
                <h2>{STANDARD_PHASE_LABELS[p].replace(/^\d+\s*—\s*/, '')}</h2>
                <p>{PHASE_BLURBS[p]}</p>
                <span className="pf-card-cta">Start →</span>
              </button>
            ))}
          </div>
          <p>
            <Link to="/practice">← Practice home</Link>
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="companion companion-v3 app-shell guided-practice-page">
      <GuidedPracticeConsole
        viewMode={viewMode}
        navCollapsed={navCollapsed}
        onToggleNav={() => setNavCollapsed((v) => !v)}
        header={
          <>
            <AppHeader
              protocolLabel="Standard EMDR"
              live
              activeNav="practice"
              clientDisplay={clientDisplay}
              onOpenClientPanel={() => setRemotePanelOpen(true)}
              rightSlot={
                <div className="stack-btns horizontal wrap">
                  <Link className="btn secondary pf-header-btn" to={finishSessionHref}>
                    Finish Session
                  </Link>
                  <button
                    type="button"
                    className="btn ghost pf-header-btn"
                    onClick={() => setShowPhasePicker(true)}
                  >
                    Change phase
                  </button>
                </div>
              }
            />
            <SessionStatusStrip
              model={headerModel}
              blsActive={blsRunning}
              onEmergencyStop={emergencyStop}
              alert={
                clientDisplay.clientPressedStop
                  ? 'CLIENT PRESSED STOP'
                  : clientDisplay.banner?.includes('disconnected')
                    ? 'REMOTE CLIENT DISCONNECTED'
                    : null
              }
            />
            <TargetSummaryCard target={ws.target} compact />
          </>
        }
        navigator={
          <nav className="guided-phase-nav" aria-label="EMDR phases">
            <ol>
              {PHASES.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    className={ws.phase === p ? 'is-active' : ''}
                    onClick={() => enterPhase(p)}
                  >
                    {STANDARD_PHASE_LABELS[p]}
                  </button>
                </li>
              ))}
            </ol>
            <div className="stack-btns">
              <button type="button" className="btn ghost" onClick={() => setHelper('themes')}>
                Clinical themes
              </button>
              <button type="button" className="btn ghost" onClick={() => setHelper('cognitions')}>
                NC / PC helper
              </button>
              <Link className="btn ghost" to="/practice/floatback">
                Floatback
              </Link>
              <Link className="btn ghost" to="/practice/safe-calm">
                Safe/Calm
              </Link>
            </div>
          </nav>
        }
        script={
          <TherapistScriptPanel
            title={STANDARD_PHASE_LABELS[ws.phase]}
            sourceLabel={STANDARD_SOURCE_LABEL}
            steps={steps}
            followMode={followMode}
            onFollowModeChange={setFollowMode}
            autoScroll={autoScroll}
            onAutoScrollChange={setAutoScroll}
            stepIndex={stepIndex}
            onStepIndexChange={setStepIndex}
            onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={() => setStepIndex((i) => Math.min(i + 1, steps.length - 1))}
            onRepeat={() => setStepIndex((i) => i)}
            onStartBls={() => void startBls()}
            onStopBls={() => stopBls()}
            blsRunning={blsRunning}
          >
            {ws.phase === 'assessment' && (
              <AssessmentFields
                target={ws.target}
                onChange={(target) => patch({ target: { ...ws.target, ...target } })}
                onBegin={() => enterPhase('desensitisation')}
              />
            )}
            {ws.phase === 'history' && (
              <HistoryFields
                history={ws.history}
                onChange={(history) => patch({ history: { ...ws.history, ...history } })}
                readiness={ws.readinessNotes}
                readinessReviewed={ws.readinessReviewed}
                onReadiness={(readinessNotes, readinessReviewed) =>
                  patch({ readinessNotes, readinessReviewed })
                }
              />
            )}
            {ws.phase === 'desensitisation' && (
              <div className="phase4-tag-row">
                {PHASE4_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      if (tag === 'Stop signal') emergencyStop();
                      addTimeline(tag);
                      if (tag !== 'Stop signal') {
                        patch({ setCount: ws.setCount + (tag === 'New association' || tag === 'Same' || tag === 'Nothing' ? 0 : 0) });
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {ws.phase === 'closure' && (
              <div className="stack-btns horizontal wrap">
                <button
                  type="button"
                  className={`btn${ws.closureBranch === 'complete' ? ' primary' : ''}`}
                  onClick={() => patch({ closureBranch: 'complete' })}
                >
                  Completed Target Session
                </button>
                <button
                  type="button"
                  className={`btn${ws.closureBranch === 'incomplete' ? ' primary' : ''}`}
                  onClick={() => patch({ closureBranch: 'incomplete' })}
                >
                  Incomplete Target Session
                </button>
                <Link className="btn primary" to={finishSessionHref}>
                  Finish Session → Transcript
                </Link>
              </div>
            )}
            {ws.phase === 'reevaluation' && (
              <ReevaluationFields
                target={ws.target}
                onChange={(target) => patch({ target: { ...ws.target, ...target } })}
                onResume={() => enterPhase('desensitisation')}
                onNewTarget={() => {
                  patch({ target: { ...ws.target, label: '', image: '', sud: null, voc: null } });
                  enterPhase('assessment');
                }}
              />
            )}
            {helper === 'cognitions' && (
              <CognitionHelper
                query={cogQuery}
                onQuery={setCogQuery}
                themes={ws.history.clinicalThemes}
                onInsertNc={(nc) => patch({ target: { ...ws.target, nc } })}
                onInsertPc={(pc) => patch({ target: { ...ws.target, pc } })}
                onClose={() => setHelper('none')}
              />
            )}
            {helper === 'themes' && (
              <ThemeHelper
                selected={ws.history.clinicalThemes}
                onChange={(clinicalThemes) =>
                  patch({ history: { ...ws.history, clinicalThemes } })
                }
                onClose={() => setHelper('none')}
              />
            )}
          </TherapistScriptPanel>
        }
        clinicalControls={
          <>
            {showLocalVisual && bls.state.visualEnabled && !bls.state.audioOnly && (
              <BlsStage
                attachCanvas={bls.attachCanvas}
                label="BLS"
                trajectory={bls.state.visualMode}
                lockSize={blsRunning}
              />
            )}
            <LiveBlsPanel
              session={{
                ...bls,
                start: startBls,
                stop: stopBls,
              }}
              recommendedPreset={
                ws.phase === 'installation'
                  ? 'installation'
                  : ws.phase === 'preparation'
                    ? 'safeCalm'
                    : 'standardReprocessing'
              }
              showAdvancedTaxation={ws.phase === 'desensitisation'}
              onEmergencyStop={emergencyStop}
            >
              <div className="pf-bls-remote-summary">
                <p>
                  <strong>Remote client</strong> ·{' '}
                  {clientDisplay.peerStatus === 'connected'
                    ? '● Connected'
                    : clientDisplay.peerStatus === 'waiting'
                      ? '● Waiting'
                      : '○ Not connected'}
                </p>
                <button type="button" className="btn ghost" onClick={() => setRemotePanelOpen(true)}>
                  Client Display
                </button>
              </div>
            </LiveBlsPanel>
            <QuickResponsePanel
              onStopSignal={emergencyStop}
              onSave={({ tags, words, sud }) => {
                addTimeline(
                  `${tags.join(', ')}${words ? ` — "${words}"` : ''}${sud != null ? ` · SUD ${sud}` : ''}`,
                );
                if (sud != null) patch({ target: { ...ws.target, sud } });
                patch({ setCount: ws.setCount + 1 });
              }}
            />
            <ClinicalIntelligencePanel
              consolePhase={ws.phase}
              target={ws.target}
              defaultCollapsed={ws.phase === 'desensitisation'}
              onApplyTargetDraft={(draft) =>
                patch({
                  target: {
                    ...ws.target,
                    ...(draft.label != null ? { label: draft.label } : {}),
                    ...(draft.image != null ? { image: draft.image } : {}),
                    ...(draft.nc != null ? { nc: draft.nc } : {}),
                    ...(draft.pc != null ? { pc: draft.pc } : {}),
                    ...(draft.voc !== undefined ? { voc: draft.voc } : {}),
                    ...(draft.sud !== undefined ? { sud: draft.sud } : {}),
                    ...(draft.emotion != null ? { emotion: draft.emotion } : {}),
                    ...(draft.body != null ? { body: draft.body } : {}),
                  },
                })
              }
            />
          </>
        }
        footer={<ProcessingTimeline entries={ws.timeline} />}
      />
      <RemoteClientPanel
        open={remotePanelOpen}
        onClose={() => setRemotePanelOpen(false)}
        display={clientDisplay}
        state={bls.state}
        onMuteTherapistChange={(muted) => bls.patchState({ muteTherapistAudio: muted })}
        outputMode={outputMode}
        onOutputMode={setOutputMode}
        therapistPreview={therapistPreview}
        onTherapistPreview={setTherapistPreview}
      />
      <ClientDisplayPreviewModal display={clientDisplay} />
    </div>
  );
}

function AssessmentFields({
  target,
  onChange,
  onBegin,
}: {
  target: StandardSessionState['target'];
  onChange: (t: Partial<StandardSessionState['target']>) => void;
  onBegin: () => void;
}) {
  return (
    <div className="guided-capture-grid">
      {(
        [
          ['label', 'Target Memory'],
          ['image', 'Image / worst part'],
          ['nc', 'Negative Cognition'],
          ['pc', 'Positive Cognition'],
          ['emotion', 'Emotion'],
          ['body', 'Body Location'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="field">
          <span>{label}</span>
          <input
            value={(target[key] as string) ?? ''}
            onChange={(e) => onChange({ [key]: e.target.value })}
          />
        </label>
      ))}
      <label className="field">
        <span>VOC 1–7</span>
        <input
          type="number"
          min={1}
          max={7}
          value={target.voc ?? ''}
          onChange={(e) => onChange({ voc: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>SUD 0–10</span>
        <input
          type="number"
          min={0}
          max={10}
          value={target.sud ?? ''}
          onChange={(e) => onChange({ sud: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </label>
      <button type="button" className="btn primary large" onClick={onBegin}>
        Begin Desensitisation
      </button>
    </div>
  );
}

function HistoryFields({
  history,
  onChange,
  readiness,
  readinessReviewed,
  onReadiness,
}: {
  history: StandardSessionState['history'];
  onChange: (h: Partial<StandardSessionState['history']>) => void;
  readiness: string[];
  readinessReviewed: boolean;
  onReadiness: (notes: string[], reviewed: boolean) => void;
}) {
  const fields: Array<[keyof StandardSessionState['history'], string]> = [
    ['presentingComplaint', 'Presenting Complaint'],
    ['recentExample', 'Recent Example'],
    ['presentTriggers', 'Present Triggers'],
    ['memoryMapping', 'Memory Mapping'],
    ['pastExperiences', 'Past Experiences'],
    ['childOnset', 'Child-Onset Experiences'],
    ['adultOnset', 'Adult-Onset Experiences'],
    ['selfIdentity', 'Self Identity / Social Location'],
    ['existingResources', 'Existing Skills & Resources'],
    ['neededResources', 'Needed Resources'],
    ['futureGoals', 'Future Goals'],
    ['potentialTargets', 'Potential Target Memories'],
    ['selectedInitialTarget', 'Selected Initial Target'],
    ['identityCulture', 'Identity / Culture (optional)'],
    ['raceEthnicity', 'Race / Ethnicity (optional)'],
    ['genderSexuality', 'Gender / Sexuality (optional)'],
    ['discrimination', 'Discrimination / Systemic stress (optional)'],
    ['contextualSafety', 'Contextual safety (optional)'],
  ];
  return (
    <div className="guided-capture-grid">
      {fields.map(([key, label]) => (
        <label key={key} className="field">
          <span>{label}</span>
          <textarea
            rows={2}
            value={(history[key] as string) ?? ''}
            onChange={(e) => onChange({ [key]: e.target.value })}
          />
        </label>
      ))}
      <fieldset className="live-bls-fieldset">
        <legend>Reprocessing Readiness — clinical considerations</legend>
        <p className="hint">Support tool only — never an approval gate.</p>
        {READINESS_FLAGS.map((flag) => (
          <label key={flag} className="check-row">
            <input
              type="checkbox"
              checked={readiness.includes(flag)}
              onChange={() => {
                const next = readiness.includes(flag)
                  ? readiness.filter((x) => x !== flag)
                  : [...readiness, flag];
                onReadiness(next, readinessReviewed);
              }}
            />
            <span>{flag}</span>
          </label>
        ))}
        <label className="check-row">
          <input
            type="checkbox"
            checked={readinessReviewed}
            onChange={(e) => onReadiness(readiness, e.target.checked)}
          />
          <span>Clinical considerations reviewed</span>
        </label>
      </fieldset>
    </div>
  );
}

function ReevaluationFields({
  target,
  onChange,
  onResume,
  onNewTarget,
}: {
  target: StandardSessionState['target'];
  onChange: (t: Partial<StandardSessionState['target']>) => void;
  onResume: () => void;
  onNewTarget: () => void;
}) {
  return (
    <div className="guided-capture-grid">
      <p className="hint">Previous target summary is shown above. Capture present status.</p>
      <label className="field">
        <span>Present SUD</span>
        <input
          type="number"
          min={0}
          max={10}
          value={target.sud ?? ''}
          onChange={(e) => onChange({ sud: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>Current VOC</span>
        <input
          type="number"
          min={1}
          max={7}
          value={target.voc ?? ''}
          onChange={(e) => onChange({ voc: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </label>
      <div className="stack-btns horizontal wrap">
        <button type="button" className="btn primary" onClick={onResume}>
          Resume Incomplete Target
        </button>
        <button type="button" className="btn" onClick={onNewTarget}>
          New Target
        </button>
        <Link className="btn ghost" to="/practice/future-template">
          Future Template
        </Link>
      </div>
    </div>
  );
}

function CognitionHelper({
  query,
  onQuery,
  themes,
  onInsertNc,
  onInsertPc,
  onClose,
}: {
  query: string;
  onQuery: (q: string) => void;
  themes: CognitionTheme[];
  onInsertNc: (nc: string) => void;
  onInsertPc: (pc: string) => void;
  onClose: () => void;
}) {
  const results = searchCognitions(query, themes.length ? themes : undefined);
  return (
    <div className="panel helper-panel">
      <header className="panel-head">
        <h3>NC / PC Helper</h3>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </header>
      <p className="hint">Source: {COGNITION_SOURCE}. Practitioner selects — nothing is auto-chosen.</p>
      <label className="field">
        <span>Search</span>
        <input value={query} onChange={(e) => onQuery(e.target.value)} />
      </label>
      <ul className="cognition-list">
        {(results.length ? results : COGNITION_PAIRS).slice(0, 40).map((p) => (
          <li key={`${p.theme}-${p.nc}`}>
            <span className="hint">{COGNITION_THEME_LABELS[p.theme]}</span>
            <div>
              <strong>NC:</strong> {p.nc}
            </div>
            <div>
              <strong>PC:</strong> {p.pc}
            </div>
            <div className="stack-btns horizontal">
              <button type="button" className="btn ghost" onClick={() => onInsertNc(p.nc)}>
                Insert as NC
              </button>
              <button type="button" className="btn ghost" onClick={() => onInsertPc(p.pc)}>
                Insert as PC
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ThemeHelper({
  selected,
  onChange,
  onClose,
}: {
  selected: CognitionTheme[];
  onChange: (t: CognitionTheme[]) => void;
  onClose: () => void;
}) {
  const themes = Object.keys(COGNITION_THEME_LABELS) as CognitionTheme[];
  return (
    <div className="panel helper-panel">
      <header className="panel-head">
        <h3>Clinical Theme Helper</h3>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </header>
      <p className="hint">Allow multiple. Cognition helper opens only on request.</p>
      {themes.map((t) => (
        <label key={t} className="check-row">
          <input
            type="checkbox"
            checked={selected.includes(t)}
            onChange={() =>
              onChange(
                selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t],
              )
            }
          />
          <span>{COGNITION_THEME_LABELS[t]}</span>
        </label>
      ))}
    </div>
  );
}
