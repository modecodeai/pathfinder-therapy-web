import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { CLINICAL_THEME_LABELS, type ClientRecord } from './types';
import { createClient, getClient, listClientAnalyses, listClients } from './lib/api';

export function ClientsListPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<
    Array<{ id: string; displayName: string; presentingProblem?: string; updatedAt: string }>
  >([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setClients(await listClients());
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

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const c = await createClient(name.trim());
      navigate(`/clients/${c.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create client');
    }
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/settings">Settings</Link>
            <span aria-hidden> › </span>
            Clients
          </p>
          <h1>Clients</h1>
          <p className="lede">Client records for Clinical Intelligence and approved findings.</p>
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
            <form className="panel stack-btns" onSubmit={(e) => void onCreate(e)}>
              <label className="field">
                <span>New client display name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anonymous Client A"
                  required
                />
              </label>
              <button type="submit" className="btn primary" disabled={!name.trim()}>
                Create client
              </button>
            </form>
            {error && <p className="ci-error-banner">{error}</p>}
            {loading ? (
              <p>Loading…</p>
            ) : (
              <ul className="ci-client-list">
                {clients.map((c) => (
                  <li key={c.id}>
                    <Link className="pf-library-card" to={`/clients/${c.id}`}>
                      <h3>{c.displayName}</h3>
                      <p>{c.presentingProblem || 'No presenting problem recorded yet'}</p>
                    </Link>
                  </li>
                ))}
                {!clients.length && <p className="hint">No clients yet.</p>}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId)
      .then(setClient)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [auth.isAuthenticated, clientId]);

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="settings" />
      <main className="practice-main">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/clients">Clients</Link>
            <span aria-hidden> › </span>
            {client?.displayName || 'Client'}
          </p>
          <h1>{client?.displayName || 'Client'}</h1>
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
            <section className="panel">
              <h2>Clinical Intelligence</h2>
              <p className="hint">
                Analyse a pasted session transcript with server-side OpenAI. Findings require
                therapist review before updating this record.
              </p>
              <div className="stack-btns horizontal wrap">
                <Link className="btn primary" to={`/clients/${client.id}/clinical-intelligence`}>
                  Analyse Transcript
                </Link>
                <Link className="btn" to={`/clients/${client.id}/aip-formulation`}>
                  AIP Formulation
                </Link>
              </div>
            </section>

            <ClientAnalysesList clientId={client.id} />

            <section className="panel">
              <h2>Presenting problem</h2>
              <p>{client.presentingProblem || 'Not established'}</p>
              {client.presentingProblems.length > 1 && (
                <ul>
                  {client.presentingProblems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel">
              <h2>Active Target Assessment</h2>
              {client.activeTarget ? (
                <dl className="ci-kv">
                  <dt>Target</dt>
                  <dd>{client.activeTarget.headline}</dd>
                  <dt>Image</dt>
                  <dd>{client.activeTarget.image || 'Not established'}</dd>
                  <dt>NC / PC</dt>
                  <dd>
                    {client.activeTarget.nc || 'Not established'} /{' '}
                    {client.activeTarget.pc || 'Not established'}
                  </dd>
                  <dt>VoC / SUD</dt>
                  <dd>
                    {client.activeTarget.voc ?? 'Not established'} /{' '}
                    {client.activeTarget.sud ?? 'Not established'}
                  </dd>
                  <dt>Emotion / Body</dt>
                  <dd>
                    {client.activeTarget.emotion || 'Not established'} /{' '}
                    {client.activeTarget.body || 'Not established'}
                  </dd>
                </dl>
              ) : (
                <p className="hint">No approved Phase 3 target assessment yet</p>
              )}
            </section>

            <section className="panel">
              <h2>AIP Formulation — Clinical Themes</h2>
              {client.themes.length ? (
                <ul>
                  {client.themes.map((t) => (
                    <li key={t.theme}>
                      <strong>{CLINICAL_THEME_LABELS[t.theme]}</strong>
                      {t.primary ? ' (primary)' : ''}
                      {t.confidence ? ` · ${t.confidence} supporting evidence` : ''}
                      {t.notes ? ` — ${t.notes}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">Not currently established</p>
              )}
            </section>

            <section className="panel">
              <h2>Memory Timeline</h2>
              {client.memories.length ? (
                <ol className="ci-memory-timeline">
                  {[...client.memories]
                    .sort((a, b) => (a.approximateAge ?? 99) - (b.approximateAge ?? 99))
                    .map((m) => (
                      <li key={m.id}>
                        <strong>{m.approximateAge != null ? `Age ${m.approximateAge}` : 'Age unknown'}</strong>
                        {' — '}
                        {m.headline}
                        {m.description ? ` · ${m.description}` : ''}
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="hint">No approved memories yet</p>
              )}
            </section>

            <section className="panel">
              <h2>Triggers</h2>
              {client.triggers.length ? (
                <ul>
                  {client.triggers.map((t) => (
                    <li key={t.id}>{t.text}</li>
                  ))}
                </ul>
              ) : (
                <p className="hint">None approved</p>
              )}
            </section>

            <section className="panel">
              <h2>Resources</h2>
              {client.resources.length ? (
                <ul>
                  {client.resources.map((r) => (
                    <li key={r.id}>
                      <span className="hint">[{r.kind}]</span> {r.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">None approved</p>
              )}
            </section>

            <section className="panel">
              <h2>Processing notes (Phase 4)</h2>
              {(client.processingNotes?.length ?? 0) ? (
                <ol className="ci-processing-sequence">
                  {[...(client.processingNotes ?? [])]
                    .sort((a, b) => a.order - b.order)
                    .map((n) => (
                      <li key={n.id}>
                        <strong>
                          {n.order}. {n.sequenceLabel}
                        </strong>{' '}
                        <span className="hint">({n.category})</span>
                        <div>{n.value}</div>
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="hint">No approved processing sequence notes yet</p>
              )}
            </section>

            <section className="panel">
              <h2>Target Candidates</h2>
              <p className="hint">Approved candidates only — not the current target.</p>
              {client.targetCandidates.length ? (
                <ul>
                  {client.targetCandidates.map((t) => (
                    <li key={t.id}>
                      {t.headline}
                      {t.approximateAge != null ? ` (age ${t.approximateAge})` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">None approved</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ClientAnalysesList({ clientId }: { clientId: string }) {
  const [rows, setRows] = useState<
    Array<{ id: string; protocol: string; phase: string; reviewStatus: string; createdAt: string }>
  >([]);
  useEffect(() => {
    void listClientAnalyses(clientId)
      .then(setRows)
      .catch(() => setRows([]));
  }, [clientId]);
  return (
    <section className="panel">
      <h2>Analysis history</h2>
      <p className="hint">Raw transcripts and AI analyses are stored separately from the approved record.</p>
      {rows.length ? (
        <ul>
          {rows.map((r) => (
            <li key={r.id}>
              {new Date(r.createdAt).toLocaleString()} · {r.protocol} / {r.phase} · {r.reviewStatus}
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">No analyses yet</p>
      )}
    </section>
  );
}
