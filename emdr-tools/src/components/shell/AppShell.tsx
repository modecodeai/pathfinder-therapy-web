import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { TherapistClientDisplay } from '../../emdr/hooks/useTherapistClientDisplay';
import { clientDisplayStatus } from '../../emdr/components/ClientDisplayPanel';
import { useAuth } from '../../hooks/useAuth';
import { IconSearch } from '../icons';
import { AccountMenu } from './AccountMenu';
import { MainNavigation, useMobileNavOpen, type MainNavKey } from './MainNavigation';

export type { MainNavKey };

interface Props {
  children: ReactNode;
  protocolLabel?: string;
  clientDisplay?: TherapistClientDisplay | null;
  onOpenClientPanel?: () => void;
  rightSlot?: ReactNode;
  activeNav?: MainNavKey;
  live?: boolean;
  /** Constrained content width for clinical workspaces */
  contentWidth?: 'default' | 'wide' | 'full';
  className?: string;
}

/**
 * Canonical authenticated application shell.
 * All product routes must use this — do not duplicate navigation markup.
 */
export function AppShell({
  children,
  protocolLabel,
  clientDisplay,
  onOpenClientPanel,
  rightSlot,
  activeNav,
  live = false,
  contentWidth = 'default',
  className = '',
}: Props) {
  const auth = useAuth();
  const navigate = useNavigate();
  const mobile = useMobileNavOpen();
  const status = clientDisplay ? clientDisplayStatus(clientDisplay) : null;

  const widthClass =
    contentWidth === 'wide'
      ? 'pf-shell-content is-wide'
      : contentWidth === 'full'
        ? 'pf-shell-content is-full'
        : 'pf-shell-content';

  return (
    <div className={`practice-shell pf-app-shell ${className}`.trim()} data-testid="app-shell">
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

        <MainNavigation activeNav={activeNav} />

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
            <MainNavigation activeNav={activeNav} variant="drawer" onNavigate={mobile.close} />
          </div>
        </div>
      )}

      <div className={widthClass}>{children}</div>
    </div>
  );
}
