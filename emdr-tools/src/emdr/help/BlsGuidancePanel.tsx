import type { BLSGuidance, ClinicalBlsPresetId } from './blsGuidanceTypes';
import { BLS_STATUS_LABELS } from './blsGuidanceTypes';

interface Props {
  guidance: BLSGuidance;
  mode: 'quick' | 'guide';
  /** Load timing preset only — never starts BLS */
  onLoadPreset?: (presetId: ClinicalBlsPresetId) => void;
  /** Open live BLS settings panel */
  onOpenBlsSettings?: () => void;
  showGlobalSafetyHint?: boolean;
}

export function BlsGuidancePanel({
  guidance,
  mode,
  onLoadPreset,
  onOpenBlsSettings,
  showGlobalSafetyHint,
}: Props) {
  const statusClass = `bls-guide status-${guidance.status}`;
  const actionPreset = guidance.action?.presetId ?? guidance.presetId;
  const actionLabel = guidance.action?.label ?? (actionPreset ? 'Load suggested BLS' : undefined);

  return (
    <div className={statusClass} role="note" aria-label={BLS_STATUS_LABELS[guidance.status]}>
      <div className="bls-guide-head">
        <span className="bls-guide-status">{BLS_STATUS_LABELS[guidance.status]}</span>
      </div>

      <p className="bls-guide-title">{guidance.title}</p>

      {mode === 'guide' && guidance.rationale && (
        <p className="bls-guide-rationale">{guidance.rationale}</p>
      )}

      {guidance.suggestedPreset && (
        <p className="bls-guide-preset">
          <strong>Suggested:</strong> {guidance.suggestedPreset}
        </p>
      )}

      {mode === 'guide' && guidance.instructions && guidance.instructions.length > 0 && (
        <ul className="bls-guide-list">
          {guidance.instructions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {mode === 'quick' && guidance.instructions?.[0] && (
        <p className="hint">{guidance.instructions[0]}</p>
      )}

      {guidance.caution && (
        <p className="bls-guide-caution">
          <strong>Caution:</strong> {guidance.caution}
        </p>
      )}

      {mode === 'guide' && showGlobalSafetyHint && (
        <p className="hint">
          BLS parameters should be adjusted according to the client’s response, tolerance and clinical
          needs.
        </p>
      )}

      <div className="bls-guide-actions">
        {actionLabel && actionPreset && actionPreset !== 'manual' && onLoadPreset && (
          <button
            type="button"
            className="btn"
            onClick={() => onLoadPreset(actionPreset)}
          >
            {actionLabel}
          </button>
        )}
        {actionPreset === 'manual' && onOpenBlsSettings && (
          <button type="button" className="btn" onClick={onOpenBlsSettings}>
            {actionLabel ?? 'Adjust BLS Settings'}
          </button>
        )}
        {guidance.status === 'pause-reassess' && onOpenBlsSettings && actionPreset !== 'manual' && (
          <button type="button" className="btn ghost" onClick={onOpenBlsSettings}>
            Adjust BLS Settings
          </button>
        )}
      </div>

      <p className="bls-guide-never hint">Never starts BLS automatically — press Start Set when ready.</p>
    </div>
  );
}
