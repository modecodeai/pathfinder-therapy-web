/** Clinician prompt library — Stage 3 full Generate Task; Stage 1 exports starters. */

export type CognitiveTaskModality =
  | 'verbal'
  | 'numerical'
  | 'cognitive-switching'
  | 'motor'
  | 'visual-discrimination';

export interface CognitiveTask {
  id: string;
  modality: CognitiveTaskModality;
  prompt: string;
  difficulty: number;
}

export const COGNITIVE_TASKS: CognitiveTask[] = [
  {
    id: 'num-10',
    modality: 'numerical',
    prompt: 'While following the stimulus, count backwards from 10.',
    difficulty: 1,
  },
  {
    id: 'num-20',
    modality: 'numerical',
    prompt: 'While following the stimulus, count backwards from 20.',
    difficulty: 2,
  },
  {
    id: 'num-30-3',
    modality: 'numerical',
    prompt: 'While following the stimulus, count backwards from 30 in threes.',
    difficulty: 4,
  },
  {
    id: 'num-50-3',
    modality: 'numerical',
    prompt: 'While following the stimulus, count backwards from 50 in threes.',
    difficulty: 5,
  },
  {
    id: 'num-100-7',
    modality: 'numerical',
    prompt: 'While following the stimulus, count backwards from 100 in sevens.',
    difficulty: 7,
  },
  {
    id: 'spell-simple',
    modality: 'verbal',
    prompt: 'While following the stimulus, spell a simple word backwards (e.g. HOUSE).',
    difficulty: 3,
  },
  {
    id: 'colour-name',
    modality: 'visual-discrimination',
    prompt: 'Keep noticing the memory, follow the light, and say the colour whenever it changes.',
    difficulty: 3,
  },
  {
    id: 'direction-call',
    modality: 'visual-discrimination',
    prompt:
      'Keep the memory there, follow the light, and say “change” whenever the direction changes unexpectedly.',
    difficulty: 4,
  },
];

export function generateTask(preferModality?: CognitiveTaskModality): CognitiveTask {
  const pool = preferModality
    ? COGNITIVE_TASKS.filter((t) => t.modality === preferModality)
    : COGNITIVE_TASKS;
  const list = pool.length ? pool : COGNITIVE_TASKS;
  return list[Math.floor(Math.random() * list.length)]!;
}

export function makeHarder(task: CognitiveTask): CognitiveTask {
  const same = COGNITIVE_TASKS.filter((t) => t.modality === task.modality).sort(
    (a, b) => a.difficulty - b.difficulty,
  );
  const harder = same.find((t) => t.difficulty > task.difficulty);
  return harder ?? task;
}

export function makeEasier(task: CognitiveTask): CognitiveTask {
  const same = COGNITIVE_TASKS.filter((t) => t.modality === task.modality).sort(
    (a, b) => b.difficulty - a.difficulty,
  );
  const easier = same.find((t) => t.difficulty < task.difficulty);
  return easier ?? task;
}
