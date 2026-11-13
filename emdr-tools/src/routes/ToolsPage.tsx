import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AudioControls } from '../components/AudioControls';
import { BlsStage } from '../components/BlsStage';
import { BlsConfigurationPanel } from '../components/bls/BlsConfigurationPanel';
import { SetControls } from '../components/SetControls';
import { TransportBar } from '../components/TransportBar';
import { VisualControls } from '../components/VisualControls';
import {
  handoffToSession,
  loadTherapistDefault,
  saveTherapistDefault,
} from '../emdr/bls/persistence';
import {
  addCustomPreset,
  allPresets,
  applyPreset,
  deleteCustomPreset,
  type Preset,
} from '../features/presets/presets';
import { RemoteRoomClient } from '../features/remote/RemoteRoomClient';
import { useBlsSession } from '../hooks/useBlsSession';
import { resolveInitialBlsState } from '../emdr/bls/persistence';
import type { SessionMode } from '../types/room';

type Tab = 'visual' | 'audio' | 'sets' | 'presets' | 'remote' | 'settings';

const TAB_META: { id: Tab; label: string; icon: string }[] = [
  { id: 'visual', label: 'Visual', icon: '◎' },
  { id: 'audio', label: 'Audio', icon: '♪' },
  { id: 'sets', label: 'Sets', icon: '▤' },
  { id: 'presets', label: 'Presets', icon: '★' },
  { id: 'remote', label: 'Remote', icon: '↗' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export function ToolsPage() {
  const [params] = useSearchParams();
  if (params.get('clientView') === '1') {
    return <LocalClientView />;
  }
  return <TherapistConsole />;
}

function LocalClientView() {
  const session = useBlsSession({ isClient: true });
  const [exitHint, setExitHint] = useState(true);
  const [connected, setConnected] = useState(false);
  const [interrupted, setInterrupted] = useState(false);

  useEffect(() => {
    const bc = new BroadcastChannel('pf-emdr-sync');
    bc.onmessage = (ev) => {
      if (ev.data?.type === 'state' && ev.data.state) {
        setConnected(true);
        setInterrupted(false);
        session.replaceState(ev.data.state);
      }
    };
    bc.postMessage({ type: 'ready' });
    const onVis = () => {
      /* keep listening */
    };
    window.addEventListener('offline', () => {
      session.stop();
      setInterrupted(true);
      setConnected(false);
    });
    return () => {
      bc.close();
      window.removeEventListener('offline', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setExitHint(false), 4000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="client-shell">
      <div className="client-chrome">
        <div className="client-brand">
          <span className="brand-mark" aria-hidden />
          <span>Pathfinder EMDR</span>
          {connected && !interrupted && <span className="client-conn">Connected to your therapist</span>}
          {interrupted && <span className="client-conn warn">Connection interrupted</span>}
        </div>
        {exitHint && (
          <button
            type="button"
            className="exit-hint"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              window.close();
            }}
          >
            Exit
          </button>
        )}
      </div>
      <BlsStage
        attachCanvas={session.attachCanvas}
        fullscreen
        trajectory={session.state.visualMode}
      />
    </div>
  );
}

function TherapistConsole() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('visual');
  const [mode, setMode] = useState<SessionMode>('in-person');
  const [presets, setPresets] = useState<Preset[]>(() => allPresets());
  const [peerStatus, setPeerStatus] = useState<'waiting' | 'connected' | 'disconnected'>('waiting');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('In-person mode — local only');
  const [testMode, setTestMode] = useState(false);
  const [presetName, setPresetName] = useState('');
  const remoteRef = useRef<RemoteRoomClient | null>(null);
  const publishTimer = useRef<number | null>(null);
  const testSetsBaseline = useRef(0);

  const session = useBlsSession({
    onStateChange: (state) => {
      try {
        const bc = new BroadcastChannel('pf-emdr-sync');
        bc.postMessage({ type: 'state', state });
        bc.close();
      } catch {
        /* ignore */
      }
      if (mode !== 'remote' || !remoteRef.current) return;
      if (publishTimer.current) window.clearTimeout(publishTimer.current);
      publishTimer.current = window.setTimeout(() => {
        const s = session.stateRef.current;
        const { running: _running, paused: _paused, sequence, ...settings } = s;
        void _running;
        void _paused;
        remoteRef.current?.sendCommand({
          type: 'SET_SETTINGS',
          sequence,
          payload: settings,
        });
      }, 60);
    },
    onSetComplete: () => {
      if (testMode) {
        // Test mode: do not treat as clinical set — counters already incremented in engine;
        // we leave metrics but UI labels this as Test.
      }
    },
  });

  // Initialise from therapist default once
  useEffect(() => {
    const initial = resolveInitialBlsState(null);
    const d = loadTherapistDefault();
    session.replaceState(d ?? initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRemoteAware = useCallback(async () => {
    if (testMode) testSetsBaseline.current = session.metrics.sets;
    const seq = await session.start();
    remoteRef.current?.sendCommand({
      type: 'START',
      sequence: seq,
      startAt: Date.now(),
    });
    remoteRef.current?.markLocalRunning(true);
    return seq;
  }, [session, testMode]);

  const pauseRemoteAware = useCallback(() => {
    const seq = session.pause();
    remoteRef.current?.sendCommand({ type: 'PAUSE', sequence: seq });
    remoteRef.current?.markLocalRunning(false);
    return seq;
  }, [session]);

  const resumeRemoteAware = useCallback(async () => {
    const seq = await session.resume();
    remoteRef.current?.sendCommand({
      type: 'RESUME',
      sequence: seq,
      startAt: Date.now(),
    });
    remoteRef.current?.markLocalRunning(true);
    return seq;
  }, [session]);

  const stopRemoteAware = useCallback(() => {
    const seq = session.stop();
    remoteRef.current?.sendCommand({ type: 'STOP', sequence: seq });
    remoteRef.current?.markLocalRunning(false);
    if (testMode) setTestMode(false);
    return seq;
  }, [session, testMode]);

  const remoteSession = useMemo(
    () => ({
      ...session,
      start: startRemoteAware,
      pause: pauseRemoteAware,
      resume: resumeRemoteAware,
      stop: stopRemoteAware,
      toggleSpace: () => {
        const s = session.stateRef.current;
        if (!s.running) void startRemoteAware();
        else if (s.paused) void resumeRemoteAware();
        else pauseRemoteAware();
      },
    }),
    [session, startRemoteAware, pauseRemoteAware, resumeRemoteAware, stopRemoteAware],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        remoteSession.toggleSpace();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopRemoteAware();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        session.patchState({ speed01: Math.min(1, session.state.speed01 + 0.05) });
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        session.patchState({ speed01: Math.max(0, session.state.speed01 - 0.05) });
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openClientView();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [remoteSession, stopRemoteAware, session]);

  const openClientView = () => {
    window.open('/tools?clientView=1', 'pf-emdr-client', 'popup=yes,width=1280,height=800');
  };

  const createRemote = async () => {
    setRemoteError(null);
    const client = new RemoteRoomClient({
      role: 'therapist',
      onRoomState: () => undefined,
      onPeerConnected: () => setPeerStatus('connected'),
      onPeerDisconnected: () => setPeerStatus('disconnected'),
      onSessionEnded: () => {
        setMode('in-person');
        setRoomId(null);
        setJoinUrl(null);
        setStatusMsg('Remote session ended');
        remoteRef.current = null;
      },
      onError: (m) => setRemoteError(m),
      onConnectionChange: (s) => {
        if (s === 'error') setStatusMsg('Remote connection error — in-person still works');
      },
    });
    remoteRef.current = client;
    const created = await client.createRoom(session.stateRef.current);
    if (!created) {
      remoteRef.current = null;
      setMode('in-person');
      setRemoteError('Could not create remote session. Continuing in-person.');
      return;
    }
    setMode('remote');
    setRoomId(created.roomId);
    setJoinUrl(created.joinUrl);
    setPeerStatus('waiting');
    setStatusMsg(`Remote room ${created.roomId}`);
    setTab('remote');
  };

  const endRemote = () => {
    remoteRef.current?.sendCommand({
      type: 'END_SESSION',
      sequence: session.stateRef.current.sequence + 1,
    });
    remoteRef.current?.disconnect();
    remoteRef.current = null;
    setMode('in-person');
    setRoomId(null);
    setJoinUrl(null);
    setPeerStatus('waiting');
    setStatusMsg('Returned to in-person mode');
  };

  const copyLink = async () => {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied('link');
    window.setTimeout(() => setCopied(null), 1500);
  };

  const copyCode = async () => {
    if (!roomId) return;
    await navigator.clipboard.writeText(roomId);
    setCopied('code');
    window.setTimeout(() => setCopied(null), 1500);
  };

  const useInSession = () => {
    handoffToSession(session.state);
    navigate('/session?fromStudio=1');
  };

  return (
    <div className="console studio-v3 app-shell">
      <header className="console-top">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> BLS Studio
          </span>
        </Link>
        <div className="top-actions">
          <button type="button" className="btn" onClick={useInSession}>
            Use this setup in EMDR Session
          </button>
          <Link className="btn ghost" to="/session">
            Session
          </Link>
          <Link className="btn ghost" to="/account">
            Account
          </Link>
        </div>
      </header>

      <div className="console-main studio-layout">
        <nav className="rail rail-wide" aria-label="Control panels">
          {TAB_META.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'rail-btn is-active' : 'rail-btn'}
              onClick={() => setTab(t.id)}
            >
              <span className="rail-icon" aria-hidden>
                {t.icon}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <aside className="side-panel side-wide">
          {tab === 'visual' && (
            <VisualControls
              state={session.state}
              onChange={(p) => session.patchState(p)}
              running={session.state.running && !session.state.paused}
            />
          )}
          {tab === 'audio' && (
            <AudioControls state={session.state} onChange={(p) => session.patchState(p)} />
          )}
          {tab === 'sets' && (
            <SetControls state={session.state} onChange={(p) => session.patchState(p)} />
          )}
          {tab === 'presets' && (
            <div className="panel">
              <h2>Presets</h2>
              <p className="hint">Therapist convenience settings — not clinical protocols.</p>
              <ul className="preset-list">
                {presets.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => session.replaceState(applyPreset(p, session.state))}
                    >
                      {p.name}
                    </button>
                    {!p.builtIn && (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => {
                          deleteCustomPreset(p.id);
                          setPresets(allPresets());
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <label className="field">
                <span>Save current</span>
                <input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="My Standard Visual"
                />
              </label>
              <div className="stack-btns">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    const name = presetName.trim() || window.prompt('Preset name') || '';
                    if (!name) return;
                    addCustomPreset(name, session.state);
                    setPresets(allPresets());
                    setPresetName('');
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    saveTherapistDefault(session.state);
                    setStatusMsg('Saved as your default BLS setup');
                  }}
                >
                  Save as my default
                </button>
              </div>
            </div>
          )}
          {tab === 'remote' && (
            <div className="panel">
              <h2>Remote</h2>
              {mode !== 'remote' ? (
                <>
                  <p className="hint">
                    Create a temporary room and share the client link. Use your usual video platform
                    for conversation — this app handles BLS only.
                  </p>
                  <button type="button" className="btn primary" onClick={() => void createRemote()}>
                    Start remote session
                  </button>
                </>
              ) : (
                <>
                  <p className="room-id">
                    Room <strong>{roomId}</strong>
                  </p>
                  <p className="peer-status">
                    Client{' '}
                    {peerStatus === 'connected' ? (
                      <span className="ok">● Connected</span>
                    ) : peerStatus === 'disconnected' ? (
                      <span>○ Disconnected</span>
                    ) : (
                      <span>○ Waiting for client</span>
                    )}
                  </p>
                  <div className="stack-btns">
                    <button type="button" className="btn primary" onClick={() => void copyLink()}>
                      {copied === 'link' ? 'Copied' : 'Copy invitation link'}
                    </button>
                    <button type="button" className="btn" onClick={() => void copyCode()}>
                      {copied === 'code' ? 'Copied' : 'Copy room code'}
                    </button>
                    <button type="button" className="btn danger" onClick={endRemote}>
                      End Session
                    </button>
                  </div>
                  {joinUrl && (
                    <p className="mono">
                      <code>{joinUrl}</code>
                    </p>
                  )}
                </>
              )}
              {remoteError && <p className="error">{remoteError}</p>}
            </div>
          )}
          {tab === 'settings' && (
            <div className="panel">
              <h2>Settings</h2>
              <p className="hint">
                Space start/pause · Esc stop · ↑↓ speed · F client view. In-person mode does not
                depend on the remote backend.
              </p>
              <p>{statusMsg}</p>
              <BlsConfigurationPanel
                state={session.state}
                onChange={(p) => session.patchState(p)}
                section="all"
                running={session.state.running && !session.state.paused}
                compact
              />
            </div>
          )}
        </aside>

        <section className="stage-wrap">
          {testMode && (
            <div className="banner soft test-banner" role="status">
              Test BLS — not a clinical processing set
            </div>
          )}
          <BlsStage
            attachCanvas={session.attachCanvas}
            label="BLS stage"
            trajectory={session.state.visualMode}
            lockSize={session.state.running && !session.state.paused}
          />
          <div className="stage-actions">
            <button
              type="button"
              className={`btn ${testMode ? 'primary' : ''}`}
              onClick={() => {
                setTestMode(true);
                void startRemoteAware();
              }}
            >
              Test BLS
            </button>
            <button type="button" className="btn ghost" onClick={openClientView}>
              Client Preview
            </button>
          </div>
        </section>
      </div>

      <TransportBar
        session={remoteSession}
        onClientView={openClientView}
        onFullscreen={() => void document.documentElement.requestFullscreen?.()}
      />
    </div>
  );
}
