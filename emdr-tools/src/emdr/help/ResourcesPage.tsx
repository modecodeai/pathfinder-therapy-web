import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ALL_SCRIPTS,
  HELP_LIBRARY_META,
  LIBRARY_GROUPS,
  getScriptById,
  searchScripts,
} from './library';
import {
  loadFavourites,
  loadHelpNotes,
  saveHelpNote,
  toggleFavourite,
} from './preferences';
import { ScriptCard } from './ScriptCard';

export function ResourcesPage() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>('phase3-assessment-sequence');
  const [favs, setFavs] = useState(() => loadFavourites());
  const [notes, setNotes] = useState(() => loadHelpNotes());
  const [mode, setMode] = useState<'quick' | 'guide'>('guide');

  const results = useMemo(() => searchScripts(query), [query]);
  const selected = selectedId ? getScriptById(selectedId) : undefined;

  return (
    <div className="marketing resources-page">
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> EMDR Tools
          </span>
        </Link>
        <nav className="site-nav">
          <Link to="/session">Session</Link>
          <Link to="/tools">BLS Studio</Link>
          <Link to="/account">Account</Link>
        </nav>
      </header>

      <main className="resources-layout">
        <aside className="resources-nav">
          <h1>Therapist Script Library</h1>
          <p className="hint">
            Version {HELP_LIBRARY_META.contentVersion} · status {HELP_LIBRARY_META.status}
          </p>

          <label className="field">
            <span>Search help</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="body scan, floatback, container…"
              aria-label="Search help content"
            />
          </label>

          {favs.length > 0 && (
            <section>
              <h2>My Quick Tools</h2>
              <ul className="resource-list">
                {favs.map((id) => {
                  const s = getScriptById(id);
                  if (!s) return null;
                  return (
                    <li key={id}>
                      <button type="button" onClick={() => setSelectedId(id)}>
                        {s.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {query.trim() ? (
            <section>
              <h2>Search results</h2>
              <ul className="resource-list">
                {results.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setSelectedId(s.id)}>
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            LIBRARY_GROUPS.map((g) => (
              <section key={g.title}>
                <h2>{g.title}</h2>
                <ul className="resource-list">
                  {g.ids.map((id) => {
                    const s = getScriptById(id);
                    if (!s) return null;
                    return (
                      <li key={id}>
                        <button type="button" onClick={() => setSelectedId(id)}>
                          {s.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}

          <p className="hint">
            {ALL_SCRIPTS.length} cards · Source-informed Pathfinder wording (not verbatim proprietary
            scripts).
          </p>
        </aside>

        <section className="resources-detail">
          <div className="segmented help-mode">
            <button
              type="button"
              className={mode === 'quick' ? 'is-active' : ''}
              onClick={() => setMode('quick')}
            >
              Quick Prompt
            </button>
            <button
              type="button"
              className={mode === 'guide' ? 'is-active' : ''}
              onClick={() => setMode('guide')}
            >
              Clinical Guide
            </button>
          </div>

          {selected ? (
            <ScriptCard
              script={selected}
              mode={mode}
              favourite={favs.includes(selected.id)}
              note={notes[selected.id]}
              onToggleFavourite={() => setFavs(toggleFavourite(selected.id))}
              onNoteChange={(note) => {
                saveHelpNote(selected.id, note);
                setNotes(loadHelpNotes());
              }}
              blsGuidance={selected.blsGuidance}
              showBlsSafetyHint={mode === 'guide'}
            />
          ) : (
            <p>Select a help card.</p>
          )}
        </section>
      </main>
    </div>
  );
}
