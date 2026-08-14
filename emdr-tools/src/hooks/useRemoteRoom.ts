import { useCallback, useEffect, useRef, useState } from 'react';
import {
  decodeMsg,
  encodeMsg,
  generateRoomId,
  generateSecret,
  type ClientRole,
  type ServerToClient,
} from '../lib/roomProtocol';
import type { SessionSnapshot } from '../lib/types';

export function useRemoteRoom(role: ClientRole) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [remoteSnapshot, setRemoteSnapshot] = useState<SessionSnapshot | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const secretRef = useRef<string | null>(null);
  const intentionalClose = useRef(false);
  const reconnectTimer = useRef<number | null>(null);

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  const connect = useCallback(
    (id: string, therapistSecret?: string) => {
      intentionalClose.current = false;
      setLastError(null);
      setRoomId(id);
      if (therapistSecret) {
        secretRef.current = therapistSecret;
        setSecret(therapistSecret);
      }

      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${location.host}/ws/${encodeURIComponent(id)}`);
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        setConnected(true);
        ws.send(
          encodeMsg({
            type: 'hello',
            role,
            secret: role === 'therapist' ? secretRef.current ?? undefined : undefined,
          }),
        );
      });

      ws.addEventListener('message', (ev) => {
        const msg = decodeMsg<ServerToClient>(String(ev.data));
        if (!msg) return;
        if (msg.type === 'welcome') {
          if (msg.snapshot) setRemoteSnapshot(msg.snapshot);
        } else if (msg.type === 'state') {
          setRemoteSnapshot(msg.snapshot);
        } else if (msg.type === 'peer') {
          setPeerConnected(msg.connected);
        } else if (msg.type === 'error') {
          setLastError(msg.message);
        } else if (msg.type === 'expired') {
          setLastError('Session room expired');
          setConnected(false);
        }
      });

      ws.addEventListener('close', () => {
        setConnected(false);
        setPeerConnected(false);
        if (!intentionalClose.current) {
          reconnectTimer.current = window.setTimeout(() => {
            connect(id, secretRef.current ?? undefined);
          }, 1200);
        }
      });

      ws.addEventListener('error', () => {
        setLastError('Connection error');
      });
    },
    [role],
  );

  const createRoom = useCallback(
    async (snapshot: SessionSnapshot) => {
      const id = generateRoomId(7);
      const sec = generateSecret(18);
      secretRef.current = sec;
      setSecret(sec);
      setRoomId(id);
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ roomId: id, secret: sec, snapshot }),
      });
      if (!res.ok) {
        const err = await res.text();
        setLastError(err || 'Failed to create room');
        return null;
      }
      connect(id, sec);
      return { roomId: id, secret: sec, joinPath: `/join/${id}` };
    },
    [connect],
  );

  const publishState = useCallback((snapshot: SessionSnapshot) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (role !== 'therapist') return;
    ws.send(encodeMsg({ type: 'state', snapshot }));
  }, [role]);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    roomId,
    secret,
    connected,
    peerConnected,
    lastError,
    remoteSnapshot,
    createRoom,
    connect,
    disconnect,
    publishState,
    joinUrl: roomId ? `${location.origin}/join/${roomId}` : null,
  };
}
