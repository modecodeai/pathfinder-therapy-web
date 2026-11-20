import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../features/audio/audioEngine';
import { BlsEngine, sideFromElapsed } from '../features/visual/blsEngine';
import { formatTime, SetController } from '../features/sets/setController';
import {
  clampSize,
  clampSpeed,
  clampTravel,
  createDefaultRoomState,
  createEmptyMetrics,
  type LocalMetrics,
  type RoomState,
} from '../types/room';

export interface UseBlsSessionOptions {
  /** Therapist hears muted by default; client never mutes for themselves via this flag */
  isClient?: boolean;
  onStateChange?: (state: RoomState) => void;
  /** When true, ignore local transport — driven by remote ROOM_STATE */
  remoteDriven?: boolean;
}

export function useBlsSession(options: UseBlsSessionOptions = {}) {
  const isClient = options.isClient ?? false;
  const onChangeRef = useRef(options.onStateChange);
  onChangeRef.current = options.onStateChange;

  const [state, setState] = useState<RoomState>(() => createDefaultRoomState());
  const [metrics, setMetrics] = useState<LocalMetrics>(() => createEmptyMetrics());
  const stateRef = useRef(state);
  const metricsRef = useRef(metrics);
  stateRef.current = state;
  metricsRef.current = metrics;

  const engineRef = useRef<BlsEngine | null>(null);
  const audioRef = useRef(new AudioEngine());
  const timerRef = useRef<number | null>(null);
  const audioOnlyRef = useRef<number | null>(null);
  const runStartedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);

  const notifyState = useCallback((next: RoomState) => {
    stateRef.current = next;
    setState(next);
    onChangeRef.current?.(next);
  }, []);

  const patchState = useCallback(
    (partial: Partial<RoomState>) => {
      const next: RoomState = {
        ...stateRef.current,
        ...partial,
        speedHz:
          partial.speedHz !== undefined
            ? clampSpeed(partial.speedHz)
            : stateRef.current.speedHz,
        stimulusSize:
          partial.stimulusSize !== undefined
            ? clampSize(partial.stimulusSize)
            : stateRef.current.stimulusSize,
        travelWidth:
          partial.travelWidth !== undefined
            ? clampTravel(partial.travelWidth)
            : stateRef.current.travelWidth,
      };
      notifyState(next);
      return next;
    },
    [notifyState],
  );

  const bumpSequence = useCallback(() => {
    return stateRef.current.sequence + 1;
  }, []);

  const clearTimers = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioOnlyRef.current) {
      window.clearInterval(audioOnlyRef.current);
      audioOnlyRef.current = null;
    }
  };

  const syncAudioSettings = useCallback(() => {
    const s = stateRef.current;
    const audio = audioRef.current;
    audio.setEnabled(s.audioEnabled);
    audio.setSound(s.audioSound);
    audio.setVolume(s.audioVolume);
    audio.setMuted(isClient ? false : s.muteTherapistAudio);
  }, [isClient]);

  const completeSet = useCallback(() => {
    clearTimers();
    runStartedAtRef.current = null;
    accumulatedMsRef.current = 0;
    audioRef.current.reset();
    setMetrics((m) => {
      const next = { ...m, sets: m.sets + 1, timeMs: 0, passes: 0 };
      metricsRef.current = next;
      return next;
    });
    notifyState({
      ...stateRef.current,
      running: false,
      paused: false,
      sequence: stateRef.current.sequence + 1,
    });
  }, [notifyState]);

  const setController = useRef(
    new SetController({
      getMode: () => stateRef.current.setMode,
      getTargetPasses: () => stateRef.current.targetPasses ?? 24,
      getTargetSeconds: () => stateRef.current.targetSeconds ?? 30,
      getElapsedMs: () => metricsRef.current.timeMs,
      getPasses: () => metricsRef.current.passes,
      onComplete: () => completeSet(),
    }),
  );

  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) {
        engineRef.current?.stopLoop();
        engineRef.current = null;
        return;
      }
      engineRef.current?.stopLoop();
      const engine = new BlsEngine({
        canvas,
        getSpeedHz: () => stateRef.current.speedHz,
        getMode: () => stateRef.current.visualMode,
        getColour: () => stateRef.current.stimulusColour,
        getBackground: () => stateRef.current.backgroundColour,
        getSizePx: () => stateRef.current.stimulusSize,
        getTravelWidth: () => stateRef.current.travelWidth,
        getVerticalPosition: () => stateRef.current.verticalPosition,
        getVisualEnabled: () =>
          stateRef.current.visualEnabled && !stateRef.current.audioOnly,
        getElapsedMs: () => {
          if (
            stateRef.current.running &&
            !stateRef.current.paused &&
            runStartedAtRef.current != null
          ) {
            return (
              accumulatedMsRef.current + (performance.now() - runStartedAtRef.current)
            );
          }
          return metricsRef.current.timeMs;
        },
        isAnimating: () => stateRef.current.running && !stateRef.current.paused,
        onPass: () => {
          if (!stateRef.current.running || stateRef.current.paused) return;
          setMetrics((m) => {
            const next = { ...m, passes: m.passes + 1 };
            metricsRef.current = next;
            queueMicrotask(() => setController.current.check());
            return next;
          });
        },
        onSide: (side) => {
          syncAudioSettings();
          if (
            stateRef.current.audioEnabled &&
            (stateRef.current.syncAudioWithVisual || stateRef.current.audioOnly)
          ) {
            void audioRef.current.onSide(side);
          }
        },
      });
      engine.startLoop();
      engineRef.current = engine;
    },
    [syncAudioSettings],
  );

  useEffect(() => {
    return () => {
      engineRef.current?.stopLoop();
      void audioRef.current.dispose();
      clearTimers();
    };
  }, []);

  const startClock = useCallback(() => {
    clearTimers();
    runStartedAtRef.current = performance.now();
    timerRef.current = window.setInterval(() => {
      if (!stateRef.current.running || stateRef.current.paused) return;
      const elapsed =
        accumulatedMsRef.current + (performance.now() - (runStartedAtRef.current ?? performance.now()));
      setMetrics((m) => {
        const next = { ...m, timeMs: Math.floor(elapsed) };
        metricsRef.current = next;
        return next;
      });
      setController.current.check();

      // Audio-only: emit sides on a timer when visual is off
      if (stateRef.current.audioOnly || !stateRef.current.visualEnabled) {
        const side = sideFromElapsed(elapsed, stateRef.current.speedHz);
        syncAudioSettings();
        void audioRef.current.tickSide(side);
      }
    }, 100);
  }, [syncAudioSettings]);

  const start = useCallback(async () => {
    await audioRef.current.ensure();
    setController.current.reset();
    engineRef.current?.resetSideTracking();
    audioRef.current.reset();
    syncAudioSettings();
    accumulatedMsRef.current = 0;
    setMetrics((m) => {
      const next = { ...m, timeMs: 0, passes: 0 };
      metricsRef.current = next;
      return next;
    });
    const seq = bumpSequence();
    notifyState({
      ...stateRef.current,
      running: true,
      paused: false,
      sequence: seq,
    });
    startClock();
    return seq;
  }, [bumpSequence, notifyState, startClock, syncAudioSettings]);

  const pause = useCallback(() => {
    if (!stateRef.current.running || stateRef.current.paused) return stateRef.current.sequence;
    accumulatedMsRef.current = metricsRef.current.timeMs;
    clearTimers();
    const seq = bumpSequence();
    notifyState({ ...stateRef.current, paused: true, sequence: seq });
    return seq;
  }, [bumpSequence, notifyState]);

  const resume = useCallback(async () => {
    if (!stateRef.current.running || !stateRef.current.paused) return stateRef.current.sequence;
    await audioRef.current.ensure();
    syncAudioSettings();
    const seq = bumpSequence();
    notifyState({ ...stateRef.current, paused: false, sequence: seq });
    startClock();
    return seq;
  }, [bumpSequence, notifyState, startClock, syncAudioSettings]);

  const stop = useCallback(() => {
    clearTimers();
    runStartedAtRef.current = null;
    accumulatedMsRef.current = 0;
    audioRef.current.reset();
    const seq = bumpSequence();
    setMetrics((m) => {
      const next = { ...m, timeMs: 0, passes: 0 };
      metricsRef.current = next;
      return next;
    });
    notifyState({
      ...stateRef.current,
      running: false,
      paused: false,
      sequence: seq,
    });
    return seq;
  }, [bumpSequence, notifyState]);

  /** Immediate halt without sequence bump — used on client connection loss */
  const emergencyStop = useCallback(() => {
    clearTimers();
    runStartedAtRef.current = null;
    accumulatedMsRef.current = 0;
    audioRef.current.reset();
    setMetrics((m) => {
      const next = { ...m, timeMs: 0, passes: 0 };
      metricsRef.current = next;
      return next;
    });
    notifyState({
      ...stateRef.current,
      running: false,
      paused: false,
    });
  }, [notifyState]);

  const resetCounters = useCallback(() => {
    setMetrics(createEmptyMetrics());
    metricsRef.current = createEmptyMetrics();
  }, []);

  const replaceState = useCallback(
    (next: RoomState, opts?: { startAt?: number; resetMetrics?: boolean }) => {
      const normalized = {
        ...next,
        speedHz: clampSpeed(next.speedHz),
        stimulusSize: clampSize(next.stimulusSize),
        travelWidth: clampTravel(next.travelWidth),
      };
      stateRef.current = normalized;
      setState(normalized);
      syncAudioSettings();

      clearTimers();
      if (opts?.resetMetrics) {
        accumulatedMsRef.current = 0;
        setMetrics(createEmptyMetrics());
        metricsRef.current = createEmptyMetrics();
      }

      if (normalized.running && !normalized.paused) {
        // Align local clock; startAt is therapist Date.now()-ish — use performance offset from receipt
        accumulatedMsRef.current = metricsRef.current.timeMs;
        runStartedAtRef.current = performance.now();
        startClock();
      } else if (normalized.running && normalized.paused) {
        runStartedAtRef.current = null;
      } else {
        runStartedAtRef.current = null;
        accumulatedMsRef.current = 0;
      }
    },
    [startClock, syncAudioSettings],
  );

  const toggleSpace = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) void start();
    else if (s.paused) void resume();
    else pause();
  }, [pause, resume, start]);

  return {
    state,
    metrics,
    stateRef,
    attachCanvas,
    patchState,
    replaceState,
    start,
    pause,
    resume,
    stop,
    emergencyStop,
    resetCounters,
    toggleSpace,
    formatTime,
    audioUnsupported: () => audioRef.current.isUnsupported,
    ensureAudio: () => audioRef.current.ensure(),
  };
}

export type BlsSession = ReturnType<typeof useBlsSession>;
