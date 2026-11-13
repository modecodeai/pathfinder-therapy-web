import {
  PAIN_NAVIGATOR_STAGES,
  PAIN_STAGE_LABELS,
  type PainProtocolStage,
} from '../../types/painProtocol';

interface Props {
  stage: PainProtocolStage;
  completed: PainProtocolStage[];
  onSelect: (s: PainProtocolStage) => void;
}

export function PainProtocolNavigator({ stage, completed, onSelect }: Props) {
  return (
    <nav className="pain-navigator" aria-label="Pain protocol stages">
      <h2>Protocol Navigator</h2>
      <p className="hint">Clinician navigation — progression is not forced.</p>
      <ol className="pain-nav-list">
        {PAIN_NAVIGATOR_STAGES.map((s, i) => {
          const done = completed.includes(s);
          const active = stage === s;
          return (
            <li key={s}>
              <button
                type="button"
                className={`pain-nav-item${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                onClick={() => onSelect(s)}
              >
                <span className="pain-nav-num">{i + 1}</span>
                <span>{PAIN_STAGE_LABELS[s]}</span>
                {done && <span className="pain-nav-check" aria-label="complete">✓</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
