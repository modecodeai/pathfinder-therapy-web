import { useEffect, useMemo, useState } from 'react';
import type { EMDRPhase, SetResponse } from '../types/emdr';
import {
  contextualScriptIds,
  getScriptById,
  resolveBlsGuidance,
} from './library';
import type { BlsGuidanceContext, ClinicalBlsPresetId } from './blsGuidanceTypes';
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
  processingActive?: boolean;
  guidanceContext?: BlsGuidanceContext;
  onLoadBlsPreset?: (presetId: ClinicalBlsPresetId) => void;
  onOpenBlsSettings?: () => void;
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
  guidanceContext,
  onLoadBlsPreset,
  onOpenBlsSettings,
}: HelpDrawerProps) {
  const [mode, setMode] = useState<'quick' | 'guide'>('quick');
  const [favs, setFavs] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [minimised, setMinimised] = useState(false);

  useEffect(() => {
    setFavs(loadFavourites());
    setNotes(loadHelpNotes());
  }, [open]);

  useEffect(() => {
    if (processingActive) {
      setMode('quick');
      setMinimised(true);
    } else {
      setMinimised(false);
    }
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
  const ctx: BlsGuidanceContext = {
    phase,
    awaitingFeedback,
    consecutiveNoChange,
    infinityMode,
    lastResponse,
    processingActive,
    ...guidanceContext,
  };
  const resolved = active
    ? resolveBlsGuidance(active.id, active.blsGuidance, ctx)
    : undefined;

  if (minimised && processingActive) {
    return (
      <aside className="help-drawer is-minimised" aria-label="Help and scripts">
        <p className="hint">Help minimised during active BLS</p>
        <button type="button" className="btn ghost" onClick={() => setMinimised(false)}>
          Expand Help
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      </aside>
    );
  }

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
          blsGuidance={resolved}
          onLoadBlsPreset={onLoadBlsPreset}
          onOpenBlsSettings={onOpenBlsSettings}
          showBlsSafetyHint={mode === 'guide'}
        />
      )}

      <p className="hint help-foot">
        Help never starts BLS, changes phase, or selects clinical content for you.
      </p>
    </aside>
  );
}
