import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';

export function AboutPage() {
  return (
    <div className="marketing">
      <SiteHeader />
      <main className="about">
        <h1>About & privacy</h1>
        <p className="lede">
          Pathfinder EMDR Tools is a browser-based bilateral stimulation utility for trained EMDR
          clinicians. It is not a substitute for clinical training, supervision, or emergency care.
        </p>

        <section>
          <h2>What we store</h2>
          <ul>
            <li>Remote rooms keep session <em>control</em> state only (speed, visual/audio settings, run flags).</li>
            <li>Rooms expire automatically and are not used as clinical records.</li>
            <li>Presets stay in your browser localStorage — never on our servers.</li>
            <li>We do not store client names, notes, SUD/VOC, diagnoses, or target memories.</li>
          </ul>
        </section>

        <section>
          <h2>Intended use</h2>
          <p>
            For qualified EMDR practitioners delivering therapy under their professional judgement.
            Clients joining a remote link see the stimulus stage only — no account is required.
          </p>
        </section>

        <section>
          <h2>Organisation</h2>
          <p>
            Built for Pathfinder Therapy. Contact{' '}
            <a href="mailto:hello@pathfindertherapy.org.uk">hello@pathfindertherapy.org.uk</a>.
          </p>
        </section>

        <p>
          <Link className="btn primary" to="/tools">
            Open console
          </Link>
        </p>
      </main>
    </div>
  );
}
