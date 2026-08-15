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
    what: 'Guided eight-phase EMDR with live BLS, target tracking and clinical scripts.',
    when: 'Use for standard trauma processing across Phases 1–8 when a full EMDR protocol is indicated.',
    Icon: IconPhases,
  },
  {
    to: '/pain',
    title: 'EMDR Pain',
    what: 'Mark Grant–informed workflows for chronic, present, phantom limb and trauma-related pain.',
    when: 'Use when pain is the clinical focus and EMDR pain protocols are medically appropriate.',
    Icon: IconPain,
  },
  {
    to: '/practice/emd',
    title: 'EMD',
    what: 'Focused desensitisation with shorter BLS sets and repeated return to target.',
    when: 'Use for contained, time-limited desensitisation when a full Standard EMDR arc is not required.',
    Icon: IconTarget,
  },
  {
    to: '/practice/safe-calm',
    title: 'Resourcing',
    what: 'Safe/Calm Place, Container, RDI and stabilisation tools with integrated BLS.',
    when: 'Use for preparation, stabilisation, or when the client needs resources before processing.',
    Icon: IconShield,
  },
] as const;

/**
 * Treatment selection catalogue — kept for deep links under Knowledge.
 * Prefer /knowledge as the top-level entry.
 */
export function ProtocolsPage() {
  return (
    <div className="practice-shell">
      <AppHeader activeNav="knowledge" />
      <main className="practice-main">
        <header className="pf-page-hero">
          <div>
            <p className="pf-eyebrow">
              <Link to="/knowledge">Knowledge</Link> › Protocols
            </p>
            <h1 className="pf-title">Protocols</h1>
            <p className="pf-subtitle">
              Treatment workflows live under Knowledge. Select a client first whenever possible —
              modalities are tools in service of the person.
            </p>
          </div>
        </header>

        <div className="pf-protocol-list pf-treatment-list" role="list">
          {PROTOCOLS.map(({ to, title, what, when, Icon }) => (
            <article key={to} className="pf-surface-card pf-treatment-card" role="listitem">
              <div className="pf-treatment-card-head">
                <span className="pf-protocol-icon" aria-hidden>
                  <Icon />
                </span>
                <h2 className="pf-card-title">{title}</h2>
              </div>
              <div className="pain-brief-block">
                <h3 className="pf-meta" style={{ fontWeight: 700, color: 'var(--pf-text)' }}>
                  What is this?
                </h3>
                <p>{what}</p>
              </div>
              <div className="pain-brief-block">
                <h3 className="pf-meta" style={{ fontWeight: 700, color: 'var(--pf-text)' }}>
                  When should I use it?
                </h3>
                <p>{when}</p>
              </div>
              <Link className="btn primary" to={to}>
                Start treatment <IconArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
