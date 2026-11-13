import type { ReactNode } from 'react';
import type { ConsoleViewMode } from '../types/guidedScript';

interface Props {
  header: ReactNode;
  navigator?: ReactNode;
  script: ReactNode;
  clinicalControls: ReactNode;
  footer?: ReactNode;
  navCollapsed?: boolean;
  onToggleNav?: () => void;
  viewMode?: ConsoleViewMode;
  className?: string;
}

/**
 * Clinical console shell: Navigator (compact) | Script (largest) | Live BLS / responses.
 * Script receives ~50–55% width on desktop.
 */
export function GuidedPracticeConsole({
  header,
  navigator,
  script,
  clinicalControls,
  footer,
  navCollapsed = false,
  onToggleNav,
  viewMode = 'standard',
  className = '',
}: Props) {
  const modeClass =
    viewMode === 'reading'
      ? ' is-reading-mode'
      : viewMode === 'processing'
        ? ' is-processing-mode'
        : '';

  return (
    <div className={`guided-console${modeClass} ${className}`.trim()}>
      <div className="guided-console-header">{header}</div>

      <div
        className={`guided-console-body${navCollapsed ? ' nav-collapsed' : ''}${
          !navigator ? ' no-nav' : ''
        }`}
      >
        {navigator && (
          <aside className="guided-console-nav" aria-label="Protocol navigator">
            {onToggleNav && (
              <button type="button" className="btn ghost guided-nav-toggle" onClick={onToggleNav}>
                {navCollapsed ? 'Show navigator' : 'Hide navigator'}
              </button>
            )}
            {!navCollapsed && navigator}
          </aside>
        )}

        <main className="guided-console-script" aria-label="Therapist script">
          {script}
        </main>

        <aside className="guided-console-controls" aria-label="Live BLS and responses">
          {clinicalControls}
        </aside>
      </div>

      {footer && <div className="guided-console-footer">{footer}</div>}
    </div>
  );
}
