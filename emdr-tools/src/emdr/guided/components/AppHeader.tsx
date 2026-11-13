import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { TherapistClientDisplay } from '../../hooks/useTherapistClientDisplay';
import { clientDisplayStatus } from '../../components/ClientDisplayPanel';

export type AppHeaderNav = 'practice' | 'protocols' | 'resources' | 'settings' | 'session';

interface Props {
  protocolLabel?: string;
  clientDisplay?: TherapistClientDisplay | null;
  onOpenClientPanel?: () => void;
  rightSlot?: ReactNode;
  activeNav?: AppHeaderNav;
  /** Compact live-session mode — hide secondary chrome */
  live?: boolean;
}

/**
 * Compact application bar (48–56px). No blank whitespace above/below.
 */
export function AppHeader({
  protocolLabel,
  clientDisplay,
  onOpenClientPanel,
  rightSlot,
  activeNav,
  live = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = clientDisplay ? clientDisplayStatus(clientDisplay) : null;

  return (
    <header className={`pf-app-header${live ? ' is-live' : ''}`} aria-label="Application">
      <div className="pf-app-header-left">
        <Link to="/practice" className="pf-app-brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> EMDR
          </span>
        </Link>
        {protocolLabel && (
          <span className="pf-app-protocol" title={protocolLabel}>
            {protocolLabel}
          </span>
        )}
        {status && (
          <button
            type="button"
            className={`pf-remote-chip tone-${status.tone}`}
            onClick={onOpenClientPanel}
            title="Remote client display"
          >
            <span aria-hidden>●</span>
            <span className="pf-remote-chip-label">{status.text}</span>
          </button>
        )}
      </div>

      <div className="pf-app-header-right">
        {clientDisplay && (
          <button type="button" className="btn ghost pf-header-btn" onClick={onOpenClientPanel}>
            Client Display
          </button>
        )}
        <nav className="pf-app-nav" aria-label="Primary">
          <NavLink
            to="/practice"
            className={({ isActive }) =>
              `pf-nav-link${isActive || activeNav === 'practice' ? ' is-active' : ''}`
            }
          >
            Practice
          </NavLink>
          <NavLink
            to="/pain"
            className={({ isActive }) =>
              `pf-nav-link${isActive || activeNav === 'protocols' ? ' is-active' : ''}`
            }
          >
            Protocols
          </NavLink>
          <NavLink
            to="/practice/library"
            className={({ isActive }) =>
              `pf-nav-link${isActive || activeNav === 'resources' ? ' is-active' : ''}`
            }
          >
            Resources
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `pf-nav-link${isActive || activeNav === 'settings' ? ' is-active' : ''}`
            }
          >
            Settings
          </NavLink>
        </nav>
        <div className="pf-app-menu">
          <button
            type="button"
            className="btn ghost pf-header-btn pf-menu-btn"
            aria-expanded={menuOpen}
            aria-label="More"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="pf-menu-popover" role="menu">
              <Link to="/session" role="menuitem" onClick={() => setMenuOpen(false)}>
                Session Companion
              </Link>
              <Link to="/tools" role="menuitem" onClick={() => setMenuOpen(false)}>
                BLS Studio
              </Link>
              <Link to="/resources" role="menuitem" onClick={() => setMenuOpen(false)}>
                Scripts
              </Link>
              <Link to="/about" role="menuitem" onClick={() => setMenuOpen(false)}>
                About
              </Link>
            </div>
          )}
        </div>
        {rightSlot}
      </div>
    </header>
  );
}
