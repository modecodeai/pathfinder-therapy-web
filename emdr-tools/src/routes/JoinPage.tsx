import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BlsStage } from '../components/BlsStage';
import { RemoteRoomClient } from '../features/remote/RemoteRoomClient';
import { useBlsSession } from '../hooks/useBlsSession';

export function JoinPage() {
  const { roomId = '' } = useParams();
  const [phase, setPhase] = useState<'intro' | 'live' | 'ended' | 'missing'>('intro');
  const [status, setStatus] = useState('Ready to join');
  const [error, setError] = useState<string | null>(null);
  const remoteRef = useRef<RemoteRoomClient | null>(null);
  const session = useBlsSession({ isClient: true });

  useEffect(() => {
    if (!roomId) setPhase('missing');
  }, [roomId]);

  useEffect(() => {
    return () => remoteRef.current?.disconnect();
  }, []);

  const join = async () => {
    setError(null);
    await session.ensureAudio();
    setPhase('live');
    setStatus('Connecting…');

    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
      if (res.status === 410 || res.status === 404) {
        setPhase('ended');
        setStatus('This session has ended or expired.');
        return;
      }
    } catch {
      /* continue */
    }

    const client = new RemoteRoomClient({
      role: 'client',
      onRoomState: (state) => {
        session.replaceState(state);
        remoteRef.current?.markLocalRunning(state.running && !state.paused);
      },
      onSessionEnded: () => {
        session.emergencyStop();
        setPhase('ended');
        setStatus('This session has ended or expired.');
      },
      onError: (m) => setError(m),
      onConnectionChange: (s) => {
        if (s === 'connected') setStatus('Connected to your therapist');
        else if (s === 'reconnecting') {
          session.emergencyStop();
          setStatus('Connection interrupted — stimulation stopped. Therapist must restart.');
        } else if (s === 'error') {
          session.emergencyStop();
          setStatus('Connection interrupted');
        } else if (s === 'connecting') setStatus('Connecting…');
      },
      onConnectionLostWhileRunning: () => {
        session.emergencyStop();
        setStatus('Connection interrupted — stimulation stopped. Therapist must restart.');
      },
    });
    remoteRef.current = client;
    client.connect(roomId);
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
      <div className="join-page center">
        <h1>Session unavailable</h1>
        <p>This session has ended or expired.</p>
        <Link className="btn" to="/">
          Home
        </Link>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="join-page center">
        <div className="brand large">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> EMDR Tools
          </span>
        </div>
        <h1>Join your EMDR session</h1>
        <p className="lede">Enter the room code from your therapist, or open the invitation link.</p>
        <p className="hint">No account. No name. No clinical information collected.</p>
        <button type="button" className="btn primary" onClick={() => void join()}>
          Join session
        </button>
        <p className="mono room-ref">Room {roomId}</p>
      </div>
    );
  }

  return (
    <div className="join-page live">
      <header className="join-bar">
        <span>{status}</span>
        <button
          type="button"
          className="btn"
          onClick={() => {
            const el = document.documentElement;
            if (!document.fullscreenElement) void el.requestFullscreen?.();
            else void document.exitFullscreen?.();
          }}
        >
          {document.fullscreenElement ? 'Exit Full Screen' : 'Enter Full Screen'}
        </button>
      </header>
      {error && <p className="error-banner">{error}</p>}
      <BlsStage attachCanvas={session.attachCanvas} fullscreen trajectory={session.state.visualMode} />
      <p className="join-footnote">
        Pathfinder EMDR Tools — stimulation only. Conversation stays on your video platform.
      </p>
    </div>
  );
}
