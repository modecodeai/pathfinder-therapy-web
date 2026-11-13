import type { ProcessingTimelineEntry } from '../types/guidedScript';

interface Props {
  entries: ProcessingTimelineEntry[];
  maxVisible?: number;
}

export function ProcessingTimeline({ entries, maxVisible = 12 }: Props) {
  const visible = entries.slice(-maxVisible).reverse();
  if (visible.length === 0) {
    return (
      <section className="processing-timeline panel" aria-label="Processing timeline">
        <h3>Processing timeline</h3>
        <p className="hint">Sets and responses will appear here.</p>
      </section>
    );
  }

  return (
    <section className="processing-timeline panel" aria-label="Processing timeline">
      <h3>Processing timeline</h3>
      <ol className="processing-timeline-list">
        {visible.map((e) => (
          <li key={e.id}>
            <time>{e.at}</time>
            <div>
              {e.setNumber != null && (
                <strong>
                  Set {e.setNumber}
                  {e.modality ? ` — ${e.modality}` : ''}
                  {e.mode ? ` — ${e.mode}` : ''}
                  {e.durationSec != null ? ` — ${e.durationSec} sec` : ''}
                </strong>
              )}
              <p>{e.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
