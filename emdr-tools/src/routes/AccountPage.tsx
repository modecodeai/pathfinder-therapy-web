import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'onboarding'>('register');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    privacyConsent: false,
    country: '',
    profession: '',
    emdrTrainingStatus: 'emdr-trained',
  });

  if (auth.loading) {
    return (
      <div className="marketing center-page">
        <p>Loading…</p>
      </div>
    );
  }

  if (auth.therapist && !auth.therapist.emdrTrainingStatus && mode !== 'onboarding') {
    // soft nudge — allow onboarding
  }

  if (auth.isAuthenticated && mode !== 'onboarding') {
    return (
      <div className="marketing">
        <header className="site-header">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Pathfinder</strong> EMDR Tools
            </span>
          </Link>
        </header>
        <main className="about">
          <h1>
            Welcome, {auth.therapist!.firstName}
          </h1>
          <p className="lede">Free therapist account · {auth.therapist!.accountTier}</p>
          <p className="hint">
            Pathfinder EMDR Tools supports clinical delivery and does not replace professional
            training, supervision, consultation or clinical judgement. EMDR reprocessing should be
            undertaken by appropriately trained practitioners.
          </p>
          <div className="cta-row">
            <Link className="btn primary" to="/session">
              Start EMDR Session
            </Link>
            <Link className="btn" to="/tools">
              Start BLS Studio
            </Link>
          </div>
          {!auth.therapist!.emdrTrainingStatus && (
            <button type="button" className="btn ghost" onClick={() => setMode('onboarding')}>
              Complete practice profile
            </button>
          )}
          <p>
            <button type="button" className="btn ghost" onClick={() => void auth.logout()}>
              Log out
            </button>
          </p>
        </main>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'onboarding') {
      const ok = await auth.saveOnboarding({
        country: form.country,
        profession: form.profession,
        emdrTrainingStatus: form.emdrTrainingStatus,
      });
      if (ok) navigate('/session');
      return;
    }
    if (mode === 'register') {
      const ok = await auth.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        privacyConsent: form.privacyConsent,
      });
      if (ok) setMode('onboarding');
      return;
    }
    const ok = await auth.login(form.email, form.password);
    if (ok) navigate('/session');
  };

  return (
    <div className="marketing">
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> EMDR Tools
          </span>
        </Link>
      </header>
      <main className="about account-form">
        <h1>
          {mode === 'onboarding'
            ? 'Tell us about your practice'
            : mode === 'register'
              ? 'Create free therapist account'
              : 'Sign in'}
        </h1>
        <p className="lede">Professional EMDR tools for therapists. No payment required.</p>

        <form onSubmit={(e) => void onSubmit(e)} className="auth-form">
          {mode === 'register' && (
            <>
              <label className="field">
                <span>First name</span>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Last name</span>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </label>
            </>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>
            </>
          )}

          {mode === 'register' && (
            <label className="toggle block">
              <input
                type="checkbox"
                checked={form.privacyConsent}
                onChange={(e) => setForm({ ...form, privacyConsent: e.target.checked })}
                required
              />
              <span>
                I am an appropriately trained mental-health professional (or in EMDR training) and
                consent to account creation. I will not enter unnecessary identifiable client data.
              </span>
            </label>
          )}

          {mode === 'onboarding' && (
            <>
              <label className="field">
                <span>Country</span>
                <input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Profession</span>
                <input
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                />
              </label>
              <label className="field">
                <span>EMDR training status</span>
                <select
                  value={form.emdrTrainingStatus}
                  onChange={(e) => setForm({ ...form, emdrTrainingStatus: e.target.value })}
                >
                  <option value="emdr-trained">EMDR trained</option>
                  <option value="in-training">Currently undertaking EMDR training</option>
                  <option value="consultant-trainer">EMDR consultant/trainer</option>
                  <option value="mental-health">Mental-health professional</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </>
          )}

          {auth.error && <p className="error">{auth.error}</p>}

          <button type="submit" className="btn primary">
            {mode === 'onboarding' ? 'Continue' : mode === 'register' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {mode !== 'onboarding' && (
          <p>
            {mode === 'register' ? (
              <>
                Already registered?{' '}
                <button type="button" className="linkish" onClick={() => setMode('login')}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                Need an account?{' '}
                <button type="button" className="linkish" onClick={() => setMode('register')}>
                  Create free therapist account
                </button>
              </>
            )}
          </p>
        )}
      </main>
    </div>
  );
}
