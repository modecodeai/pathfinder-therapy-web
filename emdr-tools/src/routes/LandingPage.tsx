import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LandingPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [code, setCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const onJoin = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) return;
    navigate(`/join/${cleaned}`);
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
    return (
      <div className="marketing">
        <header className="site-header">
          <div className="brand">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Pathfinder</strong> Clinical
            </span>
          </div>
          <nav className="site-nav site-nav-product">
            <Link to="/practice">Practice</Link>
            <Link to="/clients">Clients</Link>
            <Link to="/pain">Protocols</Link>
            <Link to="/practice/library">Resources</Link>
            <Link to="/account">Account</Link>
          </nav>
        </header>
        <main className="landing">
          <p className="eyebrow">Pathfinder Therapy</p>
          <h1>Dashboard</h1>
          <p className="subtitle">Welcome back{auth.therapist?.firstName ? `, ${auth.therapist.firstName}` : ''}</p>
          <div className="cta-row cta-hierarchy">
            <Link className="btn primary large" to="/practice/standard">
              Continue Session
            </Link>
            <Link className="btn large" to="/practice/standard">
              Start Standard EMDR
            </Link>
            <Link className="btn large" to="/pain">
              Start EMDR Pain
            </Link>
          </div>
          <div className="cta-row cta-utility">
            <Link className="btn ghost" to="/clients">
              Clients
            </Link>
            <Link className="btn ghost" to="/practice/library">
              Clinical Library
            </Link>
            <Link className="btn ghost" to="/tools">
              BLS Studio
            </Link>
            <button type="button" className="btn ghost" onClick={() => setShowJoin((v) => !v)}>
              Join / Create Remote Session
            </button>
          </div>
          {showJoin && (
            <form className="join-form" onSubmit={onJoin}>
              <label htmlFor="room-code">Room code</label>
              <div className="join-form-row">
                <input
                  id="room-code"
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
        </main>
        <footer className="site-footer">Pathfinder Therapy · Pathfinder Clinical</footer>
      </div>
    );
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
        <nav className="site-nav site-nav-product">
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
          <Link className="btn primary large" to="/practice">
            Guided Practice
          </Link>
          <Link className="btn large" to="/account">
            Create therapist account
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
