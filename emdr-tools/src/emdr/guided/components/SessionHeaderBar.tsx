import type { SessionHeaderModel } from '../types/guidedScript';

interface Props {
  model: SessionHeaderModel;
  actions?: React.ReactNode;
  onEmergencyStop?: () => void;
  blsActive?: boolean;
}

export function SessionHeaderBar({ model, actions, onEmergencyStop, blsActive }: Props) {
  return (
    <header className="guided-session-header" aria-label="Session header">
      <div className="guided-session-metrics">
        <div className="guided-metric">
          <span className="guided-metric-label">Protocol</span>
          <strong>{model.protocol}</strong>
        </div>
        <div className="guided-metric">
          <span className="guided-metric-label">Phase</span>
          <strong>{model.phase}</strong>
        </div>
        {model.target != null && model.target !== '' && (
          <div className="guided-metric guided-metric-target">
            <span className="guided-metric-label">Target</span>
            <strong title={model.target}>{model.target}</strong>
          </div>
        )}
        {model.sud !== undefined && (
          <div className="guided-metric">
            <span className="guided-metric-label">SUD</span>
            <strong>{model.sud == null ? '—' : model.sud}</strong>
          </div>
        )}
        {model.voc !== undefined && (
          <div className="guided-metric">
            <span className="guided-metric-label">VOC</span>
            <strong>{model.voc == null ? '—' : model.voc}</strong>
          </div>
        )}
        {model.blsSummary && (
          <div className="guided-metric">
            <span className="guided-metric-label">BLS</span>
            <strong>{model.blsSummary}</strong>
          </div>
        )}
        {model.setCount != null && (
          <div className="guided-metric">
            <span className="guided-metric-label">Set</span>
            <strong>{model.setCount}</strong>
          </div>
        )}
        {model.elapsedLabel && (
          <div className="guided-metric">
            <span className="guided-metric-label">Elapsed</span>
            <strong>{model.elapsedLabel}</strong>
          </div>
        )}
        {model.extra?.map((e) => (
          <div key={e.label} className="guided-metric">
            <span className="guided-metric-label">{e.label}</span>
            <strong>{e.value}</strong>
          </div>
        ))}
        <div className="guided-metric guided-bls-status" aria-live="polite">
          <span className={`bls-status-dot${blsActive ? ' is-active' : ''}`} aria-hidden />
          <strong>{blsActive ? 'BLS ACTIVE' : 'BLS STOPPED'}</strong>
        </div>
      </div>
      <div className="guided-session-actions">
        {onEmergencyStop && (
          <button type="button" className="btn danger" onClick={onEmergencyStop}>
            Client stop signal
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}
