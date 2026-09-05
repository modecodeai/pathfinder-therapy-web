import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const onJoin = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) return;
    navigate(`/join/${cleaned}`);
  };

  return (
    <div className="marketing">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> EMDR Tools
          </span>
        </div>
        <nav className="site-nav">
          <Link to="/session">Session</Link>
          <Link to="/resources">Script Library</Link>
          <Link to="/tools">BLS Studio</Link>
          <Link to="/account">Account</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>

      <main className="landing">
        <p className="eyebrow">Pathfinder Therapy</p>
        <h1>Pathfinder EMDR Tools</h1>
        <p className="subtitle">Clinical EMDR tools for trained therapists</p>
        <p className="lede">
          Browser-based visual and auditory bilateral stimulation with a phase-aware EMDR Session
          Companion. One shared BLS engine across Studio, Session, and remote client view.
        </p>
        <div className="cta-row cta-hierarchy">
          <Link className="btn primary large" to="/account">
            Create free therapist account
          </Link>
          <Link className="btn large" to="/session">
            EMDR Session Companion
          </Link>
        </div>
        <div className="cta-row cta-utility">
          <Link className="btn ghost" to="/tools">
            Open BLS Studio
          </Link>
          <Link className="btn ghost" to="/resources">
            Therapist Script Library
          </Link>
          <button type="button" className="btn ghost" onClick={() => setShowJoin((v) => !v)}>
            Join a Session
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
        <p className="hint clinical-boundary">
          Pathfinder EMDR Tools supports clinical delivery and does not replace professional
          training, supervision, consultation or clinical judgement.
        </p>
      </main>

      <footer className="site-footer">Pathfinder Therapy</footer>
    </div>
  );
}
