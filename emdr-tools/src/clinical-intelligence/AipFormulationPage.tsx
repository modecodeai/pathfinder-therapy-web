import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { THEME_EVIDENCE_LABELS, type ClientRecord, type TemporalProng } from './types';
import { buildAipFormulation } from './lib/formulation';
import { getClient, patchClient } from './lib/api';
import { AipNetworkMap } from './components/AipNetworkMap';
import { SessionChangePanel } from './components/SessionChangePanel';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel ci-aip-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Empty({ label = 'Not established' }: { label?: string }) {
  return <p className="hint">{label}</p>;
}

export function AipFormulationPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setClient(await getClient(clientId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void refresh();
  }, [auth.isAuthenticated, clientId]);

  const view = useMemo(() => (client ? buildAipFormulation(client) : null), [client]);

  const setProng = async (itemId: string, prong: TemporalProng) => {
    if (!client) return;
    setBusy(true);
    try {
      const next = {
        ...client,
        prongAssignments: { ...(client.prongAssignments ?? {}), [itemId]: prong },
      };
      const res = await patchClient(clientId, { prongAssignments: next.prongAssignments });
      if (res.client) setClient(res.client);
      else setClient(next);
    } catch {
      setError('Could not update prong assignment');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="clients" />
      <main className="practice-main ci-aip-page">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/clients">Clients</Link>
            <span aria-hidden> › </span>
            <Link to={`/clients/${clientId}`}>{client?.displayName || 'Client'}</Link>
            <span aria-hidden> › </span>
            AIP Formulation
          </p>
          <h1>AIP Formulation</h1>
          <p className="lede">
            Therapist-approved clinical intelligence only. AI suggestions never appear as established
            here.
          </p>
          <div className="stack-btns horizontal wrap">
            <Link className="btn" to={`/clients/${clientId}/clinical-intelligence`}>
              Analyse Transcript
            </Link>
            <Link className="btn ghost" to={`/clients/${clientId}`}>
              Client record
            </Link>
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

        {view && (
          <>
            <Section title="Three-pronged view — PAST | PRESENT | FUTURE">
              <p className="hint">
                Organise approved memories, triggers and future work. Defaults are editable;
                reassignment does not invent clinical content.
              </p>
              <div className="ci-prong-grid">
                {view.prongs.map((bucket) => (
                  <div key={bucket.prong} className="ci-prong-col">
                    <h3>{bucket.label}</h3>
                    <h4>Memories</h4>
                    {!bucket.memories.length && <Empty />}
                    <ul>
                      {bucket.memories.map((m) => (
                        <li key={m.id}>
                          {m.approximateAge != null ? `Age ${m.approximateAge} — ` : ''}
                          {m.headline}
                          <ProngSelect
                            value={bucket.prong}
                            disabled={busy}
                            onChange={(p) => void setProng(m.id, p)}
                          />
                        </li>
                      ))}
                    </ul>
                    <h4>Triggers</h4>
                    {!bucket.triggers.length && <Empty />}
                    <ul>
                      {bucket.triggers.map((t) => (
                        <li key={t.id}>
                          {t.text}
                          <ProngSelect
                            value={bucket.prong}
                            disabled={busy}
                            onChange={(p) => void setProng(t.id, p)}
                          />
                        </li>
                      ))}
                    </ul>
                    <h4>Future work</h4>
                    {!bucket.futureWork.length && <Empty />}
                    <ul>
                      {bucket.futureWork.map((f) => (
                        <li key={f.id}>
                          {f.text}
                          <ProngSelect
                            value={bucket.prong}
                            disabled={busy}
                            onChange={(p) => void setProng(f.id, p)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Presenting Problems">
              {!view.presentingProblems.length && <Empty />}
              <ul>
                {view.presentingProblems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Section>

            <Section title="Current Triggers">
              {!view.currentTriggers.length && <Empty />}
              <ul>
                {view.currentTriggers.map((t) => (
                  <li key={t.id}>{t.text}</li>
                ))}
              </ul>
            </Section>

            <Section title="Past Experiences / Memory Timeline">
              {!view.memoryTimeline.length && <Empty />}
              <ol className="ci-memory-timeline">
                {view.memoryTimeline.map((m) => (
                  <li key={m.id}>
                    <strong>{m.approximateAge != null ? `Age ${m.approximateAge}` : 'Age unknown'}</strong>
                    {' — '}
                    {m.headline}
                    {m.description ? ` · ${m.description}` : ''}
                    {m.touchstone ? ' · Possible touchstone candidate' : ''}
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Clinical Themes — longitudinal summary">
              <p className="hint">
                Evidence strength only (not pathology scores):{' '}
                {Object.values(THEME_EVIDENCE_LABELS).join(' · ')}
              </p>
              <table className="ci-theme-summary-table">
                <thead>
                  <tr>
                    <th>Theme</th>
                    <th>Evidence strength</th>
                    <th>Related memories</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {view.themes.map((t) => (
                    <tr key={t.theme}>
                      <td>
                        {t.label}
                        {t.primary ? ' (primary)' : ''}
                      </td>
                      <td>
                        <span className={`ci-strength strength-${t.strength}`}>{t.strengthLabel}</span>
                      </td>
                      <td>{t.relatedMemoryCount}</td>
                      <td>{t.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Touchstone Candidates">
              {!view.touchstoneCandidates.length && <Empty label="Not established / none approved" />}
              <ul>
                {view.touchstoneCandidates.map((m) => (
                  <li key={m.id}>
                    {m.approximateAge != null ? `Age ${m.approximateAge} — ` : ''}
                    {m.headline}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Active Targets">
              {!view.activeTargets.length && <Empty />}
              {view.activeTargets.map((t) => (
                <dl className="ci-kv" key={t.headline}>
                  <dt>Target</dt>
                  <dd>{t.headline}</dd>
                  <dt>Image</dt>
                  <dd>{t.image || 'Not established'}</dd>
                  <dt>NC / PC</dt>
                  <dd>
                    {t.nc || 'Not established'} / {t.pc || 'Not established'}
                  </dd>
                  <dt>VoC / SUD</dt>
                  <dd>
                    {t.voc ?? 'Not established'} / {t.sud ?? 'Not established'}
                  </dd>
                  <dt>Emotion / Body</dt>
                  <dd>
                    {t.emotion || 'Not established'} / {t.body || 'Not established'}
                  </dd>
                </dl>
              ))}
            </Section>

            <Section title="Target Candidates">
              {!view.targetCandidates.length && <Empty />}
              <ul>
                {view.targetCandidates.map((t) => (
                  <li key={t.id}>
                    {t.headline}
                    {t.approximateAge != null ? ` (age ${t.approximateAge})` : ''}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="NC / PC Network">
              {!view.ncPcNetwork.length && <Empty />}
              <ul>
                {view.ncPcNetwork.map((c) => (
                  <li key={c.id}>
                    <strong>{c.polarity === 'negative' ? 'NC' : 'PC'}</strong>: {c.text}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Internal Resources">
              {!view.internalResources.length && <Empty />}
              <ul>
                {view.internalResources.map((r) => (
                  <li key={r.id}>{r.text}</li>
                ))}
              </ul>
            </Section>

            <Section title="External Resources">
              {!view.externalResources.length && <Empty />}
              <ul>
                {view.externalResources.map((r) => (
                  <li key={r.id}>{r.text}</li>
                ))}
              </ul>
            </Section>

            <Section title="Adaptive Information">
              {!view.adaptiveInformation.length && <Empty />}
              <ul>
                {view.adaptiveInformation.map((a) => (
                  <li key={a.id}>{a.text}</li>
                ))}
              </ul>
            </Section>

            <Section title="Future Template / Desired Responses">
              {!view.futureTemplates.length && (
                <Empty label="Not established — no approved future templates yet" />
              )}
              <ul>
                {view.futureTemplates.map((f) => (
                  <li key={f.id}>
                    {f.text}
                    {f.desiredResponse ? ` · Desired: ${f.desiredResponse}` : ''}
                  </li>
                ))}
              </ul>
            </Section>

            <SessionChangePanel summary={view.latestSessionChange} />

            {view.hasApprovedFormulation && (
              <Section title="AIP Network Map">
                <AipNetworkMap nodes={view.network.nodes} edges={view.network.edges} />
              </Section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ProngSelect({
  value,
  onChange,
  disabled,
}: {
  value: TemporalProng;
  onChange: (p: TemporalProng) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className="ci-prong-select"
      value={value}
      disabled={disabled}
      aria-label="Temporal prong"
      onChange={(e) => onChange(e.target.value as TemporalProng)}
    >
      <option value="past">Past</option>
      <option value="present">Present</option>
      <option value="future">Future</option>
    </select>
  );
}
