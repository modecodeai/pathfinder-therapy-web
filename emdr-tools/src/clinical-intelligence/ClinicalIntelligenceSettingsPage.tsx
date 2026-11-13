import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { fetchCIStatus, testCIConnection, type CIStatus, type CITestResult } from './lib/api';

type ConnState = 'idle' | 'testing' | 'connected' | 'not_configured' | 'failed';

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
            Server-side OpenAI assistance for EMDR transcript analysis. API keys never leave the
            Cloudflare Worker.
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
              {conn === 'failed' && (
                <button type="button" className="btn" onClick={() => void onTest()}>
                  Try Again
                </button>
              )}
              <Link className="btn ghost" to="/clients">
                Open Clients
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

export function SettingsHomePage() {
  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <h1>Settings</h1>
          <p className="lede">Account and Clinical Intelligence configuration.</p>
        </header>
        <div className="pf-phase-grid">
          <Link className="pf-phase-card" to="/settings/clinical-intelligence">
            <span className="pf-phase-num">CI</span>
            <h2>Clinical Intelligence</h2>
            <p>OpenAI connection status and connection test.</p>
          </Link>
          <Link className="pf-phase-card" to="/clients">
            <span className="pf-phase-num">CL</span>
            <h2>Clients</h2>
            <p>Client records and transcript analysis.</p>
          </Link>
          <Link className="pf-phase-card" to="/account">
            <span className="pf-phase-num">AC</span>
            <h2>Account</h2>
            <p>Sign in, profile and practice details.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
