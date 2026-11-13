import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import type { TherapistClientDisplay } from '../../hooks/useTherapistClientDisplay';
import { clientDisplayStatus } from '../../components/ClientDisplayPanel';
import { useAuth } from '../../../hooks/useAuth';
import { IconSearch } from '../../../components/icons';

export type AppHeaderNav =
  | 'practice'
  | 'clients'
  | 'protocols'
  | 'resources'
  | 'knowledge'
  | 'settings'
  | 'session';

interface Props {
  protocolLabel?: string;
  clientDisplay?: TherapistClientDisplay | null;
  onOpenClientPanel?: () => void;
  rightSlot?: ReactNode;
  activeNav?: AppHeaderNav;
  live?: boolean;
}

/**
 * Application shell — calm primary nav for all-day clinical use.
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
        <NavLink to="/protocols" className={navClass('protocols')}>
          Protocols
        </NavLink>
        <NavLink
          to="/practice/library"
          className={navClass(activeNav === 'resources' ? 'resources' : 'knowledge')}
        >
          Knowledge
        </NavLink>
      </nav>

      <div className="pf-app-header-right">
        {clientDisplay && (
          <button type="button" className="btn tertiary pf-header-btn" onClick={onOpenClientPanel}>
            Client Display
          </button>
        )}
        {rightSlot}
        <button
          type="button"
          className="pf-header-icon-btn"
          aria-label="Search"
          title="Search"
          onClick={() => navigate('/clients')}
        >
          <IconSearch />
        </button>
        <div className="pf-account-menu" ref={menuRef}>
          {auth.isAuthenticated ? (
            <>
              <button
                type="button"
                className="pf-account-avatar"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((v) => !v)}
              >
                {initials}
              </button>
              {accountOpen && (
                <div className="pf-menu-popover" role="menu">
                  <p className="pf-account-popover-email">{auth.therapist?.email}</p>
                  <Link to="/account" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/settings" role="menuitem" onClick={() => setAccountOpen(false)}>
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="pf-menu-action"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      void auth.logout().then(() => navigate('/'));
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link className="btn secondary" to="/account">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
