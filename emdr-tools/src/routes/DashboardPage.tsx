import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/shell';
import { IconPlus } from '../components/icons';
import { useAuth } from '../hooks/useAuth';
import { createClient, listClients, patchClient } from '../clinical-intelligence/lib/api';
import { listOsAppointments } from '../os/api';
import { getService } from '../os/serviceCatalog';
import { INTAKE_STATUS_LABELS } from '../os/providers';
import type { Appointment } from '../os/types';
import { PRIMARY_APPROACH_LABELS } from '../clinical-intelligence/clinicalReasoning';

type ClientRow = {
  id: string;
  displayName: string;
  presentingProblem?: string;
  updatedAt: string;
  status?: string;
  currentPhase?: string;
  intakeStatus?: string;
  intakeClinicalStatus?: string;
  ciPending?: number;
};

function greetingForHour(h: number): string {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function isSameLocalDay(iso: string, ref = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

/**
 * Clinician dashboard — TODAY-centred Pathfinder OS workspace.
 * Primary: + New Client · Secondary: + New Appointment
 */
export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, a] = await Promise.all([
        listClients(),
        listOsAppointments().catch(() => [] as Appointment[]),
      ]);
      setClients(c);
      setAppointments(a);
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
  const todayAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== 'cancelled' && isSameLocalDay(a.startsAt))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [appointments],
  );

  const attention = useMemo(() => {
    const items: Array<{ id: string; name: string; reason: string; href: string }> = [];
    for (const c of active) {
      if (
        c.intakeStatus === 'submitted' ||
        c.intakeClinicalStatus === 'submitted' ||
        c.intakeClinicalStatus === 'ai-review-ready'
      ) {
        items.push({
          id: `${c.id}-intake`,
          name: c.displayName,
          reason: 'Intake awaiting review',
          href: `/clients/${c.id}?tab=intake`,
        });
      }
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
    return items.slice(0, 10);
  }, [active]);

  const firstName = auth.therapist?.firstName || 'there';
  const greeting = greetingForHour(new Date().getHours());
  const clientName = (id: string) =>
    active.find((c) => c.id === id)?.displayName ??
    appointments.find((a) => a.clientId === id)?.contactName ??
    'Client';

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
            <Link className="btn secondary" to="/book">
              <IconPlus /> New Appointment
            </Link>
            <Link className="btn tertiary" to="/clients">
              Open Clients
            </Link>
          </div>
        </header>

        {error && <p className="ci-error-banner">{error}</p>}

        <div className="pf-dashboard-grid">
          <section className="pf-surface-card pf-today-card">
            <h2 className="pf-card-title">Today</h2>
            {loading ? (
              <p className="pf-meta">Loading…</p>
            ) : todayAppts.length === 0 ? (
              <p className="pf-meta">No clients scheduled</p>
            ) : (
              <ul className="pf-today-list">
                {todayAppts.map((a) => {
                  const svc = getService(a.serviceId);
                  const name = clientName(a.clientId);
                  const intakeLabel =
                    INTAKE_STATUS_LABELS[a.intakeStatus] ?? a.intakeStatus;
                  return (
                    <li key={a.id}>
                      <div>
                        <strong>
                          {new Date(a.startsAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          {name}
                        </strong>
                        <span className="pf-meta">
                          {svc?.name ?? a.serviceId}
                          {a.locationType === 'online' ? ' · Online' : ''}
                        </span>
                        <span className="pf-meta">Intake: {intakeLabel}</span>
                      </div>
                      <div className="stack-btns horizontal wrap">
                        {a.intakeStatus === 'submitted' ? (
                          <Link className="btn primary" to={`/clients/${a.clientId}?tab=intake`}>
                            Review Intake
                          </Link>
                        ) : (
                          <Link className="btn primary" to={`/clients/${a.clientId}?tab=preparation`}>
                            {a.intakeStatus === 'reviewed' || a.intakeStatus === 'not-requested'
                              ? 'Prepare'
                              : 'Open'}
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="pf-surface-card">
            <h2 className="pf-card-title">Clients requiring attention</h2>
            {attention.length === 0 ? (
              <p className="pf-meta">
                Intake awaiting review · Clinical Reasoning · Debrief · Preparation — none right now.
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
                <p>No clients yet. Create a clinical record or take a booking.</p>
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
                      <span className="pf-meta">
                        {c.intakeStatus === 'submitted'
                          ? 'Intake awaiting review'
                          : c.presentingProblem || '—'}
                      </span>
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
              <Link className="btn tertiary" to="/book">
                Book
              </Link>
              <Link className="btn tertiary" to="/session">
                Remote Session
              </Link>
            </div>
            <p className="hint" style={{ marginTop: '0.75rem' }}>
              Approaches stay modality-neutral until selected — e.g.{' '}
              {PRIMARY_APPROACH_LABELS.unspecified}.
            </p>
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
      await patchClient(c.id, {
        dateOfBirth: dateOfBirth.trim() || undefined,
        pronouns: pronouns.trim() || undefined,
        setupProgress: { basicDetailsComplete: true, lastStep: 'intake' },
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
