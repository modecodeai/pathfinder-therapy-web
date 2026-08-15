/**
 * Cautious TA lens proposals from approved Core / intake evidence.
 * Hypotheses only — never a complete script formulation from intake alone.
 */

import type { ClientRecord } from '../types';
import type {
  TaDriverId,
  TaEgoState,
  TaInjunctionId,
  TaLensFormulation,
} from '../clinicalReasoning';
import { emptyTaLensFormulation } from '../clinicalReasoning';
import type { IntakeCoreFinding } from './intakeReasoning';

export type PendingTaFindingKind =
  | 'driver'
  | 'injunction'
  | 'ego-state'
  | 'script-belief'
  | 'not-established';

export interface PendingTaFinding {
  id: string;
  kind: PendingTaFindingKind;
  title: string;
  body: string;
  evidence: string[];
  confidence: 'low' | 'moderate' | 'high';
  workingHypothesis: true;
  reviewStatus: 'pending' | 'approved' | 'edited' | 'rejected';
  /** Structured payload for approval into taFormulation */
  driver?: TaDriverId;
  injunction?: TaInjunctionId;
  egoState?: TaEgoState;
  scriptLanguage?: string;
}

function approvedText(f: IntakeCoreFinding): string {
  return f.reviewStatus === 'edited' ? (f.therapistEditedValue ?? f.text) : f.text;
}

function approvedFindings(client: ClientRecord): IntakeCoreFinding[] {
  return (client.intakeCoreFindings ?? []).filter(
    (f) => f.reviewStatus === 'approved' || f.reviewStatus === 'edited',
  );
}

function blob(client: ClientRecord): string {
  const findings = approvedFindings(client);
  const core = client.coreFormulation;
  const parts = [
    ...findings.map((f) => `${approvedText(f)} ${f.clientStatement ?? ''}`),
    ...(core?.repeatingPatterns ?? []).map((p) => p.text),
    ...(core?.copingStrategies ?? []).map((p) => p.text),
    ...(core?.workingHypotheses ?? []).map((p) => p.statement),
    ...(core?.goals ?? []).map((p) => p.text),
    ...(client.presentingProblems ?? []),
  ];
  return parts.join('\n').toLowerCase();
}

/**
 * Propose TA working hypotheses grounded in approved core evidence.
 * Returns "Not sufficiently established" items where evidence is weak.
 */
export function proposeTaLensFromApprovedCore(client: ClientRecord): PendingTaFinding[] {
  const text = blob(client);
  const out: PendingTaFinding[] = [];
  const push = (item: Omit<PendingTaFinding, 'workingHypothesis' | 'reviewStatus'>) => {
    out.push({ ...item, workingHypothesis: true, reviewStatus: 'pending' });
  };

  // Be Strong — difficulty asking for help / handling problems alone
  if (/ask(ing)? for help|manage (problems )?alone|self-reli|handles problems alone|fixing|problem-solving/i.test(text)) {
    const evidence: string[] = [];
    if (/ask(ing)? for help|difficulty asking/i.test(text)) evidence.push('Difficulty asking for help');
    if (/alone|self-reli|handles problems/i.test(text)) evidence.push('Handles problems alone / self-reliance');
    if (/fixing|problem-solving/i.test(text)) evidence.push('Moves into fixing / problem-solving');
    push({
      id: 'ta_driver_be_strong',
      kind: 'driver',
      title: 'Possible Be Strong',
      body: 'Client-identified self-reliance and difficulty asking for help may support a Be Strong driver hypothesis.',
      evidence,
      confidence: evidence.length >= 2 ? 'moderate' : 'low',
      driver: 'be-strong',
    });
  }

  // Please Others — prioritising others' needs
  if (/please|others'? needs|put(ting)? .+ first|prioritis(e|ing) others/i.test(text)) {
    push({
      id: 'ta_driver_please_others',
      kind: 'driver',
      title: 'Possible Please Others',
      body: 'Narrative material suggesting prioritising others’ needs may support a Please Others driver hypothesis.',
      evidence: ['Client material referencing others’ needs / pleasing'],
      confidence: 'low',
      driver: 'please-others',
    });
  }

  // Don't Feel — suppressing emotions / emotional withdrawal
  if (/suppress|don'?t feel|withdraw(s|al)? emotionally|emotional withdrawal|not express/i.test(text)) {
    push({
      id: 'ta_inj_dont_feel',
      kind: 'injunction',
      title: 'Possible Don’t Feel',
      body: 'Emotional withdrawal / suppression language may support a Don’t Feel injunction hypothesis — hold lightly.',
      evidence: ['Emotional withdrawal / suppression in approved material'],
      confidence: /suppress|don'?t feel/i.test(text) ? 'moderate' : 'low',
      injunction: 'dont-feel',
    });
  }

  // Don't Need — related to self-reliance
  if (/handle problems myself|don'?t need|should(n'?t)? need help|manage alone/i.test(text)) {
    push({
      id: 'ta_script_handle_alone',
      kind: 'script-belief',
      title: 'Possible script belief',
      body: '“I need to handle problems myself.” — working hypothesis from self-reliance material.',
      evidence: ['Self-reliance / handling problems alone'],
      confidence: 'moderate',
      scriptLanguage: 'I need to handle problems myself.',
    });
  }

  // Adapted Child / Adult — only if relational crisis + patterns
  if (/defensive|withdraw|marital|relationship/i.test(text)) {
    push({
      id: 'ta_ego_adapted_child',
      kind: 'ego-state',
      title: 'Possible Adapted Child activation',
      body: 'Defensiveness / withdrawal under relational stress may reflect Adapted Child process — observation only.',
      evidence: ['Defensiveness / withdrawal under relational stress'],
      confidence: 'low',
      egoState: 'adapted-child',
    });
    push({
      id: 'ta_ego_adult',
      kind: 'ego-state',
      title: 'Possible Adult capacity',
      body: 'Motivation for change, goals, and prior therapy engagement may support Adult observing capacity.',
      evidence: ['Goals / motivation / prior therapy where present'],
      confidence: 'low',
      egoState: 'adult',
    });
  }

  // Critical Parent — only with stronger evidence
  if (/critic(al|is)|should|never good enough|harsh|father.*(yell|critic)/i.test(text)) {
    push({
      id: 'ta_ego_critical_parent',
      kind: 'ego-state',
      title: 'Possible Critical Parent material',
      body: 'Critical / should language in history may support Critical Parent observation — insufficient for full Parent formulation.',
      evidence: ['Critical / evaluative language in approved history'],
      confidence: 'low',
      egoState: 'critical-parent',
    });
  }

  if (!out.length) {
    push({
      id: 'ta_insufficient',
      kind: 'not-established',
      title: 'Not sufficiently established',
      body: 'Approved Core evidence does not yet support specific TA driver, injunction, or ego-state findings. Continue assessment and contracting.',
      evidence: [],
      confidence: 'low',
    });
  }

  return out;
}

export function applyApprovedPendingTaFindings(
  prior: TaLensFormulation | undefined,
  pending: PendingTaFinding[],
): TaLensFormulation {
  const base = prior ?? emptyTaLensFormulation();
  const approved = pending.filter((p) => p.reviewStatus === 'approved' || p.reviewStatus === 'edited');
  const next: TaLensFormulation = {
    ...base,
    drivers: [...base.drivers],
    injunctionHypotheses: [...base.injunctionHypotheses],
    egoStateObservations: [...base.egoStateObservations],
    scriptMessages: [...base.scriptMessages],
    updatedAt: new Date().toISOString(),
    noSufficientEvidence: approved.every((a) => a.kind === 'not-established'),
  };

  for (const item of approved) {
    if (item.kind === 'driver' && item.driver && !next.drivers.some((d) => d.driver === item.driver)) {
      next.drivers.push({
        id: item.id,
        driver: item.driver,
        relatedBehaviours: item.evidence,
        approvedAt: new Date().toISOString(),
      });
    }
    if (
      item.kind === 'injunction' &&
      item.injunction &&
      !next.injunctionHypotheses.some((i) => i.injunction === item.injunction)
    ) {
      next.injunctionHypotheses.push({
        id: item.id,
        injunction: item.injunction,
        approvedAt: new Date().toISOString(),
      });
    }
    if (
      item.kind === 'ego-state' &&
      item.egoState &&
      !next.egoStateObservations.some((e) => e.egoState === item.egoState)
    ) {
      next.egoStateObservations.push({
        id: item.id,
        egoState: item.egoState,
        context: item.body,
        approvedAt: new Date().toISOString(),
      });
    }
    if (item.kind === 'script-belief' && item.scriptLanguage) {
      if (!next.scriptMessages.some((s) => s.clientLanguage === item.scriptLanguage)) {
        next.scriptMessages.push({
          id: item.id,
          kind: 'script-message',
          clientLanguage: item.scriptLanguage,
          approvedAt: new Date().toISOString(),
        });
      }
      if (!next.scriptSummary) {
        next.scriptSummary = `Working formulation: ${item.scriptLanguage}`;
      }
    }
  }

  return next;
}
