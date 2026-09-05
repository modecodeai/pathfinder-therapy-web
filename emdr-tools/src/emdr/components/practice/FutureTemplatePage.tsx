import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { BlsStage } from '../../../components/BlsStage';
import { useBlsSession } from '../../../hooks/useBlsSession';
import { GuidedPracticeConsole } from '../../guided/components/GuidedPracticeConsole';
import { LiveBlsPanel } from '../../guided/components/LiveBlsPanel';
import { SessionHeaderBar } from '../../guided/components/SessionHeaderBar';
import { TherapistScriptPanel } from '../../guided/components/TherapistScriptPanel';
import { applyBlsPreset } from '../../guided/lib/blsPresets';
import type { GuidedScriptStep } from '../../guided/types/guidedScript';

const STEPS: GuidedScriptStep[] = [
  {
    id: 'ft-1',
    protocol: 'future-template',
    phase: 'future',
    section: 'challenge',
    type: 'say',
    text: 'Identify a challenge scenario you would like to handle more effectively in the future.',
    fieldKey: 'scenario',
    source: {
      organisation: 'The Center for Excellence in EMDR Therapy',
      title: 'Appendix B — Procedural Steps for Installing Future Templates',
      date: 'March 2026',
    },
  },
  {
    id: 'ft-2',
    protocol: 'future-template',
    phase: 'future',
    section: 'desired',
    type: 'say',
    text: 'What is your desired response in that situation?',
    fieldKey: 'desiredResponse',
    source: {
      organisation: 'The Center for Excellence in EMDR Therapy',
      title: 'Appendix B — Procedural Steps for Installing Future Templates',
      date: 'March 2026',
    },
  },
  {
    id: 'ft-3',
    protocol: 'future-template',
    phase: 'future',
    section: 'pc',
    type: 'say',
    text: 'What positive belief about yourself fits this desired response?',
    fieldKey: 'pc',
    source: {
      organisation: 'The Center for Excellence in EMDR Therapy',
      title: 'Appendix B — Procedural Steps for Installing Future Templates',
      date: 'March 2026',
    },
  },
  {
    id: 'ft-4',
    protocol: 'future-template',
    phase: 'future',
    section: 'voc',
    type: 'capture',
    text: 'Record VOC 1–7 for the PC in this future context.',
    fieldKey: 'voc',
    source: {
      organisation: 'The Center for Excellence in EMDR Therapy',
      title: 'Appendix B — Procedural Steps for Installing Future Templates',
      date: 'March 2026',
    },
  },
  {
    id: 'ft-5',
    protocol: 'future-template',
    phase: 'future',
    section: 'body',
    type: 'say',
    text: 'Notice your body response as you imagine handling it effectively.',
    fieldKey: 'body',
    source: {
      organisation: 'The Center for Excellence in EMDR Therapy',
      title: 'Appendix B — Procedural Steps for Installing Future Templates',
      date: 'March 2026',
    },
  },
  {
    id: 'ft-6',
    protocol: 'future-template',
    phase: 'future',
    section: 'rehearsal',
    type: 'bls-action',
    text: 'Run a mental rehearsal / movie of the desired response, then strengthen with BLS (Future Template preset). Repeat until ecologically appropriate. Capture obstacles as they arise — clinician decides next steps.',
    blsPreset: 'futureTemplate',
    source: {
      organisation: 'The Center for Excellence in EMDR Therapy',
      title: 'Appendix B — Procedural Steps for Installing Future Templates',
      date: 'March 2026',
    },
  },
];

export function FutureTemplatePage() {
  const bls = useBlsSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [scenario, setScenario] = useState('');
  const emergencyStop = useCallback(() => bls.stop(), [bls]);
  const blsRunning = bls.state.running && !bls.state.paused;

  useEffect(() => {
    bls.patchState(applyBlsPreset('futureTemplate', bls.stateRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="companion companion-v3 app-shell guided-practice-page">
      <GuidedPracticeConsole
        header={
          <>
            <div className="guided-top-nav">
              <Link to="/practice" className="brand">
                <span className="brand-mark" aria-hidden />
                <span>
                  <strong>Pathfinder</strong> Future Template
                </span>
              </Link>
            </div>
            <SessionHeaderBar
              model={{
                protocol: 'Future Template',
                phase: 'Installation / rehearsal',
                target: scenario || undefined,
              }}
              blsActive={blsRunning}
              onEmergencyStop={emergencyStop}
            />
          </>
        }
        script={
          <TherapistScriptPanel
            title="Future Template"
            sourceLabel="The Center for Excellence in EMDR Therapy — Appendix B (March 2026)"
            steps={STEPS}
            followMode
            stepIndex={stepIndex}
            onStepIndexChange={setStepIndex}
            onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))}
            onStartBls={() => void bls.start()}
            onStopBls={() => bls.stop()}
            blsRunning={blsRunning}
          >
            <label className="field">
              <span>Challenge scenario</span>
              <textarea rows={2} value={scenario} onChange={(e) => setScenario(e.target.value)} />
            </label>
          </TherapistScriptPanel>
        }
        clinicalControls={
          <>
            {bls.state.visualEnabled && (
              <BlsStage
                attachCanvas={bls.attachCanvas}
                label="Future Template BLS"
                trajectory={bls.state.visualMode}
                lockSize={blsRunning}
              />
            )}
            <LiveBlsPanel
              session={bls}
              recommendedPreset="futureTemplate"
              showAdvancedTaxation={false}
              onEmergencyStop={emergencyStop}
            />
          </>
        }
      />
    </div>
  );
}
