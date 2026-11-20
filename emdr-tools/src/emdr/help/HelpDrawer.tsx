import { useEffect, useMemo, useState } from 'react';
import type { EMDRPhase, SetResponse } from '../types/emdr';
import { contextualScriptIds, getScriptById } from './library';
import {
  loadFavourites,
  loadHelpNotes,
  saveHelpNote,
  toggleFavourite,
} from './preferences';
import { ScriptCard } from './ScriptCard';

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
  phase: EMDRPhase;
  awaitingFeedback?: boolean;
  consecutiveNoChange?: number;
  infinityMode?: boolean;
  focusField?: 'sud' | 'voc' | 'nc' | null;
  lastResponse?: SetResponse | null;
  /** During active BLS, keep drawer available but prefer quick mode */
  processingActive?: boolean;
}

export function HelpDrawer({
  open,
  onClose,
  phase,
  awaitingFeedback,
  consecutiveNoChange,
  infinityMode,
  focusField,
  lastResponse,
  processingActive,
}: HelpDrawerProps) {
  const [mode, setMode] = useState<'quick' | 'guide'>('quick');
  const [favs, setFavs] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setFavs(loadFavourites());
    setNotes(loadHelpNotes());
  }, [open]);

  useEffect(() => {
    if (processingActive) setMode('quick');
  }, [processingActive]);

  const ids = useMemo(
    () =>
      contextualScriptIds({
        phase,
        awaitingFeedback,
        consecutiveNoChange,
        infinityMode,
        focusField,
        lastResponse,
      }),
    [phase, awaitingFeedback, consecutiveNoChange, infinityMode, focusField, lastResponse],
  );

  useEffect(() => {
    setSelectedId(ids[0] ?? null);
  }, [ids]);

  if (!open) return null;

  const active = selectedId ? getScriptById(selectedId) : undefined;

  return (
    <aside className="help-drawer" aria-label="Help and scripts">
      <header className="help-drawer-head">
        <div>
          <h2>Help & Scripts</h2>
          <p className="hint">Optional guidance — you remain in clinical control.</p>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </header>

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

      <div className="help-script-list" role="tablist" aria-label="Contextual scripts">
        {ids.map((id) => {
          const s = getScriptById(id);
          if (!s) return null;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selectedId === id}
              className={selectedId === id ? 'help-tab is-active' : 'help-tab'}
              onClick={() => setSelectedId(id)}
            >
              {s.title}
            </button>
          );
        })}
      </div>

      {active && (
        <ScriptCard
          script={active}
          mode={mode}
          favourite={favs.includes(active.id)}
          note={notes[active.id]}
          onToggleFavourite={() => setFavs(toggleFavourite(active.id))}
          onNoteChange={(note) => {
            saveHelpNote(active.id, note);
            setNotes(loadHelpNotes());
          }}
        />
      )}

      <p className="hint help-foot">
        Help never starts BLS, changes phase, or selects clinical content for you.
      </p>
    </aside>
  );
}
