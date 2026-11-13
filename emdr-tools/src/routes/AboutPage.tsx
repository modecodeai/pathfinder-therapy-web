import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="marketing">
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Clinical
          </span>
        </Link>
        <nav>
          <Link to="/tools">Therapist Tools</Link>
        </nav>
      </header>

      <main className="about">
        <h1>About & privacy</h1>
        <p className="lede">
          Pathfinder Clinical provides clinical reasoning and guided psychotherapy tools, including
          bilateral stimulation controls, for use by appropriately trained practitioners.
        </p>
        <p>
          The application does not replace clinical judgement, professional training or appropriate
          assessment.
        </p>

        <section>
          <h2>How it works</h2>
          <ul>
            <li>Client accounts are not required.</li>
            <li>Remote room identifiers are temporary and expire automatically.</li>
            <li>Clinical session content should not be entered into the application.</li>
            <li>This beta does not store clinical notes, diagnoses, SUD/VOC, or target memories.</li>
            <li>
              Use your usual video platform (for example Zoom or Google Meet) for conversation;
              Bilateral stimulation features handle stimulation only — they do not replace clinical judgement.
            </li>
          </ul>
        </section>

        <section>
          <h2>What we do not claim</h2>
          <p>
            This product does not claim GDPR certification, HIPAA certification, medical-device
            approval, or guaranteed clinical effectiveness.
          </p>
        </section>

        <p>
          <Link className="btn primary" to="/tools">
            Open Therapist Tools
          </Link>
        </p>
      </main>

      <footer className="site-footer">Pathfinder Therapy</footer>
    </div>
  );
}
