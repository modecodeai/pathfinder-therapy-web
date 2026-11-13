import { describe, expect, it } from 'vitest';
import {
  CLINICAL_LIBRARY,
  getLibraryDiagnostics,
  getLibraryItem,
  libraryResourceHasContent,
  resolveLibraryId,
} from '../src/emdr/data/library/clinicalLibrary';

describe('clinical library content', () => {
  it('loads all resources with non-empty clinical bodies', () => {
    const d = getLibraryDiagnostics();
    expect(d.resourcesLoaded).toBeGreaterThanOrEqual(10);
    expect(d.missingContentIds).toEqual([]);
    expect(d.referenceResourcesLoaded).toBe(d.resourcesLoaded);
  });

  it('resolves acceptance-test resources', () => {
    for (const id of ['floatback', 'safe-calm', 'cognitions', 'rdi', 'p1-floatback', 'std-nc-pc']) {
      const item = getLibraryItem(id);
      expect(item, id).toBeTruthy();
      expect(libraryResourceHasContent(item!)).toBe(true);
      expect(item!.therapistScript.length).toBeGreaterThan(0);
      expect(item!.overview.length).toBeGreaterThan(40);
    }
  });

  it('maps legacy ids to canonical slugs', () => {
    expect(resolveLibraryId('p1-floatback')).toBe('floatback');
    expect(resolveLibraryId('p2-rdi')).toBe('rdi');
  });

  it('every card has id title description source category and action', () => {
    for (const item of CLINICAL_LIBRARY) {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.source.title).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.guidedRoute || item.overview).toBeTruthy();
    }
  });
});
