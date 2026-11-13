import { AudioControls } from '../AudioControls';
import { TimingControls } from './TimingControls';
import {
  InfinityControls,
  StimulusAppearanceControls,
  TrajectorySelector,
} from './VisualBlsControls';
import type { RoomState } from '../../types/room';

export type BlsPanelSection = 'visual' | 'audio' | 'timing' | 'all';

interface Props {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
  section?: BlsPanelSection;
  running?: boolean;
  compact?: boolean;
  showModalityToggles?: boolean;
}

/**
 * Shared BLS configuration controls used by Studio and Session Companion.
 */
export function BlsConfigurationPanel({
  state,
  onChange,
  section = 'all',
  running,
  compact,
  showModalityToggles = true,
}: Props) {
  const showVisual = section === 'all' || section === 'visual';
  const showAudio = section === 'all' || section === 'audio';
  const showTiming = section === 'all' || section === 'timing';

  return (
    <div className={`bls-config-panel ${compact ? 'is-compact' : ''}`}>
      {showModalityToggles && showVisual && (
        <label className="toggle block">
          <input
            type="checkbox"
            checked={state.visualEnabled}
            onChange={(e) =>
              onChange({
                visualEnabled: e.target.checked,
                audioOnly: e.target.checked ? false : state.audioOnly,
              })
            }
          />
          <span>Visual stimulation</span>
        </label>
      )}

      {showVisual && (
        <>
          <TrajectorySelector state={state} onChange={onChange} running={running} compact={compact} />
          <InfinityControls state={state} onChange={onChange} compact={compact} />
          <StimulusAppearanceControls state={state} onChange={onChange} compact={compact} />
        </>
      )}

      {showTiming && <TimingControls state={state} onChange={onChange} compact={compact} />}

      {showAudio && (
        <div className="bls-audio-wrap">
          <AudioControls state={state} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
