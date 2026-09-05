import { Link } from 'react-router-dom';
import type { ClinicalCycleState } from '../types';
import { TRANSCRIPT_STATUS_LABELS } from '../lib/clinicalCycle';

/** Persistent client/session context — UX Rule #2: context before data. */
export function ClinicalContextBar({
  clientName,
  clientId,
  cycle,
  draftStatus,
}: {
  clientName: string;
  clientId: string;
  cycle?: ClinicalCycleState | null;
  draftStatus?: 'saved' | 'saving' | 'unsaved' | null;
}) {
  return (
    <div className="clinical-context-bar" role="region" aria-label="Current client context">
      <div className="clinical-context-primary">
        <Link to={`/clients/${clientId}`} className="clinical-context-name">
          {clientName}
        </Link>
        {cycle ? (
          <span className="pf-meta">
            {cycle.protocol}
            {cycle.phase ? ` · ${cycle.phase}` : ''}
            {cycle.targetHeadline ? ` · ${cycle.targetHeadline}` : ''}
          </span>
        ) : (
          <span className="pf-meta">No active clinical cycle</span>
        )}
      </div>
      <div className="clinical-context-meta">
        {cycle?.sessionDate ? <span>{cycle.sessionDate}</span> : null}
        {cycle?.sud != null || cycle?.voc != null ? (
          <span>
            SUD {cycle.sud ?? '—'} / VoC {cycle.voc ?? '—'}
          </span>
        ) : null}
        {cycle ? (
          <span>{TRANSCRIPT_STATUS_LABELS[cycle.transcriptStatus]}</span>
        ) : null}
        {draftStatus ? (
          <span className="clinical-draft-status" data-status={draftStatus}>
            {draftStatus === 'saving'
              ? 'Saving…'
              : draftStatus === 'unsaved'
                ? 'Unsaved changes'
                : 'Saved'}
          </span>
        ) : null}
      </div>
    </div>
  );
}
