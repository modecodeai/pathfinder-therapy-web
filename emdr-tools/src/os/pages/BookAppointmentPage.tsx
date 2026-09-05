import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/PublicShell';
import { createOsBooking, fetchOsServices, fetchOsTherapists } from '../api';
import { formatServicePrice } from '../serviceCatalog';
import type { LocationType, ServiceDefinition } from '../types';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Mobile-first booking wizard.
 * Service rules come from the catalogue — not hard-coded in the UI.
 */
export function BookAppointmentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [therapists, setTherapists] = useState<
    Array<{ id: string; displayName: string; profession?: string | null }>
  >([]);
  const [serviceId, setServiceId] = useState(params.get('service') ?? '');
  const [therapistId, setTherapistId] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('online');
  const [startsAt, setStartsAt] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchOsServices().then(setServices).catch(() => setServices([]));
    void fetchOsTherapists().then(setTherapists).catch(() => setTherapists([]));
  }, []);

  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  useEffect(() => {
    if (service?.locationOptions.length) {
      setLocationType(service.locationOptions[0]!);
    }
  }, [service]);

  const onSubmitDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!service || !consent) return;
    setBusy(true);
    setError(null);
    try {
      const when =
        startsAt ||
        new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16);
      const result = await createOsBooking({
        serviceId: service.id,
        therapistId: therapistId || undefined,
        startsAt: new Date(when).toISOString(),
        locationType,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Lisbon',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        consentVersion: 'privacy-v1',
        policyVersion: 'privacy-v1',
        bookingSource: 'pathfinder-native',
      });
      if (!result.ok || !result.accessToken || !result.appointment) {
        setError(result.error ?? 'Booking could not be completed');
        return;
      }
      sessionStorage.setItem(
        'pf-os-last-booking',
        JSON.stringify({
          accessToken: result.accessToken,
          appointment: result.appointment,
          intakeRequired: result.intakeRequired,
        }),
      );
      navigate(`/book/confirmed?token=${encodeURIComponent(result.accessToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicShell title="Book Therapy">
      <p className="pf-public-lede">
        Simple booking that creates your secure Pathfinder record — intake and therapy stay connected.
      </p>

      <ol className="pf-book-steps" aria-label="Booking steps">
        {(
          [
            [1, 'Service'],
            [2, 'Therapist'],
            [3, 'Time'],
            [4, 'Details'],
            [5, 'Payment'],
            [6, 'Confirmation'],
          ] as const
        ).map(([n, label]) => (
          <li key={n} className={step === n ? 'is-active' : step > n ? 'is-done' : ''}>
            <span>{n}. {label}</span>
          </li>
        ))}
      </ol>

      {error && <p className="ci-error-banner">{error}</p>}

      {step === 1 && (
        <section className="pf-public-card">
          <h2>1. Choose a service</h2>
          <ul className="pf-service-pick">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={serviceId === s.id ? 'is-selected' : ''}
                  onClick={() => setServiceId(s.id)}
                >
                  <strong>{s.name}</strong>
                  <span>{s.description}</span>
                  <span className="pf-meta">
                    {s.durationMinutes} min · {formatServicePrice(s)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn primary"
            disabled={!serviceId}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="pf-public-card">
          <h2>2. Choose a therapist</h2>
          {therapists.length === 0 ? (
            <p className="pf-meta">
              Therapists will appear once a Pathfinder Clinical account exists. You can continue — the
              practice will assign a clinician.
            </p>
          ) : (
            <ul className="pf-service-pick">
              {therapists.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={therapistId === t.id ? 'is-selected' : ''}
                    onClick={() => setTherapistId(t.id)}
                  >
                    <strong>{t.displayName}</strong>
                    <span>{t.profession || 'Therapist'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="stack-btns horizontal wrap">
            <button type="button" className="btn ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="btn primary" onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="pf-public-card">
          <h2>3. Location & time</h2>
          <label className="field">
            <span>Location</span>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as LocationType)}
            >
              {(service?.locationOptions ?? ['online']).map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'online' ? 'Online' : opt === 'in-person' ? 'In person' : 'Either'}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Preferred date & time</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <p className="hint">
            Stage 1–2: live calendars may still use Calendly. Native availability expands in Stage 3
            without breaking current bookings.
          </p>
          <div className="stack-btns horizontal wrap">
            <button type="button" className="btn ghost" onClick={() => setStep(2)}>
              Back
            </button>
            <button type="button" className="btn primary" onClick={() => setStep(4)}>
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="pf-public-card">
          <h2>4. Your details</h2>
          <form className="stack-btns" onSubmit={(e) => void onSubmitDetails(e)}>
            <label className="field">
              <span>Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Telephone (optional)</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="pf-consent-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                I agree to the Pathfinder privacy notice (version privacy-v1) for storing my contact
                and intake information securely.
              </span>
            </label>
            <div className="stack-btns horizontal wrap">
              <button type="button" className="btn ghost" onClick={() => setStep(3)}>
                Back
              </button>
              <button type="submit" className="btn primary" disabled={busy || !consent}>
                {busy ? 'Confirming…' : service?.paymentRequired ? 'Continue to payment' : 'Confirm booking'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Steps 5–6 are confirmation route; step 5 note when payment required */}
      {false && step === 5 && <p>Payment stub</p>}

      <p className="hint" style={{ marginTop: '1.5rem' }}>
        Prefer the current consultation calendar?{' '}
        <a href="https://www.pathfindertherapy.com/book/" rel="noreferrer">
          Open Calendly booking
        </a>{' '}
        (Stage 1 embed remains supported).
      </p>
    </PublicShell>
  );
}

export function BookConfirmedPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const cached = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('pf-os-last-booking') ?? 'null') as {
        appointment?: {
          serviceName: string;
          startsAt: string;
          locationType: string;
          paymentStatus: string;
          contactName: string;
        };
        intakeRequired?: boolean;
        accessToken?: string;
      } | null;
    } catch {
      return null;
    }
  })();
  const appt = cached?.appointment;
  const access = token || cached?.accessToken || '';

  return (
    <PublicShell title="Appointment confirmed">
      <section className="pf-public-card">
        {appt ? (
          <dl className="ci-kv">
            <dt>Name</dt>
            <dd>{appt.contactName}</dd>
            <dt>Service</dt>
            <dd>{appt.serviceName}</dd>
            <dt>Date / time</dt>
            <dd>{new Date(appt.startsAt).toLocaleString()}</dd>
            <dt>Location</dt>
            <dd>{appt.locationType === 'online' ? 'Online' : 'In person'}</dd>
            <dt>Payment</dt>
            <dd>{appt.paymentStatus === 'not-required' ? 'Not required' : 'Pending (Stripe later)'}</dd>
          </dl>
        ) : (
          <p>Your appointment is confirmed.</p>
        )}
        <h2>Next step</h2>
        <p>Complete your intake form so your therapist can prepare.</p>
        {access ? (
          <Link className="btn primary" to={`/portal/intake?token=${encodeURIComponent(access)}`}>
            Complete Intake
          </Link>
        ) : (
          <Link className="btn primary" to="/portal/intake">
            Complete Intake
          </Link>
        )}
      </section>
    </PublicShell>
  );
}
