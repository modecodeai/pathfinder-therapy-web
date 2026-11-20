const FAV_KEY = 'pf-emdr-help-favourites-v1';
const NOTES_KEY = 'pf-emdr-help-notes-v1';

export function loadFavourites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavourites(ids: string[]): void {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids.slice(0, 40)));
}

export function toggleFavourite(id: string): string[] {
  const current = loadFavourites();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [id, ...current];
  saveFavourites(next);
  return next;
}

export function loadHelpNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveHelpNote(scriptId: string, note: string): void {
  const all = loadHelpNotes();
  if (!note.trim()) delete all[scriptId];
  else all[scriptId] = note.trim().slice(0, 2000);
  localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}
