import { Link } from 'react-router-dom';
import { loadStandardSession } from '../../guided/lib/standardSession';
import { loadPainWorkspace } from '../../lib/emdr-pain/painHelpers';

export function PracticeHomePage() {
  const standard = loadStandardSession();
  const pain = loadPainWorkspace();
  const hasStandard =
    Boolean(standard.target.label || standard.target.image || standard.timeline.length) ||
    standard.phase !== 'assessment';
  const hasPain = pain.stage !== 'dashboard' || pain.completedStages.length > 0;

  return (
    <div className="practice-home app-shell">
      <header className="companion-top">
        <div className="companion-brand">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Pathfinder</strong> EMDR
            </span>
          </Link>
        </div>
        <nav className="companion-meta" aria-label="Primary">
          <Link className="btn ghost" to="/practice" aria-current="page">
            Practice
          </Link>
          <Link className="btn ghost" to="/pain">
            Protocols
          </Link>
          <Link className="btn ghost" to="/resources">
            Scripts
          </Link>
          <Link className="btn ghost" to="/practice/library">
            Resources
          </Link>
          <Link className="btn ghost" to="/account">
            Settings
          </Link>
        </nav>
      </header>

      <main className="practice-home-main">
        <h1>Guided EMDR Practice</h1>
        <p className="lede">
          Conduct EMDR with a digital protocol beside you — read, speak, start BLS, observe, record,
          continue — without changing screens.
        </p>

        <div className="practice-home-grid">
          <Link className="panel practice-card" to="/practice/standard">
            <h2>Standard EMDR</h2>
            <p>Guided eight-phase EMDR practice with persistent target summary and live BLS.</p>
          </Link>
          <Link className="panel practice-card" to="/pain">
            <h2>EMDR Pain</h2>
            <p>Mark Grant-informed pain workflow on the same clinical console.</p>
          </Link>
          <Link className="panel practice-card" to="/practice/emd">
            <h2>EMD</h2>
            <p>Focused desensitisation / stabilisation with short sets and return to target.</p>
          </Link>
          <Link className="panel practice-card" to="/practice/safe-calm">
            <h2>Resourcing</h2>
            <p>Safe/Calm, RDI, grounding and state-change strategies with BLS in-script.</p>
          </Link>
          {(hasStandard || hasPain) && (
            <div className="panel practice-card practice-card-continue">
              <h2>Continue Session</h2>
              <p>Resume an active session in this browser.</p>
              <div className="stack-btns horizontal wrap">
                {hasStandard && (
                  <Link className="btn primary" to="/practice/standard">
                    Standard · {standard.phase}
                  </Link>
                )}
                {hasPain && (
                  <Link className="btn primary" to="/pain">
                    Pain · {pain.stage}
                  </Link>
                )}
              </div>
            </div>
          )}
          <Link className="panel practice-card" to="/practice/library">
            <h2>Clinical Library</h2>
            <p>Source-labelled practice tools from the training suite — not a PDF dump.</p>
          </Link>
          <Link className="panel practice-card" to="/session">
            <h2>Classic Session Companion</h2>
            <p>Existing phase companion with full Working Memory Taxation controls.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
