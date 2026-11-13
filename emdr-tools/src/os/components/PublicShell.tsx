import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * Warm public / client-facing shell — Pathfinder Therapy brand.
 * Distinct from calm clinician AppShell, same brand family.
 */
export function PublicShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="pf-public-shell" data-testid="public-shell">
      <header className="pf-public-header">
        <Link to="/public" className="pf-public-brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Therapy
          </span>
        </Link>
        <nav className="pf-public-nav" aria-label="Public">
          <Link to="/public">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/therapists">Therapists</Link>
          <Link to="/book">Book Appointment</Link>
          <Link to="/portal">Client Portal</Link>
        </nav>
      </header>
      <main className="pf-public-main">
        {title ? <h1 className="pf-public-title">{title}</h1> : null}
        {children}
      </main>
      <footer className="pf-public-footer">
        Pathfinder Therapy · Client journey powered by Pathfinder OS
      </footer>
    </div>
  );
}
