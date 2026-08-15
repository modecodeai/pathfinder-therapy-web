import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../features/audio/audioEngine';
import { BlsEngine, sideFromElapsed } from '../features/visual/blsEngine';
import { formatTime, SetController } from '../features/sets/setController';
import {
  resolveEffectiveElapsed,
  resolveTaxationColour,
  newTaxationSeed,
} from '../emdr/engine/taxationEngine';
import {
  clampSize,
  clampTravel,
  createDefaultRoomState,
  createEmptyMetrics,
  roomStateToTaxationConfig,
  withSpeed01,
  type LocalMetrics,
  type RoomState,
} from '../types/room';

export interface UseBlsSessionOptions {
  isClient?: boolean;
  onStateChange?: (state: RoomState) => void;
  onSetComplete?: (metrics: LocalMetrics) => void;
  /** Clinician-only colour-change cue (never drawn on client canvas) */
  onTaxationColourChange?: (colour: string, passFloor: number) => void;
}

export function useBlsSession(options: UseBlsSessionOptions = {}) {
  const isClient = options.isClient ?? false;
  const onChangeRef = useRef(options.onStateChange);
  onChangeRef.current = options.onStateChange;
  const onSetCompleteRef = useRef(options.onSetComplete);
  onSetCompleteRef.current = options.onSetComplete;
  const onColourChangeRef = useRef(options.onTaxationColourChange);
  onColourChangeRef.current = options.onTaxationColourChange;

  const [state, setState] = useState<RoomState>(() => createDefaultRoomState());
  const [metrics, setMetrics] = useState<LocalMetrics>(() => createEmptyMetrics());
  const stateRef = useRef(state);
  const metricsRef = useRef(metrics);
  stateRef.current = state;
  metricsRef.current = metrics;

  const engineRef = useRef<BlsEngine | null>(null);
  const audioRef = useRef(new AudioEngine());
  const timerRef = useRef<number | null>(null);
  const runStartedAtRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);

  const notifyState = useCallback((next: RoomState) => {
    stateRef.current = next;
    setState(next);
    onChangeRef.current?.(next);
  }, []);

  const patchState = useCallback(
    (partial: Partial<RoomState>) => {
      let next: RoomState = { ...stateRef.current, ...partial };
      if (partial.speed01 !== undefined) {
        next = { ...next, ...withSpeed01(next, partial.speed01) };
      } else if (partial.cycleDurationMs !== undefined) {
        const ms = partial.cycleDurationMs;
        next = {
          ...next,
          cycleDurationMs: ms,
          speedHz: 1000 / Math.max(50, ms),
          speed01: Math.min(1, Math.max(0, (5000 - ms) / (5000 - 550))),
        };
      }
      if (partial.stimulusSize !== undefined) {
        next.stimulusSize = clampSize(partial.stimulusSize);
      }
      if (partial.travelWidth !== undefined) {
        next.travelWidth = clampTravel(partial.travelWidth);
      }
      notifyState(next);
      return next;
    },
    [notifyState],
  );

  const bumpSequence = useCallback(() => stateRef.current.sequence + 1, []);

  const clearTimers = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
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
    const finalMetrics = {
      ...metricsRef.current,
      sets: metricsRef.current.sets + 1,
    };
    setMetrics({ ...finalMetrics, timeMs: 0, passes: 0 });
    metricsRef.current = { ...finalMetrics, timeMs: 0, passes: 0 };
    notifyState({
      ...stateRef.current,
      running: false,
      paused: false,
      sequence: stateRef.current.sequence + 1,
    });
    onSetCompleteRef.current?.(finalMetrics);
  }, [notifyState]);

  const setController = useRef(
    new SetController({
      getMode: () => {
        const s = stateRef.current;
        if (s.continuous) return 'manual';
        return s.setMode === 'continuous' ? 'manual' : s.setMode;
      },
      getTargetPasses: () => stateRef.current.targetPasses ?? 30,
      getTargetSeconds: () => stateRef.current.targetSeconds ?? 15,
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
        getCycleDurationMs: () => stateRef.current.cycleDurationMs,
        getTrajectory: () => stateRef.current.visualMode,
        getColour: () => stateRef.current.stimulusColour,
        getBackground: () => stateRef.current.backgroundColour,
        getSizePx: () => stateRef.current.stimulusSize,
        getTravelWidth: () => stateRef.current.travelWidth,
        getVerticalPosition: () => stateRef.current.verticalPosition,
        getVisualEnabled: () =>
          stateRef.current.visualEnabled && !stateRef.current.audioOnly,
        getMidline: () => stateRef.current.midlineDirection,
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
        mapElapsedMs: (wall) => {
          const cfg = roomStateToTaxationConfig(stateRef.current);
          if (cfg.mode === 'standard') return wall;
          return resolveEffectiveElapsed(cfg, wall);
        },
        getEffectiveColour: () => {
          const s = stateRef.current;
          const cfg = roomStateToTaxationConfig(s);
          if (cfg.mode === 'standard') return s.stimulusColour;
          const wall =
            s.running && !s.paused && runStartedAtRef.current != null
              ? accumulatedMsRef.current + (performance.now() - runStartedAtRef.current)
              : metricsRef.current.timeMs;
          const effective = resolveEffectiveElapsed(cfg, wall);
          const passFloor = Math.floor(effective / Math.max(50, s.cycleDurationMs));
          return resolveTaxationColour(cfg, s.stimulusColour, passFloor).colour;
        },
        isAnimating: () => stateRef.current.running && !stateRef.current.paused,
        onPass: (completed) => {
          if (!stateRef.current.running || stateRef.current.paused) return;
          setMetrics((m) => {
            const next = { ...m, passes: completed };
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
        onColourChange: (colour, passFloor) => {
          if (isClient) return;
          onColourChangeRef.current?.(colour, passFloor);
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
        accumulatedMsRef.current +
        (performance.now() - (runStartedAtRef.current ?? performance.now()));
      setMetrics((m) => {
        const next = { ...m, timeMs: Math.floor(elapsed) };
        metricsRef.current = next;
        return next;
      });
      setController.current.check();
      if (stateRef.current.audioOnly || !stateRef.current.visualEnabled) {
        const side = sideFromElapsed(elapsed, stateRef.current.cycleDurationMs);
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
    const nextSeed =
      stateRef.current.taxationMode !== 'standard'
        ? newTaxationSeed()
        : stateRef.current.taxationSeed;
    notifyState({
      ...stateRef.current,
      running: true,
      paused: false,
      sequence: seq,
      taxationSeed: nextSeed,
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
    (next: RoomState) => {
      const normalized: RoomState = {
        ...createDefaultRoomState(),
        ...next,
        cycleDurationMs: next.cycleDurationMs || hzFallback(next.speedHz),
        speed01: next.speed01 ?? 0.5,
        midlineDirection: next.midlineDirection ?? 'up',
        continuous: next.continuous ?? false,
        stimulusSize: clampSize(next.stimulusSize),
        travelWidth: clampTravel(next.travelWidth),
      };
      if (!next.cycleDurationMs && next.speedHz) {
        normalized.cycleDurationMs = hzFallback(next.speedHz);
        normalized.speed01 = Math.min(
          1,
          Math.max(0, (5000 - normalized.cycleDurationMs) / (5000 - 550)),
        );
      }
      stateRef.current = normalized;
      setState(normalized);
      syncAudioSettings();
      clearTimers();

      if (normalized.running && !normalized.paused) {
        accumulatedMsRef.current = metricsRef.current.timeMs;
        runStartedAtRef.current = performance.now();
        startClock();
      } else {
        runStartedAtRef.current = null;
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

function hzFallback(hz: number): number {
  return Math.round(1000 / Math.max(0.15, hz || 0.7));
}

export type BlsSession = ReturnType<typeof useBlsSession>;
