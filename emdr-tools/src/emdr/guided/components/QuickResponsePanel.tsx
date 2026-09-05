import { useState } from 'react';

export type QuickResponseTag =
  | 'image'
  | 'thought'
  | 'emotion'
  | 'body'
  | 'memory'
  | 'insight'
  | 'change'
  | 'no-change'
  | 'more-distress'
  | 'less-distress'
  | 'stop'
  | 'other';

const TAGS: Array<{ id: QuickResponseTag; label: string }> = [
  { id: 'image', label: 'Image' },
  { id: 'thought', label: 'Thought' },
  { id: 'emotion', label: 'Emotion' },
  { id: 'body', label: 'Body sensation' },
  { id: 'memory', label: 'Memory' },
  { id: 'insight', label: 'Insight' },
  { id: 'change', label: 'Change' },
  { id: 'no-change', label: 'No change' },
  { id: 'more-distress', label: 'More distress' },
  { id: 'less-distress', label: 'Less distress' },
  { id: 'stop', label: 'Stop' },
  { id: 'other', label: 'Other' },
];

interface Props {
  onSave: (payload: { tags: QuickResponseTag[]; words: string; sud?: number | null }) => void;
  onStopSignal?: () => void;
  /** Saving must not stop BLS unless protocol says so */
  showSud?: boolean;
  title?: string;
}

export function QuickResponsePanel({
  onSave,
  onStopSignal,
  showSud = true,
  title = 'Quick response',
}: Props) {
  const [tags, setTags] = useState<QuickResponseTag[]>([]);
  const [words, setWords] = useState('');
  const [sud, setSud] = useState<string>('');

  const toggle = (id: QuickResponseTag) => {
    if (id === 'stop') {
      onStopSignal?.();
      setTags((prev) => (prev.includes('stop') ? prev : [...prev, 'stop']));
      return;
    }
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const save = () => {
    onSave({
      tags,
      words: words.trim(),
      sud: sud === '' ? null : Number(sud),
    });
    setWords('');
    setTags([]);
  };

  return (
    <section className="quick-response-panel panel" aria-label="Quick response">
      <h3>{title}</h3>
      <div className="quick-response-tags" role="group" aria-label="Response tags">
        {TAGS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn ghost quick-tag${tags.includes(t.id) ? ' is-active' : ''}${
              t.id === 'stop' ? ' danger-outline' : ''
            }`}
            onClick={() => toggle(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Client&apos;s exact words</span>
        <textarea
          rows={2}
          value={words}
          onChange={(e) => setWords(e.target.value)}
          placeholder="Record briefly…"
        />
      </label>
      {showSud && (
        <label className="field">
          <span>New SUD (optional)</span>
          <input
            type="number"
            min={0}
            max={10}
            value={sud}
            onChange={(e) => setSud(e.target.value)}
          />
        </label>
      )}
      <button type="button" className="btn primary" onClick={save} disabled={!words && tags.length === 0}>
        Save response
      </button>
      <p className="hint">Saving does not stop BLS unless you press Stop / Client stop signal.</p>
    </section>
  );
}
