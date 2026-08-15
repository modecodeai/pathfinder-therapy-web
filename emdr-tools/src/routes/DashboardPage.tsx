import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/shell';
import { IconPlus } from '../components/icons';
import { useAuth } from '../hooks/useAuth';
import { createClient, listClients } from '../clinical-intelligence/lib/api';

type ClientRow = {
  id: string;
  displayName: string;
  presentingProblem?: string;
  updatedAt: string;
  status?: string;
  currentPhase?: string;
  ciPending?: number;
};

function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Client-first clinical dashboard — primary action is New Client.
 * Treatment-specific EMDR CTAs do not belong here.
 */
export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const active = useMemo(
    () => clients.filter((c) => (c.status ?? 'active') !== 'archived'),
    [clients],
  );
  const recent = active.slice(0, 8);
  const attention = useMemo(() => {
    const items: Array<{ id: string; name: string; reason: string; href: string }> = [];
    for (const c of active) {
      if (c.ciPending && c.ciPending > 0) {
        items.push({
          id: `${c.id}-ci`,
          name: c.displayName,
          reason: 'Clinical Reasoning awaiting review',
          href: `/clients/${c.id}/clinical-reasoning`,
        });
      }
      if ((c.currentPhase ?? '').toLowerCase().includes('debrief')) {
        items.push({
          id: `${c.id}-debrief`,
          name: c.displayName,
          reason: 'Debrief incomplete',
          href: `/clients/${c.id}/debrief`,
        });
      }
      if ((c.currentPhase ?? '').toLowerCase().includes('prep')) {
        items.push({
          id: `${c.id}-prep`,
          name: c.displayName,
          reason: 'Preparation ready',
          href: `/clients/${c.id}?tab=preparation`,
        });
      }
    }
    return items.slice(0, 8);
  }, [active]);

  const firstName = auth.therapist?.firstName || 'there';
  const greeting = greetingForHour(new Date().getHours());

  return (
    <AppShell activeNav="dashboard" contentWidth="wide">
      <main className="practice-main pf-dashboard">
        <header className="pf-page-hero">
          <div>
            <h1 className="pf-title">Dashboard</h1>
            <p className="pf-subtitle">Your clinical workspace.</p>
            <p className="pf-dashboard-greeting">
              {greeting}, {firstName}
            </p>
          </div>
          <div className="stack-btns horizontal wrap">
            <button type="button" className="btn primary" onClick={() => setShowNew(true)}>
              <IconPlus /> New Client
            </button>
            <Link className="btn secondary" to="/clients">
              Open Clients
            </Link>
          </div>
        </header>

        {error && <p className="ci-error-banner">{error}</p>}

        <div className="pf-dashboard-grid">
          <section className="pf-surface-card">
            <h2 className="pf-card-title">Today</h2>
            {loading ? (
              <p className="pf-meta">Loading…</p>
            ) : recent.length === 0 ? (
              <p className="pf-meta">No clients scheduled</p>
            ) : (
              <ul className="pf-recent-list">
                {recent.slice(0, 3).map((c) => (
                  <li key={c.id}>
                    <Link to={`/clients/${c.id}`}>
                      <span className="pf-recent-name">{c.displayName}</span>
                      <span className="pf-meta">
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="pf-surface-card">
            <h2 className="pf-card-title">Clients requiring attention</h2>
            {attention.length === 0 ? (
              <p className="pf-meta">
                Intake awaiting review · Clinical Reasoning awaiting review · Debrief incomplete ·
                Preparation ready — none right now.
              </p>
            ) : (
              <ul className="pf-attention-list">
                {attention.map((a) => (
                  <li key={a.id}>
                    <Link to={a.href}>
                      <strong>{a.name}</strong>
                      <span className="pf-meta">{a.reason}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="pf-surface-card">
            <h2 className="pf-card-title">Recent clients</h2>
            {loading ? (
              <p className="pf-meta">Loading…</p>
            ) : recent.length === 0 ? (
              <div className="pf-empty">
                <p>No clients yet. Create a clinical record to begin.</p>
                <button type="button" className="btn primary" onClick={() => setShowNew(true)}>
                  <IconPlus /> New Client
                </button>
              </div>
            ) : (
              <ul className="pf-recent-list">
                {recent.map((c) => (
                  <li key={c.id}>
                    <Link to={`/clients/${c.id}`}>
                      <span className="pf-recent-name">{c.displayName}</span>
                      <span className="pf-meta">{c.presentingProblem || '—'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="pf-surface-card">
            <h2 className="pf-card-title">Quick access</h2>
            <div className="pf-quick-access">
              <Link className="btn secondary" to="/clients">
                Clients
              </Link>
              <Link className="btn secondary" to="/practice">
                Practice
              </Link>
              <Link className="btn secondary" to="/knowledge">
                Knowledge
              </Link>
              <Link className="btn tertiary" to="/session">
                Remote Session
              </Link>
            </div>
          </section>
        </div>
      </main>

      {showNew && (
        <NewClientIdentityModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            navigate(`/clients/${id}/setup`);
          }}
        />
      )}
    </AppShell>
  );
}

function NewClientIdentityModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [pronouns, setPronouns] = useState('');
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
      // Optional demographics via patch — never block create
      if (dateOfBirth.trim() || pronouns.trim()) {
        const { patchClient } = await import('../clinical-intelligence/lib/api');
        await patchClient(c.id, {
          dateOfBirth: dateOfBirth.trim() || undefined,
          pronouns: pronouns.trim() || undefined,
          setupProgress: { basicDetailsComplete: true, lastStep: 'intake' },
        });
      } else {
        const { patchClient } = await import('../clinical-intelligence/lib/api');
        await patchClient(c.id, {
          setupProgress: { basicDetailsComplete: true, lastStep: 'intake' },
        });
      }
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
        aria-labelledby="dash-new-client-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dash-new-client-title">Identity</h2>
        <p className="pf-meta">Create a client record in seconds — demographics are optional.</p>
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
            <span>Preferred name</span>
            <input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
          </label>
          <label className="field">
            <span>Client reference</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="field">
            <span>Date of birth (optional)</span>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </label>
          <label className="field">
            <span>Pronouns (optional)</span>
            <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} />
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
