/**
 * Lisa golden-case quality scorecard — regression checks for TA-first analysis.
 * Operates on structured analysis objects (no live model calls required).
 */

import type { TaTranscriptAnalysis } from '../../src/clinical-intelligence/clinicalReasoning';
import {
  EMDR_LEAKAGE_FORBIDDEN_TERMS,
  EMDR_LEAKAGE_STRUCTURED_KEYS,
  LISA_KEY_QUOTES,
} from './lisaGoldenFixture';

export type ScorecardResult = {
  pass: boolean;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
};

function textBlob(analysis: TaTranscriptAnalysis): string {
  return JSON.stringify(analysis);
}

function hasExcerpt(analysis: TaTranscriptAnalysis, needle: string): boolean {
  const n = needle.toLowerCase();
  return textBlob(analysis).toLowerCase().includes(n);
}

/** Detect EMDR construct leakage in a TA-primary analysis. */
export function detectEmdrLeakage(analysis: unknown): string[] {
  const leaks: string[] = [];
  if (!analysis || typeof analysis !== 'object') return ['invalid-analysis'];
  const obj = analysis as Record<string, unknown>;
  for (const key of EMDR_LEAKAGE_STRUCTURED_KEYS) {
    if (key in obj && obj[key] != null) {
      const v = obj[key];
      if (Array.isArray(v) ? v.length > 0 : true) leaks.push(`structured:${key}`);
    }
  }
  const blob = JSON.stringify(analysis);
  for (const term of EMDR_LEAKAGE_FORBIDDEN_TERMS) {
    if (blob.includes(term)) leaks.push(`term:${term}`);
  }
  // Fact-style injunction language
  if (/client has (?:injunction|driver)/i.test(blob)) {
    leaks.push('language:fact-claim');
  }
  return leaks;
}

export function scoreLisaTaAnalysis(analysis: TaTranscriptAnalysis): ScorecardResult {
  const checks: ScorecardResult['checks'] = [];

  checks.push({
    id: 'analysis-kind-ta',
    pass: analysis.analysisKind === 'ta-formulation',
    detail: `analysisKind=${analysis.analysisKind}`,
  });

  checks.push({
    id: 'clinical-lens-ta',
    pass: analysis.clinicalLens === 'transactional-analysis',
    detail: `clinicalLens=${analysis.clinicalLens}`,
  });

  const leaks = detectEmdrLeakage(analysis);
  checks.push({
    id: 'no-emdr-leakage',
    pass: leaks.length === 0,
    detail: leaks.length ? leaks.join('; ') : 'clean',
  });

  const bePerfect = analysis.drivers?.find((d) => d.driver === 'be-perfect');
  checks.push({
    id: 'be-perfect-present',
    pass: Boolean(bePerfect),
    detail: bePerfect ? 'present' : 'missing',
  });
  checks.push({
    id: 'be-perfect-evidence',
    pass: Boolean(
      bePerfect &&
        LISA_KEY_QUOTES.bePerfect.some((q) =>
          bePerfect.evidence.some((e) => e.excerpt.toLowerCase().includes(q.toLowerCase().slice(0, 24))),
        ),
    ),
    detail: 'Be Perfect linked to transcript excerpts',
  });

  const beStrong = analysis.drivers?.find((d) => d.driver === 'be-strong');
  checks.push({
    id: 'be-strong-present',
    pass: Boolean(beStrong),
    detail: beStrong ? 'present' : 'missing',
  });

  const dontFeel = analysis.injunctionHypotheses?.find((i) => i.injunction === 'dont-feel');
  checks.push({
    id: 'dont-feel-hypothesis',
    pass: Boolean(dontFeel && dontFeel.hypothesisLabel === 'Possible injunction hypothesis'),
    detail: dontFeel ? dontFeel.hypothesisLabel : 'missing',
  });

  const factClaims = /Lisa has |client has (?:a )?(?:Be Perfect|Don't Feel)/i.test(
    textBlob(analysis),
  );
  checks.push({
    id: 'no-fact-claims',
    pass: !factClaims,
    detail: factClaims ? 'fact-style claim found' : 'hypotheses only',
  });

  const griefCentral =
    hasExcerpt(analysis, 'Marta') ||
    /grief|loss|bereavement|unfinished/i.test(analysis.summary?.value ?? '');
  checks.push({
    id: 'grief-remains-central',
    pass: griefCentral,
    detail: griefCentral ? 'grief/loss referenced' : 'grief missing from summary',
  });

  const clientLanguagePreserved =
    hasExcerpt(analysis, 'shrink and adapt') ||
    analysis.scriptMessages?.some((s) => /feelings have a place|shrink/i.test(s.clientLanguage));
  checks.push({
    id: 'client-language-preserved',
    pass: Boolean(clientLanguagePreserved),
    detail: clientLanguagePreserved ? 'client wording present' : 'client wording missing',
  });

  const contradictory =
    analysis.injunctionHypotheses?.some(
      (i) => i.injunction === 'dont-belong' && (i.contradictoryEvidence?.length ?? 0) > 0,
    ) ||
    analysis.drivers?.some((d) => (d.contradictoryEvidence?.length ?? 0) > 0) ||
    /find your people|people who think like I do/i.test(textBlob(analysis));
  checks.push({
    id: 'contradictory-or-moderating-evidence',
    pass: Boolean(contradictory),
    detail: contradictory ? 'moderating evidence retained' : 'no moderating evidence found',
  });

  const lifeGlobal = /permanent (?:global )?life position|fixed life position/i.test(
    textBlob(analysis),
  );
  checks.push({
    id: 'life-position-not-global',
    pass: !lifeGlobal && (analysis.lifePositions ?? []).every((l) => l.contextSpecific === true),
    detail: 'life positions context-specific only',
  });

  const inventedRedecision = analysis.redecisionAreas?.some(
    (r) =>
      !/perfect|protect|feelings|perception|little Lisa/i.test(
        `${r.oldDecision} ${r.possibleNewDecision}`,
      ),
  );
  checks.push({
    id: 'redecision-grounded',
    pass: !inventedRedecision,
    detail: inventedRedecision ? 'possible ungrounded redecision' : 'ok',
  });

  return {
    pass: checks.every((c) => c.pass),
    checks,
  };
}

/** Minimal valid "good" Lisa TA analysis for fixture-based regression (not live AI). */
export function buildLisaExpectedTaAnalysis(): TaTranscriptAnalysis {
  const base = {
    evidenceLevel: 'suggested' as const,
    confidence: 'moderate' as const,
    reviewStatus: 'pending' as const,
    clinicalLens: 'transactional-analysis' as const,
  };
  return {
    analysisKind: 'ta-formulation',
    clinicalLens: 'transactional-analysis',
    summary: {
      id: 'sum1',
      value:
        'Anticipatory grief and unfinished business with Marta, activating earlier losses (Solomon; sudden death of a university friend). Repeating pattern of high functioning, scanning, adapting, and delayed affect. Strong reflective resources and an explicit desire for mutual recognition without disappearing or overpowering others.',
      evidenceLevel: 'inferred',
      confidence: 'high',
      evidence: [
        { excerpt: 'Marta is deteriorating', speaker: 'client' },
        { excerpt: 'I become highly functional when everything is chaotic', speaker: 'client' },
      ],
      reviewStatus: 'pending',
    },
    egoStates: [
      {
        id: 'e1',
        egoState: 'critical-parent',
        context: 'Get it right; do not act before perfect',
        clientLanguagePattern: 'I need to get it right before I let myself be heard.',
        reasoning: 'Possible Critical Parent processes around competence and exposure',
        evidence: [
          { excerpt: 'I need to get it right before I let myself be heard.', speaker: 'client' },
        ],
        ...base,
        confidence: 'high',
      },
      {
        id: 'e2',
        egoState: 'adapted-child',
        context: 'Scan, shrink, adapt, withdraw',
        clientLanguagePattern: 'I have to shrink and adapt',
        reasoning: 'Possible Adapted Child protective response',
        evidence: [{ excerpt: 'I have to shrink and adapt', speaker: 'client' }],
        ...base,
      },
      {
        id: 'e3',
        egoState: 'adult',
        context: 'Differentiation and self-trust',
        clientLanguagePattern: 'I notice what belongs to me and what belongs to other people.',
        reasoning: 'Movement toward Adult autonomy',
        evidence: [
          {
            excerpt: 'I notice what belongs to me and what belongs to other people.',
            speaker: 'client',
          },
        ],
        ...base,
        confidence: 'high',
      },
    ],
    drivers: [
      {
        id: 'd1',
        driver: 'be-perfect',
        evidenceStrength: 'strong',
        relatedBehaviours: ['delay publishing', 'immobilisation'],
        reasoning: 'Possible Driver: Be Perfect — therapist review required',
        protectiveFunction: 'Avoid exposure until safe enough',
        evidence: LISA_KEY_QUOTES.bePerfect.map((excerpt) => ({
          excerpt,
          speaker: 'client' as const,
        })),
        ...base,
        confidence: 'high',
      },
      {
        id: 'd2',
        driver: 'be-strong',
        evidenceStrength: 'moderate',
        reasoning:
          'Possible Driver: Be Strong — functional competence may protect against overwhelming affect',
        protectiveFunction: 'Private coping; avoid breakdown in front of others',
        evidence: [
          {
            excerpt:
              "I don't like totally break down in front of people, maybe I do that more privately.",
            speaker: 'client',
          },
          {
            excerpt:
              "I can handle it, even if it's fucking crushing me. But I'll do that by myself.",
            speaker: 'client',
          },
        ],
        ...base,
      },
      {
        id: 'd3',
        driver: 'please-others',
        evidenceStrength: 'possible',
        reasoning: 'Possible / moderate — high availability and usefulness; needs secondary',
        evidence: [
          { excerpt: 'I\'m highly available. Being useful.', speaker: 'client' },
        ],
        ...base,
        confidence: 'low',
      },
    ],
    injunctionHypotheses: [
      {
        id: 'i1',
        injunction: 'dont-feel',
        hypothesisLabel: 'Possible injunction hypothesis',
        evidenceStrength: 'strong',
        alternativeExplanation:
          'Protective emotional inhibition developed in an unpredictable emotional environment',
        reasoning: 'Possible injunction hypothesis: Don\'t Feel',
        evidence: [
          { excerpt: 'being quiet and swallowing it', speaker: 'client' },
          {
            excerpt: 'The things that have to be done can distract you from the feelings you have',
            speaker: 'client',
          },
        ],
        ...base,
        confidence: 'high',
      },
      {
        id: 'i2',
        injunction: 'dont-be-important',
        hypothesisLabel: 'Possible injunction hypothesis',
        evidenceStrength: 'possible',
        clientLanguagePattern: 'My feelings do not seem to factor',
        reasoning: 'Possible Don\'t Be Important / Don\'t Have Needs — prefer client language',
        evidence: [
          { excerpt: 'My feelings do not seem to factor', speaker: 'client' },
          { excerpt: 'I have to shrink and adapt', speaker: 'client' },
        ],
        ...base,
      },
      {
        id: 'i3',
        injunction: 'dont-belong',
        hypothesisLabel: 'Possible injunction hypothesis',
        evidenceStrength: 'possible',
        reasoning: 'Possible but mixed — not forced as dominant',
        evidence: [
          {
            excerpt: "I withdraw when I believe there's no space for me",
            speaker: 'client',
          },
        ],
        contradictoryEvidence: [
          {
            excerpt: 'there are people who think like I do',
            speaker: 'client',
          },
          { excerpt: 'Find your people', speaker: 'client' },
        ],
        ...base,
        confidence: 'low',
      },
    ],
    scriptMessages: [
      {
        id: 'sm1',
        kind: 'script-message',
        clientLanguage: 'My feelings do not have room.',
        reasoning: 'Working script hypothesis in client language',
        evidence: [{ excerpt: 'Their feelings take up all the room', speaker: 'client' }],
        ...base,
      },
      {
        id: 'p1',
        kind: 'permission',
        clientLanguage: 'My feelings have a place.',
        reasoning: 'Emerging permission grounded in transcript',
        evidence: [{ excerpt: 'My feelings have a place.', speaker: 'client' }],
        ...base,
        confidence: 'high',
      },
      {
        id: 'p2',
        kind: 'permission',
        clientLanguage: 'I can trust my judgment and perception.',
        reasoning: 'Emerging permission',
        evidence: [
          { excerpt: 'I can trust my judgment and perception.', speaker: 'client' },
        ],
        ...base,
      },
    ],
    lifePositions: [
      {
        id: 'lp1',
        position: 'not-ok-ok',
        contextSpecific: true,
        context: 'During evaluation / criticism — external judgement may feel more authoritative',
        reasoning: 'Context-specific observation only — not a global life position',
        evidence: [
          { excerpt: 'Sensitivity to criticism', speaker: 'client' },
        ],
        ...base,
      },
    ],
    transactions: [],
    gamePatterns: [],
    racketSystems: [
      {
        id: 'rk1',
        reasoning:
          'Possible racket-process question: Does reactive anger sometimes become more available than vulnerable affect?',
        evidenceStrength: 'moderate',
        racketFeeling: undefined,
        authenticFeeling: 'hurt / sadness / fear / grief (possible)',
        evidence: [
          { excerpt: 'I get reactive when I\'m dysregulated', speaker: 'client' },
        ],
        ...base,
      },
    ],
    discounting: [],
    redecisionAreas: [
      {
        id: 'rd1',
        oldDecision: 'I need perfection before I act',
        possibleNewDecision: 'I can enter the conversation before everything feels perfect',
        reasoning: 'Grounded in client language',
        evidence: [
          {
            excerpt: 'I can enter the conversation before everything feels perfect.',
            speaker: 'client',
          },
        ],
        ...base,
        confidence: 'high',
      },
      {
        id: 'rd2',
        oldDecision: 'I handle crushing feelings alone',
        possibleNewDecision: 'I can protect myself without absorbing another person\'s emotional state',
        reasoning: 'Grounded permission / redecision area',
        evidence: [
          {
            excerpt:
              'I can protect myself without absorbing another person\'s emotional state.',
            speaker: 'client',
          },
        ],
        ...base,
      },
    ],
    unansweredQuestions: [
      'What does Lisa experience internally immediately before scanning the room?',
      'What does she predict would happen if she communicated hurt earlier?',
      'What remains unfinished with Marta?',
      'What feelings sit beneath reactive anger?',
    ],
    clarificationSuggestions: [
      'Possible areas to clarify: when Be Perfect remains adaptive vs inhibiting',
      'Possible areas to clarify: what "being seen by myself" looks like behaviourally',
    ],
    noSufficientTaEvidence: false,
    lensConsiderations: [],
    reasoningMode: 'primary-lens-only',
    primaryApproach: 'transactional-analysis',
    scriptWorkingHypothesis:
      'There may not be enough room for what I feel, so I need to monitor other people, adapt, remain competent and get things right before I expose myself.',
  };
}
