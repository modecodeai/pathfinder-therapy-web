export const CREDENTIAL_BODY = "EATA registered";
export const BRENT_TITLE = "Therapist";

const REPLACEMENTS = [
  [/NCPS registered practitioner/gi, "EATA registered therapist"],
  [/NCPS registered psychotherapist/gi, "EATA registered therapist"],
  [/NCPS registered/gi, "EATA registered"],
  [/Registered psychotherapist/g, "Therapist"],
  [/registered psychotherapist \(NCPS\)/gi, "therapist (EATA)"],
  [/registered psychotherapist/gi, "therapist"],
  [/"jobTitle":"Psychotherapist"/g, '"jobTitle":"Therapist"'],
  [/"role":"Psychotherapist"/g, '"role":"Therapist"'],
  [/"registrations":\["NCPS"\]/g, '"registrations":["EATA"]'],
  [/Brent is NCPS registered/gi, "Brent is registered with EATA"],
  [/\bPsychotherapist\b/g, "Therapist"],
  [/\bpsychotherapist\b/g, "therapist"]
];

export function applyCredentialCopy(html) {
  let next = html;
  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  return next;
}
