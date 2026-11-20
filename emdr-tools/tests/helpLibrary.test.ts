import { describe, expect, it } from 'vitest';
import {
  ALL_SCRIPTS,
  HELP_LIBRARY_META,
  LIBRARY_GROUPS,
  contextualScriptIds,
  getScriptById,
  searchScripts,
} from '../src/emdr/help/library';

describe('Help Script Library', () => {
  it('has versioned meta in clinical-review', () => {
    expect(HELP_LIBRARY_META.contentVersion).toBeTruthy();
    expect(HELP_LIBRARY_META.status).toBe('clinical-review');
  });

  it('includes every Standard Protocol phase script', () => {
    const required = [
      'phase1-presenting-issue',
      'phase1-floatback',
      'phase2-safe-calm-place',
      'phase2-container',
      'phase3-assessment-sequence',
      'phase4-processing-checkin',
      'phase5-installation',
      'phase6-body-scan',
      'phase7-completed-closure',
      'phase7-incomplete-closure',
      'phase8-global-reevaluation',
      'phase8-target-reevaluation',
      'future-template-sequence',
      'infinity-figure-eight',
      'cross-container',
    ];
    for (const id of required) {
      expect(getScriptById(id), id).toBeTruthy();
    }
  });

  it('keeps unique script ids', () => {
    const ids = ALL_SCRIPTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('library groups resolve to real scripts', () => {
    for (const group of LIBRARY_GROUPS) {
      for (const id of group.ids) {
        expect(getScriptById(id), `${group.title}:${id}`).toBeTruthy();
      }
    }
  });

  it('search finds body scan, floatback, container, NC, future template', () => {
    expect(searchScripts('body scan').some((s) => s.id === 'phase6-body-scan')).toBe(true);
    expect(searchScripts('floatback').some((s) => s.id === 'phase1-floatback')).toBe(true);
    expect(searchScripts('closure').length).toBeGreaterThan(0);
    expect(searchScripts('NC').some((s) => s.id.includes('nc') || s.id.includes('phase3'))).toBe(
      true,
    );
    expect(searchScripts('container').length).toBeGreaterThan(0);
    expect(searchScripts('future template').some((s) => s.id === 'future-template-sequence')).toBe(
      true,
    );
  });

  it('contextual help prioritises Phase 3 assessment', () => {
    const ids = contextualScriptIds({ phase: 'assessment' });
    expect(ids[0]).toBe('phase3-assessment-sequence');
  });

  it('contextual help surfaces no-change twice guidance', () => {
    const ids = contextualScriptIds({
      phase: 'desensitisation',
      awaitingFeedback: true,
      consecutiveNoChange: 2,
    });
    expect(ids).toContain('phase4-no-change-twice');
  });

  it('infinity mode surfaces Figure Eight help', () => {
    const ids = contextualScriptIds({ phase: 'closure', infinityMode: true });
    expect(ids[0]).toBe('infinity-figure-eight');
  });

  it('does not invent empty sections', () => {
    for (const script of ALL_SCRIPTS) {
      expect(script.sections.length).toBeGreaterThan(0);
      expect(script.sourceType === 'source-derived' || script.sourceType === 'pathfinder-original').toBe(
        true,
      );
    }
  });
});
