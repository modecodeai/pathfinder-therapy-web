import type { SessionHeaderModel } from '../types/guidedScript';

interface Props {
  model: SessionHeaderModel;
  blsActive?: boolean;
  onEmergencyStop?: () => void;
  alert?: string | null;
}

/** Compact single-row session status (~44–52px). */
export function SessionStatusStrip({ model, blsActive, onEmergencyStop, alert }: Props) {
  const parts: string[] = [
    model.protocol,
    model.phase,
  ];
  if (model.sud !== undefined) parts.push(`SUD ${model.sud == null ? '—' : model.sud}`);
  if (model.voc !== undefined) parts.push(`VOC ${model.voc == null ? '—' : model.voc}`);
  if (model.blsSummary) parts.push(model.blsSummary);
  if (model.elapsedLabel) parts.push(model.elapsedLabel);
  if (model.setCount != null) parts.push(`Set ${model.setCount}`);
  for (const e of model.extra ?? []) {
    if (e.value && e.value !== '—') parts.push(`${e.label} ${e.value}`);
  }

  return (
    <div className="pf-session-strip" aria-label="Session status">
      <div className="pf-session-strip-main">
        {parts.map((p, i) => (
          <span key={`${p}-${i}`} className="pf-session-chip">
            {i > 0 && <span className="pf-session-sep" aria-hidden>
              |
            </span>}
            {p}
          </span>
        ))}
        {model.target && (
          <span className="pf-session-chip pf-session-target" title={model.target}>
            <span className="pf-session-sep" aria-hidden>
              |
            </span>
            Target: {model.target}
          </span>
        )}
        <span className={`pf-session-bls${blsActive ? ' is-active' : ''}`}>
          <span aria-hidden>{blsActive ? '●' : '○'}</span> {blsActive ? 'BLS ACTIVE' : 'BLS STOPPED'}
        </span>
      </div>
      <div className="pf-session-strip-actions">
        {alert && <span className="pf-session-alert">{alert}</span>}
        {onEmergencyStop && (
          <button type="button" className="btn danger pf-stop-btn" onClick={onEmergencyStop}>
            Client stop signal
          </button>
        )}
      </div>
    </div>
  );
}
