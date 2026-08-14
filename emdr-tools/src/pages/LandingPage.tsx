import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';

export function LandingPage() {
  return (
    <div className="marketing">
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Pathfinder Therapy</p>
            <h1>Pathfinder EMDR Tools</h1>
            <p className="lede">
              Clinician-controlled bilateral stimulation for trained EMDR therapists — fast, calm, and
              built for in-person and remote sessions.
            </p>
            <div className="cta-row">
              <Link className="btn primary" to="/tools">
                Open therapist console
              </Link>
              <Link className="btn ghost" to="/about">
                Privacy & positioning
              </Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden>
            <div className="hero-stage">
              <span className="hero-dot" />
            </div>
          </div>
        </section>

        <section className="feature-strip">
          <article>
            <h2>In-person first</h2>
            <p>Local BLS keeps working even if the remote backend is unreachable.</p>
          </article>
          <article>
            <h2>Remote rooms</h2>
            <p>Create a short-lived room, share a join link, sync controls — not clinical notes.</p>
          </article>
          <article>
            <h2>Privacy by design</h2>
            <p>No client accounts. No SUD/VOC, diagnoses, or target memories stored.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
