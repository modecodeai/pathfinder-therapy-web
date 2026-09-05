import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/PublicShell';
import { fetchPortalAppointment, submitPortalIntake } from '../api';

export function PublicHomePage() {
  return (
    <PublicShell title="Pathfinder Therapy">
      <p className="pf-public-lede">
        Welcoming therapy and EMDR in Lisbon and online — booking, intake and clinical care in one
        continuous journey.
      </p>
      <div className="stack-btns horizontal wrap">
        <Link className="btn primary" to="/book">
          Book Appointment
        </Link>
        <Link className="btn secondary" to="/services">
          Services
        </Link>
        <Link className="btn tertiary" to="/portal">
          Client Portal
        </Link>
      </div>
      <section className="pf-public-card" style={{ marginTop: '1.5rem' }}>
        <h2>How it works</h2>
        <ol>
          <li>Book a service and time</li>
          <li>Complete your intake securely</li>
          <li>Meet your therapist — preparation already connected</li>
        </ol>
      </section>
    </PublicShell>
  );
}

export function PublicServicesPage() {
  return (
    <PublicShell title="Services">
      <p className="pf-public-lede">Therapy offerings configured in Pathfinder OS — not hard-coded in the page.</p>
      <Link className="btn primary" to="/book">
        Book Appointment
      </Link>
      <ul className="pf-public-list">
        <li>
          <Link to="/book?service=svc_initial_consultation">Initial Consultation</Link>
        </li>
        <li>
          <Link to="/book?service=svc_psychotherapy_50">Psychotherapy — 50 min</Link>
        </li>
        <li>
          <Link to="/book?service=svc_online_psychotherapy_50">Online Psychotherapy — 50 min</Link>
        </li>
        <li>
          <Link to="/book?service=svc_emdr_60">EMDR — 60 min</Link>
        </li>
        <li>
          <Link to="/book?service=svc_emdr_pain_60">EMDR Pain — 60 min</Link>
        </li>
      </ul>
    </PublicShell>
  );
}

export function PublicTherapistsPage() {
  return (
    <PublicShell title="Therapists">
      <p className="pf-public-lede">
        Clinician profiles will expand here. Booking does not require a full clinical account to view
        availability.
      </p>
      <Link className="btn primary" to="/book">
        Book with a therapist
      </Link>
    </PublicShell>
  );
}

export function ClientPortalHomePage() {
  return (
    <PublicShell title="Client Portal">
      <p className="pf-public-lede">
        Upcoming appointments, intake, payments and remote-session links — without exposing clinical
        notes or AI reasoning.
      </p>
      <div className="pf-portal-grid">
        <Link className="pf-public-card" to="/portal/appointments">
          <strong>Appointments</strong>
          <span className="pf-meta">Upcoming · reschedule (soon)</span>
        </Link>
        <Link className="pf-public-card" to="/portal/intake">
          <strong>Intake</strong>
          <span className="pf-meta">Complete your form</span>
        </Link>
        <Link className="pf-public-card" to="/portal/payments">
          <strong>Payments</strong>
          <span className="pf-meta">Invoices & receipts (soon)</span>
        </Link>
      </div>
    </PublicShell>
  );
}

export function PortalAppointmentsPage() {
  return (
    <PublicShell title="Your appointments">
      <p className="pf-meta">
        Open your confirmation link or complete intake from your booking email. Full account login
        arrives in a later sprint.
      </p>
      <Link className="btn secondary" to="/portal/intake">
        Complete intake
      </Link>
    </PublicShell>
  );
}

export function PortalPaymentsPage() {
  return (
    <PublicShell title="Payments">
      <p className="pf-meta">
        Stripe and Portuguese invoicing are abstracted behind BillingProvider / InvoiceProvider —
        not wired to clinical data.
      </p>
    </PublicShell>
  );
}

export function PortalIntakePage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [meta, setMeta] = useState<{
    contactName?: string;
    serviceName?: string;
    startsAt?: string;
    intakeStatus?: string;
  } | null>(null);
  const [rawText, setRawText] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void fetchPortalAppointment(token).then((r) => {
      if (r.appointment) {
        setMeta({
          contactName: r.appointment.contactName,
          serviceName: r.appointment.serviceName,
          startsAt: r.appointment.startsAt,
          intakeStatus: r.appointment.intakeStatus,
        });
      } else if (r.error) setError(r.error);
    });
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !consent) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitPortalIntake(token, {
        rawText,
        version: 'pathfinder-intake-v1',
        consentVersion: 'privacy-v1',
        policyVersion: 'privacy-v1',
      });
      if (!res.ok) {
        setError(res.error ?? 'Could not submit intake');
        return;
      }
      setDone(res.message ?? 'Intake submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicShell title="Complete your intake">
      {!token && (
        <label className="field">
          <span>Access code from your confirmation email / page</span>
          <input value={token} onChange={(e) => setToken(e.target.value.trim())} />
        </label>
      )}

      {meta && (
        <p className="pf-meta">
          {meta.contactName}
          {meta.serviceName ? ` · ${meta.serviceName}` : ''}
          {meta.startsAt ? ` · ${new Date(meta.startsAt).toLocaleString()}` : ''}
          {meta.intakeStatus ? ` · Status: ${meta.intakeStatus}` : ''}
        </p>
      )}

      {done ? (
        <section className="pf-public-card">
          <p>{done}</p>
          <p className="hint">Your therapist will review this before the first session. No diagnosis is made automatically.</p>
          <Link className="btn secondary" to="/portal">
            Back to portal
          </Link>
        </section>
      ) : (
        <form className="pf-public-card stack-btns" onSubmit={(e) => void onSubmit(e)}>
          <p className="pf-meta">
            Paste or type your completed intake. Clinical content maps into your Pathfinder client
            record — raw submission is preserved.
          </p>
          <label className="field">
            <span>Intake form</span>
            <textarea
              className="ci-transcript-editor"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
              placeholder="Presenting concerns, history, goals, supports…"
            />
          </label>
          <label className="pf-consent-check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            <span>I consent to Pathfinder storing this intake (privacy-v1) for my therapist to review.</span>
          </label>
          {error && <p className="ci-error-banner">{error}</p>}
          <button type="submit" className="btn primary" disabled={busy || !token || !rawText.trim()}>
            {busy ? 'Submitting…' : 'Submit intake'}
          </button>
        </form>
      )}
    </PublicShell>
  );
}
