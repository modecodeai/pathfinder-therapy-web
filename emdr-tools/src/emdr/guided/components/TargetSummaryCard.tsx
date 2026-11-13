import type { TargetSummary } from '../types/guidedScript';

interface Props {
  target: TargetSummary | null | undefined;
  compact?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function TargetSummaryCard({ target, compact, collapsed, onToggle }: Props) {
  if (!target) return null;
  const title = target.label || 'Target';

  return (
    <section className={`target-summary-card${compact ? ' is-compact' : ''}`} aria-label="Target summary">
      <header className="target-summary-head">
        <h3>Target</h3>
        {onToggle && (
          <button type="button" className="btn ghost" onClick={onToggle}>
            {collapsed ? 'Show' : 'Hide'}
          </button>
        )}
      </header>
      {!collapsed && (
        <dl className="target-summary-grid">
          <div>
            <dt>Memory</dt>
            <dd>
              {target.age ? `Age ${target.age} — ` : ''}
              {title}
            </dd>
          </div>
          {target.image && (
            <div>
              <dt>Image</dt>
              <dd>{target.image}</dd>
            </div>
          )}
          {target.nc && (
            <div>
              <dt>NC</dt>
              <dd>{target.nc}</dd>
            </div>
          )}
          {target.pc && (
            <div>
              <dt>PC</dt>
              <dd>{target.pc}</dd>
            </div>
          )}
          {target.voc !== undefined && (
            <div>
              <dt>VOC</dt>
              <dd>{target.voc == null ? '—' : target.voc}</dd>
            </div>
          )}
          {target.sud !== undefined && (
            <div>
              <dt>SUD</dt>
              <dd>{target.sud == null ? '—' : target.sud}</dd>
            </div>
          )}
          {target.body && (
            <div>
              <dt>Body</dt>
              <dd>{target.body}</dd>
            </div>
          )}
          {target.emotion && (
            <div>
              <dt>Emotion</dt>
              <dd>{target.emotion}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
