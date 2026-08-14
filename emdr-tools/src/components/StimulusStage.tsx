import { useEffect, useRef } from 'react';

interface StimulusStageProps {
  attachCanvas: (el: HTMLCanvasElement | null) => void;
  label?: string;
  fullscreen?: boolean;
  className?: string;
}

export function StimulusStage({
  attachCanvas,
  label = 'Client preview',
  fullscreen = false,
  className = '',
}: StimulusStageProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    attachCanvas(ref.current);
    return () => attachCanvas(null);
  }, [attachCanvas]);

  return (
    <div className={`stimulus-stage ${fullscreen ? 'is-fullscreen' : ''} ${className}`.trim()}>
      <canvas ref={ref} className="stimulus-canvas" aria-label="Bilateral stimulation stage" />
      {!fullscreen && <span className="stimulus-label">{label}</span>}
    </div>
  );
}
