import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlsStage } from '../../components/BlsStage';
import { RemoteRoomClient } from '../../features/remote/RemoteRoomClient';
import { useBlsSession } from '../../hooks/useBlsSession';

type Phase = 'intro' | 'live' | 'ended' | 'missing';

interface ClientDisplayViewProps {
  roomId: string;
  /** Therapist-opened second-monitor window — streamlined join */
  displayMode?: boolean;
}

function notifyOpener(payload: Record<string, unknown>) {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'pf-client-display', ...payload }, location.origin);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Full-screen client BLS renderer.
 * Receives RoomState only — never clinical notes / target / SUD / VOC.
 */
export function ClientDisplayView({ roomId, displayMode = false }: ClientDisplayViewProps) {
  const [phase, setPhase] = useState<Phase>(roomId ? 'intro' : 'missing');
  const [status, setStatus] = useState('Ready to join');
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [audioOk, setAudioOk] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const remoteRef = useRef<RemoteRoomClient | null>(null);
  const session = useBlsSession({ isClient: true });
  const running = session.state.running && !session.state.paused;
  const waitingNeutral = phase === 'live' && !session.state.running;

  useEffect(() => {
    if (!roomId) setPhase('missing');
  }, [roomId]);

  useEffect(() => {
    return () => remoteRef.current?.disconnect();
  }, []);

  useEffect(() => {
    document.title = 'Pathfinder Clinical';
  }, []);

  useEffect(() => {
    const onFs = () => {
      const on = !!document.fullscreenElement;
      setFullscreen(on);
      notifyOpener({ fullscreen: on });
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    if (phase === 'live') {
      session.patchState({ audioVolume: volume });
    }
  }, [volume, phase, session]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* browser may block */
    }
  };

  const playTestTone = async (side: 'L' | 'R') => {
    await session.ensureAudio();
    // Brief non-clinical tone via temporary audio-only pulse (does not start set)
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    osc.frequency.value = 520;
    gain.gain.value = Math.min(0.35, volume);
    pan.pan.value = side === 'L' ? -1 : 1;
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    window.setTimeout(() => void ctx.close(), 400);
  };

  const join = async () => {
    if (!roomId) return;
    setError(null);
    await session.ensureAudio();
    setPhase('live');
    setStatus('Connecting…');

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
      if (res.status === 410 || res.status === 404) {
        setPhase('ended');
        setStatus('Session ended.');
        return;
      }
    } catch {
      /* continue */
    }

    const client = new RemoteRoomClient({
      role: 'client',
      onRoomState: (state) => {
        session.replaceState({ ...state, audioVolume: volume });
        remoteRef.current?.markLocalRunning(state.running && !state.paused);
      },
      onSessionEnded: () => {
        session.emergencyStop();
        setPhase('ended');
        setStatus('Session ended.');
        notifyOpener({ ended: true });
      },
      onError: (m) => setError(m),
      onConnectionChange: (s) => {
        if (s === 'connected') setStatus('Connected to your therapist');
        else if (s === 'reconnecting') {
          session.emergencyStop();
          setStatus('Connection interrupted — stimulation stopped.');
        } else if (s === 'error') {
          session.emergencyStop();
          setStatus('Connection interrupted');
        } else if (s === 'connecting') setStatus('Connecting…');
      },
      onConnectionLostWhileRunning: () => {
        session.emergencyStop();
        setStatus('Connection interrupted — stimulation stopped.');
      },
    });
    remoteRef.current = client;
    client.connect(roomId);
  };

  const clientStop = () => {
    session.emergencyStop();
    remoteRef.current?.sendClientStop();
    setStatus('You pressed STOP — waiting for your therapist.');
  };

  const enableAudioAndFullscreen = async () => {
    await join();
    await enterFullscreen();
  };

  if (phase === 'missing') {
    return (
      <div className="join-page center">
        <h1>Invalid link</h1>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="join-page center client-end">
        <div className="brand large">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Clinical
          </span>
        </div>
        <h1>Session ended</h1>
        <p className="lede">You can close this window.</p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="join-page center client-waiting-intro">
        <div className="brand large">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Clinical
          </span>
        </div>
        <h1>Connected</h1>
        <p className="lede">
          Your therapist will control the stimulation from their screen. Please keep this window
          open.
        </p>
        <p className="hint">No account required. Stimulation only — no clinical information is shown.</p>

        <section className="client-audio-setup panel" aria-label="Audio setup">
          <h2>Audio setup</h2>
          <p className="hint">Use headphones if appropriate.</p>
          <div className="stack-btns horizontal wrap">
            <button type="button" className="btn" onClick={() => void playTestTone('L')}>
              Test Left
            </button>
            <button type="button" className="btn" onClick={() => void playTestTone('R')}>
              Test Right
            </button>
          </div>
          <label className="field">
            <span>Volume · {Math.round(volume * 100)}%</span>
            <input
              type="range"
              min={0.05}
              max={0.85}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={audioOk}
              onChange={(e) => setAudioOk(e.target.checked)}
            />
            <span>Audio working</span>
          </label>
        </section>

        <button type="button" className="btn primary large" onClick={() => void enableAudioAndFullscreen()}>
          Enter Full Screen
        </button>
        {!displayMode && (
          <button type="button" className="btn ghost" onClick={() => void join()}>
            Join without full screen
          </button>
        )}
        <p className="hint">Connection working once you join.</p>
      </div>
    );
  }

  return (
    <div className={`join-page live ${fullscreen ? 'is-fs' : ''}`}>
      <header className="join-bar client-live-bar">
        <div className="client-live-status">
          <span className={`client-conn-dot ${running ? 'is-live' : ''}`} aria-hidden>
            ●
          </span>
          <span>{status}</span>
          {error && <p className="error-banner">{error}</p>}
        </div>
        <div className="stack-btns horizontal">
          <button type="button" className="btn danger large" onClick={clientStop}>
            STOP
          </button>
          <button type="button" className="btn" onClick={() => void enterFullscreen()}>
            {fullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          </button>
        </div>
      </header>

      <div className="client-stage-wrap">
        <BlsStage attachCanvas={session.attachCanvas} fullscreen trajectory={session.state.visualMode} />
        {waitingNeutral && (
          <div className="client-neutral-overlay" role="status">
            <p className="client-neutral-brand">Pathfinder Clinical</p>
            <p>Connected to your therapist.</p>
            <p className="hint">The visual stimulus will appear when your therapist begins.</p>
            {!fullscreen && (
              <button type="button" className="btn primary" onClick={() => void enterFullscreen()}>
                Enter Full Screen
              </button>
            )}
          </div>
        )}
      </div>

      {!fullscreen && (
        <p className="join-footnote">Pathfinder Clinical — stimulation only.</p>
      )}
    </div>
  );
}
