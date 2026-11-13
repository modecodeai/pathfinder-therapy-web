import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlsStage } from '../../../components/BlsStage';
import { useBlsSession } from '../../../hooks/useBlsSession';
import { GuidedPracticeConsole } from '../../guided/components/GuidedPracticeConsole';
import { LiveBlsPanel } from '../../guided/components/LiveBlsPanel';
import { SessionHeaderBar } from '../../guided/components/SessionHeaderBar';
import { TherapistScriptPanel } from '../../guided/components/TherapistScriptPanel';
import { useGuidedKeyboard } from '../../guided/hooks/useGuidedKeyboard';
import { applyBlsPreset } from '../../guided/lib/blsPresets';
import { SAFE_CALM_SOURCE_LABEL, SAFE_CALM_STEPS } from '../../data/scripts/safeCalm';

export function SafeCalmPage() {
  const bls = useBlsSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [followMode, setFollowMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [cueWord, setCueWord] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    bls.patchState(applyBlsPreset('safeCalm', bls.stateRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once on mount
  }, []);

  const emergencyStop = useCallback(() => bls.stop(), [bls]);
  const blsRunning = bls.state.running && !bls.state.paused;

  useGuidedKeyboard({
    enabled: followMode,
    blsRunning,
    onToggleBls: () => (blsRunning ? bls.stop() : void bls.start()),
    onNext: () => setStepIndex((i) => Math.min(i + 1, SAFE_CALM_STEPS.length - 1)),
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
                  <strong>Pathfinder</strong> Safe / Calm State
                </span>
              </Link>
              <nav className="stack-btns horizontal">
                <Link className="btn ghost" to="/practice">
                  Practice
                </Link>
                <Link className="btn ghost" to="/practice/rdi">
                  RDI
                </Link>
              </nav>
            </div>
            <SessionHeaderBar
              model={{
                protocol: 'Resourcing',
                phase: 'Safe / Calm State',
                blsSummary: 'Slow · alternating · 8–10 passes',
                extra: cueWord ? [{ label: 'Cue', value: cueWord }] : undefined,
              }}
              blsActive={blsRunning}
              onEmergencyStop={emergencyStop}
            />
          </>
        }
        script={
          <TherapistScriptPanel
            title="Creating a Safe/Calm Place or State"
            sourceLabel={SAFE_CALM_SOURCE_LABEL}
            steps={SAFE_CALM_STEPS}
            followMode={followMode}
            onFollowModeChange={setFollowMode}
            autoScroll={autoScroll}
            onAutoScrollChange={setAutoScroll}
            stepIndex={stepIndex}
            onStepIndexChange={setStepIndex}
            onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={() => setStepIndex((i) => Math.min(i + 1, SAFE_CALM_STEPS.length - 1))}
            onRepeat={() => setStepIndex((i) => i)}
            onStartBls={() => void bls.start()}
            onStopBls={() => bls.stop()}
            blsRunning={blsRunning}
          >
            <div className="guided-capture-grid">
              <label className="field">
                <span>Image / place / symbol</span>
                <input value={image} onChange={(e) => setImage(e.target.value)} />
              </label>
              <label className="field">
                <span>Cue word</span>
                <input value={cueWord} onChange={(e) => setCueWord(e.target.value)} />
              </label>
            </div>
          </TherapistScriptPanel>
        }
        clinicalControls={
          <>
            {bls.state.visualEnabled && (
              <BlsStage
                attachCanvas={bls.attachCanvas}
                label="Safe/Calm BLS"
                trajectory={bls.state.visualMode}
                lockSize={blsRunning}
              />
            )}
            <LiveBlsPanel
              session={bls}
              recommendedPreset="safeCalm"
              showAdvancedTaxation={false}
              onEmergencyStop={emergencyStop}
            />
          </>
        }
      />
    </div>
  );
}
