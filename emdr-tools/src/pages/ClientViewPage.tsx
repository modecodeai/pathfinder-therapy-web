import { useEffect } from 'react';
import { StimulusStage } from '../components/StimulusStage';
import { useSessionController } from '../hooks/useSessionController';

/** Popup / second-screen client view synced via BroadcastChannel (same browser). */
export function ClientViewPage() {
  const session = useSessionController({ isClientView: true });

  useEffect(() => {
    const bc = new BroadcastChannel('pathfinder-emdr-sync');
    bc.onmessage = (ev) => {
      if (ev.data?.type === 'snapshot' && ev.data.snapshot) {
        session.replaceSnapshot(ev.data.snapshot);
      }
    };
    bc.postMessage({ type: 'client-ready' });
    return () => bc.close();
    // session.replaceSnapshot is stable enough for mount-only subscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') void document.documentElement.requestFullscreen?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="client-view">
      <StimulusStage attachCanvas={session.attachCanvas} fullscreen label="Client view" />
    </div>
  );
}
