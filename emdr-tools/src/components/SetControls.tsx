import { TimingControls } from './bls/TimingControls';
import type { RoomState } from '../types/room';

interface SetControlsProps {
  state: RoomState;
  onChange: (partial: Partial<RoomState>) => void;
}

export function SetControls({ state, onChange }: SetControlsProps) {
  return (
    <div className="panel">
      <h2>Sets</h2>
      <TimingControls state={state} onChange={onChange} />
    </div>
  );
}
