import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from '../lib/audioEngine';
import { BlsEngine } from '../lib/blsEngine';
import { formatTime, SetController } from '../lib/setController';
import {
  clampSpeed,
  createDefaultSnapshot,
  type SessionSnapshot,
  type SetMode,
  type Side,
} from '../lib/types';

export function useSessionController(options?: {
  isClientView?: boolean;
  onSnapshotChange?: (snap: SessionSnapshot) => void;
}) {
  const isClientView = options?.isClientView ?? false;
  const onChangeRef = useRef(options?.onSnapshotChange);
  onChangeRef.current = options?.onSnapshotChange;

  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() => createDefaultSnapshot());
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BlsEngine | null>(null);
  const audioRef = useRef(new AudioEngine());
  const timerRef = useRef<number | null>(null);
  const runStartedAtRef = useRef(0);
  const accumulatedMsRef = useRef(0);

  const notify = useCallback((next: SessionSnapshot) => {
    setSnapshot(next);
    onChangeRef.current?.(next);
  }, []);

  const patch = useCallback(
    (partial: Partial<SessionSnapshot> | ((s: SessionSnapshot) => SessionSnapshot)) => {
      const base = snapshotRef.current;
      const next = typeof partial === 'function' ? partial(base) : { ...base, ...partial };
      snapshotRef.current = next;
      notify(next);
      return next;
    },
    [notify],
  );

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const setController = useMemo(
    () =>
      new SetController({
        getMode: () => snapshotRef.current.set.mode,
        getPassesTarget: () => snapshotRef.current.set.passesTarget,
        getTimedSeconds: () => snapshotRef.current.set.timedSeconds,
        getElapsedMs: () => snapshotRef.current.timeMs,
        getPasses: () => snapshotRef.current.passes,
        onSetComplete: () => {
          clearTimer();
          accumulatedMsRef.current = snapshotRef.current.timeMs;
          patch((s) => ({
            ...s,
            running: false,
            paused: false,
            sets: s.sets + 1,
          }));
          audioRef.current.reset();
        },
      }),
    [patch],
  );

  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas;
      if (!canvas) {
        engineRef.current?.stop();
        engineRef.current = null;
        return;
      }
      engineRef.current?.stop();
      const engine = new BlsEngine({
        canvas,
        getSpeedHz: () => snapshotRef.current.speedHz,
        getMode: () => snapshotRef.current.visual.mode,
        getColor: () => snapshotRef.current.visual.color,
        getBackground: () => snapshotRef.current.visual.background,
        getSize: () => snapshotRef.current.visual.size,
        getTravelWidth: () => snapshotRef.current.visual.travelWidth,
        getVerticalPosition: () => snapshotRef.current.visual.verticalPosition,
        getEnabled: () => snapshotRef.current.visual.enabled,
        getPhaseOriginMs: () => snapshotRef.current.phaseOriginMs,
        isRunning: () => snapshotRef.current.running,
        isPaused: () => snapshotRef.current.paused,
        onSideChange: (side: Side, passCompleted: boolean) => {
          const audio = audioRef.current;
          audio.setEnabled(snapshotRef.current.audio.enabled);
          audio.setSound(snapshotRef.current.audio.sound);
          audio.setMuteTherapist(isClientView ? false : snapshotRef.current.audio.muteTherapist);
          void audio.onSide(side);
          if (passCompleted && snapshotRef.current.running && !snapshotRef.current.paused) {
            patch((s) => {
              const next = { ...s, passes: s.passes + 1 };
              snapshotRef.current = next;
              queueMicrotask(() => setController.check());
              return next;
            });
          }
        },
      });
      engine.start();
      engineRef.current = engine;
    },
    [isClientView, patch, setController],
  );

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      void audioRef.current.dispose();
      clearTimer();
    };
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    runStartedAtRef.current = performance.now();
    timerRef.current = window.setInterval(() => {
      if (!snapshotRef.current.running || snapshotRef.current.paused) return;
      const elapsed = accumulatedMsRef.current + (performance.now() - runStartedAtRef.current);
      patch((s) => ({ ...s, timeMs: Math.floor(elapsed) }));
      setController.check();
    }, 200);
  }, [patch, setController]);

  const start = useCallback(async () => {
    await audioRef.current.ensure();
    setController.reset();
    engineRef.current?.resetPhaseTracking();
    const now = performance.now();
    const resuming = snapshotRef.current.paused && snapshotRef.current.running;
    if (!resuming && !snapshotRef.current.running) {
      // fresh start from stopped — keep prior counters unless already zeroed by stop
      accumulatedMsRef.current = snapshotRef.current.timeMs;
    }
    const phaseOrigin = now - snapshotRef.current.timeMs;
    patch({
      running: true,
      paused: false,
      phaseOriginMs: phaseOrigin,
    });
    startTimer();
  }, [patch, setController, startTimer]);

  const pause = useCallback(() => {
    if (!snapshotRef.current.running || snapshotRef.current.paused) return;
    accumulatedMsRef.current = snapshotRef.current.timeMs;
    clearTimer();
    patch({ paused: true });
  }, [patch]);

  const resume = useCallback(async () => {
    if (!snapshotRef.current.running || !snapshotRef.current.paused) return;
    await audioRef.current.ensure();
    const origin = performance.now() - snapshotRef.current.timeMs;
    patch({ paused: false, phaseOriginMs: origin });
    startTimer();
  }, [patch, startTimer]);

  const stop = useCallback(() => {
    clearTimer();
    accumulatedMsRef.current = 0;
    audioRef.current.reset();
    patch({
      running: false,
      paused: false,
      timeMs: 0,
      passes: 0,
      phaseOriginMs: 0,
    });
  }, [patch]);

  const toggleStartPause = useCallback(() => {
    const s = snapshotRef.current;
    if (!s.running) void start();
    else if (s.paused) void resume();
    else pause();
  }, [pause, resume, start]);

  const setSpeed = useCallback(
    (hz: number) => {
      patch({ speedHz: clampSpeed(hz) });
    },
    [patch],
  );

  const replaceSnapshot = useCallback(
    (next: SessionSnapshot, opts?: { preserveRuntime?: boolean }) => {
      const merged = opts?.preserveRuntime
        ? {
            ...next,
            running: snapshotRef.current.running,
            paused: snapshotRef.current.paused,
            timeMs: snapshotRef.current.timeMs,
            passes: snapshotRef.current.passes,
            sets: snapshotRef.current.sets,
            phaseOriginMs: snapshotRef.current.phaseOriginMs,
          }
        : next;
      snapshotRef.current = merged;
      notify(merged);
      audioRef.current.setEnabled(merged.audio.enabled);
      audioRef.current.setSound(merged.audio.sound);
      audioRef.current.setMuteTherapist(isClientView ? false : merged.audio.muteTherapist);
    },
    [isClientView, notify],
  );

  const setSetMode = useCallback(
    (mode: SetMode) => patch((s) => ({ ...s, set: { ...s.set, mode } })),
    [patch],
  );

  return {
    snapshot,
    snapshotRef,
    attachCanvas,
    start,
    pause,
    resume,
    stop,
    toggleStartPause,
    setSpeed,
    patch,
    replaceSnapshot,
    setSetMode,
    formatTime: (ms: number) => formatTime(ms),
  };
}

export type SessionController = ReturnType<typeof useSessionController>;
