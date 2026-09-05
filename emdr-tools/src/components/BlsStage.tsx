import { useEffect, useRef } from 'react';

interface BlsStageProps {
  attachCanvas: (el: HTMLCanvasElement | null) => void;
  label?: string;
  fullscreen?: boolean;
  className?: string;
}

export function BlsStage({
  attachCanvas,
  label,
  fullscreen = false,
  className = '',
}: BlsStageProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    attachCanvas(ref.current);
    return () => attachCanvas(null);
  }, [attachCanvas]);

  return (
    <div
      className={`bls-stage ${fullscreen ? 'is-fullscreen' : ''} ${className}`.trim()}
      role="img"
      aria-label="Bilateral stimulation stage"
    >
      <canvas ref={ref} className="bls-canvas" />
      {label && !fullscreen && <span className="bls-label">{label}</span>}
    </div>
  );
}
