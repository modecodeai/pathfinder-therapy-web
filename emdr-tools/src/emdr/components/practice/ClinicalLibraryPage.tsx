import { Link } from 'react-router-dom';
import {
  CLINICAL_LIBRARY,
  LIBRARY_SECTIONS,
  SCREENING_TOOL_INDEX,
} from '../../data/library/clinicalLibrary';

export function ClinicalLibraryPage() {
  return (
    <div className="practice-home app-shell">
      <header className="companion-top">
        <Link to="/practice" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Clinical Library
          </span>
        </Link>
        <nav className="companion-meta">
          <Link className="btn ghost" to="/practice">
            Practice
          </Link>
          <Link className="btn ghost" to="/resources">
            Scripts
          </Link>
        </nav>
      </header>
      <main className="practice-home-main">
        <h1>Clinical Library</h1>
        <p className="lede">
          Navigable practice tools with source labels. Proprietary training PDFs are not offered for
          public download — structured guidance only for clinician personal use.
        </p>

        {LIBRARY_SECTIONS.map((section) => {
          const items = CLINICAL_LIBRARY.filter((i) => i.section === section);
          if (!items.length) return null;
          return (
            <section key={section} className="library-section">
              <h2>{section}</h2>
              <div className="practice-home-grid">
                {items.map((item) => (
                  <article key={item.id} className="panel practice-card">
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <p className="script-source">
                      <span className="badge-protocol">Source</span>{' '}
                      {[item.source.organisation, item.source.author, item.source.title, item.source.date]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {item.guidedRoute && (
                      <Link className="btn primary" to={item.guidedRoute}>
                        Open in Guided Mode
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <section id="screening" className="library-section">
          <h2>Screening & Measures</h2>
          <p className="hint">
            Source: EMDRIA Phase One Toolkit. Do not reproduce proprietary assessments here. Status
            indicates how to obtain the instrument externally.
          </p>
          <div className="screening-table-wrap">
            <table className="screening-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Purpose</th>
                  <th>When useful</th>
                  <th>Status / external source</th>
                </tr>
              </thead>
              <tbody>
                {SCREENING_TOOL_INDEX.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.purpose}</td>
                    <td>{t.whenUseful}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
