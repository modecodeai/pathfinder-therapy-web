import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../emdr/guided/components/AppHeader';
import { useAuth } from '../hooks/useAuth';
import { getClient, patchClient } from './lib/api';
import { ensureClinicalReasoningStores } from './lib/coreFormulation';
import { buildAipFormulation } from './lib/formulation';
import {
  PRIMARY_APPROACH_LABELS,
  TA_DRIVER_LABELS,
  TA_INJUNCTION_LABELS,
  TA_LIFE_POSITION_LABELS,
  type ClinicalLens,
  type PrimaryTreatmentApproach,
} from './clinicalReasoning';
import {
  inferPrimaryApproach,
  setPrimaryTreatmentApproach,
} from './lib/lensGovernance';
import { CLINICAL_THEME_LABELS, type ClientRecord } from './types';

/**
 * Clinical Reasoning workspace — one client, one record, multiple lenses.
 * Primary approach determines which lens is prioritised — never auto-EMDR.
 */
export function ClinicalReasoningPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  type ViewTab = 'overview' | 'core' | ClinicalLens;
  const [view, setView] = useState<ViewTab>('overview');
  const [exploreOpen, setExploreOpen] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId)
      .then((c) => setClient(ensureClinicalReasoningStores(c)))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [auth.isAuthenticated, clientId]);

  const core = client?.coreFormulation;
  const aip = useMemo(() => (client ? buildAipFormulation(client) : null), [client]);
  const ta = client?.taFormulation ?? client?.taLens;
  const primary = client ? inferPrimaryApproach(client) : 'unspecified';
  const isTaPrimary = primary === 'transactional-analysis';
  const isEmdrPrimary = primary === 'emdr' || primary === 'pain';

  const onChangeApproach = async (approach: PrimaryTreatmentApproach) => {
    if (!client) return;
    const next = setPrimaryTreatmentApproach(client, approach);
    const res = await patchClient(clientId, {
      primaryTreatmentApproach: next.primaryTreatmentApproach,
      treatmentApproachHistory: next.treatmentApproachHistory,
      activeApproaches: next.activeApproaches,
      activeClinicalLenses: next.activeClinicalLenses,
    });
    if (res.client) setClient(ensureClinicalReasoningStores(res.client));
    else setClient(next);
  };

  return (
    <div className="practice-shell library-page">
      <AppHeader activeNav="clients" />
      <main className="practice-main clinical-reasoning-page">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to={`/clients/${clientId}`}>{client?.displayName || 'Client'}</Link>
            <span aria-hidden> › </span>
            Clinical Reasoning
          </p>
          <div className="clients-header">
            <div>
              <h1>Clinical Reasoning</h1>
              <p className="lede">
                One person · one record · multiple clinical lenses. No lens is treated as objective
                truth.
              </p>
              {client && (
                <p className="pf-meta">
                  Current approach: <strong>{PRIMARY_APPROACH_LABELS[primary]}</strong>
                </p>
              )}
            </div>
            <label className="field clinical-lens-select">
              <span>Primary approach</span>
              <select
                value={primary}
                onChange={(e) => void onChangeApproach(e.target.value as PrimaryTreatmentApproach)}
                aria-label="Primary treatment approach"
              >
                {(Object.keys(PRIMARY_APPROACH_LABELS) as PrimaryTreatmentApproach[]).map((id) => (
                  <option key={id} value={id}>
                    {PRIMARY_APPROACH_LABELS[id]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        {!auth.isAuthenticated && (
          <section className="pf-surface-card">
            <Link className="btn primary" to="/account">
              Sign in
            </Link>
          </section>
        )}
        {error && <p className="ci-error-banner">{error}</p>}

        {client && (
          <>
            <nav className="client-dash-tabs" aria-label="Clinical reasoning views">
              <button
                type="button"
                className={view === 'overview' ? 'is-active' : ''}
                onClick={() => setView('overview')}
              >
                Integrated
              </button>
              <button
                type="button"
                className={view === 'core' ? 'is-active' : ''}
                onClick={() => setView('core')}
              >
                Core
              </button>
              <button
                type="button"
                className={view === 'transactional-analysis' ? 'is-active' : ''}
                onClick={() => setView('transactional-analysis')}
              >
                TA
              </button>
              <button
                type="button"
                className={view === 'emdr' ? 'is-active' : ''}
                onClick={() => setView('emdr')}
              >
                EMDR
              </button>
            </nav>

            <div className="stack-btns horizontal wrap" style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn tertiary" onClick={() => setExploreOpen((v) => !v)}>
                Explore Another Lens
              </button>
              {exploreOpen && (
                <>
                  <Link
                    className="btn tertiary"
                    to={`/clients/${clientId}/clinical-intelligence?exploreEmdr=1&lens=emdr&protocol=standard-emdr`}
                  >
                    EMDR
                  </Link>
                  <span className="pf-meta">Gestalt · Pain · Attachment (coming soon)</span>
                </>
              )}
            </div>

            {(view === 'overview' || view === 'core') && (
              <div className="client-overview-stack">
                <section className="pf-surface-card">
                  <h2>Core Clinical Formulation</h2>
                  <p className="pf-meta">Modality-agnostic · therapist-approved evidence only</p>
                  {core?.presentingProblems?.length ? (
                    <ul className="session-prep-list">
                      {core.presentingProblems.map((p) => (
                        <li key={p.id}>{p.text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-meta">No approved core presenting problems yet.</p>
                  )}
                  {core?.currentTriggers?.length ? (
                    <>
                      <h3>Current triggers</h3>
                      <ul className="session-prep-list">
                        {core.currentTriggers.map((t) => (
                          <li key={t.id}>{t.text}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {core?.repeatingPatterns?.length ? (
                    <>
                      <h3>Repeating patterns</h3>
                      <ul className="session-prep-list">
                        {core.repeatingPatterns.map((p) => (
                          <li key={p.id}>{p.text}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {core?.significantExperiences?.length ? (
                    <>
                      <h3>Significant experiences</h3>
                      <ul className="session-prep-list">
                        {core.significantExperiences.map((e) => (
                          <li key={e.id}>
                            {e.headline}
                            {e.approximateAge != null ? ` (age ${e.approximateAge})` : ''}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </section>

                {view === 'overview' && isTaPrimary && (
                  <section className="pf-surface-card">
                    <h2>Primary lens — Transactional Analysis</h2>
                    <p className="ci-ai-label">Lens — not fact</p>
                    <dl className="ci-kv">
                      <dt>Drivers</dt>
                      <dd>
                        {ta?.drivers?.length
                          ? ta.drivers.map((d) => TA_DRIVER_LABELS[d.driver]).join('; ')
                          : '—'}
                      </dd>
                      <dt>Possible injunction hypotheses</dt>
                      <dd>
                        {ta?.injunctionHypotheses?.length
                          ? ta.injunctionHypotheses
                              .map((i) => TA_INJUNCTION_LABELS[i.injunction])
                              .join('; ')
                          : '—'}
                      </dd>
                      <dt>Script summary</dt>
                      <dd>{ta?.scriptSummary || '—'}</dd>
                    </dl>
                  </section>
                )}

                {view === 'overview' && isEmdrPrimary && (
                  <section className="pf-surface-card">
                    <h2>Primary lens — EMDR</h2>
                    <p className="ci-ai-label">Lens — not fact</p>
                    {aip?.hasApprovedFormulation ? (
                      <dl className="ci-kv">
                        <dt>Primary theme</dt>
                        <dd>
                          {aip.themes.find((t) => t.primary)?.label ||
                            aip.themes.find((t) => t.strength !== 'not-established')?.label ||
                            '—'}
                        </dd>
                        <dt>Active target</dt>
                        <dd>{client.activeTarget?.headline || '—'}</dd>
                        <dt>NC / PC</dt>
                        <dd>
                          {client.activeTarget?.nc || client.approvedNc || '—'} /{' '}
                          {client.activeTarget?.pc || client.approvedPc || '—'}
                        </dd>
                      </dl>
                    ) : (
                      <p className="pf-meta">No approved EMDR formulation yet.</p>
                    )}
                  </section>
                )}

                {view === 'overview' && (
                  <section className="pf-surface-card">
                    <h2>Integrated working hypothesis</h2>
                    <p className="pf-meta">
                      Perspectives remain separated by lens. Pathfinder does not force theoretical
                      agreement or auto-convert modalities.
                    </p>
                    {core?.workingHypotheses?.filter((h) => h.clinicianApproved).length ? (
                      <ul className="session-prep-list">
                        {core.workingHypotheses
                          .filter((h) => h.clinicianApproved)
                          .map((h) => (
                            <li key={h.id}>
                              {h.statement}{' '}
                              <span className="pf-meta">({h.evidenceStrength})</span>
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="pf-meta">No clinician-approved integrated working hypothesis yet.</p>
                    )}
                    {!isEmdrPrimary && (
                      <Link
                        className="btn tertiary"
                        to={`/clients/${clientId}/clinical-intelligence?exploreEmdr=1`}
                      >
                        Explore with EMDR lens
                      </Link>
                    )}
                  </section>
                )}

                <div className="stack-btns horizontal wrap">
                  <Link className="btn primary" to={`/clients/${clientId}/clinical-intelligence`}>
                    Analyse Transcript
                  </Link>
                  <Link className="btn secondary" to={`/clients/${clientId}?tab=preparation`}>
                    Session Preparation
                  </Link>
                </div>
              </div>
            )}

            {view === 'emdr' && (
              <div className="client-overview-stack">
                <section className="pf-surface-card">
                  <h2>EMDR lens</h2>
                  <p className="lede">
                    AIP formulation, themes, targets, NC/PC and memory networks — therapist-approved
                    only.
                  </p>
                  {client.themes.length ? (
                    <ul className="session-prep-list">
                      {client.themes.map((t) => (
                        <li key={t.theme}>
                          {CLINICAL_THEME_LABELS[t.theme]}
                          {t.primary ? ' (primary)' : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-meta">No approved EMDR themes yet.</p>
                  )}
                  <Link className="btn primary" to={`/clients/${clientId}/aip-formulation`}>
                    Open full AIP formulation
                  </Link>
                </section>
              </div>
            )}

            {view === 'transactional-analysis' && (
              <div className="client-overview-stack">
                <section className="pf-surface-card">
                  <h2>TA Script Formulation</h2>
                  <p className="ci-ai-label">
                    Possible hypotheses · evidence-linked · therapist-approved
                  </p>
                  {ta?.scriptSummary && <p>{ta.scriptSummary}</p>}
                  <h3>Drivers</h3>
                  {ta?.drivers?.length ? (
                    <ul className="session-prep-list">
                      {ta.drivers.map((d) => (
                        <li key={d.id}>
                          <strong>{TA_DRIVER_LABELS[d.driver]}</strong>
                          {d.relatedBehaviours?.length
                            ? ` — ${d.relatedBehaviours.join('; ')}`
                            : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-meta">No approved driver patterns.</p>
                  )}
                  <h3>Possible injunction hypotheses</h3>
                  {ta?.injunctionHypotheses?.length ? (
                    <ul className="session-prep-list">
                      {ta.injunctionHypotheses.map((i) => (
                        <li key={i.id}>{TA_INJUNCTION_LABELS[i.injunction]}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-meta">No approved injunction hypotheses.</p>
                  )}
                  <h3>Life positions (context-specific)</h3>
                  {ta?.lifePositions?.length ? (
                    <ul className="session-prep-list">
                      {ta.lifePositions.map((l) => (
                        <li key={l.id}>
                          {TA_LIFE_POSITION_LABELS[l.position]} — {l.context}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-meta">No approved life-position observations.</p>
                  )}
                  <h3>Redecision areas</h3>
                  {ta?.redecisionAreas?.length ? (
                    <ul className="session-prep-list">
                      {ta.redecisionAreas.map((r) => (
                        <li key={r.id}>
                          Old: “{r.oldDecision}” → Possible: “{r.possibleNewDecision}”
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-meta">No approved redecision areas.</p>
                  )}
                  <Link
                    className="btn primary"
                    to={`/clients/${clientId}/clinical-intelligence?protocol=transactional-analysis&lens=transactional-analysis&mode=primary-lens-only`}
                  >
                    Analyse with TA lens
                  </Link>
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
