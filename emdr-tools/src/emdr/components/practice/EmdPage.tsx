import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlsStage } from '../../../components/BlsStage';
import { useBlsSession } from '../../../hooks/useBlsSession';
import { GuidedPracticeConsole } from '../../guided/components/GuidedPracticeConsole';
import { LiveBlsPanel } from '../../guided/components/LiveBlsPanel';
import { QuickResponsePanel } from '../../guided/components/QuickResponsePanel';
import { SessionHeaderBar } from '../../guided/components/SessionHeaderBar';
import { TherapistScriptPanel } from '../../guided/components/TherapistScriptPanel';
import { useGuidedKeyboard } from '../../guided/hooks/useGuidedKeyboard';
import { applyBlsPreset } from '../../guided/lib/blsPresets';
import { EMD_SOURCE_LABEL, EMD_STEPS } from '../../data/scripts/emd';

export function EmdPage() {
  const bls = useBlsSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [followMode, setFollowMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [focusedTarget, setFocusedTarget] = useState('');
  const [sud, setSud] = useState<number | null>(null);
  const [setCount, setSetCount] = useState(0);

  useEffect(() => {
    bls.patchState(applyBlsPreset('emdShortSet', bls.stateRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emergencyStop = useCallback(() => bls.stop(), [bls]);
  const blsRunning = bls.state.running && !bls.state.paused;

  useGuidedKeyboard({
    enabled: followMode,
    blsRunning,
    onToggleBls: () => (blsRunning ? bls.stop() : void bls.start()),
    onNext: () => setStepIndex((i) => Math.min(i + 1, EMD_STEPS.length - 1)),
    onPrev: () => setStepIndex((i) => Math.max(0, i - 1)),
    onEmergencyStop: emergencyStop,
  });

  return (
    <div className="companion companion-v3 app-shell guided-practice-page">
      <GuidedPracticeConsole
        viewMode="processing"
        header={
          <>
            <div className="guided-top-nav">
              <Link to="/practice" className="brand">
                <span className="brand-mark" aria-hidden />
                <span>
                  <strong>Pathfinder</strong> EMD
                </span>
              </Link>
              <Link className="btn ghost" to="/practice">
                Practice
              </Link>
            </div>
            <SessionHeaderBar
              model={{
                protocol: 'EMD',
                phase: 'Focused desensitisation',
                target: focusedTarget || undefined,
                sud,
                setCount,
                blsSummary: '12–15 passes · standard predictable',
              }}
              blsActive={blsRunning}
              onEmergencyStop={emergencyStop}
            />
          </>
        }
        script={
          <TherapistScriptPanel
            title="Eye Movement Desensitization (EMD)"
            sourceLabel={EMD_SOURCE_LABEL}
            steps={EMD_STEPS}
            followMode={followMode}
            onFollowModeChange={setFollowMode}
            autoScroll={autoScroll}
            onAutoScrollChange={setAutoScroll}
            stepIndex={stepIndex}
            onStepIndexChange={setStepIndex}
            onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={() => setStepIndex((i) => Math.min(i + 1, EMD_STEPS.length - 1))}
            onRepeat={() => setStepIndex((i) => i)}
            onStartBls={() => void bls.start()}
            onStopBls={() => bls.stop()}
            blsRunning={blsRunning}
          >
            <div className="guided-capture-grid">
              <label className="field">
                <span>Focused part of memory</span>
                <input value={focusedTarget} onChange={(e) => setFocusedTarget(e.target.value)} />
              </label>
              <label className="field">
                <span>SUD after set</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={sud ?? ''}
                  onChange={(e) => setSud(e.target.value === '' ? null : Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  setSetCount((c) => c + 1);
                  setStepIndex(EMD_STEPS.findIndex((s) => s.id === 'emd-return'));
                }}
              >
                Return to target · next set
              </button>
            </div>
          </TherapistScriptPanel>
        }
        clinicalControls={
          <>
            {bls.state.visualEnabled && (
              <BlsStage
                attachCanvas={bls.attachCanvas}
                label="EMD BLS"
                trajectory={bls.state.visualMode}
                lockSize={blsRunning}
              />
            )}
            <LiveBlsPanel
              session={bls}
              recommendedPreset="emdShortSet"
              showAdvancedTaxation={false}
              onEmergencyStop={emergencyStop}
            />
            <QuickResponsePanel
              onStopSignal={emergencyStop}
              onSave={({ words, sud: newSud }) => {
                setSetCount((c) => c + 1);
                if (newSud != null) setSud(newSud);
                void words;
              }}
            />
          </>
        }
      />
    </div>
  );
}
