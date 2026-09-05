import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardPage } from './DashboardPage';

export function LandingPage() {
  const auth = useAuth();
  const [code, setCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const onJoin = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) return;
    window.location.assign(`/join/${cleaned}`);
  };

  if (auth.loading) {
    return (
      <div className="marketing">
        <main className="landing">
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return <DashboardPage />;
  }

  return (
    <div className="marketing">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Clinical
          </span>
        </div>
        <nav className="site-nav site-nav-product" aria-label="Marketing">
          <Link to="/practice">Practice</Link>
          <Link to="/account">Sign in</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>

      <main className="landing">
        <p className="eyebrow">Pathfinder Therapy</p>
        <h1>Pathfinder Clinical</h1>
        <p className="subtitle">Clinical reasoning and guided psychotherapy tools for Pathfinder Therapy</p>
        <p className="lede">
          Guided practice, Clinical Reasoning and bilateral stimulation for trained therapists — with
          client records held in authenticated server-side storage.
        </p>
        <div className="cta-row cta-hierarchy">
          <Link className="btn primary large" to="/account">
            Sign in
          </Link>
          <Link className="btn large" to="/practice">
            Guided Practice
          </Link>
        </div>
        <div className="cta-row cta-utility">
          <button type="button" className="btn ghost" onClick={() => setShowJoin((v) => !v)}>
            Join a Session
          </button>
        </div>

        {showJoin && (
          <form className="join-form" onSubmit={onJoin}>
            <label htmlFor="room-code-public">Room code</label>
            <div className="join-form-row">
              <input
                id="room-code-public"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="K7P4-M9Q2"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="btn primary">
                Continue
              </button>
            </div>
          </form>
        )}
        <p className="hint clinical-boundary">
          Pathfinder Clinical supports clinical delivery and does not replace professional training,
          supervision, consultation or clinical judgement.
        </p>
      </main>

      <footer className="site-footer">Pathfinder Therapy</footer>
    </div>
  );
}

/** Legacy redirect helper if needed by tests */
export function AuthenticatedHomeRedirect() {
  return <Navigate to="/" replace />;
}
