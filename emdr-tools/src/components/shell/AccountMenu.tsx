import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Avatar account menu — Profile / Settings / Sign out.
 * Do not place "Account" as plain text in primary nav.
 */
export function AccountMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="pf-account-menu" ref={menuRef} data-testid="account-menu">
      {auth.isAuthenticated ? (
        <>
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
  );
}
