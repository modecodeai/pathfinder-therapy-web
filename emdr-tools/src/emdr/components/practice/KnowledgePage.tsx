import { Link } from 'react-router-dom';
import { AppShell } from '../../../components/shell';
import {
  IconArrowRight,
  IconPain,
  IconPhases,
  IconShield,
  IconTarget,
} from '../../../components/icons';

const SECTIONS = [
  {
    title: 'Protocols',
    description: 'Guided treatment workflows — select after the client and clinical understanding are in place.',
    links: [
      {
        to: '/practice/standard',
        title: 'Standard EMDR',
        blurb: 'Eight-phase EMDR with live BLS and clinical scripts.',
        Icon: IconPhases,
      },
      {
        to: '/pain',
        title: 'EMDR Pain',
        blurb: 'Pain-focused EMDR workflows when clinically indicated.',
        Icon: IconPain,
      },
      {
        to: '/practice/emd',
        title: 'EMD',
        blurb: 'Focused desensitisation with shorter BLS sets.',
        Icon: IconTarget,
      },
      {
        to: '/practice/safe-calm',
        title: 'Resourcing',
        blurb: 'Safe/Calm Place, Container, RDI and stabilisation.',
        Icon: IconShield,
      },
    ],
  },
  {
    title: 'Clinical Library & Scripts',
    description: 'Reference material for session delivery.',
    links: [
      {
        to: '/practice/library',
        title: 'Clinical Library',
        blurb: 'Phase guidance, scripts and clinical notes.',
        Icon: IconPhases,
      },
      {
        to: '/resources',
        title: 'Training Resources',
        blurb: 'Therapist-facing training and support materials.',
        Icon: IconShield,
      },
    ],
  },
  {
    title: 'Pain Resources',
    description: 'Specialist material for pain-informed work.',
    links: [
      {
        to: '/pain',
        title: 'EMDR Pain workspace',
        blurb: 'Open the pain protocol tools when the client approach is Pain / Somatic.',
        Icon: IconPain,
      },
    ],
  },
] as const;

/**
 * Knowledge hub — consolidates Protocols, Scripts, Clinical Library, Resources.
 * Top nav stays: Dashboard · Clients · Practice · Knowledge
 */
export function KnowledgePage() {
  return (
    <AppShell activeNav="knowledge" contentWidth="wide">
      <main className="practice-main">
        <header className="pf-page-hero">
          <div>
            <h1 className="pf-title">Knowledge</h1>
            <p className="pf-subtitle">
              Protocols, scripts, clinical library and training resources — tools in service of the
              client.
            </p>
          </div>
        </header>

        <div className="pf-stack">
          {SECTIONS.map((sec) => (
            <section key={sec.title} className="pf-surface-card">
              <h2 className="pf-card-title">{sec.title}</h2>
              <p className="pf-meta">{sec.description}</p>
              <ul className="pf-knowledge-list">
                {sec.links.map(({ to, title, blurb, Icon }) => (
                  <li key={to + title}>
                    <Link to={to} className="pf-knowledge-link">
                      <span className="pf-protocol-icon" aria-hidden>
                        <Icon />
                      </span>
                      <span>
                        <strong>{title}</strong>
                        <span className="pf-meta">{blurb}</span>
                      </span>
                      <IconArrowRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
