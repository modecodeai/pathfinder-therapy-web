import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { emptyClientRecord } from '../worker/clinical-ai/applyFindings';
import {
  extractIntakeFindingsHeuristic,
  mergeFindingsWithoutDuplicates,
  detectRiskReviewRequired,
  type IntakeExtractedFinding,
} from '../src/clinical-intelligence/lib/intake';

const root = resolve(import.meta.dirname, '..');

function readSrc(rel: string): string {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('UI information architecture', () => {
  it('uses canonical MainNavigation with Dashboard Clients Practice Knowledge', () => {
    const nav = readSrc('src/components/shell/MainNavigation.tsx');
    expect(nav).toContain('Dashboard');
    expect(nav).toContain('Clients');
    expect(nav).toContain('Practice');
    expect(nav).toContain('Knowledge');
    expect(nav).toContain("to: '/'");
    expect(nav).toContain("to: '/clients'");
    expect(nav).toContain("to: '/practice'");
    expect(nav).toContain("to: '/knowledge'");
    expect(nav).toContain('pf-nav-link');
    expect(nav).not.toContain('Treatments');
    expect(nav).not.toContain('Account');
  });

  it('AppHeader delegates to MainNavigation and AccountMenu', () => {
    const header = readSrc('src/emdr/guided/components/AppHeader.tsx');
    expect(header).toContain('MainNavigation');
    expect(header).toContain('AccountMenu');
    expect(header).not.toMatch(/NavLink to="\/settings"/);
    const account = readSrc('src/components/shell/AccountMenu.tsx');
    expect(account).toContain('to="/settings"');
    expect(account).toContain('Profile');
    expect(account).toContain('Sign out');
  });

  it('AppShell is the canonical authenticated shell', () => {
    const shell = readSrc('src/components/shell/AppShell.tsx');
    expect(shell).toContain('data-testid="app-shell"');
    expect(shell).toContain('MainNavigation');
    expect(shell).toContain('AccountMenu');
  });

  it('authenticated dashboard is client-first without EMDR CTAs', () => {
    const dash = readSrc('src/routes/DashboardPage.tsx');
    expect(dash).toContain('New Client');
    expect(dash).toContain('Open Clients');
    expect(dash).toContain('AppShell');
    expect(dash).not.toContain('Start Standard EMDR');
    expect(dash).not.toContain('Start EMDR Pain');
    expect(dash).not.toContain('Continue Session');
    const landing = readSrc('src/routes/LandingPage.tsx');
    expect(landing).toContain('DashboardPage');
    expect(landing).not.toMatch(/PracticeClientsProtocols/);
  });

  it('registers client workspace routes including setup and knowledge', () => {
    const app = readSrc('src/app/App.tsx');
    expect(app).toContain('path="/clients"');
    expect(app).toContain('path="/clients/:clientId"');
    expect(app).toContain('path="/clients/:clientId/setup"');
    expect(app).toContain('path="/clients/:clientId/clinical-intelligence"');
    expect(app).toContain('path="/clients/:clientId/aip-formulation"');
    expect(app).toContain('path="/knowledge"');
    expect(app).toContain('path="/protocols"');
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

  it('Clients workspace uses production list + new-client flow into setup', () => {
    const clients = readSrc('src/clinical-intelligence/ClientsPage.tsx');
    expect(clients).toContain('New Client');
    expect(clients).toContain('Search clients');
    expect(clients).toContain('Current Focus');
    expect(clients).toContain('Create Client & Continue');
    expect(clients).toContain('client-dash-tabs');
    expect(clients).toContain('Treatment Work');
    expect(clients).toContain('/clients/${id}/setup');
  });

  it('nav links are styled and not concatenated raw anchors', () => {
    const css = readSrc('src/styles/global.css');
    expect(css).toMatch(/\.pf-nav-link\s*\{[^}]*text-decoration:\s*none/s);
    expect(css).toMatch(/\.pf-app-nav\s*\{[^}]*gap:\s*1\.25rem/s);
    expect(css).toMatch(/\.site-nav\s*\{[^}]*gap:\s*1\.25rem/s);
    const nav = readSrc('src/components/shell/MainNavigation.tsx');
    const labels = ['Dashboard', 'Clients', 'Practice', 'Knowledge'];
    for (const label of labels) {
      expect(nav).toContain(`label: '${label}'`);
    }
    // Ensure labels are separate NavLink children, not one concatenated string
    expect(nav).not.toContain('DashboardClientsPracticeKnowledge');
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

describe('Intake merge provenance', () => {
  it('corroborates matching intake + transcript findings without duplicates', () => {
    const intake: IntakeExtractedFinding[] = extractIntakeFindingsHeuristic(
      'Anxiety, difficult childhood, supportive friend',
      'src_intake',
    );
    const fromTranscript: IntakeExtractedFinding[] = extractIntakeFindingsHeuristic(
      'anxiety childhood criticism supportive friend',
      'src_tx',
    ).map((f) => ({
      ...f,
      provenance: {
        sourceIds: ['src_tx'],
        sourceTypes: ['transcript' as const],
        status: 'single' as const,
      },
    }));
    const merged = mergeFindingsWithoutDuplicates(intake, fromTranscript);
    const anxiety = merged.filter((f) => /anxiety/i.test(f.text));
    expect(anxiety.length).toBe(1);
    expect(anxiety[0]?.provenance.status).toBe('corroborated');
    expect(anxiety[0]?.provenance.sourceTypes).toEqual(
      expect.arrayContaining(['intake', 'transcript']),
    );
  });

  it('flags risk language for clinical review without inferring severity', () => {
    expect(detectRiskReviewRequired('history of suicidal ideation')).toBe(true);
    expect(detectRiskReviewRequired('feels anxious at work')).toBe(false);
  });
});

describe('Client-first principle documentation', () => {
  it('documents PATHFINDER CLIENT-FIRST PRINCIPLE', () => {
    const doc = readSrc('docs/CLINICAL_REASONING.md');
    expect(doc).toContain('PATHFINDER CLIENT-FIRST PRINCIPLE');
    expect(doc).toMatch(/Clinical work begins with the person/i);
  });
});
