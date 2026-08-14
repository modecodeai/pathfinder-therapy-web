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
        <nav>
          <Link to="/about">About</Link>
        </nav>
      </header>

      <main className="landing">
        <p className="eyebrow">Pathfinder Therapy</p>
        <h1>Pathfinder EMDR Tools</h1>
        <p className="subtitle">Bilateral stimulation tools for EMDR therapy</p>
        <p className="lede">
          Browser-based visual and auditory bilateral stimulation tools designed for appropriately
          trained practitioners.
        </p>
        <div className="cta-row">
          <Link className="btn primary" to="/tools">
            Open Therapist Tools
          </Link>
          <button type="button" className="btn" onClick={() => setShowJoin((v) => !v)}>
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
      </main>

      <footer className="site-footer">Pathfinder Therapy</footer>
    </div>
  );
}
