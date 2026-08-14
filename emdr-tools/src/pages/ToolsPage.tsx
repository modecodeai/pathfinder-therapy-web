import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AudioPanel } from '../components/AudioPanel';
import { SetPanel } from '../components/SetPanel';
import { StimulusStage } from '../components/StimulusStage';
import { TransportBar } from '../components/TransportBar';
import { VisualPanel } from '../components/VisualPanel';
import { useRemoteRoom } from '../hooks/useRemoteRoom';
import { useSessionController } from '../hooks/useSessionController';
import { applyPreset, deletePreset, loadPresets, upsertPreset, type Preset } from '../lib/presets';
import type { SessionMode } from '../lib/types';

type Tab = 'visual' | 'audio' | 'autostop' | 'profiles' | 'settings';

export function ToolsPage() {
  const [tab, setTab] = useState<Tab>('visual');
  const [sessionMode, setSessionMode] = useState<SessionMode>('in-person');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('Local session ready');
  const clientWin = useRef<Window | null>(null);
  const publishTimer = useRef<number | null>(null);

  const remote = useRemoteRoom('therapist');

  const session = useSessionController({
    onSnapshotChange: (snap) => {
      try {
        const bc = new BroadcastChannel('pathfinder-emdr-sync');
        bc.postMessage({ type: 'snapshot', snapshot: snap });
        bc.close();
      } catch {
        /* ignore */
      }
      if (sessionMode !== 'remote') return;
      if (publishTimer.current) window.clearTimeout(publishTimer.current);
      publishTimer.current = window.setTimeout(() => remote.publishState(snap), 80);
    },
  });

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        session.toggleStartPause();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        session.stop();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        void document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session]);

  const openClientView = useCallback(() => {
    const w = window.open('/tools?clientView=1', 'pf-emdr-client', 'popup=yes,width=1280,height=800');
    clientWin.current = w;
  }, []);

  const endRemote = () => {
    remote.disconnect();
    setSessionMode('in-person');
    setStatus('Returned to in-person mode');
  };

  const startRemote = async () => {
    setSessionMode('remote');
    const created = await remote.createRoom(session.snapshot);
    if (created) {
      setStatus(`Remote room ${created.roomId} active`);
    } else {
      setSessionMode('in-person');
      setStatus('Remote create failed — continuing in-person');
    }
  };

  const copyJoin = async () => {
    if (!remote.joinUrl) return;
    await navigator.clipboard.writeText(remote.joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  // Sync incoming? Therapist is source of truth — ignore remote snapshot except peer status
  useEffect(() => {
    if (sessionMode === 'remote') {
      setStatus(
        remote.peerConnected
          ? 'Client connected'
          : remote.connected
            ? 'Waiting for client…'
            : 'Connecting…',
      );
    }
  }, [remote.connected, remote.peerConnected, sessionMode]);

  return (
    <div className="console-shell">
      <header className="console-top">
        <Link to="/" className="brand compact">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">
            <strong>Pathfinder</strong> EMDR Tools
          </span>
        </Link>
        <div className="console-actions">
          <div className="segmented mode-toggle">
            <button
              type="button"
              className={sessionMode === 'in-person' ? 'is-active' : ''}
              onClick={() => {
                if (sessionMode === 'remote') endRemote();
                else setSessionMode('in-person');
              }}
            >
              In-person
            </button>
            <button
              type="button"
              className={sessionMode === 'remote' ? 'is-active' : ''}
              onClick={() => {
                if (sessionMode !== 'remote') void startRemote();
              }}
            >
              Remote
            </button>
          </div>
          {sessionMode === 'remote' && remote.joinUrl && (
            <button type="button" className="btn" onClick={() => void copyJoin()}>
              {copied ? 'Copied' : 'Invite client'}
            </button>
          )}
          {sessionMode === 'remote' && (
            <button type="button" className="btn danger" onClick={endRemote}>
              End remote
            </button>
          )}
          <Link className="btn ghost" to="/about">
            Menu
          </Link>
        </div>
      </header>

      <div className="console-body">
        <aside className="console-rail" aria-label="Panels">
          {(
            [
              ['visual', 'Visual'],
              ['audio', 'Audio'],
              ['autostop', 'Auto stop'],
              ['profiles', 'Profiles'],
              ['settings', 'Settings'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rail-btn ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
              title={label}
            >
              <span className="rail-icon" data-icon={id} />
              <span className="rail-label">{label}</span>
            </button>
          ))}
        </aside>

        <section className="console-panel" aria-live="polite">
          {tab === 'visual' && (
            <VisualPanel
              snapshot={session.snapshot}
              onChange={(visual) => session.patch({ visual })}
            />
          )}
          {tab === 'audio' && (
            <AudioPanel
              snapshot={session.snapshot}
              onChange={(audio) => session.patch({ audio })}
            />
          )}
          {tab === 'autostop' && (
            <SetPanel
              snapshot={session.snapshot}
              onChange={(set) => session.patch({ set })}
            />
          )}
          {tab === 'profiles' && (
            <div className="panel">
              <h2>Presets</h2>
              <p className="hint">Stored only in this browser. No clinical content.</p>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  const name = window.prompt('Preset name');
                  if (!name) return;
                  setPresets(upsertPreset(name, session.snapshot));
                }}
              >
                Save current
              </button>
              <ul className="preset-list">
                {presets.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => session.replaceSnapshot(applyPreset(p, session.snapshot), { preserveRuntime: true })}
                    >
                      {p.name}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setPresets(deletePreset(p.id))}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'settings' && (
            <div className="panel">
              <h2>Settings</h2>
              <p className="hint">
                Keyboard: Space start/pause · Esc stop · F fullscreen. In-person mode keeps working if
                remote backends fail.
              </p>
              <p className="status-line">{status}</p>
              {remote.lastError && <p className="error-line">{remote.lastError}</p>}
              {remote.joinUrl && (
                <p className="mono join-url">
                  Join link: <code>{remote.joinUrl}</code>
                </p>
              )}
            </div>
          )}
        </section>

        <section className="console-stage">
          <StimulusStage attachCanvas={session.attachCanvas} />
          <div className="video-placeholder" aria-hidden>
            <span>Session focus</span>
            <p>No video capture · clinician-controlled BLS only</p>
          </div>
        </section>
      </div>

      <TransportBar
        session={session}
        onFullscreen={() => void document.documentElement.requestFullscreen?.()}
        onClientView={openClientView}
      />
    </div>
  );
}
