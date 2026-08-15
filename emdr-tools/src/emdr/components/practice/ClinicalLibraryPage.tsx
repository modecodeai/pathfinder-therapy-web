import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from '../../guided/components/AppHeader';
import {
  CLINICAL_LIBRARY,
  LIBRARY_SECTIONS,
  SCREENING_TOOL_INDEX,
  getLibraryItem,
  type LibraryItem,
} from '../../data/library/clinicalLibrary';

const FILTERS = ['All', ...LIBRARY_SECTIONS] as const;
const SCROLL_KEY = 'pathfinder.emdr.libraryScroll';

function sourceShort(item: LibraryItem): string {
  return item.source.organisation || item.source.author || item.source.title;
}

function sourceFull(item: LibraryItem): string {
  return [item.source.organisation, item.source.author, item.source.title, item.source.date, item.source.page]
    .filter(Boolean)
    .join(' · ');
}

function matchesQuery(item: LibraryItem, q: string): boolean {
  if (!q) return true;
  const hay = [
    item.title,
    item.description,
    item.overview,
    item.section,
    item.source.title,
    item.source.organisation,
    item.source.author,
    item.kind,
    item.phaseLabel,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function LibraryDetail({ item }: { item: LibraryItem }) {
  const navigate = useNavigate();
  const related = item.relatedIds
    .map((id) => getLibraryItem(id))
    .filter((x): x is LibraryItem => Boolean(x));

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="resources" />
      <main className="practice-main">
        <button type="button" className="btn ghost" onClick={() => navigate('/practice/library')}>
          ← Clinical Library
        </button>
        <header className="pf-page-header">
          <p className="pf-eyebrow">{item.phaseLabel || item.section}</p>
          <h1>{item.title}</h1>
          <p className="lede">{item.description}</p>
        </header>
        <div className="stack-btns horizontal wrap">
          {item.guidedRoute && item.id !== 'screening' && (
            <button type="button" className="btn primary" onClick={() => navigate(item.guidedRoute!)}>
              Open Guided Mode
            </button>
          )}
          <button type="button" className="btn" onClick={() => navigate('/practice/library')}>
            Back to library
          </button>
        </div>
        <section className="panel pf-detail-block">
          <h2>Overview</h2>
          {item.overview.split('\n\n').map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}

          {item.therapistScript.length > 0 && (
            <>
              <h2>Therapist Script</h2>
              {item.therapistScript.map((line) => (
                <p key={line.slice(0, 40)} className="pf-script-block">
                  {line}
                </p>
              ))}
            </>
          )}

          {item.considerations.length > 0 && (
            <>
              <h2>Clinical Considerations</h2>
              <ul>
                {item.considerations.map((c) => (
                  <li key={c.slice(0, 48)}>{c}</li>
                ))}
              </ul>
            </>
          )}

          {related.length > 0 && (
            <>
              <h2>Related Tools</h2>
              <ul className="pf-related-list">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link className="btn ghost" to={`/practice/library/${r.id}`}>
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2>Source</h2>
          <p>{sourceFull(item)}</p>
          <p className="hint">Kind: {item.kind}</p>
        </section>

        {item.id === 'screening' && (
          <section id="screening" className="pf-section library-section">
            <h2 className="pf-section-title">Screening & Measures index</h2>
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
        )}
      </main>
    </div>
  );
}

export function ClinicalLibraryDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const item = getLibraryItem(resourceId);
  if (!item) return <Navigate to="/practice/library" replace />;
  return <LibraryDetail item={item} />;
}

export function ClinicalLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

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
    navigate(`/practice/library/${item.id}`);
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="knowledge" />
      <main className="practice-main">
        <header className="pf-page-hero">
          <div>
            <h1 className="pf-title">Knowledge</h1>
            <p className="pf-subtitle">
              Structured EMDR scripts, guidance and clinical reference tools.
            </p>
          </div>
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
                    <button type="button" className="pf-library-card-main" onClick={() => openItem(item)}>
                      <span className="pf-library-cat">{item.section}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </button>
                    <div className="pf-library-card-foot">
                      <button
                        type="button"
                        className="pf-source-badge"
                        onClick={() => setExpandedSource((id) => (id === item.id ? null : item.id))}
                        aria-expanded={expandedSource === item.id}
                      >
                        Source · {sourceShort(item)}
                      </button>
                      {expandedSource === item.id && (
                        <p className="pf-source-expand">{sourceFull(item).replace(/ · /g, '\n')}</p>
                      )}
                      <div className="stack-btns horizontal wrap">
                        {item.guidedRoute && item.id !== 'screening' ? (
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
            Source: EMDRIA Phase One Toolkit. Proprietary instruments are listed for reference only — obtain
            licensed copies externally.
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
