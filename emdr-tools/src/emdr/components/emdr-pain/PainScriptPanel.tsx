import type { ProtocolScriptSection } from '../../types/painProtocol';

interface Props {
  section: ProtocolScriptSection | null | undefined;
  open: boolean;
  onToggle: () => void;
  pinned: boolean;
  onPin: () => void;
  onCopy: () => void;
  note: string;
  onNote: (v: string) => void;
  onMarkComplete?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function PainScriptPanel({
  section,
  open,
  onToggle,
  pinned,
  onPin,
  onCopy,
  note,
  onNote,
  onMarkComplete,
  onPrev,
  onNext,
}: Props) {
  if (!section && !open) return null;
  return (
    <aside className={`pain-script-panel${pinned ? ' is-pinned' : ''}${open ? '' : ' is-collapsed'}`}>
      <header className="pain-script-head">
        <div>
          <h3>Therapist Script</h3>
          {section && (
            <p className="hint">
              <span className="badge-protocol">Protocol Guidance</span> · {section.source}
            </p>
          )}
        </div>
        <div className="stack-btns horizontal">
          <button type="button" className="btn ghost" onClick={onToggle}>
            {open ? 'Collapse' : 'Expand'}
          </button>
          <button type="button" className="btn ghost" onClick={onPin}>
            {pinned ? 'Unpin' : 'Pin Script'}
          </button>
        </div>
      </header>
      {open && section && (
        <div className="pain-script-body">
          <h4>{section.title}</h4>
          <pre className="pain-script-text">{section.script}</pre>
          {section.clinicalNotes?.map((n) => (
            <p key={n} className="hint">
              {n}
            </p>
          ))}
          <div className="stack-btns horizontal">
            {onPrev && (
              <button type="button" className="btn ghost" onClick={onPrev}>
                Previous
              </button>
            )}
            {onNext && (
              <button type="button" className="btn ghost" onClick={onNext}>
                Next
              </button>
            )}
            <button type="button" className="btn" onClick={onCopy}>
              Copy Section
            </button>
            {onMarkComplete && (
              <button type="button" className="btn primary" onClick={onMarkComplete}>
                Mark Complete
              </button>
            )}
          </div>
          <label className="field">
            <span>Add Note</span>
            <textarea rows={2} value={note} onChange={(e) => onNote(e.target.value)} />
          </label>
        </div>
      )}
    </aside>
  );
}
