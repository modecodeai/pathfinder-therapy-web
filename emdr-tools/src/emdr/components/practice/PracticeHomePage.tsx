import { Link } from 'react-router-dom';
import { AppHeader } from '../../guided/components/AppHeader';
import { loadStandardSession, STANDARD_PHASE_LABELS } from '../../guided/lib/standardSession';
import { loadPainWorkspace } from '../../lib/emdr-pain/painHelpers';
import { PAIN_STAGE_LABELS } from '../../types/painProtocol';

function IconPhases() {
  return (
    <svg className="pf-card-icon" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3v9l6 3" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconPain() {
  return (
    <svg className="pf-card-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21c-4-3.5-7-6.4-7-10a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 19 11c0 3.6-3 6.5-7 10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg className="pf-card-icon" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="pf-card-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function IconBook() {
  return (
    <svg className="pf-card-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function PracticeHomePage() {
  const standard = loadStandardSession();
  const pain = loadPainWorkspace();
  const hasStandard =
    Boolean(standard.target.label || standard.target.image || standard.timeline.length) ||
    standard.updatedAt !== undefined;
  const hasPain = pain.stage !== 'dashboard' || pain.completedStages.length > 0;

  return (
    <div className="practice-shell">
      <AppHeader activeNav="practice" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/practice">Practice</Link>
          </p>
          <h1>Guided EMDR Practice</h1>
          <p className="lede">
            Use guided protocols, live BLS and clinical scripts together in one workspace.
          </p>
        </header>

        <section className="pf-section">
          <h2 className="pf-section-title">Primary workflows</h2>
          <div className="pf-card-grid pf-card-grid-primary">
            <Link className="pf-practice-card is-primary" to="/practice/standard">
              <IconPhases />
              <h3>Standard EMDR</h3>
              <p>
                Guided eight-phase EMDR practice with live BLS, target tracking and clinical scripts.
              </p>
              <span className="pf-card-cta">Start guided practice →</span>
            </Link>
            <Link className="pf-practice-card is-primary" to="/pain">
              <IconPain />
              <h3>EMDR Pain</h3>
              <p>
                Guided chronic pain workflow using the Mark Grant pain protocol and pain-specific BLS
                settings.
              </p>
              <span className="pf-card-cta">Open pain workspace →</span>
            </Link>
            <Link className="pf-practice-card is-primary" to="/practice/emd">
              <IconTarget />
              <h3>EMD</h3>
              <p>Focused desensitisation using shorter BLS sets and repeated return to target.</p>
              <span className="pf-card-cta">Start EMD →</span>
            </Link>
            <Link className="pf-practice-card is-primary" to="/practice/safe-calm">
              <IconShield />
              <h3>Resourcing</h3>
              <p>Safe/Calm State, RDI, grounding and stabilisation tools with integrated BLS.</p>
              <span className="pf-card-cta">Open resourcing →</span>
            </Link>
          </div>
        </section>

        {(hasStandard || hasPain) && (
          <section className="pf-section">
            <h2 className="pf-section-title">Continue session</h2>
            <div className="pf-resume-grid">
              {hasStandard && (
                <article className="pf-resume-card">
                  <div>
                    <h3>Standard EMDR</h3>
                    <p>{STANDARD_PHASE_LABELS[standard.phase]}</p>
                    <p className="hint">
                      Last active:{' '}
                      {standard.updatedAt
                        ? new Date(standard.updatedAt).toLocaleString()
                        : 'This browser'}
                    </p>
                  </div>
                  <Link className="btn primary" to="/practice/standard">
                    Resume →
                  </Link>
                </article>
              )}
              {hasPain && (
                <article className="pf-resume-card">
                  <div>
                    <h3>EMDR Pain</h3>
                    <p>{PAIN_STAGE_LABELS[pain.stage] ?? pain.stage}</p>
                    <p className="hint">
                      Current SUD:{' '}
                      {pain.assessment.currentSud ?? pain.assessment.baselineSud ?? '—'}
                    </p>
                  </div>
                  <Link className="btn primary" to="/pain">
                    Resume →
                  </Link>
                </article>
              )}
            </div>
          </section>
        )}

        <section className="pf-section">
          <h2 className="pf-section-title">Tools</h2>
          <div className="pf-card-grid">
            <Link className="pf-practice-card" to="/practice/library">
              <IconBook />
              <h3>Clinical Library</h3>
              <p>Search EMDR scripts, protocols, techniques and clinical guidance.</p>
              <span className="pf-card-cta">Browse library →</span>
            </Link>
            <Link className="pf-practice-card" to="/session">
              <IconPhases />
              <h3>Session Companion</h3>
              <p>Quick access to guided protocol, live BLS and advanced processing tools.</p>
              <span className="pf-card-cta">Open companion →</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
