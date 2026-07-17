export const CREDENTIAL_BODY = "EATA registered · ITAA member";
export const BRENT_TITLE = "Therapist";

const REPLACEMENTS = [
  [/NCPS registered practitioner/gi, "EATA registered therapist"],
  [/NCPS registered psychotherapist/gi, "EATA registered therapist"],
  [/NCPS registered/gi, "EATA registered"],
  [/Registered psychotherapist/g, "Therapist"],
  [/registered psychotherapist \(NCPS\)/gi, "therapist (EATA · ITAA)"],
  [/registered psychotherapist/gi, "therapist"],
  [/"jobTitle":"Psychotherapist"/g, '"jobTitle":"Therapist"'],
  [/"role":"Psychotherapist"/g, '"role":"Therapist"'],
  [/"registrations":\["NCPS"\]/g, '"registrations":["EATA","ITAA"]'],
  [/Brent is NCPS registered/gi, "Brent is registered with EATA and a member of ITAA"],
  [/\bPsychotherapist\b/g, "Therapist"],
  [/\bpsychotherapist\b/g, "therapist"]
];

function ensureItaaMembershipCopy(html) {
  let next = html;

  next = next.replace(
    "<li>EATA registered therapist and ITAA member</li>",
    "<li>EATA registered therapist</li><li>ITAA member</li>"
  );

  if (next.includes("<li>EATA registered therapist</li>") && !next.includes("<li>ITAA member</li>")) {
    next = next.replace(
      "<li>EATA registered therapist</li>",
      "<li>EATA registered therapist</li><li>ITAA member</li>"
    );
  }

  return next;
}

export function applyCredentialCopy(html) {
  let next = html;
  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  return ensureItaaMembershipCopy(next);
}
