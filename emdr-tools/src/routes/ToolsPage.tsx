import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AudioControls } from '../components/AudioControls';
import { BlsStage } from '../components/BlsStage';
import { SetControls } from '../components/SetControls';
import { TransportBar } from '../components/TransportBar';
import { VisualControls } from '../components/VisualControls';
import {
  addCustomPreset,
  allPresets,
  applyPreset,
  deleteCustomPreset,
  type Preset,
} from '../features/presets/presets';
import { RemoteRoomClient } from '../features/remote/RemoteRoomClient';
import { useBlsSession } from '../hooks/useBlsSession';
import type { SessionMode } from '../types/room';

type Tab = 'visual' | 'audio' | 'sets' | 'presets' | 'remote' | 'settings';

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

  useEffect(() => {
    const bc = new BroadcastChannel('pf-emdr-sync');
    bc.onmessage = (ev) => {
      if (ev.data?.type === 'state' && ev.data.state) {
        session.replaceState(ev.data.state);
      }
    };
    bc.postMessage({ type: 'ready' });
    return () => bc.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setExitHint(false), 4000);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="client-shell">
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
      <BlsStage attachCanvas={session.attachCanvas} fullscreen />
    </div>
  );
}

function TherapistConsole() {
  const [tab, setTab] = useState<Tab>('visual');
  const [mode, setMode] = useState<SessionMode>('in-person');
  const [presets, setPresets] = useState<Preset[]>(() => allPresets());
  const [peerStatus, setPeerStatus] = useState<'waiting' | 'connected' | 'disconnected'>('waiting');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('In-person mode — local only');
  const remoteRef = useRef<RemoteRoomClient | null>(null);
  const publishTimer = useRef<number | null>(null);

  const publishRemote = useCallback((partial: Record<string, unknown>, type: 'settings' | 'full') => {
    void type;
    const client = remoteRef.current;
    if (!client || mode !== 'remote') return;
    // handled via session callbacks below
    void partial;
  }, [mode]);

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
        const {
          running: _running,
          paused: _paused,
          sequence,
          ...settings
        } = s;
        void _running;
        void _paused;
        remoteRef.current?.sendCommand({
          type: 'SET_SETTINGS',
          sequence,
          payload: settings,
        });
      }, 60);
    },
  });

  // Wrap transport to also emit remote START/PAUSE/etc.
  const startRemoteAware = useCallback(async () => {
    const seq = await session.start();
    remoteRef.current?.sendCommand({
      type: 'START',
      sequence: seq,
      startAt: Date.now(),
    });
    remoteRef.current?.markLocalRunning(true);
    return seq;
  }, [session]);

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
    return seq;
  }, [session]);

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
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openClientView();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [remoteSession, stopRemoteAware]);

  const openClientView = () => {
    const w = window.open('/tools?clientView=1', 'pf-emdr-client', 'popup=yes,width=1280,height=800');
    if (w) {
      try {
        void w.document.documentElement.requestFullscreen?.();
      } catch {
        /* ignore */
      }
    }
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
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  void publishRemote;

  return (
    <div className="console">
      <header className="console-top">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> EMDR Tools
          </span>
        </Link>
        <div className="top-actions">
          <div className="segmented mode-toggle" role="group" aria-label="Session mode">
            <button
              type="button"
              className={mode === 'in-person' ? 'is-active' : ''}
              onClick={() => {
                if (mode === 'remote') endRemote();
                else setMode('in-person');
              }}
            >
              In-person
            </button>
            <button
              type="button"
              className={mode === 'remote' ? 'is-active' : ''}
              onClick={() => {
                if (mode !== 'remote') void createRemote();
              }}
            >
              Remote
            </button>
          </div>
          <Link className="btn ghost" to="/about">
            About
          </Link>
        </div>
      </header>

      <div className="console-main">
        <nav className="rail" aria-label="Control panels">
          {(
            [
              ['visual', 'Visual'],
              ['audio', 'Audio'],
              ['sets', 'Sets'],
              ['presets', 'Presets'],
              ['remote', 'Remote'],
              ['settings', 'Settings'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'rail-btn is-active' : 'rail-btn'}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <aside className="side-panel">
          {tab === 'visual' && (
            <VisualControls state={session.state} onChange={(p) => session.patchState(p)} />
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
              <p className="hint">Convenience settings — not clinical treatment protocols.</p>
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
                        onClick={() => setPresets([...allPresets().filter((x) => x.builtIn), ...deleteCustomPreset(p.id)])}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  const name = window.prompt('Preset name');
                  if (!name) return;
                  addCustomPreset(name, session.state);
                  setPresets(allPresets());
                }}
              >
                Save current as custom
              </button>
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
                    Create Remote Session
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
                      {copied ? 'Copied' : 'Copy Client Link'}
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
                Keyboard: Space start/pause/resume · Esc stop · F client view. In-person mode does not
                depend on the remote backend.
              </p>
              <p>{statusMsg}</p>
            </div>
          )}
        </aside>

        <section className="stage-wrap">
          <BlsStage attachCanvas={session.attachCanvas} label="BLS stage" />
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
