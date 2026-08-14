import { Link, NavLink } from 'react-router-dom';

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`site-header ${compact ? 'is-compact' : ''}`}>
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden />
        <span className="brand-text">
          <strong>Pathfinder</strong> EMDR Tools
        </span>
      </Link>
      {!compact && (
        <nav className="site-nav" aria-label="Primary">
          <NavLink to="/tools">Therapist console</NavLink>
          <NavLink to="/about">About & privacy</NavLink>
        </nav>
      )}
    </header>
  );
}
