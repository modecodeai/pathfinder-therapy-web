import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StimulusStage } from '../components/StimulusStage';
import { useRemoteRoom } from '../hooks/useRemoteRoom';
import { useSessionController } from '../hooks/useSessionController';

export function JoinPage() {
  const { roomId = '' } = useParams();
  const remote = useRemoteRoom('client');
  const session = useSessionController({ isClientView: true });

  useEffect(() => {
    if (roomId) remote.connect(roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    const snap = remote.remoteSnapshot;
    if (!snap) return;
    const aligned: typeof snap = {
      ...snap,
      phaseOriginMs:
        snap.running && !snap.paused ? performance.now() - snap.timeMs : snap.phaseOriginMs,
    };
    session.replaceSnapshot(aligned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote.remoteSnapshot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') void document.documentElement.requestFullscreen?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="join-page">
      <header className="join-bar">
        <Link to="/" className="brand compact">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">
            <strong>Pathfinder</strong> EMDR Tools
          </span>
        </Link>
        <div className="join-status">
          {!remote.connected && <span>Connecting…</span>}
          {remote.connected && !remote.peerConnected && <span>Waiting for therapist…</span>}
          {remote.connected && remote.peerConnected && <span>Connected</span>}
          <button
            type="button"
            className="btn"
            onClick={() => void document.documentElement.requestFullscreen?.()}
          >
            Fullscreen
          </button>
        </div>
      </header>
      {remote.lastError && <p className="error-banner">{remote.lastError}</p>}
      <StimulusStage attachCanvas={session.attachCanvas} fullscreen label="Session" />
      <p className="join-footnote">
        No account required. This page does not collect clinical notes or personal health information.
      </p>
    </div>
  );
}
