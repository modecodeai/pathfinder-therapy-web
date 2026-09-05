import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { fetchCIStatus, testCIConnection, type CIStatus, type CITestResult } from './lib/api';

type ConnState = 'idle' | 'testing' | 'connected' | 'not_configured' | 'failed';

const IS_DEV =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.pages.dev'));

export function ClinicalIntelligenceSettingsPage() {
  const auth = useAuth();
  const [status, setStatus] = useState<CIStatus | null>(null);
  const [conn, setConn] = useState<ConnState>('idle');
  const [testResult, setTestResult] = useState<CITestResult | null>(null);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!auth.isAuthenticated) return;
    try {
      const s = await fetchCIStatus();
      setStatus(s);
      if (!s.configured) setConn('not_configured');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load status');
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const onTest = async () => {
    setConn('testing');
    setError(null);
    setTestResult(null);
    try {
      const result = await testCIConnection();
      setTestResult(result);
      setLastTestAt(new Date().toISOString());
      if (result.success) {
        setConn('connected');
        await loadStatus();
      } else {
        setConn(result.error?.toLowerCase().includes('not configured') ? 'not_configured' : 'failed');
        setError(result.error ?? 'Clinical Intelligence connection failed.');
      }
    } catch {
      setConn('failed');
      setError('Clinical Intelligence connection failed.');
    }
  };

  const statusLabel =
    conn === 'testing'
      ? 'Testing…'
      : conn === 'connected'
        ? 'Connected'
        : conn === 'not_configured'
          ? 'Not configured'
          : conn === 'failed'
            ? 'Connection failed'
            : status?.configured
              ? 'Configured (not tested)'
              : 'Not configured';

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/settings">Settings</Link>
            <span aria-hidden> › </span>
            Clinical Intelligence
          </p>
          <h1>Clinical Intelligence</h1>
          <p className="lede">
            Provider configuration — OpenAI model, connection status and analysis preferences. For
            transcript analysis, open a client workspace.
          </p>
        </header>

        {!auth.isAuthenticated && (
          <section className="panel">
            <p>Sign in to manage Clinical Intelligence.</p>
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        )}

        {auth.isAuthenticated && (
          <section className="panel ci-settings-panel">
            <dl className="ci-kv">
              <div>
                <dt>Provider</dt>
                <dd>OpenAI</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`ci-status-pill tone-${conn}`}>{statusLabel}</span>
                </dd>
              </div>
              <div>
                <dt>Model</dt>
                <dd>{status?.model || (status?.modelConfigured ? 'Configured' : 'Not configured')}</dd>
              </div>
              <div>
                <dt>Last test</dt>
                <dd>{lastTestAt ? new Date(lastTestAt).toLocaleString() : '—'}</dd>
              </div>
              <div>
                <dt>Latency</dt>
                <dd>{testResult?.latencyMs != null ? `${testResult.latencyMs} ms` : '—'}</dd>
              </div>
            </dl>

            <div className="stack-btns horizontal wrap">
              <button
                type="button"
                className="btn primary"
                onClick={() => void onTest()}
                disabled={conn === 'testing'}
              >
                {conn === 'testing' ? 'Testing…' : 'Test Connection'}
              </button>
              <Link className="btn" to="/clients">
                Open Clients workspace
              </Link>
            </div>

            {conn === 'connected' && testResult?.response && (
              <div className="ci-success-banner" role="status">
                <strong>Clinical Intelligence connected</strong>
                <p>{testResult.response}</p>
              </div>
            )}
            {error && (
              <div className="ci-error-banner" role="alert">
                <strong>Clinical Intelligence connection failed.</strong>
                <p>{error}</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function SettingsCard({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link className="settings-card" to={to}>
      <span className="settings-card-icon" aria-hidden>
        {icon}
      </span>
      <span className="settings-card-body">
        <h2>{title}</h2>
        <p>{description}</p>
      </span>
    </Link>
  );
}

export function SettingsHomePage() {
  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <h1>Settings</h1>
          <p className="lede">Account, security and product preferences — not clinical workspaces.</p>
        </header>
        <div className="settings-card-grid">
          <SettingsCard
            to="/account"
            icon="👤"
            title="Account"
            description="Profile and practice details."
          />
          <SettingsCard
            to="/settings/clinical-intelligence"
            icon="◎"
            title="Clinical Intelligence"
            description="OpenAI model, connection status and analysis preferences."
          />
          <SettingsCard
            to="/settings/security"
            icon="🔒"
            title="Security & Privacy"
            description="Session security, transcript retention and data controls."
          />
          <SettingsCard
            to="/settings/appearance"
            icon="◇"
            title="Appearance"
            description="Display preferences for the clinical console."
          />
          <SettingsCard
            to="/settings/data-retention"
            icon="☰"
            title="Data & Retention"
            description="Raw transcript retention, archive/export and deletion controls."
          />
          <SettingsCard
            to="/settings/remote-sessions"
            icon="⇄"
            title="Remote Sessions"
            description="Remote-client link expiry and connection defaults."
          />
        </div>
      </main>
    </div>
  );
}

export function SecurityPrivacySettingsPage() {
  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/settings">Settings</Link>
            <span aria-hidden> › </span>
            Security & Privacy
          </p>
          <h1>Security & Privacy</h1>
        </header>
        <section className="panel">
          <h2>Platform status</h2>
          <dl className="ci-kv">
            <div>
              <dt>Storage</dt>
              <dd>Server-side Cloudflare Durable Object (AccountDirectory)</dd>
            </div>
            <div>
              <dt>Encryption at rest</dt>
              <dd>Enabled by Cloudflare platform</dd>
            </div>
            <div>
              <dt>Encryption in transit</dt>
              <dd>TLS</dd>
            </div>
            <div>
              <dt>API secrets</dt>
              <dd>Stored in Cloudflare Secrets</dd>
            </div>
            <div>
              <dt>Raw transcript logging</dt>
              <dd>Disabled</dd>
            </div>
            <div>
              <dt>AI provider</dt>
              <dd>OpenAI</dd>
            </div>
          </dl>
          <p className="hint">
            Compliance certifications are not claimed for this deployment unless independently
            verified for the exact Cloudflare account configuration.
          </p>
        </section>
        {IS_DEV && (
          <section className="panel">
            <h2>Storage Architecture (development only)</h2>
            <dl className="ci-kv">
              <div>
                <dt>Accounts</dt>
                <dd>Durable Object binding ACCOUNTS → AccountDirectory</dd>
              </div>
              <div>
                <dt>Clients</dt>
                <dd>SQLite table clients (record_json) in AccountDirectory</dd>
              </div>
              <div>
                <dt>Sessions</dt>
                <dd>SQLite table clinical_sessions in AccountDirectory</dd>
              </div>
              <div>
                <dt>Transcripts</dt>
                <dd>SQLite table raw_transcripts in AccountDirectory</dd>
              </div>
              <div>
                <dt>AI analyses</dt>
                <dd>SQLite table clinical_ai_analyses in AccountDirectory</dd>
              </div>
              <div>
                <dt>Remote rooms</dt>
                <dd>Durable Object binding ROOM → EmdrRoom (no clinical content)</dd>
              </div>
            </dl>
            <p className="hint">See docs/STORAGE.md for the full map.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export function DataRetentionSettingsPage() {
  const [transcriptRetention, setTranscriptRetention] = useState<
    'ask' | 'delete-after-approve' | 'keep'
  >(() => (localStorage.getItem('pf-emdr-retention-transcript') as 'ask' | 'delete-after-approve' | 'keep') || 'ask');
  const [analysisRetention, setAnalysisRetention] = useState(
    () => localStorage.getItem('pf-emdr-retention-analysis') || 'keep-audit',
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    localStorage.setItem('pf-emdr-retention-transcript', transcriptRetention);
  }, [transcriptRetention]);
  useEffect(() => {
    localStorage.setItem('pf-emdr-retention-analysis', analysisRetention);
  }, [analysisRetention]);

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/settings">Settings</Link>
            <span aria-hidden> › </span>
            Data & Retention
          </p>
          <h1>Data & Retention</h1>
          <p className="lede">
            Preferences for how long raw transcripts and AI analyses are kept. Client clinical records
            remain server-side until you archive or delete them.
          </p>
        </header>
        <section className="panel">
          <h2>Raw transcript retention</h2>
          <label className="field">
            <select
              value={transcriptRetention}
              onChange={(e) =>
                setTranscriptRetention(e.target.value as 'ask' | 'delete-after-approve' | 'keep')
              }
            >
              <option value="ask">Ask each time</option>
              <option value="delete-after-approve">Delete after approved analysis</option>
              <option value="keep">Keep</option>
            </select>
          </label>
        </section>
        <section className="panel">
          <h2>AI analysis retention</h2>
          <label className="field">
            <select value={analysisRetention} onChange={(e) => setAnalysisRetention(e.target.value)}>
              <option value="keep-audit">Keep audit copy</option>
            </select>
          </label>
          <p className="hint">Further retention windows will be configurable later.</p>
        </section>
        <section className="panel">
          <h2>Client archive & deletion</h2>
          <p>
            Archive clients from the client dashboard Audit tab. Permanent deletion requires explicit
            confirmation and is not available as a one-click action.
          </p>
          {!confirmDelete ? (
            <button type="button" className="btn ghost" onClick={() => setConfirmDelete(true)}>
              Show deletion guidance
            </button>
          ) : (
            <div className="ci-error-banner">
              <p>
                To delete an account and all clients, use Account → Delete account. Individual client
                permanent deletion will require a typed confirmation in a later release.
              </p>
              <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
                Close
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export function AppearanceSettingsPage() {
  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/settings">Settings</Link>
            <span aria-hidden> › </span>
            Appearance
          </p>
          <h1>Appearance</h1>
        </header>
        <section className="panel">
          <p className="hint">Display density and theme options will expand here. Brand colour: Pathfinder teal.</p>
        </section>
      </main>
    </div>
  );
}

export function RemoteSessionsSettingsPage() {
  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/settings">Settings</Link>
            <span aria-hidden> › </span>
            Remote Sessions
          </p>
          <h1>Remote Sessions</h1>
        </header>
        <section className="panel">
          <p className="hint">
            Remote-client rooms use Durable Object <code>ROOM</code> / <code>EmdrRoom</code> with
            secret-gated WebSockets. Clinical content is not stored in room state.
          </p>
        </section>
      </main>
    </div>
  );
}
