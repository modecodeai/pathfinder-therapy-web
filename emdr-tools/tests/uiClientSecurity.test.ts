import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';

const root = resolve(import.meta.dirname, '..');

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('UI information architecture', () => {
  it('exposes Clients as a top-level header nav item', () => {
    const header = readSrc('src/emdr/guided/components/AppHeader.tsx');
    expect(header).toContain('NavLink to="/clients"');
    expect(header).toContain('Practice');
    expect(header).toContain('Clients');
    expect(header).toContain('Treatments');
    expect(header).toContain('Knowledge');
    // Settings must not be a primary clinical nav destination
    expect(header).not.toMatch(/NavLink to="\/settings"/);
    expect(header).toContain('to="/settings"'); // account menu only
    expect(header).toContain('NavLink to="/protocols"');
  });

  it('registers client workspace routes at /clients', () => {
    const app = readSrc('src/app/App.tsx');
    expect(app).toContain('path="/clients"');
    expect(app).toContain('path="/clients/:clientId"');
    expect(app).toContain('path="/clients/:clientId/clinical-intelligence"');
    expect(app).toContain('path="/clients/:clientId/aip-formulation"');
    expect(app).not.toContain('path="/settings/clients"');
  });

  it('Settings home has category cards without Clients or CI/CL/AC abbreviations', () => {
    const settings = readSrc('src/clinical-intelligence/ClinicalIntelligenceSettingsPage.tsx');
    const homeStart = settings.indexOf('export function SettingsHomePage');
    const homeEnd = settings.indexOf('export function SecurityPrivacySettingsPage');
    const home = settings.slice(homeStart, homeEnd);
    expect(home).toContain('Account');
    expect(home).toContain('Clinical Reasoning');
    expect(home).toContain('Security & Privacy');
    expect(home).toContain('Data & Retention');
    expect(home).toContain('Remote Sessions');
    expect(home).not.toMatch(/title="Clients"/);
    expect(home).not.toMatch(/\bCI\b|\bCL\b|\bAC\b/);
  });

  it('Clients workspace uses production list + new-client flow', () => {
    const clients = readSrc('src/clinical-intelligence/ClientsPage.tsx');
    expect(clients).toContain('New Client');
    expect(clients).toContain('Search clients');
    expect(clients).toContain('Current Focus');
    expect(clients).toContain('Create Client');
    expect(clients).toContain('client-dash-tabs');
  });
});

describe('Tenant isolation & client records', () => {
  it('binds every client record to a therapistId', () => {
    const a = emptyClientRecord('c_a', 'therapist_a', 'Client A', '2026-08-15T00:00:00.000Z');
    const b = emptyClientRecord('c_b', 'therapist_b', 'Client B', '2026-08-15T00:00:00.000Z');
    expect(a.therapistId).toBe('therapist_a');
    expect(b.therapistId).toBe('therapist_b');
    expect(a.id).not.toBe(b.id);
  });

  it('AccountDirectory loads clients with therapist_id AND client id', () => {
    const dir = readSrc('worker/accountDirectory.ts');
    expect(dir).toContain('SELECT record_json FROM clients WHERE id = ? AND therapist_id = ?');
    expect(dir).toContain(
      'SELECT id, display_name, record_json, updated_at FROM clients WHERE therapist_id = ?',
    );
    expect(dir).toContain("return Response.json({ error: 'Unauthorized' }, { status: 401 })");
    expect(dir).toContain("return Response.json({ error: 'Not found' }, { status: 404 })");
    expect(dir).toContain("event: 'client_created'");
    expect(dir).toContain("event: 'client_archived'");
    expect(dir).toContain("event: 'transcript_analysed'");
    expect(dir).toContain('Cache-Control');
    expect(dir).toContain('no-store');
  });

  it('clinical session save rejects cross-therapist ownership', () => {
    const dir = readSrc('worker/accountDirectory.ts');
    expect(dir).toContain("return Response.json({ error: 'Forbidden' }, { status: 403 })");
    expect(dir).toContain('WHERE clinical_sessions.therapist_id = excluded.therapist_id');
  });
});

describe('Browser storage policy', () => {
  it('documents that client clinical truth is AccountDirectory, not localStorage', () => {
    const doc = readSrc('docs/STORAGE.md');
    expect(doc).toContain('AccountDirectory');
    expect(doc).toContain('raw_transcripts');
    expect(doc).toContain('clinical_ai_analyses');
    expect(doc).toMatch(/must live only in authenticated server-side/);
    expect(doc).toContain('IndexedDB:** none');
  });

  it('auth token is the only clinical-adjacent localStorage used by API client', () => {
    const api = readSrc('src/clinical-intelligence/lib/api.ts');
    expect(api).toContain('localStorage.getItem(TOKEN_KEY)');
    expect(api).not.toMatch(/localStorage\.setItem\([^)]*client/i);
    expect(api).not.toMatch(/sessionStorage/);
  });
});
