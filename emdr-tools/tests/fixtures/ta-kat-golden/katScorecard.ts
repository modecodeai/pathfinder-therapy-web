/**
 * Kat golden scorecard — therapist reasoning model regression.
 */

import type { CoreProcessFormulation } from '../../../src/clinical-intelligence/therapistReasoning';
import type { TaTranscriptAnalysis } from '../../../src/clinical-intelligence/clinicalReasoning';
import {
  EMDR_LEAKAGE_FORBIDDEN_FOR_KAT,
  KAT_CONTRACT_PHRASES,
  KAT_KEY_OBSERVATIONS,
  KAT_RISK_PHRASES,
} from './katGoldenFixture';
import { emptyCoreProcessFormulation } from '../../../src/clinical-intelligence/therapistReasoning';

export type KatScore = {
  pass: boolean;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
};

function blob(x: unknown): string {
  return JSON.stringify(x);
}

export function detectEmdrLeakageKat(analysis: unknown): string[] {
  const leaks: string[] = [];
  const s = blob(analysis);
  for (const term of EMDR_LEAKAGE_FORBIDDEN_FOR_KAT) {
    if (s.includes(term)) leaks.push(term);
  }
  if (analysis && typeof analysis === 'object') {
    const o = analysis as Record<string, unknown>;
    for (const k of ['themes', 'targetCandidates', 'negativeCognitions', 'positiveCognitions']) {
      if (k in o && Array.isArray(o[k]) && (o[k] as unknown[]).length) leaks.push(`structured:${k}`);
    }
  }
  return leaks;
}

export function scoreKatReasoning(args: {
  process: CoreProcessFormulation;
  ta?: TaTranscriptAnalysis | null;
  sessionOnlyText: string;
  rawTranscript: string;
}): KatScore {
  const { process, ta, sessionOnlyText, rawTranscript } = args;
  const checks: KatScore['checks'] = [];

  checks.push({
    id: 'observations-before-theory',
    pass: process.observations.length > 0,
    detail: `${process.observations.length} observations`,
  });

  checks.push({
    id: 'observation-not-modality-labelled',
    pass: process.observations.every(
      (o) =>
        !/\b(Adapted Child|Be Perfect|injunction|AIP|touchstone|NC\b|PC\b)\b/i.test(o.text),
    ),
    detail: 'observations stay modality-neutral',
  });

  checks.push({
    id: 'protective-function-present',
    pass: process.protectiveFunctions.length > 0,
    detail: `${process.protectiveFunctions.length} protective-function hypotheses`,
  });

  checks.push({
    id: 'protective-function-labelled',
    pass: process.protectiveFunctions.every((p) => p.label === 'Possible protective function'),
    detail: 'Possible protective function label',
  });

  checks.push({
    id: 'clinical-tensions-preserved',
    pass: process.clinicalTensions.length >= 1,
    detail: `${process.clinicalTensions.length} tensions`,
  });

  checks.push({
    id: 'cognition-vs-embodiment',
    pass: process.cognitionVsEmbodiment.length >= 1,
    detail: 'dimension tracked',
  });

  const dissoc = process.dissociationNotes[0];
  checks.push({
    id: 'dissociation-not-overdiagnosed',
    pass: Boolean(
      dissoc &&
        dissoc.label.startsWith('Possible dissociative experience') &&
        !/DID|depersonalisation disorder|structural dissociation/i.test(blob(process)),
    ),
    detail: dissoc ? dissoc.label : 'missing',
  });

  checks.push({
    id: 'risk-flagged-without-invented-status',
    pass:
      process.riskFlags.length >= 1 &&
      process.riskFlags.every(
        (r) =>
          r.label === 'CLINICAL REVIEW REQUIRED' &&
          r.currentStatus === 'not-established-in-transcript',
      ),
    detail: `${process.riskFlags.length} risk flags`,
  });

  checks.push({
    id: 'client-language-preserved',
    pass: KAT_KEY_OBSERVATIONS.some(
      (q) =>
        blob(process).toLowerCase().includes(q.toLowerCase()) ||
        sessionOnlyText.toLowerCase().includes(q.toLowerCase()),
    ),
    detail: 'cornered / pull back language present',
  });

  checks.push({
    id: 'contract-client-endorsed',
    pass:
      process.contractMaterial.some((c) => c.label === 'CLIENT-ENDORSED CONTRACT MATERIAL') &&
      KAT_CONTRACT_PHRASES.some((p) => blob(process).includes(p)),
    detail: 'contract material labelled client-endorsed',
  });

  checks.push({
    id: 'therapist-interpretation-not-client-fact',
    pass: !/Client fact:\s*Little Kat feels unsafe/i.test(blob(process)),
    detail: 'no false client-fact storage',
  });

  const therapistIntro = process.observations.some(
    (o) => o.provenance === 'therapist-interpretation' || o.provenance === 'therapist-introduced',
  ) || process.reasoningCards.some((c) =>
    c.provenanceNotes?.some((p) => p.provenance === 'therapist-interpretation'),
  );
  checks.push({
    id: 'therapist-provenance-tracked',
    pass: therapistIntro || /Therapist working hypothesis/i.test(blob(process)),
    detail: 'therapist interpretation provenance present',
  });

  checks.push({
    id: 'non-session-excluded-from-session-text',
    pass:
      !/Continue straight for 200 metres/i.test(sessionOnlyText) &&
      !/ChatGPT/i.test(sessionOnlyText) &&
      /Continue straight for 200 metres/i.test(rawTranscript),
    detail: 'navigation/post-session kept in raw, excluded from session-only',
  });

  if (ta) {
    const leaks = detectEmdrLeakageKat(ta);
    checks.push({
      id: 'no-emdr-leakage',
      pass: leaks.length === 0 && ta.clinicalLens === 'transactional-analysis',
      detail: leaks.length ? leaks.join('; ') : 'clean',
    });
    checks.push({
      id: 'ta-second-not-forced-completeness',
      pass: ta.analysisKind === 'ta-formulation' && ta.noSufficientTaEvidence === false,
      detail: 'TA lens present without claiming completeness',
    });
  }

  // Theory must not appear without observations
  checks.push({
    id: 'theory-not-before-observation',
    pass: process.observations.length > 0 && process.reasoningCards.every((c) => Boolean(c.observation)),
    detail: 'reasoning cards start with observation',
  });

  for (const phrase of KAT_RISK_PHRASES) {
    checks.push({
      id: `risk-phrase-present:${phrase}`,
      pass: rawTranscript.includes(phrase) || blob(process).toLowerCase().includes(phrase.toLowerCase()),
      detail: phrase,
    });
  }

  return { pass: checks.every((c) => c.pass), checks };
}

/** Expected process-layer fixture for Kat (development / regression — not live AI). */
export function buildKatExpectedProcessFormulation(): CoreProcessFormulation {
  const base = emptyCoreProcessFormulation();
  return {
    ...base,
    observations: [
      {
        id: 'o1',
        text: 'Client reports pulling back when relational contact becomes closer and feeling cornered.',
        clientLanguage: 'I feel cornered',
        evidence: [{ excerpt: 'I feel cornered. I need time after contact. I pull back.', speaker: 'client' }],
        provenance: 'client-explicit',
        stage: 'observe',
      },
      {
        id: 'o2',
        text: 'Client laughs after emotionally charged content about dating caution.',
        clientLanguage: 'I laugh about it',
        evidence: [{ excerpt: "I laugh about it, but underneath I'm scared", speaker: 'client' }],
        provenance: 'client-explicit',
        stage: 'observe',
      },
      {
        id: 'o3',
        text: 'Client left a table when others showed empathy after harassment disclosure.',
        evidence: [
          {
            excerpt: 'I left the table when people showed empathy',
            speaker: 'client',
          },
        ],
        provenance: 'client-explicit',
        stage: 'observe',
      },
      {
        id: 'o4',
        text: 'Therapist working hypothesis: vulnerable younger self-state may experience relational closeness as unsafe.',
        evidence: [{ excerpt: "Little Kat doesn't feel safe when people get too close", speaker: 'client' }],
        provenance: 'therapist-interpretation',
        stage: 'observe',
      },
    ],
    regulationOrientation: [
      {
        id: 'r1',
        text: 'Client reports dissociative experiences and concern about falling back into a hole, alongside stronger social support and improved noticing of bodily feeling.',
        label: 'Relevant preparation / regulation considerations',
        domains: ['dissociation', 'overwhelm', 'social-support', 'affect-tolerance'],
        evidence: [
          { excerpt: "I'm concerned about falling back into a hole", speaker: 'client' },
          { excerpt: 'stronger social support now', speaker: 'client' },
        ],
      },
    ],
    patterns: [
      {
        id: 'p1',
        label: 'Possible repeating clinical pattern',
        summary:
          'Sexual assault → harassment → not believed / exclusion → dating caution → fear of labelling → hyper-attunement → withdrawal when closeness increases → difficulty tolerating empathy',
        sequence: [
          'sexual assault',
          'sexual harassment',
          'not being believed / social exclusion',
          'dating caution',
          'fear of being labelled',
          'hyper-attunement',
          'withdrawal when closeness increases',
          'difficulty tolerating empathy',
        ],
        evidence: [
          { excerpt: 'There was sexual assault earlier', speaker: 'client' },
          { excerpt: 'When it gets closer I feel cornered', speaker: 'client' },
        ],
        processCategories: ['threat-anticipation', 'relational-process', 'avoidance-withdrawal-process'],
      },
    ],
    protectiveFunctions: [
      {
        id: 'pf1',
        behaviour: 'Withdrawal when closeness increases',
        possibleFunction: 'Preserving autonomy and reducing perceived vulnerability',
        label: 'Possible protective function',
        evidence: [{ excerpt: 'I pull back', speaker: 'client' }],
      },
      {
        id: 'pf2',
        behaviour: 'Humour / over-rationalisation',
        possibleFunction: 'Deflecting or regulating vulnerable emotion; maintaining control',
        label: 'Possible protective function',
        evidence: [{ excerpt: 'Humour helps. Sometimes I over-rationalise', speaker: 'client' }],
      },
      {
        id: 'pf3',
        behaviour: 'Dissociation / watching self',
        possibleFunction: 'Reducing access to overwhelming affect',
        label: 'Possible protective function',
        evidence: [{ excerpt: "It's kind of like I'm watching myself doing things", speaker: 'client' }],
      },
    ],
    clinicalTensions: [
      {
        id: 't1',
        sideA: 'Wants closeness',
        sideB: 'Pulls back when closeness increases',
        evidenceA: [{ excerpt: 'I want closeness', speaker: 'client' }],
        evidenceB: [{ excerpt: 'I pull back', speaker: 'client' }],
      },
      {
        id: 't2',
        sideA: 'Values autonomy',
        sideB: 'Wants intimacy',
        note: 'Do not resolve prematurely',
      },
      {
        id: 't3',
        sideA: 'Wants empathy',
        sideB: 'Can become overwhelmed by empathy',
      },
      {
        id: 't4',
        sideA: 'Articulate about emotions',
        sideB: 'Struggles to inhabit own emotions',
      },
    ],
    cognitionVsEmbodiment: [
      {
        id: 'ce1',
        cognitiveUnderstanding: 'I understand it / dissect everything',
        embodiedExperience: 'Notice feelings and bodily location; sit with emotion remains harder',
        movement: 'From needing to dissect everything toward not having to dissect every single thing',
        evidence: [
          { excerpt: "I don't have to dissect every single thing", speaker: 'client' },
          {
            excerpt: 'I can notice feelings and where they are in the body more than before',
            speaker: 'client',
          },
        ],
      },
    ],
    dissociationNotes: [
      {
        id: 'd1',
        text: "Client reports watching herself doing things; 'it was not me, it was her.'",
        label: 'Possible dissociative experience — explicit client report',
        reviewConsideration: 'Clinical review / dissociation assessment consideration',
        evidence: [
          { excerpt: "It's kind of like I'm watching myself doing things", speaker: 'client' },
          { excerpt: 'it was not me, it was her', speaker: 'client' },
        ],
      },
    ],
    riskFlags: [
      {
        id: 'risk1',
        excerpt: 'Stop self-harm',
        kind: 'self-harm',
        label: 'CLINICAL REVIEW REQUIRED',
        currentStatus: 'not-established-in-transcript',
        evidence: [{ excerpt: 'Stop self-harm', speaker: 'client' }],
      },
      {
        id: 'risk2',
        excerpt: 'Not think about not wanting to live',
        kind: 'not-wanting-to-live',
        label: 'CLINICAL REVIEW REQUIRED',
        currentStatus: 'not-established-in-transcript',
        evidence: [{ excerpt: 'not wanting to live', speaker: 'client' }],
      },
    ],
    contractMaterial: [
      {
        id: 'c1',
        kind: 'self-belief',
        clientLanguage: 'I am enough.',
        label: 'CLIENT-ENDORSED CONTRACT MATERIAL',
        evidence: [{ excerpt: 'I am enough', speaker: 'client' }],
      },
      {
        id: 'c2',
        kind: 'behavioural-movement',
        clientLanguage: 'Sit with emotions',
        label: 'CLIENT-ENDORSED CONTRACT MATERIAL',
        evidence: [{ excerpt: 'Sit with emotions', speaker: 'client' }],
      },
      {
        id: 'c3',
        kind: 'self-belief',
        clientLanguage: 'I can ask for help. I can enforce boundaries.',
        label: 'CLIENT-ENDORSED CONTRACT MATERIAL',
        evidence: [{ excerpt: 'I can ask for help. I can enforce boundaries.', speaker: 'client' }],
      },
    ],
    therapeuticMovement: [
      {
        id: 'm1',
        earlier: 'I need to dissect everything',
        now: "I don't have to dissect every single thing",
        label: 'Evidence of movement — not resolution',
        evidence: [
          { excerpt: "I don't have to dissect every single thing", speaker: 'client' },
        ],
      },
    ],
    relationalProcessHypotheses: [
      {
        id: 'rp1',
        label: 'Working relational process hypothesis',
        summary:
          'Closeness increases → loss-of-freedom / threat prediction → hyper-attunement → overstimulation / feeling cornered → withdrawal → need to explain → exhaustion / anger',
        sequence: [
          'closeness increases',
          'threat prediction',
          'hyper-attunement',
          'feeling cornered',
          'withdrawal',
          'need to explain',
          'exhaustion / anger',
        ],
        evidence: [
          { excerpt: 'When it gets closer I feel cornered', speaker: 'client' },
          { excerpt: 'hyper-attuned to the other person', speaker: 'client' },
        ],
      },
    ],
    reasoningCards: [
      {
        id: 'rc1',
        observation: 'Client reports pulling back when someone wants increased closeness.',
        clientLanguage: 'I feel cornered',
        pattern: 'Similar withdrawal appears when relational intensity increases.',
        possibleProtectiveFunction: 'Preserving autonomy and reducing perceived vulnerability.',
        meaning: 'Closeness may be predicted as loss of freedom or risk of hurt.',
        primaryLens: {
          lens: 'transactional-analysis',
          interpretation: 'Possible Adapted Child protection and/or Be Strong process.',
        },
        alternativeLenses: [
          {
            lens: 'attachment',
            interpretation: 'Possible proximity-related threat response.',
            label: 'Possible complementary clinical lens',
          },
          {
            lens: 'emdr',
            interpretation: 'A present trigger may exist, but EMDR has not been activated.',
            label: 'Possible complementary clinical lens',
          },
        ],
        openQuestion:
          'What does Kat predict will happen if she remains close rather than withdrawing?',
        evidence: [{ excerpt: 'I feel cornered', speaker: 'client' }],
        provenanceNotes: [
          {
            text: 'Therapist explored "who is scared" / Little Kat — working hypothesis, not client fact',
            provenance: 'therapist-interpretation',
          },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}
