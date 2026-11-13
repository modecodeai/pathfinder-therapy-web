import { groupSessionChanges } from '../lib/formulation';
import type { SessionChangeItem, SessionChangeKind, SessionChangeSummary } from '../types';

const LABELS: Record<SessionChangeKind, string> = {
  new: 'New this session',
  updated: 'Updated',
  unchanged: 'Unchanged',
  'possible-conflict': 'Possible conflict',
  'needs-clarification': 'Needs clarification',
};

function ChangeList({ title, items }: { title: string; items: SessionChangeItem[] }) {
  return (
    <div className="ci-session-change-group">
      <h4>{title}</h4>
      {!items.length ? (
        <p className="hint">None</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              <strong>{i.category}</strong>: {i.label}
              {i.detail ? <span className="hint"> — {i.detail}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SessionChangePanel({ summary }: { summary: SessionChangeSummary | null }) {
  if (!summary) {
    return (
      <section className="panel">
        <h2>Session-to-Session Change</h2>
        <p className="hint">Apply approved findings from a session to see longitudinal change here.</p>
      </section>
    );
  }
  const groups = groupSessionChanges(summary.items);
  return (
    <section className="panel ci-session-change">
      <h2>Session-to-Session Change</h2>
      <p className="hint">
        Phase: {summary.phase} · {new Date(summary.createdAt).toLocaleString()} · analysis{' '}
        {summary.analysisId}
      </p>
      <div className="ci-session-change-grid">
        {(Object.keys(LABELS) as SessionChangeKind[]).map((kind) => (
          <ChangeList key={kind} title={LABELS[kind]} items={groups[kind]} />
        ))}
      </div>
    </section>
  );
}
