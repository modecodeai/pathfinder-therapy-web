import type { EMDRScript, ScriptSectionType } from './types';
import { SECTION_LABELS } from './types';

interface ScriptCardProps {
  script: EMDRScript;
  mode: 'quick' | 'guide';
  favourite?: boolean;
  note?: string;
  onToggleFavourite?: () => void;
  onNoteChange?: (note: string) => void;
  compact?: boolean;
}

export function ScriptCard({
  script,
  mode,
  favourite,
  note,
  onToggleFavourite,
  onNoteChange,
  compact,
}: ScriptCardProps) {
  const sections =
    mode === 'quick'
      ? script.sections.filter((s) => s.type === 'say' || s.type === 'ask' || s.type === 'decision-point' || s.type === 'caution').slice(0, 6)
      : script.sections;

  return (
    <article className={`script-card ${compact ? 'is-compact' : ''}`}>
      <header className="script-card-head">
        <div>
          <h3>{script.title}</h3>
          <p className="script-meta">Source-informed Pathfinder prompt</p>
        </div>
        {onToggleFavourite && (
          <button
            type="button"
            className={`btn ghost fav-btn ${favourite ? 'is-on' : ''}`}
            aria-pressed={favourite}
            onClick={onToggleFavourite}
          >
            {favourite ? '★ Saved' : '☆ Save'}
          </button>
        )}
      </header>

      {script.requiresClinicalReview && (
        <p className="banner notice">CONTENT_REQUIRES_CLINICAL_REVIEW</p>
      )}

      {mode === 'guide' && script.clinicalNote && (
        <p className="hint">{script.clinicalNote}</p>
      )}

      <div className="script-sections">
        {sections.map((sec, i) => (
          <div key={i} className={`script-block type-${sec.type ?? 'instruction'}`}>
            <span className="script-label">
              {sec.type ? SECTION_LABELS[sec.type as ScriptSectionType] : 'NOTE'}
              {sec.heading ? ` · ${sec.heading}` : ''}
            </span>
            <p>{sec.text}</p>
          </div>
        ))}
      </div>

      {script.caution && mode === 'guide' && (
        <div className="script-block type-caution">
          <span className="script-label">CAUTION</span>
          <p>{script.caution}</p>
        </div>
      )}

      {onNoteChange && (
        <label className="field">
          <span>My reminder (therapist-only)</span>
          <textarea
            rows={2}
            value={note ?? ''}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Optional personal training note — not a client record"
          />
        </label>
      )}

      {mode === 'guide' && (
        <p className="script-footer">
          Based on Pathfinder’s EMDR training reference framework.
        </p>
      )}
    </article>
  );
}
