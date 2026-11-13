import { useState } from 'react';
import {
  COGNITIVE_TASKS,
  generateTask,
  makeEasier,
  makeHarder,
  type CognitiveTask,
  type CognitiveTaskModality,
} from '../../engine/cognitiveTasks';

const GROUPS: { id: CognitiveTaskModality; title: string }[] = [
  { id: 'verbal', title: 'Verbal' },
  { id: 'numerical', title: 'Numerical' },
  { id: 'cognitive-switching', title: 'Cognitive switching' },
  { id: 'motor', title: 'Motor' },
  { id: 'visual-discrimination', title: 'Visual discrimination' },
];

const STATIC: Record<CognitiveTaskModality, string[]> = {
  verbal: [
    'Spell your first name backwards.',
    'Spell a simple word backwards.',
    'Spell a longer word backwards.',
    'Say the alphabet backwards.',
    'Name the colour when the stimulus changes.',
    'Name an animal beginning with the letter I give you.',
    'Alternate between two categories, e.g. fruit / country.',
  ],
  numerical: [
    'Count backwards from 10.',
    'Count backwards from 20.',
    'Count backwards from 50.',
    'Count backwards in twos.',
    'Count backwards in threes.',
    'Count backwards in sevens.',
  ],
  'cognitive-switching': [
    'Alternate number / letter: 1-A, 2-B, 3-C.',
    'Alternate odd / even numbers.',
    'Alternate two semantic categories.',
    'Respond to changing therapist instructions.',
  ],
  motor: [
    'Alternate finger tapping (suggestion only).',
    'Alternating knee taps (suggestion only).',
    'Reproduce a simple rhythm (suggestion only).',
    'Alternate between two tapping patterns (suggestion only).',
  ],
  'visual-discrimination': [
    'Name each colour change.',
    'Identify whether the dot became lighter or darker.',
    'Call out when direction unexpectedly changes.',
    'Call out when the trajectory changes.',
  ],
};

interface Props {
  activePrompt: string | null;
  onSelectPrompt: (prompt: string | null) => void;
}

/** Optional clinician prompts — does not automatically perform therapy. */
export function CognitiveTaskPanel({ activePrompt, onSelectPrompt }: Props) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<CognitiveTask | null>(null);

  return (
    <div className="cognitive-task-panel panel">
      <header className="taxation-head">
        <div>
          <h3>Additional Working Memory Tasks</h3>
          <p className="hint">Optional prompts for the practitioner — not automated therapy.</p>
        </div>
        <button type="button" className="btn ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Show'}
        </button>
      </header>

      {activePrompt && (
        <p className="taxation-task-line">
          Active: <strong>{activePrompt}</strong>
        </p>
      )}

      <div className="taxation-actions compact">
        <button
          type="button"
          className="btn"
          onClick={() => {
            const t = generateTask();
            setTask(t);
            onSelectPrompt(t.prompt);
          }}
        >
          Generate Task
        </button>
        {task && (
          <>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const t = makeEasier(task);
                setTask(t);
                onSelectPrompt(t.prompt);
              }}
            >
              Make Easier
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const t = makeHarder(task);
                setTask(t);
                onSelectPrompt(t.prompt);
              }}
            >
              Make Harder
            </button>
          </>
        )}
        {activePrompt && (
          <button type="button" className="btn ghost" onClick={() => onSelectPrompt(null)}>
            Stop secondary task
          </button>
        )}
      </div>

      {task && (
        <div className="suggested-task">
          <span className="hint">Suggested task</span>
          <p>{task.prompt}</p>
        </div>
      )}

      {open && (
        <div className="cognitive-groups">
          {GROUPS.map((g) => (
            <details key={g.id} className="cognitive-group">
              <summary>{g.title}</summary>
              <ul>
                {(STATIC[g.id] ?? []).map((line) => (
                  <li key={line}>
                    <button
                      type="button"
                      className="btn ghost linkish"
                      onClick={() => onSelectPrompt(line)}
                    >
                      {line}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
          <p className="hint">
            Library size: {COGNITIVE_TASKS.length} generated starters. The clinician remains
            responsible for deciding whether to use a task.
          </p>
        </div>
      )}
    </div>
  );
}
