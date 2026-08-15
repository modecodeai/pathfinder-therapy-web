import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../guided/components/AppHeader';
import {
  CLINICAL_LIBRARY,
  LIBRARY_SECTIONS,
  SCREENING_TOOL_INDEX,
  type LibraryItem,
} from '../../data/library/clinicalLibrary';

const FILTERS = ['All', ...LIBRARY_SECTIONS] as const;
const SCROLL_KEY = 'pathfinder.emdr.libraryScroll';

function sourceShort(item: LibraryItem): string {
  return item.source.organisation || item.source.author || item.source.title;
}

function matchesQuery(item: LibraryItem, q: string): boolean {
  if (!q) return true;
  const hay = [
    item.title,
    item.summary,
    item.section,
    item.source.title,
    item.source.organisation,
    item.source.author,
    item.kind,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function ClinicalLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [detail, setDetail] = useState<LibraryItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CLINICAL_LIBRARY.filter((item) => {
      if (filter !== 'All' && item.section !== filter) return false;
      return matchesQuery(item, q);
    });
  }, [query, filter]);

  useEffect(() => {
    const y = Number(sessionStorage.getItem(SCROLL_KEY) || '0');
    if (y > 0) window.scrollTo(0, y);
    const onScroll = () => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const openItem = (item: LibraryItem) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    setDetail(item);
  };

  if (detail) {
    return (
      <div className="practice-shell">
        <AppHeader activeNav="resources" />
        <main className="practice-main">
          <button type="button" className="btn ghost" onClick={() => setDetail(null)}>
            ← Clinical Library
          </button>
          <header className="pf-page-header">
            <p className="pf-eyebrow">{detail.section}</p>
            <h1>{detail.title}</h1>
            <p className="lede">{detail.summary}</p>
          </header>
          <div className="stack-btns horizontal wrap">
            {detail.guidedRoute && (
              <button
                type="button"
                className="btn primary"
                onClick={() => navigate(detail.guidedRoute!)}
              >
                Open Guided Mode
              </button>
            )}
            <button type="button" className="btn" onClick={() => setDetail(null)}>
              Reference
            </button>
          </div>
          <section className="panel pf-detail-block">
            <h2>Overview</h2>
            <p>{detail.summary}</p>
            <h2>Source</h2>
            <p>
              {[detail.source.organisation, detail.source.author, detail.source.title, detail.source.date]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="hint">Kind: {detail.kind}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="practice-shell">
      <AppHeader activeNav="resources" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/practice">Practice</Link>
            <span aria-hidden> › </span>
            Clinical Library
          </p>
          <h1>Clinical Library</h1>
          <p className="lede">
            Structured EMDR scripts, guidance and clinical reference tools.
          </p>
        </header>

        <div className="pf-library-toolbar">
          <label className="pf-search-field">
            <span className="sr-only">Search clinical resources</span>
            <input
              type="search"
              placeholder="Search scripts, phases, techniques and resources…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="pf-filter-chips" role="group" aria-label="Library filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`pf-filter-chip${filter === f ? ' is-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {(filter === 'All' ? LIBRARY_SECTIONS : [filter]).map((section) => {
          const items = filtered.filter((i) => i.section === section);
          if (!items.length) return null;
          return (
            <section key={section} className="pf-section library-section">
              <h2 className="pf-section-title">{section}</h2>
              <div className="pf-library-grid">
                {items.map((item) => (
                  <article key={item.id} className="pf-library-card">
                    <button
                      type="button"
                      className="pf-library-card-main"
                      onClick={() => openItem(item)}
                    >
                      <span className="pf-library-cat">{item.section}</span>
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                    </button>
                    <div className="pf-library-card-foot">
                      <button
                        type="button"
                        className="pf-source-badge"
                        onClick={() =>
                          setExpandedSource((id) => (id === item.id ? null : item.id))
                        }
                        aria-expanded={expandedSource === item.id}
                      >
                        Source · {sourceShort(item)}
                      </button>
                      {expandedSource === item.id && (
                        <p className="pf-source-expand">
                          {[
                            item.source.organisation,
                            item.source.author,
                            item.source.title,
                            item.source.date,
                          ]
                            .filter(Boolean)
                            .join('\n')}
                        </p>
                      )}
                      <div className="stack-btns horizontal wrap">
                        {item.guidedRoute ? (
                          <Link className="btn primary" to={item.guidedRoute}>
                            Open Guided Mode
                          </Link>
                        ) : (
                          <button type="button" className="btn" onClick={() => openItem(item)}>
                            Open
                          </button>
                        )}
                        <button type="button" className="btn ghost" onClick={() => openItem(item)}>
                          Reference
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {!filtered.length && <p className="hint">No resources match this search.</p>}

        <section id="screening" className="pf-section library-section">
          <h2 className="pf-section-title">Screening & Measures</h2>
          <p className="hint">
            Source: EMDRIA Phase One Toolkit. Proprietary instruments are listed for reference only —
            obtain licensed copies externally.
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
