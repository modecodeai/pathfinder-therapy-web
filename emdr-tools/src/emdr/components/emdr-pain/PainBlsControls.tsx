import type { RoomState } from '../../../types/room';
import type { BlsSession } from '../../../hooks/useBlsSession';
import {
  GRANT_PAIN_DEFAULT_LABEL,
  PAIN_INSTALL_SLOW_LABEL,
  PAIN_VISUAL_BLS_LABEL,
  grantPainDefaultPatch,
  painInstallationSlowPatch,
  painVisualBlsPatch,
} from '../../lib/emdr-pain/painBlsPresets';

interface Props {
  session: BlsSession;
  showWmtWarning: boolean;
  onDismissWmt: () => void;
  onReturnPainDefault: () => void;
  continuousPreferred: boolean;
  onContinuousPreferred: (v: boolean) => void;
}

export function PainBlsControls({
  session,
  showWmtWarning,
  onDismissWmt,
  onReturnPainDefault,
  continuousPreferred,
  onContinuousPreferred,
}: Props) {
  const s = session.state;
  const running = s.running && !s.paused;

  const apply = (patch: Partial<RoomState>) => session.patchState(patch);

  return (
    <div className="pain-bls-controls panel">
      <header className="taxation-head">
        <div>
          <h3>Pain BLS</h3>
          <p className="hint">
            <span className="badge-protocol">Protocol Guidance</span> — The supplied protocol
            describes auditory BLS as a preferred option for pain work and notes that it may have a
            more visceral effect for some clients. Not universally superior.
          </p>
        </div>
      </header>

      <div className="recommended-pain-bls">
        <h4>Recommended Pain BLS</h4>
        <ul className="hint-list">
          <li>Preferred mode: Auditory BLS</li>
          <li>Default pattern: Continuous</li>
          <li>Check-ins: Allow verbal check-ins without stopping BLS</li>
          <li>Suggested set length: 30–60 seconds (or continuous)</li>
          <li>Visual: centre fixation or standard tracking if used</li>
        </ul>
        <p className="hint">Do not hard-lock — override any value.</p>
      </div>

      <div className="stack-btns horizontal wrap">
        <button
          type="button"
          className="btn primary"
          onClick={() => apply(grantPainDefaultPatch(s))}
        >
          {GRANT_PAIN_DEFAULT_LABEL}
        </button>
        <button type="button" className="btn" onClick={() => apply(painVisualBlsPatch(s))}>
          {PAIN_VISUAL_BLS_LABEL}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => apply(painInstallationSlowPatch(s))}
        >
          {PAIN_INSTALL_SLOW_LABEL}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => apply(grantPainDefaultPatch(s))}
        >
          Reset to Grant Pain Default
        </button>
      </div>

      <label className="check-row">
        <input
          type="checkbox"
          checked={continuousPreferred && (s.continuous || s.setMode === 'continuous')}
          onChange={(e) => {
            onContinuousPreferred(e.target.checked);
            apply(
              e.target.checked
                ? { continuous: true, setMode: 'continuous' }
                : { continuous: false, setMode: 'timed', targetSeconds: 45 },
            );
          }}
        />
        <span>Continuous BLS</span>
      </label>
      <p className="hint">
        Continuous BLS may help keep the client “on the track” and may give anxious,
        intellectualising or low-sensory-receptivity clients more time to notice effects. Asking
        “What do you notice now?” must not automatically stop stimulation.
      </p>

      <fieldset className="taxation-fieldset">
        <legend>Auditory BLS</legend>
        <p className="hint">Headphones recommended where clinically appropriate.</p>
        <label className="check-row">
          <input
            type="checkbox"
            checked={s.audioEnabled}
            onChange={(e) => apply({ audioEnabled: e.target.checked })}
          />
          <span>Auditory enabled</span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={s.audioOnly}
            onChange={(e) =>
              apply({
                audioOnly: e.target.checked,
                visualEnabled: e.target.checked ? false : s.visualEnabled,
              })
            }
          />
          <span>Audio-only (visual off)</span>
        </label>
        <label className="field">
          <span>Tone</span>
          <select
            value={s.audioSound}
            onChange={(e) =>
              apply({ audioSound: e.target.value as RoomState['audioSound'] })
            }
          >
            <option value="soft-tone">Soft tone</option>
            <option value="soft-click">Soft click</option>
            <option value="pulse">Pulse</option>
          </select>
        </label>
        <label className="field">
          <span>Volume · {Math.round(s.audioVolume * 100)}%</span>
          <input
            type="range"
            min={0.05}
            max={0.85}
            step={0.01}
            value={s.audioVolume}
            onChange={(e) => apply({ audioVolume: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Speed</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.speed01}
            onChange={(e) => apply({ speed01: Number(e.target.value) })}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={s.muteTherapistAudio}
            onChange={(e) => apply({ muteTherapistAudio: e.target.checked })}
          />
          <span>Mute therapist speaker (client headphones)</span>
        </label>
      </fieldset>

      <div className="bls-transport-primary" aria-label="Pain BLS transport">
        {!running ? (
          <button
            type="button"
            className="btn primary large"
            onClick={() => void session.start()}
          >
            Start BLS
          </button>
        ) : (
          <div className="bls-transport-running">
            <button
              type="button"
              className="btn large"
              onClick={() => (s.paused ? void session.resume() : session.pause())}
            >
              {s.paused ? 'Resume' : 'Pause'}
            </button>
            <button type="button" className="btn danger large" onClick={() => session.stop()}>
              Stop BLS
            </button>
          </div>
        )}
        <p className="hint">
          Set elapsed: {session.formatTime(session.metrics.timeMs)}
          {s.continuous || s.setMode === 'continuous' ? ' · Continuous' : ''}
        </p>
      </div>

      {showWmtWarning && (
        <div className="taxation-advisory" role="status">
          <p>
            <strong>Clinical check</strong>
          </p>
          <p>
            The supplied Mark Grant Pain Protocol primarily describes continuous BLS, with a
            preference for auditory stimulation. Advanced visual working-memory taxation is not
            part of the core pain protocol supplied here.
          </p>
          <p>Continue only according to clinical judgement and relevant training.</p>
          <div className="stack-btns horizontal">
            <button type="button" className="btn" onClick={onDismissWmt}>
              Continue
            </button>
            <button type="button" className="btn primary" onClick={onReturnPainDefault}>
              Return to Pain Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
