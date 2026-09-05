export type CognitionTheme =
  | 'responsibility-defectiveness'
  | 'belonging'
  | 'responsibility-action'
  | 'safety-vulnerability'
  | 'power-control';

export interface CognitionPair {
  theme: CognitionTheme;
  nc: string;
  pc: string;
}

/** Source: Center for Excellence — Part I Worksheets, Examples of Negative and Positive Beliefs (March 2026). */
export const COGNITION_SOURCE =
  'The Center for Excellence in EMDR Therapy — Basic Training Part I Worksheets (March 2026)';

export const COGNITION_THEME_LABELS: Record<CognitionTheme, string> = {
  'responsibility-defectiveness': 'Responsibility / Defectiveness',
  belonging: 'Belonging',
  'responsibility-action': 'Responsibility — Action',
  'safety-vulnerability': 'Safety / Vulnerability',
  'power-control': 'Power / Control / Choices',
};

export const COGNITION_PAIRS: CognitionPair[] = [
  { theme: 'responsibility-defectiveness', nc: "I'm not good enough.", pc: 'I am good enough / fine as I am.' },
  { theme: 'responsibility-defectiveness', nc: "I don't deserve love.", pc: 'I deserve love; I can have love.' },
  { theme: 'responsibility-defectiveness', nc: 'I am not lovable.', pc: 'I am lovable.' },
  { theme: 'responsibility-defectiveness', nc: 'I am a bad person.', pc: 'I am a good (loving) person.' },
  { theme: 'responsibility-defectiveness', nc: 'I am incompetent.', pc: 'I am competent.' },
  { theme: 'responsibility-defectiveness', nc: 'I am worthless.', pc: 'I am worthy; I am worthwhile.' },
  { theme: 'responsibility-defectiveness', nc: "I'm inadequate.", pc: "I'm fine as I am." },
  { theme: 'responsibility-defectiveness', nc: 'I am shameful.', pc: 'I am honorable.' },
  { theme: 'responsibility-defectiveness', nc: 'I am a failure.', pc: 'I can succeed.' },
  { theme: 'responsibility-defectiveness', nc: 'I deserve only bad things.', pc: 'I deserve good things.' },
  { theme: 'responsibility-defectiveness', nc: 'I am defective.', pc: 'I am okay. I can heal.' },
  { theme: 'responsibility-defectiveness', nc: 'I am ugly / my body is hateful.', pc: 'I am fine / attractive / lovable.' },
  {
    theme: 'responsibility-defectiveness',
    nc: 'I have to be perfect (out of inadequacy).',
    pc: 'I am fine the way I am.',
  },
  { theme: 'belonging', nc: 'I do not deserve…', pc: 'I deserve…' },
  { theme: 'belonging', nc: 'I am stupid / not smart enough.', pc: 'I am intelligent / able to learn.' },
  { theme: 'belonging', nc: 'I am unimportant.', pc: 'I am important.' },
  { theme: 'belonging', nc: 'I am a disappointment.', pc: 'I am OK just the way I am.' },
  { theme: 'belonging', nc: 'I deserve to die.', pc: 'I deserve to live.' },
  { theme: 'belonging', nc: 'I deserve to be miserable.', pc: 'I deserve to be happy.' },
  { theme: 'belonging', nc: "I am different. I don't belong.", pc: 'I am OK as I am. I do / can belong.' },
  { theme: 'belonging', nc: "I'm invisible. I don't matter.", pc: 'I am real. I do matter.' },
  { theme: 'belonging', nc: "I don't exist. I am alone.", pc: 'I do exist. I am now connected with others.' },
  { theme: 'responsibility-action', nc: 'I should have done something.', pc: 'I did the best I could.' },
  { theme: 'responsibility-action', nc: 'I did something wrong.', pc: 'I learned / can learn from it.' },
  { theme: 'responsibility-action', nc: 'I should have known better.', pc: 'I do the best I can / I can learn.' },
  { theme: 'safety-vulnerability', nc: 'I cannot trust anyone.', pc: 'I can choose whom to trust.' },
  { theme: 'safety-vulnerability', nc: 'I cannot protect myself.', pc: 'I can learn to protect myself.' },
  { theme: 'safety-vulnerability', nc: 'I am in danger.', pc: "It's over; I am safe now." },
  { theme: 'safety-vulnerability', nc: 'I am not safe.', pc: 'I am safe now.' },
  { theme: 'safety-vulnerability', nc: 'I am going to die.', pc: 'I am safe now.' },
  {
    theme: 'safety-vulnerability',
    nc: "It's not OK (safe) to feel / show my emotions.",
    pc: 'I can safely feel / show my emotions.',
  },
  { theme: 'power-control', nc: 'I am not in control.', pc: 'I am now in control.' },
  { theme: 'power-control', nc: 'I am powerless / helpless.', pc: 'I now have choices.' },
  { theme: 'power-control', nc: 'I cannot get what I want.', pc: 'I can get what I want now.' },
  { theme: 'power-control', nc: 'I cannot stand up for myself.', pc: 'I can make my needs known now.' },
  { theme: 'power-control', nc: 'I cannot let it out.', pc: 'I can choose to let it out.' },
  { theme: 'power-control', nc: 'I cannot be trusted.', pc: 'I can be trusted.' },
  { theme: 'power-control', nc: 'I cannot trust myself.', pc: 'I can / can learn to trust myself.' },
  { theme: 'power-control', nc: 'I cannot trust my judgment.', pc: 'I can trust my judgment.' },
  { theme: 'power-control', nc: 'I cannot succeed.', pc: 'I can succeed.' },
  { theme: 'power-control', nc: 'I have to be perfect / please everyone.', pc: 'I can be myself / make mistakes.' },
  { theme: 'power-control', nc: "I can't handle it.", pc: 'I can handle it.' },
];

export function searchCognitions(query: string, themes?: CognitionTheme[]): CognitionPair[] {
  const q = query.trim().toLowerCase();
  return COGNITION_PAIRS.filter((p) => {
    if (themes?.length && !themes.includes(p.theme)) return false;
    if (!q) return true;
    return p.nc.toLowerCase().includes(q) || p.pc.toLowerCase().includes(q);
  });
}
