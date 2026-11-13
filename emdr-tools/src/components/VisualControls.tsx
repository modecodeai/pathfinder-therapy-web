/**
 * Bridge: legacy VisualControls → shared BlsConfigurationPanel visual sections.
 */
import { BlsConfigurationPanel } from './bls/BlsConfigurationPanel';
import type { RoomState } from '../types/room';

interface VisualControlsProps {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
  running?: boolean;
}

export function VisualControls({ state, onChange, running }: VisualControlsProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Visual</h2>
      </div>
      <BlsConfigurationPanel
        state={state}
        onChange={onChange}
        section="visual"
        running={running}
        showModalityToggles
      />
    </div>
  );
}
