import type { WorkingMemoryLoad } from '../../types/emdrTaxation';
import { WORKING_MEMORY_LOAD_LABELS } from '../../types/emdrTaxation';

interface Props {
  load: WorkingMemoryLoad;
  compact?: boolean;
}

/** Interface estimate of relative task complexity — not a physiological measure. */
export function TaxationIndicator({ load, compact }: Props) {
  return (
    <div
      className={`taxation-indicator load-${load}${compact ? ' is-compact' : ''}`}
      title="This indicates the relative complexity of the tasks selected. It does not measure the client’s actual working-memory load."
    >
      <span className="taxation-indicator-label">Working Memory Load</span>
      <strong className="taxation-indicator-value">{WORKING_MEMORY_LOAD_LABELS[load]}</strong>
      {!compact && (
        <p className="hint taxation-indicator-hint">
          Relative task complexity (interface estimate) — not a physiological measurement.
        </p>
      )}
    </div>
  );
}
