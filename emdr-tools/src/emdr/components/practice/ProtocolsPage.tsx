import { Link } from 'react-router-dom';
import { AppHeader } from '../../guided/components/AppHeader';
import {
  IconArrowRight,
  IconPain,
  IconPhases,
  IconShield,
  IconTarget,
} from '../../../components/icons';

const PROTOCOLS = [
  {
    to: '/practice/standard',
    title: 'Standard EMDR',
    subtitle: 'Eight-phase protocol',
    Icon: IconPhases,
  },
  {
    to: '/pain',
    title: 'EMDR Pain',
    subtitle: 'Mark Grant Protocol',
    Icon: IconPain,
  },
  {
    to: '/practice/emd',
    title: 'EMD',
    subtitle: 'Focused desensitisation',
    Icon: IconTarget,
  },
  {
    to: '/practice/safe-calm',
    title: 'Resourcing',
    subtitle: 'Safe Place · Container · RDI',
    Icon: IconShield,
  },
] as const;

/**
 * Protocol templates — not active sessions.
 */
export function ProtocolsPage() {
  return (
    <div className="practice-shell">
      <AppHeader activeNav="protocols" />
      <main className="practice-main">
        <header className="pf-page-hero">
          <div>
            <h1 className="pf-title">Protocols</h1>
            <p className="pf-subtitle">
              Clinical templates for guided EMDR delivery. Open a protocol to begin a session.
            </p>
          </div>
        </header>

        <div className="pf-protocol-list" role="list">
          {PROTOCOLS.map(({ to, title, subtitle, Icon }) => (
            <Link key={to} className="pf-protocol-card" to={to} role="listitem">
              <span className="pf-protocol-icon" aria-hidden>
                <Icon />
              </span>
              <span className="pf-protocol-copy">
                <span className="pf-protocol-title">{title}</span>
                <span className="pf-protocol-sub">{subtitle}</span>
              </span>
              <span className="pf-protocol-open">
                Open <IconArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
