import { Link, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../../guided/components/AppHeader';
import { loadStandardSession, STANDARD_PHASE_LABELS } from '../../guided/lib/standardSession';
import { loadPainWorkspace } from '../../lib/emdr-pain/painHelpers';
import { PAIN_STAGE_LABELS } from '../../types/painProtocol';
import { IconArrowRight, IconUser } from '../../../components/icons';
import { useAuth } from '../../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { listClients } from '../../../clinical-intelligence/lib/api';

/**
 * Practice home — begin from client context.
 * Treatment selection happens after client selection, not as global EMDR CTAs.
 */
export function PracticeHomePage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const preselectedClientId = params.get('clientId');
  const standard = loadStandardSession();
  const pain = loadPainWorkspace();
  const hasStandard =
    Boolean(standard.target.label || standard.target.image || standard.timeline.length) ||
    Boolean(standard.updatedAt);
  const hasPain = pain.stage !== 'dashboard' || pain.completedStages.length > 0;
  const continueTo = hasStandard
    ? '/practice/standard'
    : hasPain
      ? '/pain'
      : preselectedClientId
        ? `/clients/${preselectedClientId}?tab=preparation`
        : '/clients';
  const continueLabel = hasStandard
    ? `Continue · ${STANDARD_PHASE_LABELS[standard.phase]}`
    : hasPain
      ? `Continue · ${PAIN_STAGE_LABELS[pain.stage] ?? 'Pain protocol'}`
      : preselectedClientId
        ? 'Continue with selected client'
        : 'Open a client to start';

  const [recent, setRecent] = useState<Array<{ id: string; displayName: string; updatedAt: string }>>(
    [],
  );

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void listClients()
      .then((rows) =>
        setRecent(
          rows
            .filter((c) => (c.status ?? 'active') !== 'archived')
            .slice(0, 5)
            .map((c) => ({ id: c.id, displayName: c.displayName, updatedAt: c.updatedAt })),
        ),
      )
      .catch(() => setRecent([]));
  }, [auth.isAuthenticated]);

  return (
    <div className="practice-shell">
      <AppHeader activeNav="practice" />
      <main className="practice-main">
        <header className="pf-page-hero">
          <div>
            <h1 className="pf-title">Practice</h1>
            <p className="pf-subtitle">
              Continue a recent client session, or start from a client record. Treatment selection
              follows the client.
            </p>
          </div>
          <Link className="btn primary" to="/clients">
            <IconUser size={18} /> Start session with client
          </Link>
        </header>

        <section className="pf-stack">
          <Link className="pf-surface-card pf-continue-card" to={continueTo}>
            <div>
              <h2 className="pf-card-title">Continue recent client session</h2>
              <p className="pf-meta">
                {hasStandard || hasPain
                  ? continueLabel
                  : 'No in-progress session in this browser — open a client when ready.'}
              </p>
            </div>
            <span className="pf-text-link">
              Open <IconArrowRight size={16} />
            </span>
          </Link>

          <div className="pf-surface-card">
            <h2 className="pf-card-title">Recent clients</h2>
            {!auth.isAuthenticated ? (
              <div className="pf-empty">
                <p>Sign in to see recent clients across devices.</p>
                <Link className="btn secondary" to="/account">
                  Sign in
                </Link>
              </div>
            ) : recent.length === 0 ? (
              <div className="pf-empty">
                <p>No clients yet. Create a clinical record to keep sessions organised.</p>
                <Link className="btn secondary" to="/">
                  <IconUser size={18} /> Open Dashboard
                </Link>
              </div>
            ) : (
              <ul className="pf-recent-list">
                {recent.map((c) => (
                  <li key={c.id}>
                    <Link to={`/clients/${c.id}`}>
                      <span className="pf-recent-name">{c.displayName}</span>
                      <span className="pf-meta">
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ''}
                      </span>
                    </Link>
                    <Link
                      className="btn tertiary"
                      to={`/clients/${c.id}?tab=preparation`}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Prepare
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
