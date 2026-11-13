import {
  CYCLE_RAIL_STEPS,
  WORKFLOW_STATUS_LABELS,
  railStepForStatus,
} from '../lib/clinicalCycle';
import type { ClinicalCycleState, CycleWorkflowStatus } from '../types';

export function ClinicalCycleRail({
  cycle,
  status,
}: {
  cycle?: ClinicalCycleState | null;
  status?: CycleWorkflowStatus;
}) {
  const workflow = status ?? cycle?.workflowStatus ?? 'not-started';
  const active = railStepForStatus(workflow);
  const activeIdx = CYCLE_RAIL_STEPS.findIndex((s) => s.id === active);

  return (
    <div className="clinical-cycle-rail" aria-label="Clinical cycle status">
      <p className="clinical-cycle-rail-status">
        <span className="pf-meta">Clinical cycle</span>{' '}
        <strong>{WORKFLOW_STATUS_LABELS[workflow]}</strong>
        {cycle?.sessionId ? (
          <span className="pf-meta clinical-cycle-session-id"> · {cycle.sessionId}</span>
        ) : null}
      </p>
      <ol className="clinical-cycle-rail-steps">
        {CYCLE_RAIL_STEPS.map((step, i) => {
          const state = i < activeIdx ? 'done' : i === activeIdx ? 'current' : 'upcoming';
          return (
            <li key={step.id} data-state={state}>
              <span className="clinical-cycle-rail-dot" aria-hidden />
              <span className="clinical-cycle-rail-label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
