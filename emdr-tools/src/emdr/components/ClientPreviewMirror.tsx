import { useEffect, useState } from 'react';
import { BlsStage } from '../../components/BlsStage';
import { useBlsSession } from '../../hooks/useBlsSession';

const BC_NAME = 'pf-emdr-sync';

/** Compact mirror of client BLS — does not own clinical set history. */
export function ClientPreviewMirror({ open }: { open: boolean }) {
  const session = useBlsSession({ isClient: true });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!open) return;
    const bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (ev) => {
      if (ev.data?.type === 'state' && ev.data.state) {
        setConnected(true);
        session.replaceState(ev.data.state);
      }
    };
    bc.postMessage({ type: 'ready' });
    return () => bc.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="client-preview-mirror" aria-label="Client display preview">
      <div className="client-preview-label">
        Client Preview {connected ? '· mirroring' : '· waiting'}
      </div>
      <BlsStage attachCanvas={session.attachCanvas} trajectory={session.state.visualMode} />
    </div>
  );
}
