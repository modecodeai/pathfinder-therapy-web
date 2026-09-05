import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BlsStage } from '../../../components/BlsStage';
import type { BlsSession } from '../../../hooks/useBlsSession';
import {
  IconArrowRight,
  IconBook,
  IconPain,
  IconPhases,
  IconPlus,
  IconShield,
  IconTarget,
} from '../../../components/icons';
import { listClients } from '../../../clinical-intelligence/lib/api';
import { useAuth } from '../../../hooks/useAuth';
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
import { GuidedPracticeConsole } from '../../guided/components/GuidedPracticeConsole';
import { LiveBlsPanel } from '../../guided/components/LiveBlsPanel';
import { QuickResponsePanel } from '../../guided/components/QuickResponsePanel';
import { AppHeader } from '../../guided/components/AppHeader';
import { SessionStatusStrip } from '../../guided/components/SessionStatusStrip';
import { RemoteClientPanel } from '../../guided/components/RemoteClientPanel';
import { TherapistScriptPanel } from '../../guided/components/TherapistScriptPanel';
import { useGuidedKeyboard } from '../../guided/hooks/useGuidedKeyboard';
import { useGuidedRemoteBls } from '../../guided/hooks/useGuidedRemoteBls';
import { parsePlainScriptToSteps } from '../../guided/lib/parseScriptSteps';
import { ClientDisplayPreviewModal } from '../ClientDisplayPanel';
import { PainProtocolNavigator } from './PainProtocolNavigator';

const PROTOCOL_TITLE = 'Mark Grant EMDR Pain Protocol';

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
  const auth = useAuth();
  const [ws, setWs] = useState<PainWorkspaceState>(() => loadPainWorkspace());
  const [aipExpanded, setAipExpanded] = useState(false);
  const [wmtDismissed, setWmtDismissed] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [timelineNotes, setTimelineNotes] = useState<string[]>([]);
  const [pendingVariant, setPendingVariant] = useState<string | null>(null);
  /** Treatment Selection → Client → Session choice (never show clinical data before context) */
  const [flowStep, setFlowStep] = useState<'treatment' | 'client' | 'session'>('treatment');
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<{ id: string; displayName: string } | null>(
    null,
  );
  const [clientOptions, setClientOptions] = useState<
    Array<{ id: string; displayName: string }>
  >([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const mountedRef = useRef(false);

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

  const blsForControls: BlsSession = useMemo(
    () => ({
      ...bls,
      start: async () => {
        bls.patchState(grantPainDefaultPatch(bls.stateRef.current));
        return startBls();
      },
      stop: () => stopBls(),
    }),
    [bls, startBls, stopBls],
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
      if (stage === 'dashboard') {
        setFlowStep('treatment');
        setSelectedClient(null);
        setPendingVariant(null);
      }
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

  const startProtocol = useCallback(
    (opts?: { clientId?: string; clientName?: string; variant?: string }) => {
      applyPainDefault();
      const variant = opts?.variant ?? pendingVariant ?? ws.protocolVariant;
      patchWs((prev) => {
        const assessment = { ...prev.assessment };
        if (variant === 'present-pain') assessment.targetType = 'present-pain';
        if (variant === 'trauma-related' || variant === 'standard') {
          assessment.targetType = assessment.targetType ?? 'traumatic-pain';
        }
        if (variant === 'trauma-related') assessment.targetType = 'traumatic-pain';
        return {
          ...prev,
          stage: 'orientation',
          orientationComplete: false,
          linkedClientId: opts?.clientId ?? prev.linkedClientId,
          linkedClientName: opts?.clientName ?? prev.linkedClientName,
          protocolVariant: variant ?? prev.protocolVariant,
          assessment,
        };
      });
      setPendingVariant(null);
      setFlowStep('treatment');
      setSelectedClient(null);
    },
    [applyPainDefault, patchWs, pendingVariant, ws.protocolVariant],
  );

  const continueSession = useCallback(
    (opts?: { clientId?: string; clientName?: string }) => {
      patchWs((prev) => ({
        ...prev,
        linkedClientId: opts?.clientId ?? prev.linkedClientId,
        linkedClientName: opts?.clientName ?? prev.linkedClientName,
        stage: prev.stage === 'dashboard' ? firstOpenStage(prev) : prev.stage,
      }));
      setFlowStep('treatment');
      setSelectedClient(null);
    },
    [patchWs],
  );

  const hasExistingSession =
    ws.completedStages.length > 0 ||
    Boolean(ws.assessment.targetDescription || ws.assessment.painImageMetaphor) ||
    ws.orientationComplete;

  const beginTreatmentSelection = useCallback((variant?: string) => {
    if (variant) setPendingVariant(variant);
    else setPendingVariant((v) => v ?? 'standard');
    setFlowStep('client');
    setSelectedClient(null);
    setClientQuery('');
  }, []);

  useEffect(() => {
    if (flowStep !== 'client' && flowStep !== 'session') return;
    if (!auth.isAuthenticated) return;
    setPickerError(null);
    void listClients()
      .then((rows) =>
        setClientOptions(
          rows
            .filter((c) => (c.status ?? 'active') !== 'archived')
            .map((c) => ({ id: c.id, displayName: c.displayName })),
        ),
      )
      .catch(() => setPickerError('Could not load clients. Sign in and try again.'));
  }, [flowStep, auth.isAuthenticated]);

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

  const RESOURCE_STAGES: PainProtocolStage[] = [
    'dashboard',
    'help',
    'overview',
    'script-full',
    'script-short',
  ];
  const isResourceStage = RESOURCE_STAGES.includes(ws.stage);

  // Gate clinical session stages: require linked client
  const goStageGuarded = useCallback(
    (stage: PainProtocolStage) => {
      const resource: PainProtocolStage[] = [
        'dashboard',
        'help',
        'overview',
        'script-full',
        'script-short',
      ];
      if (!resource.includes(stage) && !ws.linkedClientId) {
        setPendingVariant(ws.protocolVariant ?? 'standard');
        setFlowStep('client');
        return;
      }
      goStage(stage);
    },
    [goStage, ws.linkedClientId, ws.protocolVariant],
  );

  const inProcessing = PROCESSING_STAGES.includes(ws.stage);
  const showVisual = bls.state.visualEnabled && !bls.state.audioOnly && showLocalVisual;
  const blsRunning = bls.state.running && !bls.state.paused;
  const showLiveBls =
    ws.stage !== 'dashboard' &&
    ws.stage !== 'help' &&
    ws.stage !== 'script-full' &&
    ws.stage !== 'script-short';

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

  const scriptSteps = useMemo(() => {
    if (!currentScript?.script) return [];
    return parsePlainScriptToSteps(currentScript.script, {
      protocol: 'emdr-pain',
      phase: ws.stage,
      section: currentScript.id,
      idPrefix: currentScript.id,
      source: {
        author: 'Mark Grant',
        title: currentScript.source || 'EMDR Pain Protocol',
      },
    });
  }, [currentScript, ws.stage]);

  useEffect(() => {
    setStepIndex(0);
  }, [ws.stage, currentScript?.id]);

  useGuidedKeyboard({
    enabled: followMode && ws.stage !== 'dashboard',
    blsRunning,
    onToggleBls: () => {
      if (blsRunning) stopBls();
      else void blsForControls.start();
    },
    onNext: () => setStepIndex((i) => Math.min(i + 1, Math.max(0, scriptSteps.length - 1))),
    onPrev: () => setStepIndex((i) => Math.max(0, i - 1)),
    onEmergencyStop: emergencyStop,
  });

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

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clientOptions;
    return clientOptions.filter((c) => c.displayName.toLowerCase().includes(q));
  }, [clientOptions, clientQuery]);

  const variantLabel = (id: string | null | undefined) => {
    switch (id) {
      case 'present-pain':
        return 'Present Pain Target';
      case 'trauma-related':
        return 'Trauma-related Pain';
      case 'phantom-limb':
        return 'Phantom Limb Pain';
      case 'residual-limb':
        return 'Residual Limb Pain';
      case 'somatic':
        return 'Somatic Pain';
      default:
        return 'Standard Pain Protocol';
    }
  };

  const renderDashboard = () => {
    if (flowStep === 'client') {
      return (
        <div className="pain-flow pain-flow-client">
          <button type="button" className="btn tertiary" onClick={() => setFlowStep('treatment')}>
            ← Back to treatment selection
          </button>
          <header className="pf-page-hero">
            <div>
              <p className="pf-eyebrow">Step 2 of 3</p>
              <h1 className="pf-title">Who are you working with today?</h1>
              <p className="pf-subtitle">
                Context before data — choose the client before any session measures appear.
                {pendingVariant ? ` Treatment: ${variantLabel(pendingVariant)}.` : ''}
              </p>
            </div>
          </header>
          {!auth.isAuthenticated ? (
            <div className="pf-surface-card pf-empty">
              <p>Sign in to select a clinical client record.</p>
              <Link className="btn primary" to="/account">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <label className="field">
                <span>Search</span>
                <input
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  placeholder="Search clients…"
                  autoFocus
                />
              </label>
              {pickerError && <p className="ci-error-banner">{pickerError}</p>}
              <ul className="pf-recent-list pain-client-list">
                {filteredClients.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="pain-client-pick"
                      onClick={() => {
                        setSelectedClient(c);
                        setFlowStep('session');
                      }}
                    >
                      <span className="pf-recent-name">{c.displayName}</span>
                      <span className="pf-text-link">
                        Select <IconArrowRight size={14} />
                      </span>
                    </button>
                  </li>
                ))}
                {!filteredClients.length && (
                  <li className="pf-meta" style={{ padding: '12px 0' }}>
                    No matching clients.
                  </li>
                )}
              </ul>
              <Link className="btn secondary" to="/clients">
                <IconPlus /> New Client
              </Link>
            </>
          )}
        </div>
      );
    }

    if (flowStep === 'session' && selectedClient) {
      return (
        <div className="pain-flow pain-flow-session">
          <button type="button" className="btn tertiary" onClick={() => setFlowStep('client')}>
            ← Change client
          </button>
          <header className="pf-page-hero">
            <div>
              <p className="pf-eyebrow">Step 3 of 3</p>
              <h1 className="pf-title">{selectedClient.displayName}</h1>
              <p className="pf-subtitle">
                {variantLabel(pendingVariant)} · Choose how to continue this treatment.
              </p>
            </div>
          </header>
          <div className="pain-session-choice">
            {hasExistingSession && (
              <button
                type="button"
                className="pf-surface-card pain-choice-card"
                onClick={() =>
                  continueSession({
                    clientId: selectedClient.id,
                    clientName: selectedClient.displayName,
                  })
                }
              >
                <h2 className="pf-card-title">Continue previous session</h2>
                <p className="pf-meta">
                  Resume at {PAIN_STAGE_LABELS[firstOpenStage(ws)]}.
                </p>
                <span className="pf-text-link">
                  Continue <IconArrowRight size={16} />
                </span>
              </button>
            )}
            <button
              type="button"
              className="pf-surface-card pain-choice-card is-primary-choice"
              onClick={() =>
                startProtocol({
                  clientId: selectedClient.id,
                  clientName: selectedClient.displayName,
                  variant: pendingVariant ?? 'standard',
                })
              }
            >
              <h2 className="pf-card-title">Start new pain session</h2>
              <p className="pf-meta">Begin from orientation with Grant Pain Default BLS.</p>
              <span className="pf-text-link">
                Begin <IconArrowRight size={16} />
              </span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="pain-flow pain-treatment-selection">
        <header className="pf-page-hero">
          <div>
            <p className="pf-eyebrow">Treatment selection</p>
            <h1 className="pf-title">EMDR Pain</h1>
            <p className="pf-subtitle">
              Mark Grant–informed treatment workflows for chronic pain, phantom limb pain and
              trauma-related pain.
            </p>
          </div>
        </header>

        <section className="pf-surface-card pain-brief">
          <div className="pain-brief-block">
            <h2 className="pf-card-title">What is this?</h2>
            <p>
              A guided Mark Grant EMDR Pain Protocol workspace for describing, targeting and
              processing pain with bilateral stimulation, antidote imagery and imaginal healing —
              without replacing medical care.
            </p>
          </div>
          <div className="pain-brief-block">
            <h2 className="pf-card-title">When should I use it?</h2>
            <p>
              Use when pain is the clinical focus: chronic or present pain, trauma-linked pain,
              phantom or residual limb pain, or somatic pain presentations where EMDR pain protocols
              are clinically indicated and medically appropriate.
            </p>
          </div>
          <button
            type="button"
            className="btn primary pain-start-treatment"
            onClick={() => beginTreatmentSelection('standard')}
          >
            <IconPlus /> Start treatment
          </button>
        </section>

        <section className="pain-landing-section" aria-label="How to work">
          <h2 className="pf-section-title">Choose how you want to work</h2>
          <div className="pain-how-grid">
            <button
              type="button"
              className="pf-surface-card pain-choice-card"
              onClick={() => beginTreatmentSelection('standard')}
            >
              <h3 className="pf-card-title">Start New Session</h3>
              <p className="pf-meta">Select a client, then begin a new pain protocol session.</p>
            </button>
            <button
              type="button"
              className="pf-surface-card pain-choice-card"
              onClick={() => beginTreatmentSelection(ws.protocolVariant ?? 'standard')}
            >
              <h3 className="pf-card-title">Continue Session</h3>
              <p className="pf-meta">
                {hasExistingSession
                  ? 'Pick the client and resume where you left off.'
                  : 'No in-progress session yet — you can still start fresh after choosing a client.'}
              </p>
            </button>
          </div>
        </section>

        <section className="pain-landing-section">
          <h2 className="pf-section-title">Treatment protocols</h2>
          <div className="pain-protocol-grid">
            {(
              [
                {
                  id: 'standard',
                  title: 'Standard Pain',
                  sub: 'Eight-phase Grant pain workflow',
                  Icon: IconPhases,
                },
                {
                  id: 'present-pain',
                  title: 'Present Pain',
                  sub: 'Present-moment sensory targeting',
                  Icon: IconPain,
                },
                {
                  id: 'trauma-related',
                  title: 'Trauma-related Pain',
                  sub: 'Pain linked to traumatic memory',
                  Icon: IconShield,
                },
                {
                  id: 'phantom-limb',
                  title: 'Phantom Limb',
                  sub: 'Grant variation for phantom limb',
                  Icon: IconTarget,
                },
                {
                  id: 'residual-limb',
                  title: 'Residual Limb',
                  sub: 'Grant variation for residual limb',
                  Icon: IconTarget,
                },
                {
                  id: 'somatic',
                  title: 'Somatic Pain',
                  sub: 'Somatic / body-focused framing',
                  Icon: IconPain,
                },
              ] as const
            ).map(({ id, title, sub, Icon }) => (
              <button
                key={id}
                type="button"
                className="pf-protocol-card pain-template-card"
                onClick={() => beginTreatmentSelection(id)}
              >
                <span className="pf-protocol-icon" aria-hidden>
                  <Icon />
                </span>
                <span className="pf-protocol-copy">
                  <span className="pf-protocol-title">{title}</span>
                  <span className="pf-protocol-sub">{sub}</span>
                </span>
                <span className="pf-protocol-open">
                  Select <IconArrowRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="pain-landing-section">
          <h2 className="pf-section-title">Knowledge</h2>
          <div className="pain-resource-grid">
            <button type="button" className="pf-surface-card pain-resource-card" onClick={() => goStage('overview')}>
              <IconBook size={22} />
              <span>
                <strong>Protocol Reference</strong>
                <span className="pf-meta">Structure and phase overview</span>
              </span>
            </button>
            <button type="button" className="pf-surface-card pain-resource-card" onClick={() => goStage('overview')}>
              <IconBook size={22} />
              <span>
                <strong>Clinical Guidance</strong>
                <span className="pf-meta">Integrative approach and safety</span>
              </span>
            </button>
            <button type="button" className="pf-surface-card pain-resource-card" onClick={() => goStage('script-full')}>
              <IconBook size={22} />
              <span>
                <strong>Scripts</strong>
                <span className="pf-meta">Full and short protocol scripts</span>
              </span>
            </button>
            <button type="button" className="pf-surface-card pain-resource-card" onClick={() => goStage('help')}>
              <IconPhases size={22} />
              <span>
                <strong>Variations</strong>
                <span className="pf-meta">Present pain, phantom limb and more</span>
              </span>
            </button>
            <button type="button" className="pf-surface-card pain-resource-card" onClick={() => goStage('help')}>
              <IconPain size={22} />
              <span>
                <strong>Antidote Imagery</strong>
                <span className="pf-meta">Antidote installation resources</span>
              </span>
            </button>
            <button type="button" className="pf-surface-card pain-resource-card" onClick={() => goStage('help')}>
              <IconShield size={22} />
              <span>
                <strong>Healing Imagery</strong>
                <span className="pf-meta">Imaginal healing scripts</span>
              </span>
            </button>
          </div>
        </section>

        <p className="pf-meta pain-landing-note">
          Medical safety: EMDR pain work does not replace appropriate medical assessment. Stop BLS if
          pain becomes intolerable.
        </p>
      </div>
    );
  };

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
    <div
      className={`companion companion-v3 app-shell pain-protocol-page guided-practice-page${
        ws.stage === 'dashboard' ? ' pain-treatment-shell' : ''
      }`}
    >
      {isResourceStage ? (
        <>
          <AppHeader protocolLabel="EMDR Pain" activeNav="protocols" />
          {ws.stage !== 'dashboard' && (
            <div className="pain-resource-bar">
              <button type="button" className="btn tertiary" onClick={() => goStage('dashboard')}>
                ← Back to EMDR Pain
              </button>
            </div>
          )}
          <main className={ws.stage === 'dashboard' ? 'practice-main pain-dashboard-main' : 'pain-dashboard-main'}>
            {renderStageContent()}
          </main>
        </>
      ) : (
        <GuidedPracticeConsole
          viewMode="processing"
          navCollapsed={navCollapsed}
          onToggleNav={() => setNavCollapsed((v) => !v)}
          header={
            <>
              <AppHeader
                protocolLabel="EMDR Pain"
                live
                activeNav="protocols"
                clientDisplay={clientDisplay}
                onOpenClientPanel={() => setRemotePanelOpen(true)}
                rightSlot={
                  <button type="button" className="btn tertiary pf-header-btn" onClick={() => goStage('dashboard')}>
                    Exit to protocols
                  </button>
                }
              />
              {/* Session metrics only after a client is linked */}
              {ws.linkedClientId ? (
                <SessionStatusStrip
                  model={{
                    protocol: ws.linkedClientName
                      ? `${ws.linkedClientName} · Pain Protocol`
                      : 'Pain Protocol',
                    phase: PAIN_STAGE_LABELS[ws.stage] ?? ws.stage,
                    target:
                      ws.assessment.targetDescription || ws.assessment.painImageMetaphor || undefined,
                    sud: ws.assessment.currentSud ?? ws.assessment.baselineSud,
                    blsSummary: `${
                      bls.state.audioOnly ? 'Auditory' : bls.state.visualEnabled ? 'Visual' : 'Off'
                    }${bls.state.continuous || bls.state.setMode === 'continuous' ? ' Continuous' : ''}`,
                    elapsedLabel: bls.formatTime(bls.metrics.timeMs),
                    extra: [
                      {
                        label: 'VoC',
                        value:
                          ws.assessment.voc != null ? String(ws.assessment.voc) : '—',
                      },
                    ],
                  }}
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
              ) : null}
              <div className="banner notice medical-safety-note pf-safety-compact" role="note">
                Medical safety: Stop BLS if pain becomes intolerable. This app does not diagnose pain
                origin.
              </div>
            </>
          }
          navigator={
            <>
              <PainProtocolNavigator
                stage={ws.stage}
                completed={ws.completedStages}
                onSelect={goStageGuarded}
              />
              <div className="stack-btns">
                <button type="button" className="btn tertiary" onClick={() => goStage('dashboard')}>
                  Protocol home
                </button>
                <button type="button" className="btn tertiary" onClick={() => goStage('overview')}>
                  Overview
                </button>
                <button type="button" className="btn tertiary" onClick={() => goStage('script-full')}>
                  Full scripts
                </button>
              </div>
            </>
          }
          script={
            <TherapistScriptPanel
              title={currentScript?.title ?? PAIN_STAGE_LABELS[ws.stage] ?? 'Therapist Script'}
              sourceLabel={currentScript?.source ?? PROTOCOL_TITLE}
              steps={scriptSteps}
              plainText={!scriptSteps.length ? currentScript?.script : undefined}
              followMode={followMode}
              onFollowModeChange={setFollowMode}
              autoScroll={autoScroll}
              onAutoScrollChange={setAutoScroll}
              stepIndex={stepIndex}
              onStepIndexChange={setStepIndex}
              onPrev={
                scriptPrev
                  ? () => {
                      if (stepIndex > 0) setStepIndex((i) => i - 1);
                      else goStageGuarded(scriptPrev);
                    }
                  : () => setStepIndex((i) => Math.max(0, i - 1))
              }
              onNext={
                scriptNext
                  ? () => {
                      if (stepIndex < scriptSteps.length - 1) setStepIndex((i) => i + 1);
                      else goStageGuarded(scriptNext);
                    }
                  : () => setStepIndex((i) => Math.min(i + 1, scriptSteps.length - 1))
              }
              onRepeat={() => setStepIndex((i) => i)}
              onStartBls={() => void blsForControls.start()}
              onStopBls={() => bls.stop()}
              blsRunning={blsRunning}
              toolbarExtra={
                <button
                  type="button"
                  className="btn tertiary"
                  onClick={() =>
                    patchWs({
                      pinnedScriptId: ws.pinnedScriptId ? null : (currentScript?.id ?? null),
                    })
                  }
                >
                  {ws.pinnedScriptId ? 'Unpin Script' : 'Pin Script'}
                </button>
              }
            >
              <div className="pain-stage-inline">{renderStageContent()}</div>
            </TherapistScriptPanel>
          }
          clinicalControls={
            <>
              {showLiveBls && showVisual && (
                <BlsStage
                  attachCanvas={bls.attachCanvas}
                  label="Pain BLS"
                  trajectory={bls.state.visualMode}
                  lockSize={blsRunning}
                />
              )}
              {showLiveBls && !showVisual && (
                <div className="panel pain-audio-only-stage">
                  <p>
                    {blsRunning ? '● Auditory BLS ACTIVE' : '○ BLS STOPPED'} ·{' '}
                    {bls.formatTime(bls.metrics.timeMs)}
                  </p>
                  <p className="hint">Visual stage hidden while audio-only (Grant Pain Default).</p>
                </div>
              )}
              {showLiveBls && (
                <LiveBlsPanel
                  session={blsForControls}
                  recommendedPreset="grantPainAuditory"
                  presetOptions={[
                    'grantPainAuditory',
                    'painVisual',
                    'painInstallation',
                    'standardReprocessing',
                  ]}
                  showAdvancedTaxation={inProcessing}
                  onEmergencyStop={emergencyStop}
                  title="Pain BLS"
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
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setRemotePanelOpen(true)}
                    >
                      Client Display
                    </button>
                  </div>
                  {showWmtWarning && (
                    <div className="taxation-advisory" role="status">
                      <p>
                        <strong>Clinical check</strong> — Advanced visual working-memory taxation is
                        not part of the core Mark Grant Pain Protocol supplied here. Continue only
                        with clinical judgement.
                      </p>
                      <div className="stack-btns horizontal">
                        <button type="button" className="btn" onClick={() => setWmtDismissed(true)}>
                          Continue
                        </button>
                        <button type="button" className="btn primary" onClick={returnPainDefault}>
                          Return to Pain Default
                        </button>
                      </div>
                    </div>
                  )}
                </LiveBlsPanel>
              )}
              <QuickResponsePanel
                title="What changed?"
                onStopSignal={emergencyStop}
                onSave={({ tags, words, sud }) => {
                  setTimelineNotes((prev) => [
                    ...prev,
                    `${tags.join(', ')}${words ? `: ${words}` : ''}${sud != null ? ` · SUD ${sud}` : ''}`,
                  ]);
                  if (sud != null) updateSud(sud);
                  if (words) setStageNote(ws.stage, `${ws.stageNotes[ws.stage] ?? ''}\n${words}`.trim());
                }}
              />
              {timelineNotes.length > 0 && (
                <ul className="hint-list">
                  {timelineNotes.slice(-6).map((n) => (
                    <li key={n}>
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </>
          }
          footer={
            <div className="guided-footer-record panel">
              <label className="field">
                <span>Session note / current response</span>
                <textarea
                  rows={2}
                  value={ws.stageNotes[ws.stage] ?? ''}
                  onChange={(e) => setStageNote(ws.stage, e.target.value)}
                />
              </label>
              <div className="stack-btns horizontal wrap">
                <button type="button" className="btn" onClick={handleCheckIn}>
                  Check-in (keep BLS) · {checkInCount}
                </button>
                <button type="button" className="btn primary" onClick={() => completeStage(ws.stage)}>
                  Mark stage complete
                </button>
                {scriptNext && (
                  <button type="button" className="btn" onClick={() => goStage(scriptNext)}>
                    Next stage
                  </button>
                )}
              </div>
            </div>
          }
        />
      )}
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
