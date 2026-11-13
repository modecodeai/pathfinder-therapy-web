import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { TherapistClientDisplay } from '../../hooks/useTherapistClientDisplay';
import { clientDisplayStatus } from '../../components/ClientDisplayPanel';
import { useAuth } from '../../../hooks/useAuth';

export type AppHeaderNav =
  | 'practice'
  | 'clients'
  | 'protocols'
  | 'resources'
  | 'settings'
  | 'session';

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
 * Product application bar — Pathfinder EMDR primary clinical navigation.
 */
export function AppHeader({
  protocolLabel,
  clientDisplay,
  onOpenClientPanel,
  rightSlot,
  activeNav,
  live = false,
}: Props) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = clientDisplay ? clientDisplayStatus(clientDisplay) : null;

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [accountOpen]);

  const initials = (() => {
    const u = auth.therapist;
    if (!u) return '·';
    const a = (u.firstName?.[0] ?? '').toUpperCase();
    const b = (u.lastName?.[0] ?? u.email?.[0] ?? '').toUpperCase();
    return `${a}${b}` || '·';
  })();

  const navClass = (key: AppHeaderNav) =>
    ({ isActive }: { isActive: boolean }) =>
      `pf-nav-link${isActive || activeNav === key ? ' is-active' : ''}`;

  return (
    <header className={`pf-app-header${live ? ' is-live' : ''}`} aria-label="Application">
      <div className="pf-app-header-left">
        <Link to={auth.isAuthenticated ? '/practice' : '/'} className="pf-app-brand">
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

      <nav className="pf-app-nav" aria-label="Primary">
        <NavLink to="/practice" className={navClass('practice')}>
          Practice
        </NavLink>
        <NavLink to="/clients" className={navClass('clients')}>
          Clients
        </NavLink>
        <NavLink to="/pain" className={navClass('protocols')}>
          Protocols
        </NavLink>
        <NavLink to="/practice/library" className={navClass('resources')}>
          Resources
        </NavLink>
      </nav>

      <div className="pf-app-header-right">
        {clientDisplay && (
          <button type="button" className="btn ghost pf-header-btn" onClick={onOpenClientPanel}>
            Client Display
          </button>
        )}
        <button
          type="button"
          className="pf-header-icon-btn"
          aria-label="Search"
          title="Search"
          onClick={() => navigate('/clients')}
        >
          <SearchIcon />
        </button>
        <div className="pf-account-menu" ref={menuRef}>
          <button
            type="button"
            className="pf-account-avatar"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            onClick={() => setAccountOpen((v) => !v)}
          >
            {initials}
          </button>
          {accountOpen && (
            <div className="pf-menu-popover pf-account-popover" role="menu">
              {auth.isAuthenticated ? (
                <>
                  <p className="pf-account-popover-email">{auth.therapist?.email}</p>
                  <Link to="/account" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/settings" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="pf-menu-action"
                    onClick={() => {
                      setAccountOpen(false);
                      void auth.logout().then(() => navigate('/'));
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/account" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Sign in
                  </Link>
                  <Link to="/settings" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Settings
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
        {rightSlot}
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
