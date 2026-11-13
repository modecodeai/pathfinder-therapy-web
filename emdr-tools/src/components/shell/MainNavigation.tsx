import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export type MainNavKey = 'dashboard' | 'clients' | 'practice' | 'knowledge';

const NAV_ITEMS: Array<{ key: MainNavKey; to: string; label: string; end?: boolean }> = [
  { key: 'dashboard', to: '/', label: 'Dashboard', end: true },
  { key: 'clients', to: '/clients', label: 'Clients' },
  { key: 'practice', to: '/practice', label: 'Practice' },
  { key: 'knowledge', to: '/knowledge', label: 'Knowledge' },
];

interface Props {
  activeNav?: MainNavKey;
  /** Compact horizontal scroll for tablet; drawer uses full-width links */
  variant?: 'desktop' | 'drawer';
  onNavigate?: () => void;
}

/**
 * Canonical primary navigation — never render raw unstyled text links.
 */
export function MainNavigation({ activeNav, variant = 'desktop', onNavigate }: Props) {
  const navClass =
    ({ isActive }: { isActive: boolean }) =>
    (key: MainNavKey) =>
      `pf-nav-link${isActive || activeNav === key ? ' is-active' : ''}`;

  return (
    <nav
      className={variant === 'drawer' ? 'pf-app-nav pf-app-nav-drawer' : 'pf-app-nav'}
      aria-label="Primary"
      data-testid="main-navigation"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end={item.end}
          className={(args) => navClass(args)(item.key)}
          onClick={onNavigate}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function useMobileNavOpen() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen((v) => !v), close: () => setOpen(false) };
}

export { NAV_ITEMS };
