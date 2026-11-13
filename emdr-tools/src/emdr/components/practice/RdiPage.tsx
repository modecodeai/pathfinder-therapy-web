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
import { RDI_SOURCE_LABEL, RDI_STEPS } from '../../data/scripts/rdi';

export function RdiPage() {
  const bls = useBlsSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [followMode, setFollowMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [quality, setQuality] = useState('');
  const [resourceType, setResourceType] = useState('mastery');
  const [cueWord, setCueWord] = useState('');

  useEffect(() => {
    bls.patchState(applyBlsPreset('rdi', bls.stateRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emergencyStop = useCallback(() => bls.stop(), [bls]);
  const blsRunning = bls.state.running && !bls.state.paused;

  useGuidedKeyboard({
    enabled: followMode,
    blsRunning,
    onToggleBls: () => (blsRunning ? bls.stop() : void bls.start()),
    onNext: () => setStepIndex((i) => Math.min(i + 1, RDI_STEPS.length - 1)),
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
                  <strong>Pathfinder</strong> RDI
                </span>
              </Link>
              <nav className="stack-btns horizontal">
                <Link className="btn ghost" to="/practice/safe-calm">
                  Safe/Calm
                </Link>
                <Link className="btn ghost" to="/practice">
                  Practice
                </Link>
              </nav>
            </div>
            <SessionHeaderBar
              model={{
                protocol: 'RDI',
                phase: 'Resource Development & Installation',
                blsSummary: 'Slower · predictable · taxation off',
                extra: quality ? [{ label: 'Quality', value: quality }] : undefined,
              }}
              blsActive={blsRunning}
              onEmergencyStop={emergencyStop}
            />
          </>
        }
        script={
          <TherapistScriptPanel
            title="Resource Development & Installation"
            sourceLabel={RDI_SOURCE_LABEL}
            steps={RDI_STEPS}
            followMode={followMode}
            onFollowModeChange={setFollowMode}
            autoScroll={autoScroll}
            onAutoScrollChange={setAutoScroll}
            stepIndex={stepIndex}
            onStepIndexChange={setStepIndex}
            onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={() => setStepIndex((i) => Math.min(i + 1, RDI_STEPS.length - 1))}
            onRepeat={() => setStepIndex((i) => i)}
            onStartBls={() => void bls.start()}
            onStopBls={() => bls.stop()}
            blsRunning={blsRunning}
          >
            <div className="guided-capture-grid">
              <label className="field">
                <span>Desired quality / skill / attribute</span>
                <input value={quality} onChange={(e) => setQuality(e.target.value)} />
              </label>
              <label className="field">
                <span>Resource type</span>
                <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                  <option value="mastery">Mastery</option>
                  <option value="relational">Relational</option>
                  <option value="symbolic">Symbolic</option>
                </select>
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
                label="RDI BLS"
                trajectory={bls.state.visualMode}
                lockSize={blsRunning}
              />
            )}
            <LiveBlsPanel
              session={bls}
              recommendedPreset="rdi"
              showAdvancedTaxation={false}
              onEmergencyStop={emergencyStop}
            />
          </>
        }
      />
    </div>
  );
}
