import { Link } from 'react-router-dom';

/**
 * Recent Traumatic Events — protocol slot.
 * Source worksheet is referenced; steps are not invented beyond labelled guidance.
 */
export function RecentEventsPage() {
  return (
    <div className="practice-shell">
      <header className="companion-top">
        <Link to="/practice" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Recent Traumatic Events
          </span>
        </Link>
      </header>
      <main className="practice-main">
        <h1>Recent Traumatic Events Protocol</h1>
        <div className="panel">
          <p>
            <span className="badge-protocol">Source</span> The Center for Excellence in EMDR Therapy —
            Appendix B — Recent Traumatic Events Protocol Worksheet (March 2026)
          </p>
          <p>
            This slot is reserved for the training-suite Recent Traumatic Events workflow. Full
            procedural steps should be taken from the clinician&apos;s licensed worksheet packet.
          </p>
          <p className="hint">
            Placeholder rather than fabricated clinical guidance. Use Standard EMDR Phase tools,
            EMD, or Safe/Calm as clinically indicated while consulting your source materials.
          </p>
          <div className="stack-btns horizontal wrap">
            <Link className="btn primary" to="/practice/standard">
              Open Standard EMDR console
            </Link>
            <Link className="btn" to="/practice/emd">
              Open EMD
            </Link>
            <Link className="btn ghost" to="/practice/library">
              Clinical Library
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
