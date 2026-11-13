import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlsSession } from '../../../hooks/useBlsSession';
import { useTherapistClientDisplay } from '../../hooks/useTherapistClientDisplay';

/**
 * Shared BLS + remote client wiring for guided practice consoles.
 * Therapist start/stop publishes to the remote client when a session exists.
 */
export function useGuidedRemoteBls() {
  const publishRemoteRef = useRef<(state: import('../../../types/room').RoomState) => void>(() => undefined);
  const bls = useBlsSession({
    onStateChange: (state) => publishRemoteRef.current(state),
  });
  const clientDisplay = useTherapistClientDisplay(bls);
  const [remotePanelOpen, setRemotePanelOpen] = useState(false);
  const [outputMode, setOutputMode] = useState<'local' | 'remote' | 'both'>('both');
  const [therapistPreview, setTherapistPreview] = useState(false);

  useEffect(() => {
    publishRemoteRef.current = clientDisplay.publishState;
  }, [clientDisplay.publishState]);

  useEffect(() => {
    const t = window.setTimeout(() => clientDisplay.prepareRoom(), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emergencyStop = useCallback(() => {
    clientDisplay.stop();
  }, [clientDisplay]);

  const startBls = useCallback(async () => {
    if (outputMode === 'remote' && clientDisplay.peerStatus !== 'connected') {
      setRemotePanelOpen(true);
      return bls.stateRef.current.sequence;
    }
    return clientDisplay.start();
  }, [clientDisplay, outputMode, bls]);

  const stopBls = useCallback(() => {
    return clientDisplay.stop();
  }, [clientDisplay]);

  const muteTherapist =
    outputMode === 'remote' || (outputMode === 'both' && clientDisplay.peerStatus === 'connected');

  useEffect(() => {
    bls.patchState({ muteTherapistAudio: muteTherapist && bls.state.audioEnabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muteTherapist]);

  return {
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
    showLocalVisual:
      outputMode !== 'remote' || therapistPreview || clientDisplay.peerStatus !== 'connected',
  };
}
