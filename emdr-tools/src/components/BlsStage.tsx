import { useEffect, useRef } from 'react';
import type { BLSTrajectory } from '../emdr/types/emdr';

const ASPECT: Record<BLSTrajectory, string> = {
  horizontal: 'aspect-horizontal',
  blink: 'aspect-horizontal',
  'diagonal-up': 'aspect-diagonal',
  'diagonal-down': 'aspect-diagonal',
  vertical: 'aspect-vertical',
  infinity: 'aspect-infinity',
};

interface BlsStageProps {
  attachCanvas: (el: HTMLCanvasElement | null) => void;
  label?: string;
  fullscreen?: boolean;
  className?: string;
  trajectory?: BLSTrajectory;
  /** Freeze outer box size (e.g. during active set) */
  lockSize?: boolean;
}

export function BlsStage({
  attachCanvas,
  label,
  fullscreen = false,
  className = '',
  trajectory = 'horizontal',
  lockSize = false,
}: BlsStageProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    attachCanvas(ref.current);
    return () => attachCanvas(null);
  }, [attachCanvas]);

  const aspectClass = fullscreen ? '' : ASPECT[trajectory] ?? 'aspect-horizontal';

  return (
    <div
      className={`bls-stage-fit ${lockSize ? 'is-locked' : ''}`}
    >
      <div
        className={`bls-stage ${aspectClass} ${fullscreen ? 'is-fullscreen' : ''} ${className}`.trim()}
        role="img"
        aria-label="Bilateral stimulation stage"
      >
        <canvas ref={ref} className="bls-canvas" />
        {label && !fullscreen && <span className="bls-label">{label}</span>}
      </div>
    </div>
  );
}
