import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { TherapistClientDisplay } from '../../hooks/useTherapistClientDisplay';
import { clientDisplayStatus } from '../../components/ClientDisplayPanel';
import { useAuth } from '../../../hooks/useAuth';
import { IconSearch } from '../../../components/icons';
import {
  AccountMenu,
  MainNavigation,
  useMobileNavOpen,
  type MainNavKey,
} from '../../../components/shell';

/** @deprecated Prefer MainNavKey — kept for call-site compatibility */
export type AppHeaderNav = MainNavKey | 'protocols' | 'resources' | 'settings' | 'session';

interface Props {
  protocolLabel?: string;
  clientDisplay?: TherapistClientDisplay | null;
  onOpenClientPanel?: () => void;
  rightSlot?: ReactNode;
  activeNav?: AppHeaderNav;
  live?: boolean;
}

function mapActiveNav(nav?: AppHeaderNav): MainNavKey | undefined {
  if (!nav) return undefined;
  if (nav === 'protocols' || nav === 'resources') return 'knowledge';
  if (nav === 'settings' || nav === 'session') return undefined;
  return nav;
}

/**
 * Application header — delegates to canonical MainNavigation + AccountMenu.
 * Prefer wrapping pages with AppShell; this remains for incremental migration.
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
  const mobile = useMobileNavOpen();
  const status = clientDisplay ? clientDisplayStatus(clientDisplay) : null;
  const mapped = mapActiveNav(activeNav);

  return (
    <>
      <header className={`pf-app-header${live ? ' is-live' : ''}`} aria-label="Application">
        <div className="pf-app-header-left">
          <button
            type="button"
            className="pf-nav-menu-btn"
            aria-label={mobile.open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobile.open}
            onClick={mobile.toggle}
          >
            <span className="pf-nav-menu-icon" aria-hidden>
              {mobile.open ? '✕' : '☰'}
            </span>
          </button>
          <Link to={auth.isAuthenticated ? '/' : '/'} className="pf-app-brand">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Pathfinder</strong> Clinical
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

        <MainNavigation activeNav={mapped} />

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
          <AccountMenu />
        </div>
      </header>

      {mobile.open && (
        <div className="pf-mobile-nav-backdrop" role="presentation" onClick={mobile.close}>
          <div
            className="pf-mobile-nav-drawer"
            role="dialog"
            aria-label="Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <MainNavigation activeNav={mapped} variant="drawer" onNavigate={mobile.close} />
          </div>
        </div>
      )}
    </>
  );
}
