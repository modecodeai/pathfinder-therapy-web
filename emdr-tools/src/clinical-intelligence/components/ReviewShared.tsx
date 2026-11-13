import type { FindingDelta, ReviewStatus } from '../types';

export function deltaLabel(delta?: FindingDelta): string | null {
  if (!delta) return null;
  switch (delta) {
    case 'new':
      return 'New';
    case 'updated':
      return 'Updated';
    case 'possible-conflict':
      return 'Possible Conflict';
    case 'already-known':
      return 'Already Known';
    default:
      return null;
  }
}

export function DeltaBadge({ delta }: { delta?: FindingDelta }) {
  const label = deltaLabel(delta);
  if (!label) return null;
  return <span className={`ci-delta-badge delta-${delta}`}>{label}</span>;
}

export function ReviewActions({
  status,
  onStatus,
}: {
  status: ReviewStatus;
  onStatus: (s: ReviewStatus, edited?: string) => void;
}) {
  return (
    <div className="ci-review-actions">
      <button type="button" className={status === 'approved' ? 'btn primary' : 'btn'} onClick={() => onStatus('approved')}>
        Approve
      </button>
      <button
        type="button"
        className={status === 'edited' ? 'btn primary' : 'btn'}
        onClick={() => {
          const edited = window.prompt('Edit value for clinical record:');
          if (edited != null && edited.trim()) onStatus('edited', edited.trim());
        }}
      >
        Edit
      </button>
      <button type="button" className={status === 'rejected' ? 'btn primary' : 'btn ghost'} onClick={() => onStatus('rejected')}>
        Reject
      </button>
    </div>
  );
}

export function NotEstablished({ label }: { label: string }) {
  return <p className="ci-not-established">{label}: Not established</p>;
}
