import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { CLINICAL_THEME_LABELS, type ClientRecord } from './types';
import { IconPlus } from '../components/icons';
import {
  archiveClient,
  createClient,
  getClient,
  listClientAnalyses,
  listClients,
} from './lib/api';
import { SessionPreparationView } from './SessionPreparationView';
import { ClinicalCycleRail } from './components/ClinicalCycleRail';
import { ClinicalContextBar } from './components/ClinicalContextBar';
import {
  acceptedStrategyTexts,
} from './lib/clinicalCycle';
import { PRIMARY_APPROACH_LABELS, type PrimaryTreatmentApproach } from './clinicalReasoning';
import { hasCoreFormulationContent } from './lib/intake';
import { inferPrimaryApproach } from './lib/lensGovernance';

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
        <header className="pf-page-hero clients-header">
          <div>
            <h1 className="pf-title">Clients</h1>
            <p className="pf-subtitle">
              Manage clinical records, formulations and treatment.
            </p>
          </div>
          {auth.isAuthenticated && (
            <button type="button" className="btn primary" onClick={() => setShowNew(true)}>
              <IconPlus /> New Client
            </button>
          )}
        </header>

        {!auth.isAuthenticated ? (
          <section className="pf-surface-card pf-empty">
            <p>Sign in to manage clinical client records across devices.</p>
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
                <label className="field" htmlFor="client-search" style={{ marginBottom: 0, flex: 1 }}>
                  <span className="sr-only">Search clients</span>
                  <input
                    id="client-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or focus…"
                  />
                </label>
                <button type="submit" className="btn secondary">
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
              <div className="pf-surface-card" aria-busy="true" aria-label="Loading clients">
                <div className="pf-skeleton pf-skeleton-line lg" />
                <div className="pf-skeleton pf-skeleton-line" style={{ width: '90%' }} />
                <div className="pf-skeleton pf-skeleton-line" style={{ width: '75%' }} />
                <div className="pf-skeleton pf-skeleton-line" style={{ width: '85%' }} />
              </div>
            ) : (
              <div className="clients-table-wrap">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Current Focus</th>
                      <th>Current Phase</th>
                      <th>Last Session</th>
                      <th>Clinical Reasoning</th>
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
                          <strong className="client-name">{c.displayName}</strong>
                          {(c.status ?? 'active') === 'archived' && (
                            <span className="clients-status-pill">Archived</span>
                          )}
                        </td>
                        <td>{c.presentingProblem || '—'}</td>
                        <td>{c.currentPhase || '—'}</td>
                        <td className="pf-meta">
                          {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          {c.ciPending
                            ? `${c.ciPending} awaiting review`
                            : 'Up to date'}
                        </td>
                        <td>
                          <Link
                            className="btn secondary"
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
                        <td colSpan={6}>
                          <div className="pf-empty clients-empty">
                            <p>
                              {clients.length === 0
                                ? 'No clients yet. Create a clinical record to begin formulations and treatment workspaces.'
                                : 'No clients match this view.'}
                            </p>
                            {clients.length === 0 && (
                              <button
                                type="button"
                                className="btn primary"
                                onClick={() => setShowNew(true)}
                              >
                                <IconPlus /> New Client
                              </button>
                            )}
                          </div>
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
            navigate(`/clients/${id}/setup`);
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
              {busy ? 'Creating…' : 'Create Client & Continue'}
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
  | 'intake'
  | 'preparation'
  | 'treatment-work'
  | 'sessions'
  | 'documents'
  | 'audit';

const TAB_FROM_QUERY: Record<string, DashTab> = {
  overview: 'overview',
  intake: 'intake',
  preparation: 'preparation',
  targets: 'treatment-work',
  'treatment-work': 'treatment-work',
  sessions: 'sessions',
  documents: 'documents',
  audit: 'audit',
};

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialTab = TAB_FROM_QUERY[searchParams.get('tab') ?? ''] ?? 'overview';
  const [tab, setTab] = useState<DashTab>(initialTab);
  const [analyses, setAnalyses] = useState<
    Array<{ id: string; phase: string; reviewStatus: string; createdAt: string }>
  >([]);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = searchParams.get('tab');
    if (q && TAB_FROM_QUERY[q] && TAB_FROM_QUERY[q] !== tab) {
      setTab(TAB_FROM_QUERY[q]!);
    }
  }, [searchParams, tab]);

  const selectTab = (id: DashTab) => {
    setTab(id);
    setSearchParams(id === 'overview' ? {} : { tab: id }, { replace: true });
  };

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
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => selectTab('preparation')}
                >
                  Prepare Session
                </button>
                <Link className="btn secondary" to={`/clients/${client.id}/setup`}>
                  Client Setup
                </Link>
                <Link className="btn tertiary" to={`/clients/${client.id}?tab=intake`}>
                  Intake
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
                  ['intake', 'Intake'],
                  ['preparation', 'Preparation'],
                  ['practice', 'Practice'],
                  ['clinical-reasoning', 'Clinical Reasoning'],
                  ['formulation', 'Formulation'],
                  ['treatment-work', 'Treatment Work'],
                  ['sessions', 'Sessions'],
                  ['documents', 'Documents'],
                ] as const
              ).map(([id, label]) => {
                const isInline =
                  id === 'overview' ||
                  id === 'intake' ||
                  id === 'preparation' ||
                  id === 'treatment-work' ||
                  id === 'sessions' ||
                  id === 'documents';
                const active = isInline && tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className={active ? 'is-active' : ''}
                    aria-selected={active}
                    onClick={() => {
                      if (id === 'formulation') {
                        navigate(`/clients/${client.id}/aip-formulation`);
                        return;
                      }
                      if (id === 'clinical-reasoning') {
                        navigate(`/clients/${client.id}/clinical-reasoning`);
                        return;
                      }
                      if (id === 'practice') {
                        navigate(
                          `/practice?clientId=${encodeURIComponent(client.id)}`,
                        );
                        return;
                      }
                      if (isInline) selectTab(id);
                    }}
                  >
                    {label}
                    {id === 'clinical-reasoning' && pendingCi > 0 ? (
                      <span className="client-tab-badge" aria-label={`${pendingCi} awaiting review`}>
                        {pendingCi}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <ClinicalContextBar
              clientName={client.displayName}
              clientId={client.id}
              cycle={client.activeCycle}
            />
            <ClinicalCycleRail cycle={client.activeCycle} />

            {tab === 'overview' && (
              <ClientOverviewPanel
                client={client}
                pendingCi={pendingCi}
                primaryTheme={primaryTheme}
                onPrepare={() => selectTab('preparation')}
              />
            )}

            {tab === 'intake' && (
              <section className="pf-surface-card">
                <h2>Intake</h2>
                {client.intake?.riskReviewRequired && (
                  <div className="pf-clinical-review-alert" role="alert">
                    <strong>CLINICAL REVIEW REQUIRED</strong>
                    <p>Risk-related content is present in intake material.</p>
                  </div>
                )}
                {client.intake ? (
                  <>
                    <p className="pf-meta">
                      Last updated{' '}
                      {client.intake.updatedAt
                        ? new Date(client.intake.updatedAt).toLocaleString()
                        : '—'}
                    </p>
                    <Link className="btn primary" to={`/clients/${client.id}/setup`}>
                      Continue intake / setup
                    </Link>
                  </>
                ) : (
                  <div className="pf-empty">
                    <p>
                      Initial formulation not yet established. Add intake information or clinical
                      material to begin.
                    </p>
                    <div className="stack-btns horizontal wrap">
                      <Link className="btn primary" to={`/clients/${client.id}/setup`}>
                        Add Intake
                      </Link>
                      <Link className="btn secondary" to={`/clients/${client.id}/setup`}>
                        Add Transcript
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            )}

            {tab === 'preparation' && (
              <SessionPreparationView
                client={client}
                therapistName={
                  auth.therapist
                    ? `${auth.therapist.firstName} ${auth.therapist.lastName}`.trim()
                    : undefined
                }
                onClientUpdate={setClient}
              />
            )}

            {tab === 'treatment-work' && (
              <TreatmentWorkPanel client={client} />
            )}

            {tab === 'sessions' && (
              <section className="panel">
                <h2>Session timeline</h2>
                <p className="hint">
                  Each completed cycle links preparation → practice → transcript → clinical
                  intelligence → approved findings → debrief → formulation update.
                </p>
                {(client.sessionTimeline ?? []).length > 0 ? (
                  <ol className="session-timeline">
                    {(client.sessionTimeline ?? [])
                      .slice()
                      .reverse()
                      .map((ev) => (
                        <li key={ev.id}>
                          <time dateTime={ev.at}>{new Date(ev.at).toLocaleString()}</time>
                          {ev.href ? (
                            <Link to={ev.href}>
                              <strong>{ev.label}</strong>
                            </Link>
                          ) : (
                            <strong>{ev.label}</strong>
                          )}
                          <span className="pf-meta">
                            {ev.kind}
                            {ev.sessionId ? ` · ${ev.sessionId}` : ''}
                          </span>
                        </li>
                      ))}
                  </ol>
                ) : (
                  <p className="pf-meta">
                    No timeline events yet. Approve a Session Debrief after Clinical Reasoning to
                    start the longitudinal record.
                  </p>
                )}
                <h3 style={{ marginTop: '1.5rem' }}>Analyses</h3>
                <ul className="client-activity-list">
                  {analyses.map((a) => (
                    <li key={a.id}>
                      {new Date(a.createdAt).toLocaleString()} · {a.phase} · {a.reviewStatus}
                      {(a.reviewStatus === 'reviewed' || a.reviewStatus === 'applied') && (
                        <>
                          {' · '}
                          <Link to={`/clients/${client.id}/debrief?analysisId=${encodeURIComponent(a.id)}`}>
                            Debrief
                          </Link>
                        </>
                      )}
                    </li>
                  ))}
                  {!analyses.length && <li className="hint">No sessions recorded yet</li>}
                </ul>
                <div className="stack-btns horizontal wrap" style={{ marginTop: '1rem' }}>
                  <Link className="btn secondary" to={`/clients/${client.id}/debrief`}>
                    Open Session Debrief
                  </Link>
                  <button type="button" className="btn tertiary" onClick={() => selectTab('audit' as DashTab)}>
                    Audit
                  </button>
                </div>
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

function ClientOverviewPanel({
  client,
  pendingCi,
  primaryTheme,
  onPrepare,
}: {
  client: ClientRecord;
  pendingCi: number;
  primaryTheme: ClientRecord['themes'][number] | undefined;
  onPrepare: () => void;
}) {
  const approach = inferPrimaryApproach(client);
  const strategy = acceptedStrategyTexts(client);
  const openQs = (client.outstandingQuestions ?? []).filter(
    (q) => q.status === 'open' || q.status === 'deferred',
  );
  const core = client.coreFormulation;
  const hasCore = hasCoreFormulationContent(core);

  if (!hasCore && !client.intake && !(client.clinicalMaterials ?? []).length) {
    return (
      <div className="client-overview-stack">
        <section className="pf-surface-card">
          <h2>{client.displayName}</h2>
          <p className="pf-meta">
            Current approach:{' '}
            {PRIMARY_APPROACH_LABELS[approach as PrimaryTreatmentApproach] ?? 'Not yet decided'}
          </p>
          <div className="pf-empty">
            <p>
              Initial formulation not yet established. Add intake information or clinical material to
              begin.
            </p>
            <div className="stack-btns horizontal wrap">
              <Link className="btn primary" to={`/clients/${client.id}/setup`}>
                Add Intake
              </Link>
              <Link className="btn secondary" to={`/clients/${client.id}/setup`}>
                Add Transcript
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="client-overview-stack">
      <section className="pf-surface-card">
        <h2>{client.displayName}</h2>
        <p className="pf-meta">
          Current approach:{' '}
          <strong>
            {PRIMARY_APPROACH_LABELS[approach as PrimaryTreatmentApproach] ?? 'Not yet decided'}
          </strong>
        </p>
      </section>

      <section className="pf-surface-card">
        <h2>Current understanding</h2>
        <dl className="ci-kv">
          <dt>Presenting problems</dt>
          <dd>
            {(core?.presentingProblems?.map((p) => p.text).join('; ') ||
              client.presentingProblems.join('; ') ||
              client.presentingProblem) ??
              '—'}
          </dd>
          <dt>Working formulation</dt>
          <dd>
            {hasCore
              ? 'Core clinical understanding established'
              : primaryTheme
                ? CLINICAL_THEME_LABELS[primaryTheme.theme]
                : 'Not yet established'}
          </dd>
          <dt>Key patterns</dt>
          <dd>{(core?.repeatingPatterns ?? []).map((p) => p.text).join('; ') || '—'}</dd>
          <dt>Resources</dt>
          <dd>
            {(core?.resources ?? []).map((r) => r.text).join('; ') ||
              client.resources.map((r) => r.text).join('; ') ||
              '—'}
          </dd>
        </dl>
      </section>

      <section className="pf-surface-card">
        <h2>Current work</h2>
        <dl className="ci-kv">
          <dt>Current contract / strategy</dt>
          <dd>{strategy.length ? strategy.join('; ') : 'None accepted yet'}</dd>
          <dt>Outstanding questions</dt>
          <dd>{openQs.length ? `${openQs.length} open` : 'None open'}</dd>
        </dl>
      </section>

      <section className="pf-surface-card">
        <h2>Next session</h2>
        <p className="pf-meta">
          {client.activeCycle?.workflowStatus === 'complete' || !client.activeCycle
            ? 'Preparation ready'
            : 'Cycle in progress'}
        </p>
        <button type="button" className="btn primary" onClick={onPrepare}>
          Prepare Session
        </button>
      </section>

      <section className="pf-surface-card">
        <h2>Recent clinical material</h2>
        <ul className="client-activity-list">
          {(client.clinicalMaterials ?? [])
            .slice()
            .reverse()
            .slice(0, 5)
            .map((m) => (
              <li key={m.id}>
                {m.label} · {m.sourceType} · {new Date(m.createdAt).toLocaleDateString()}
              </li>
            ))}
          {!(client.clinicalMaterials ?? []).length && (
            <li className="hint">No intake or transcripts added yet</li>
          )}
        </ul>
        {client.lastSessionSummary && (
          <p className="pf-meta">Latest debrief: {client.lastSessionSummary}</p>
        )}
      </section>

      <section className="pf-surface-card">
        <h2>Clinical Reasoning</h2>
        <p className="pf-meta" style={{ marginBottom: 16 }}>
          {pendingCi ? `${pendingCi} findings awaiting review` : 'No pending reviews'}
        </p>
        <Link className="btn primary" to={`/clients/${client.id}/clinical-reasoning`}>
          Review
        </Link>
      </section>
    </div>
  );
}

function TreatmentWorkPanel({ client }: { client: ClientRecord }) {
  const approach = inferPrimaryApproach(client);
  const isEmdr = approach === 'emdr' || approach === 'pain' || approach === 'integrated-ta-emdr';
  const isTa = approach === 'transactional-analysis' || approach === 'integrated-ta-emdr';

  return (
    <section className="pf-surface-card">
      <h2>Treatment Work</h2>
      <p className="pf-meta">
        Modality-specific content appears here after you select a current approach. Default remains
        Not yet decided.
      </p>

      {isTa && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Transactional Analysis</h3>
          <dl className="ci-kv">
            <dt>Contract</dt>
            <dd>{acceptedStrategyTexts(client).join('; ') || '—'}</dd>
            <dt>Redecision areas</dt>
            <dd>
              {(client.taFormulation?.redecisionAreas ?? [])
                .map((r) => `${r.oldDecision} → ${r.possibleNewDecision}`)
                .filter(Boolean)
                .join('; ') || '—'}
            </dd>
            <dt>Script work</dt>
            <dd>
              {(client.taFormulation?.scriptMessages ?? [])
                .map((s) => s.clientLanguage)
                .filter(Boolean)
                .join('; ') || '—'}
            </dd>
          </dl>
        </div>
      )}

      {isEmdr && (
        <div style={{ marginTop: '1rem' }}>
          <h3>EMDR</h3>
          <dl className="ci-kv">
            <dt>Targets</dt>
            <dd>{client.activeTarget?.headline || '—'}</dd>
            <dt>NC / PC</dt>
            <dd>
              {client.activeTarget?.nc || '—'} / {client.activeTarget?.pc || '—'}
            </dd>
            <dt>AIP theme</dt>
            <dd>
              {client.themes.find((t) => t.primary)
                ? CLINICAL_THEME_LABELS[client.themes.find((t) => t.primary)!.theme]
                : '—'}
            </dd>
          </dl>
          <h4>Candidates</h4>
          <ul>
            {client.targetCandidates.map((t) => (
              <li key={t.id}>{t.headline}</li>
            ))}
            {!client.targetCandidates.length && <li className="hint">None</li>}
          </ul>
        </div>
      )}

      {!isTa && !isEmdr && (
        <div className="pf-empty">
          <p>
            Select a current treatment approach in Client Setup to see modality-specific treatment
            work (e.g. TA contract / EMDR targets).
          </p>
          <Link className="btn secondary" to={`/clients/${client.id}/setup`}>
            Choose approach
          </Link>
        </div>
      )}
    </section>
  );
}
