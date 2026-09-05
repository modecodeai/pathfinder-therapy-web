import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { CLINICAL_THEME_LABELS, type ClientRecord } from './types';
import {
  archiveClient,
  createClient,
  getClient,
  listClientAnalyses,
  listClients,
} from './lib/api';

type ListFilter = 'all' | 'active' | 'archived';

export function ClientsListPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<
    Array<{
      id: string;
      displayName: string;
      presentingProblem?: string;
      updatedAt: string;
      status?: string;
      currentPhase?: string;
      ciPending?: number;
    }>
  >([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ListFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listClients();
      setClients(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) void refresh();
    else setLoading(false);
  }, [auth.isAuthenticated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      const status = (c.status ?? 'active').toLowerCase();
      if (filter === 'active' && status === 'archived') return false;
      if (filter === 'archived' && status !== 'archived') return false;
      if (!q) return true;
      return (
        c.displayName.toLowerCase().includes(q) ||
        (c.presentingProblem ?? '').toLowerCase().includes(q)
      );
    });
  }, [clients, query, filter]);

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="clients" />
      <main className="practice-main clients-workspace">
        <header className="pf-page-header clients-header">
          <div>
            <h1>Clients</h1>
            <p className="lede">Clinical records, formulations and EMDR treatment workspaces.</p>
          </div>
          {auth.isAuthenticated && (
            <button type="button" className="btn primary" onClick={() => setShowNew(true)}>
              + New Client
            </button>
          )}
        </header>

        {!auth.isAuthenticated ? (
          <section className="panel">
            <p>Sign in to manage clients.</p>
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        ) : (
          <>
            <div className="clients-toolbar">
              <form
                className="clients-search"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <label className="sr-only" htmlFor="client-search">
                  Search clients
                </label>
                <input
                  id="client-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search clients…"
                />
                <button type="submit" className="btn">
                  Search
                </button>
              </form>
              <div className="clients-filters" role="group" aria-label="Client filters">
                {(
                  [
                    ['all', 'All'],
                    ['active', 'Active'],
                    ['archived', 'Archived'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={filter === id ? 'is-active' : ''}
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="ci-error-banner">{error}</p>}
            {loading ? (
              <p>Loading…</p>
            ) : (
              <div className="clients-table-wrap panel">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Current focus</th>
                      <th>Current phase</th>
                      <th>Last session</th>
                      <th>CI status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        tabIndex={0}
                        onClick={() => navigate(`/clients/${c.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/clients/${c.id}`);
                        }}
                      >
                        <td>
                          <strong>{c.displayName}</strong>
                          {(c.status ?? 'active') === 'archived' && (
                            <span className="clients-status-pill">Archived</span>
                          )}
                        </td>
                        <td>{c.presentingProblem || '—'}</td>
                        <td>{c.currentPhase || '—'}</td>
                        <td>{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '—'}</td>
                        <td>
                          {c.ciPending
                            ? `${c.ciPending} findings awaiting review`
                            : 'Up to date'}
                        </td>
                        <td>
                          <Link
                            className="btn"
                            to={`/clients/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr>
                        <td colSpan={6} className="hint">
                          No clients match this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {showNew && (
        <NewClientModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            navigate(`/clients/${id}`);
          }}
        />
      )}
    </div>
  );
}

function NewClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [preferredName, setPreferredName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const c = await createClient(displayName.trim(), {
        reference: reference.trim() || undefined,
        status,
        preferredName: preferredName.trim() || undefined,
      });
      onCreated(c.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create client');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pf-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="pf-modal panel"
        role="dialog"
        aria-labelledby="new-client-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="new-client-title">New Client</h2>
        <form className="stack-btns" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span>Display name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span>Client ID / reference (optional)</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} />
          </label>
          <label className="field">
            <span>Preferred name (optional)</span>
            <input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          {error && <p className="ci-error-banner">{error}</p>}
          <div className="stack-btns horizontal wrap">
            <button type="submit" className="btn primary" disabled={busy || !displayName.trim()}>
              {busy ? 'Creating…' : 'Create Client'}
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DashTab =
  | 'overview'
  | 'formulation'
  | 'targets'
  | 'sessions'
  | 'clinical-intelligence'
  | 'documents'
  | 'audit';

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<DashTab>('overview');
  const [analyses, setAnalyses] = useState<
    Array<{ id: string; phase: string; reviewStatus: string; createdAt: string }>
  >([]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId)
      .then(setClient)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
    void listClientAnalyses(clientId)
      .then(setAnalyses)
      .catch(() => setAnalyses([]));
  }, [auth.isAuthenticated, clientId]);

  const pendingCi = analyses.filter((a) => a.reviewStatus === 'pending' || a.reviewStatus === 'partially-reviewed')
    .length;
  const primaryTheme = client?.themes.find((t) => t.primary) ?? client?.themes[0];

  const onArchive = async () => {
    if (!client) return;
    setBusy(true);
    try {
      const next = await archiveClient(client.id);
      setClient(next);
      setConfirmArchive(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not archive');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="clients" />
      <main className="practice-main client-dashboard">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/clients">Clients</Link>
            <span aria-hidden> › </span>
            {client?.displayName || 'Client'}
          </p>
          <div className="clients-header">
            <div>
              <h1>{client?.displayName || 'Client'}</h1>
              <p className="lede">{client?.presentingProblem || 'No presenting problem recorded yet'}</p>
              {client && (
                <p className="hint">
                  Last session:{' '}
                  {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : '—'}
                  {client.status === 'archived' ? ' · Archived' : ''}
                </p>
              )}
            </div>
            {client && (
              <div className="stack-btns horizontal wrap">
                <Link className="btn primary" to="/practice/standard">
                  Continue Guided Practice
                </Link>
                <Link className="btn" to={`/clients/${client.id}/clinical-intelligence`}>
                  Analyse Transcript
                </Link>
              </div>
            )}
          </div>
        </header>

        {!auth.isAuthenticated && (
          <section className="panel">
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        )}
        {error && <p className="ci-error-banner">{error}</p>}

        {client && (
          <>
            <div className="client-dash-tabs" role="tablist">
              {(
                [
                  ['overview', 'Overview'],
                  ['formulation', 'Formulation'],
                  ['targets', 'Targets'],
                  ['sessions', 'Sessions'],
                  ['clinical-intelligence', 'Clinical Intelligence'],
                  ['documents', 'Documents'],
                  ['audit', 'Audit'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={tab === id ? 'is-active' : ''}
                  aria-selected={tab === id}
                  onClick={() => {
                    if (id === 'formulation') {
                      navigate(`/clients/${client.id}/aip-formulation`);
                      return;
                    }
                    if (id === 'clinical-intelligence') {
                      navigate(`/clients/${client.id}/clinical-intelligence`);
                      return;
                    }
                    setTab(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="client-overview-grid">
                <section className="panel">
                  <h2>Current formulation</h2>
                  <dl className="ci-kv">
                    <dt>Primary theme</dt>
                    <dd>
                      {primaryTheme
                        ? CLINICAL_THEME_LABELS[primaryTheme.theme]
                        : 'Not established'}
                    </dd>
                    <dt>Current target</dt>
                    <dd>{client.activeTarget?.headline || 'Not established'}</dd>
                    <dt>Current phase</dt>
                    <dd>{client.currentPhase || 'Not established'}</dd>
                    <dt>SUD / VoC</dt>
                    <dd>
                      {client.activeTarget?.sud ?? '—'} / {client.activeTarget?.voc ?? '—'}
                    </dd>
                  </dl>
                  <Link className="btn ghost" to={`/clients/${client.id}/aip-formulation`}>
                    Open AIP Formulation
                  </Link>
                </section>

                <section className="panel">
                  <h2>Clinical Intelligence</h2>
                  <p>
                    {pendingCi
                      ? `${pendingCi} findings awaiting review`
                      : 'No pending reviews'}
                  </p>
                  <div className="stack-btns horizontal wrap">
                    <Link className="btn primary" to={`/clients/${client.id}/clinical-intelligence`}>
                      {pendingCi ? 'Review Findings' : 'Analyse Transcript'}
                    </Link>
                  </div>
                </section>

                <section className="panel">
                  <h2>Recent activity</h2>
                  {analyses.length ? (
                    <ul className="client-activity-list">
                      {analyses.slice(0, 8).map((a) => (
                        <li key={a.id}>
                          <strong>{new Date(a.createdAt).toLocaleDateString()}</strong>
                          {' — '}
                          {a.phase} · {a.reviewStatus}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="hint">No analyses yet</p>
                  )}
                </section>

                <section className="panel">
                  <h2>Next planned work</h2>
                  <p className="hint">
                    Use Guided Practice or Analyse Transcript when you are ready for the next clinical
                    step. Resolution is always therapist-confirmed.
                  </p>
                </section>
              </div>
            )}

            {tab === 'targets' && (
              <section className="panel">
                <h2>Active target</h2>
                {client.activeTarget ? (
                  <dl className="ci-kv">
                    <dt>Headline</dt>
                    <dd>{client.activeTarget.headline}</dd>
                    <dt>NC / PC</dt>
                    <dd>
                      {client.activeTarget.nc || '—'} / {client.activeTarget.pc || '—'}
                    </dd>
                    <dt>Image</dt>
                    <dd>{client.activeTarget.image || '—'}</dd>
                  </dl>
                ) : (
                  <p className="hint">No approved Phase 3 target yet</p>
                )}
                <h3>Candidates</h3>
                <ul>
                  {client.targetCandidates.map((t) => (
                    <li key={t.id}>{t.headline}</li>
                  ))}
                  {!client.targetCandidates.length && <li className="hint">None</li>}
                </ul>
              </section>
            )}

            {tab === 'sessions' && (
              <section className="panel">
                <h2>Sessions</h2>
                <p className="hint">
                  Analysis history from Clinical Intelligence. Guided Practice console drafts remain
                  on-device until applied to this client record.
                </p>
                <ul className="client-activity-list">
                  {analyses.map((a) => (
                    <li key={a.id}>
                      {new Date(a.createdAt).toLocaleString()} · {a.phase} · {a.reviewStatus}
                    </li>
                  ))}
                  {!analyses.length && <li className="hint">No sessions recorded yet</li>}
                </ul>
              </section>
            )}

            {tab === 'documents' && (
              <section className="panel">
                <h2>Documents</h2>
                <p className="hint">Document upload will arrive in a later release.</p>
              </section>
            )}

            {tab === 'audit' && (
              <section className="panel">
                <h2>Audit</h2>
                <p className="hint">
                  Apply decisions are stored server-side without full transcript text. Session-to-session
                  change summaries appear on the AIP Formulation page.
                </p>
                <ul className="client-activity-list">
                  {(client.sessionChanges ?? [])
                    .slice()
                    .reverse()
                    .slice(0, 10)
                    .map((s) => (
                      <li key={s.id}>
                        {new Date(s.createdAt).toLocaleString()} · {s.phase} · {s.items.length} change
                        items
                      </li>
                    ))}
                  {!(client.sessionChanges ?? []).length && <li className="hint">No audit summaries yet</li>}
                </ul>
                <div className="stack-btns horizontal wrap" style={{ marginTop: '1rem' }}>
                  {!confirmArchive ? (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setConfirmArchive(true)}
                      disabled={client.status === 'archived'}
                    >
                      Archive client
                    </button>
                  ) : (
                    <>
                      <p className="hint">Archive this client? This does not permanently delete data.</p>
                      <button
                        type="button"
                        className="btn"
                        disabled={busy}
                        onClick={() => void onArchive()}
                      >
                        Confirm archive
                      </button>
                      <button type="button" className="btn ghost" onClick={() => setConfirmArchive(false)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
