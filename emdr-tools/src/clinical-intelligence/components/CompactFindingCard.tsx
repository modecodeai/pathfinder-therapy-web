import { useState } from 'react';
import type {
  ClinicalSuggestion,
  ConfidenceLevel,
  EvidenceLevel,
  FindingDelta,
  ReviewStatus,
  TranscriptEvidence,
} from '../types';
import { DeltaBadge } from './ReviewShared';

export function evidenceLevelLabel(level: EvidenceLevel): string {
  switch (level) {
    case 'explicit':
      return 'Explicit';
    case 'inferred':
      return 'Inferred';
    case 'suggested':
      return 'Suggested';
    default:
      return 'Unknown';
  }
}

export function CompactFindingCard({
  finding,
  evidenceLevel,
  confidence,
  reviewStatus,
  evidence,
  findingDelta,
  selected,
  onSelect,
  onStatus,
  onViewEvidence,
  meta,
}: {
  finding: string;
  evidenceLevel: EvidenceLevel;
  confidence: ConfidenceLevel;
  reviewStatus: ReviewStatus;
  evidence: TranscriptEvidence[];
  findingDelta?: FindingDelta;
  selected?: boolean;
  onSelect?: (on: boolean) => void;
  onStatus: (s: ReviewStatus, edited?: string) => void;
  onViewEvidence: (excerpt: string) => void;
  meta?: string;
}) {
  const [openEvidence, setOpenEvidence] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(finding);

  return (
    <article className={`ci-compact-card status-${reviewStatus}`}>
      <div className="ci-compact-main">
        {onSelect && (
          <label className="ci-select">
            <input type="checkbox" checked={!!selected} onChange={(e) => onSelect(e.target.checked)} />
          </label>
        )}
        <div className="ci-compact-body">
          <div className="ci-compact-finding">
            <p className="ci-compact-text">{finding}</p>
            <DeltaBadge delta={findingDelta} />
          </div>
          {meta && <p className="hint">{meta}</p>}
          <dl className="ci-compact-meta">
            <div>
              <dt>Evidence Level</dt>
              <dd>{evidenceLevelLabel(evidenceLevel)}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{confidence}</dd>
            </div>
          </dl>
        </div>
        <div className="ci-compact-actions">
          <button
            type="button"
            className={reviewStatus === 'approved' || reviewStatus === 'edited' ? 'btn primary' : 'btn'}
            onClick={() => onStatus('approved')}
          >
            Approve
          </button>
          {!editing ? (
            <button
              type="button"
              className={reviewStatus === 'edited' ? 'btn primary' : 'btn'}
              onClick={() => {
                setDraft(finding);
                setEditing(true);
              }}
            >
              Edit
            </button>
          ) : (
            <span className="ci-inline-edit">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Edit finding" />
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  if (draft.trim()) onStatus('edited', draft.trim());
                  setEditing(false);
                }}
              >
                Save
              </button>
            </span>
          )}
          <button
            type="button"
            className={reviewStatus === 'rejected' ? 'btn primary' : 'btn ghost'}
            onClick={() => onStatus('rejected')}
          >
            Reject
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => setOpenEvidence((v) => !v)}
            aria-expanded={openEvidence}
          >
            {openEvidence ? 'Hide Evidence' : 'View Evidence'}
          </button>
        </div>
      </div>
      {openEvidence && (
        <div className="ci-compact-evidence">
          {!evidence?.length && <p className="hint">No evidence excerpts returned</p>}
          <ul className="ci-evidence-list">
            {evidence?.map((e, i) => (
              <li key={`${e.excerpt}-${i}`}>
                <q>{e.excerpt}</q>
                {e.speaker && <span className="hint">({e.speaker})</span>}
                <button type="button" className="btn ghost" onClick={() => onViewEvidence(e.excerpt)}>
                  Highlight in transcript
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export function suggestionToCompactProps(item: ClinicalSuggestion) {
  return {
    finding: item.value,
    evidenceLevel: item.evidenceLevel,
    confidence: item.confidence,
    reviewStatus: item.reviewStatus,
    evidence: item.evidence,
    findingDelta: item.findingDelta,
  };
}
