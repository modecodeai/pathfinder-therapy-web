import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RemoteRoomClient,
  type ClientConnectionStatus,
} from '../../features/remote/RemoteRoomClient';
import type { RoomState } from '../../types/room';
import type { useBlsSession } from '../../hooks/useBlsSession';

export type ClientPeerStatus = 'none' | 'waiting' | 'connected' | 'disconnected' | 'interrupted';

export type BlsSessionApi = ReturnType<typeof useBlsSession>;

const CLIENT_WINDOW = 'pf-emdr-client';
const BC_NAME = 'pf-emdr-sync';

function publishBroadcast(state: RoomState) {
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage({ type: 'state', state });
    bc.close();
  } catch {
    /* ignore */
  }
}

export function useTherapistClientDisplay(session: BlsSessionApi) {
  const remoteRef = useRef<RemoteRoomClient | null>(null);
  const publishTimer = useRef<number | null>(null);
  const activeRef = useRef(false);
  const previewRef = useRef(false);
  const wasPeerConnected = useRef(false);
  const lastRuntimeRef = useRef({ running: false, paused: false });

  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [peerStatus, setPeerStatus] = useState<ClientPeerStatus>('none');
  const [therapistWs, setTherapistWs] = useState<ClientConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [clientFullscreen, setClientFullscreen] = useState<boolean | null>(null);
  const [clientPressedStop, setClientPressedStop] = useState(false);

  useEffect(() => {
    activeRef.current = !!roomId;
  }, [roomId]);

  useEffect(() => {
    previewRef.current = previewOpen;
  }, [previewOpen]);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.origin !== location.origin) return;
      const data = ev.data;
      if (!data || data.type !== 'pf-client-display') return;
      if (typeof data.fullscreen === 'boolean') {
        setClientFullscreen(data.fullscreen);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    return () => {
      if (publishTimer.current) window.clearTimeout(publishTimer.current);
      remoteRef.current?.disconnect();
      remoteRef.current = null;
    };
  }, []);

  const stopClinicalForDisconnect = useCallback(() => {
    const s = session.stateRef.current;
    if (s.running) {
      session.stop();
      remoteRef.current?.sendCommand({ type: 'STOP', sequence: session.stateRef.current.sequence });
      remoteRef.current?.markLocalRunning(false);
    }
    setBanner('Client display disconnected — BLS stopped remotely.');
    setPeerStatus('interrupted');
  }, [session]);

  const clearClientStopBanner = useCallback(() => {
    setClientPressedStop(false);
  }, []);

  const attachTherapistClient = useCallback(() => {
    const client = new RemoteRoomClient({
      role: 'therapist',
      onRoomState: () => undefined,
      onPeerConnected: () => {
        wasPeerConnected.current = true;
        setPeerStatus('connected');
        setBanner((b) =>
          b?.includes('disconnected') || b?.includes('interrupted')
            ? 'Client display reconnected — resume when ready.'
            : null,
        );
      },
      onPeerDisconnected: () => {
        if (session.stateRef.current.running) {
          stopClinicalForDisconnect();
        } else {
          setPeerStatus('disconnected');
          setBanner('Client display disconnected.');
        }
      },
      onClientStop: () => {
        if (session.stateRef.current.running) {
          session.stop();
          remoteRef.current?.markLocalRunning(false);
        }
        setClientPressedStop(true);
        setBanner('CLIENT PRESSED STOP — BLS stopped. Restart manually when ready.');
      },
      onSessionEnded: () => {
        remoteRef.current = null;
        setRoomId(null);
        setJoinUrl(null);
        setPeerStatus('none');
        setTherapistWs('ended');
        setBanner('Client display session ended.');
      },
      onError: (m) => setError(m),
      onConnectionChange: (s) => {
        setTherapistWs(s);
        if (s === 'error') setError('Client display connection error');
      },
    });
    remoteRef.current = client;
    return client;
  }, [session, stopClinicalForDisconnect]);

  const ensureRoom = useCallback(
    async (opts?: { markWaiting?: boolean }) => {
      setError(null);
      if (remoteRef.current?.getRoomId() && joinUrl) {
        if (opts?.markWaiting) {
          setPeerStatus((s) => (s === 'connected' ? s : 'waiting'));
        }
        return { roomId: remoteRef.current.getRoomId()!, joinUrl };
      }
      const client = attachTherapistClient();
      // Always create room in a stopped state — client waits until Start Set
      const initial = {
        ...session.stateRef.current,
        running: false,
        paused: false,
      };
      const created = await client.createRoom(initial);
      if (!created) {
        remoteRef.current = null;
        setError('Could not create client display room.');
        return null;
      }
      setRoomId(created.roomId);
      setJoinUrl(created.joinUrl);
      if (opts?.markWaiting) {
        setPeerStatus('waiting');
      }
      // Silent prepare keeps "Not connected" until open/share
      setBanner(null);
      wasPeerConnected.current = false;
      publishBroadcast(session.stateRef.current);
      return created;
    },
    [attachTherapistClient, joinUrl, session],
  );

  /** Prepare room token in background when Session Companion opens. */
  const prepareRoom = useCallback(() => {
    void ensureRoom({ markWaiting: false });
  }, [ensureRoom]);

  const openClientDisplay = useCallback(async () => {
    const created = await ensureRoom({ markWaiting: true });
    if (!created) return null;
    const url = `${created.joinUrl}${created.joinUrl.includes('?') ? '&' : '?'}display=1`;
    window.open(url, CLIENT_WINDOW, 'popup=yes,width=1280,height=800');
    publishBroadcast(session.stateRef.current);
    return created;
  }, [ensureRoom, session]);

  const copyClientLink = useCallback(async () => {
    const created = await ensureRoom({ markWaiting: true });
    if (!created) return false;
    try {
      await navigator.clipboard.writeText(created.joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setError('Could not copy link');
      return false;
    }
  }, [ensureRoom]);

  const disconnectDisplay = useCallback(() => {
    const remote = remoteRef.current;
    if (remote) {
      if (session.stateRef.current.running) {
        const stopSeq = session.stop();
        remote.sendCommand({ type: 'STOP', sequence: stopSeq });
        remote.markLocalRunning(false);
      }
      const seq = session.stateRef.current.sequence + 1;
      session.patchState({ sequence: seq, running: false, paused: false });
      remote.sendCommand({ type: 'END_SESSION', sequence: seq });
      remote.disconnect();
    }
    remoteRef.current = null;
    setRoomId(null);
    setJoinUrl(null);
    setPeerStatus('none');
    setTherapistWs('disconnected');
    setClientFullscreen(null);
    setBanner(null);
    wasPeerConnected.current = false;
  }, [session]);

  const endSessionWithClient = useCallback(() => {
    if (session.stateRef.current.running) {
      session.stop();
    }
    disconnectDisplay();
    setBanner('Session ended. Client display disconnected.');
  }, [disconnectDisplay, session]);

  const publishState = useCallback((state: RoomState) => {
    if (previewRef.current || activeRef.current) {
      publishBroadcast(state);
    }
    const remote = remoteRef.current;
    if (!remote) {
      lastRuntimeRef.current = { running: state.running, paused: state.paused };
      return;
    }

    const prev = lastRuntimeRef.current;
    // Set completion / emergency local stop must push STOP — SET_SETTINGS strips running/paused
    if (prev.running && !state.running) {
      remote.sendCommand({ type: 'STOP', sequence: state.sequence });
      remote.markLocalRunning(false);
    } else if (prev.running && !prev.paused && state.running && state.paused) {
      remote.sendCommand({ type: 'PAUSE', sequence: state.sequence });
      remote.markLocalRunning(false);
    }
    lastRuntimeRef.current = { running: state.running, paused: state.paused };

    if (publishTimer.current) window.clearTimeout(publishTimer.current);
    publishTimer.current = window.setTimeout(() => {
      const s = state;
      const { running: _r, paused: _p, sequence, ...settings } = s;
      void _r;
      void _p;
      remote.sendCommand({
        type: 'SET_SETTINGS',
        sequence,
        payload: settings,
      });
    }, 60);
  }, []);

  const start = useCallback(async () => {
    setClientPressedStop(false);
    const seq = await session.start();
    // publishState already saw running=true; START must carry startAt
    remoteRef.current?.sendCommand({ type: 'START', sequence: seq, startAt: Date.now() });
    remoteRef.current?.markLocalRunning(true);
    lastRuntimeRef.current = { running: true, paused: false };
    publishBroadcast(session.stateRef.current);
    return seq;
  }, [session]);

  const pause = useCallback(() => {
    const seq = session.pause();
    // STOP/PAUSE emitted via publishState transition; ensure mark
    remoteRef.current?.markLocalRunning(false);
    lastRuntimeRef.current = { running: true, paused: true };
    publishBroadcast(session.stateRef.current);
    return seq;
  }, [session]);

  const resume = useCallback(async () => {
    const seq = await session.resume();
    remoteRef.current?.sendCommand({ type: 'RESUME', sequence: seq, startAt: Date.now() });
    remoteRef.current?.markLocalRunning(true);
    lastRuntimeRef.current = { running: true, paused: false };
    publishBroadcast(session.stateRef.current);
    return seq;
  }, [session]);

  const stop = useCallback(() => {
    const seq = session.stop();
    // STOP emitted via publishState when running→false
    remoteRef.current?.markLocalRunning(false);
    lastRuntimeRef.current = { running: false, paused: false };
    publishBroadcast(session.stateRef.current);
    return seq;
  }, [session]);

  const toggleSpace = useCallback(() => {
    const s = session.stateRef.current;
    if (!s.running) void start();
    else if (s.paused) void resume();
    else pause();
  }, [session, start, pause, resume]);

  const togglePreview = useCallback(() => {
    setPreviewOpen((v) => {
      const next = !v;
      previewRef.current = next;
      if (next) publishBroadcast(session.stateRef.current);
      return next;
    });
  }, [session]);

  const stimulusSummary = useCallback(() => {
    const s = session.state;
    const mode =
      s.visualMode === 'diagonal-up'
        ? 'Diagonal ↗︎'
        : s.visualMode === 'diagonal-down'
          ? 'Diagonal ↖︎'
          : s.visualMode === 'infinity'
            ? 'Infinity'
            : s.visualMode.charAt(0).toUpperCase() + s.visualMode.slice(1);
    return `${mode} · ${s.stimulusSize}px`;
  }, [session.state]);

  return {
    roomId,
    joinUrl,
    peerStatus,
    therapistWs,
    error,
    banner,
    setBanner,
    copied,
    previewOpen,
    clientFullscreen,
    clientPressedStop,
    clearClientStopBanner,
    active: !!roomId,
    ensureRoom,
    prepareRoom,
    openClientDisplay,
    copyClientLink,
    disconnectDisplay,
    endSessionWithClient,
    publishState,
    start,
    pause,
    resume,
    stop,
    toggleSpace,
    togglePreview,
    setPreviewOpen,
    stimulusSummary,
  };
}

export type TherapistClientDisplay = ReturnType<typeof useTherapistClientDisplay>;
