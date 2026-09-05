import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/shell';
import { useAuth } from '../hooks/useAuth';
import {
  PRIMARY_APPROACH_LABELS,
  emptyCoreFormulation,
  type PrimaryTreatmentApproach,
} from './clinicalReasoning';
import { analyseTranscript, getClient, patchClient } from './lib/api';
import { setPrimaryTreatmentApproach } from './lib/lensGovernance';
import {
  SETUP_STEPS,
  detectRiskReviewRequired,
  extractIntakeFindingsHeuristic,
  findingsToCorePatch,
  hasCoreFormulationContent,
  intakeFieldsToText,
  mergeFindingsWithoutDuplicates,
  type ClientIntakeFields,
  type ClientSetupStep,
  type ClinicalMaterialSource,
  type ClinicalSourceType,
  type IntakeExtractedFinding,
  INTAKE_FIELD_LABELS,
  type IntakeFieldKey,
} from './lib/intake';
import type { ClientRecord } from './types';

const APPROACH_OPTIONS: PrimaryTreatmentApproach[] = [
  'unspecified',
  'transactional-analysis',
  'emdr',
  'integrated-ta-emdr',
  'general-integrative',
  'pain',
  'other',
];

const MATERIAL_TYPES: Array<{ id: ClinicalSourceType; label: string }> = [
  { id: 'transcript', label: 'Paste session transcript' },
  { id: 'therapist-note', label: 'Paste previous therapy notes' },
  { id: 'referral', label: 'Paste referral letter' },
  { id: 'assessment', label: 'Paste assessment notes' },
];

export function ClientSetupPage({ clientId }: { clientId: string }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<ClientSetupStep>('intake');
  const [busy, setBusy] = useState(false);

  // Intake state
  const [intakeMode, setIntakeMode] = useState<'manual' | 'paste' | 'skip'>('paste');
  const [fields, setFields] = useState<ClientIntakeFields>({});
  const [pasteText, setPasteText] = useState('');
  const [findings, setFindings] = useState<IntakeExtractedFinding[]>([]);

  // Material
  const [materialType, setMaterialType] = useState<ClinicalSourceType>('transcript');
  const [materialText, setMaterialText] = useState('');

  // Approach
  const [approach, setApproach] = useState<PrimaryTreatmentApproach>('unspecified');

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    void getClient(clientId)
      .then((c) => {
        setClient(c);
        setFields(c.intake?.fields ?? {});
        setPasteText(c.intake?.rawPaste ?? '');
        setFindings(c.intake?.extractedFindings ?? []);
        setApproach(c.primaryTreatmentApproach ?? 'unspecified');
        setStep(c.setupProgress?.lastStep ?? 'intake');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [auth.isAuthenticated, clientId]);

  const riskAlert = useMemo(() => {
    const blob = `${pasteText}\n${intakeFieldsToText(fields)}\n${materialText}`;
    return detectRiskReviewRequired(blob) || client?.intake?.riskReviewRequired;
  }, [pasteText, fields, materialText, client?.intake?.riskReviewRequired]);

  const saveClient = async (patch: Partial<ClientRecord>) => {
    const res = await patchClient(clientId, patch);
    if (!res.ok || !res.client) throw new Error(res.error ?? 'Save failed');
    setClient(res.client);
    return res.client;
  };

  const saveLater = async () => {
    setBusy(true);
    try {
      await saveClient({
        intake: {
          fields,
          rawPaste: pasteText || undefined,
          updatedAt: new Date().toISOString(),
          extractedFindings: findings,
          riskReviewRequired: riskAlert || undefined,
        },
        setupProgress: {
          ...(client?.setupProgress ?? {}),
          lastStep: step,
        },
      });
      navigate(`/clients/${clientId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const analyseIntake = async () => {
    setBusy(true);
    setError(null);
    try {
      const structured = intakeFieldsToText(fields);
      const text = [pasteText.trim(), structured].filter(Boolean).join('\n\n');
      if (!text.trim()) {
        setError('Paste or enter intake information first.');
        return;
      }
      const sourceId = `src_intake_${Date.now().toString(36)}`;
      let extracted = extractIntakeFindingsHeuristic(text, sourceId);

      // Prefer CORE-ONLY AI analysis when available
      const ai = await analyseTranscript({
        clientId,
        protocol: 'general-psychotherapy',
        phase: 'formulation',
        clinicalLens: 'integrated',
        reasoningMode: 'core-only',
        primaryApproach: 'unspecified',
        transcript: `[INTAKE FORM — sourceType: intake]\n\n${text}`,
      });

      if (ai.success && ai.structuredResult) {
        const fromAi = coreishToFindings(ai.structuredResult, sourceId);
        extracted = mergeFindingsWithoutDuplicates(extracted, fromAi);
      }

      const merged = mergeFindingsWithoutDuplicates(findings, extracted);
      setFindings(merged);
      const materials: ClinicalMaterialSource[] = [
        ...(client?.clinicalMaterials ?? []).filter((m) => m.sourceType !== 'intake'),
        {
          id: sourceId,
          sourceType: 'intake',
          label: 'Intake form',
          text,
          createdAt: new Date().toISOString(),
          analysedAt: new Date().toISOString(),
        },
      ];
      await saveClient({
        intake: {
          fields,
          rawPaste: pasteText || undefined,
          updatedAt: new Date().toISOString(),
          extractedFindings: merged,
          riskReviewRequired: detectRiskReviewRequired(text),
        },
        clinicalMaterials: materials,
        setupProgress: {
          ...(client?.setupProgress ?? {}),
          intakeComplete: true,
          lastStep: 'intake',
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse failed');
    } finally {
      setBusy(false);
    }
  };

  const approveAllPending = () => {
    setFindings((prev) =>
      prev.map((f) => (f.reviewStatus === 'pending' ? { ...f, reviewStatus: 'approved' as const } : f)),
    );
  };

  const buildInitialFormulation = async () => {
    setBusy(true);
    try {
      const approved = findings.map((f) =>
        f.reviewStatus === 'pending' ? { ...f, reviewStatus: 'approved' as const } : f,
      );
      setFindings(approved);
      const patch = findingsToCorePatch(approved);
      const prior = client?.coreFormulation ?? emptyCoreFormulation();
      const core = {
        ...prior,
        ...mergeCoreArrays(prior, patch),
        updatedAt: new Date().toISOString(),
      };
      await saveClient({
        coreFormulation: core,
        presentingProblems: [
          ...new Set([
            ...(client?.presentingProblems ?? []),
            ...(core.presentingProblems?.map((p) => p.text) ?? []),
          ]),
        ],
        intake: {
          fields,
          rawPaste: pasteText || undefined,
          updatedAt: new Date().toISOString(),
          extractedFindings: approved,
          riskReviewRequired: riskAlert || undefined,
        },
        setupProgress: {
          ...(client?.setupProgress ?? {}),
          initialReasoningComplete: true,
          lastStep: 'current-approach',
        },
      });
      setStep('current-approach');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build formulation');
    } finally {
      setBusy(false);
    }
  };

  const saveMaterial = async (skip = false) => {
    setBusy(true);
    try {
      if (skip) {
        await saveClient({
          setupProgress: {
            ...(client?.setupProgress ?? {}),
            materialSkipped: true,
            lastStep: 'initial-reasoning',
          },
        });
        setStep('initial-reasoning');
        return;
      }
      if (!materialText.trim()) {
        setError('Paste material or skip.');
        return;
      }
      const sourceId = `src_${materialType}_${Date.now().toString(36)}`;
      const materials: ClinicalMaterialSource[] = [
        ...(client?.clinicalMaterials ?? []),
        {
          id: sourceId,
          sourceType: materialType,
          label: MATERIAL_TYPES.find((m) => m.id === materialType)?.label ?? materialType,
          text: materialText.trim(),
          createdAt: new Date().toISOString(),
        },
      ];

      // Analyse material with core-only; merge without duplicates
      let nextFindings = findings;
      if (materialType === 'transcript' || materialType === 'assessment' || materialType === 'referral') {
        const heuristic = extractIntakeFindingsHeuristic(materialText, sourceId).map((f) => ({
          ...f,
          provenance: {
            ...f.provenance,
            sourceTypes: [materialType] as ClinicalSourceType[],
          },
        }));
        const ai = await analyseTranscript({
          clientId,
          protocol: 'general-psychotherapy',
          phase: 'formulation',
          clinicalLens: 'integrated',
          reasoningMode: 'core-only',
          primaryApproach: approach === 'unspecified' ? 'unspecified' : approach,
          transcript: `[CLINICAL MATERIAL — sourceType: ${materialType}]\n\n${materialText}`,
        });
        let fromAi: IntakeExtractedFinding[] = [];
        if (ai.success && ai.structuredResult) {
          fromAi = coreishToFindings(ai.structuredResult, sourceId).map((f) => ({
            ...f,
            provenance: {
              sourceIds: [sourceId],
              sourceTypes: [materialType],
              status: 'single' as const,
            },
          }));
        }
        nextFindings = mergeFindingsWithoutDuplicates(findings, [...heuristic, ...fromAi]);
        setFindings(nextFindings);
      }

      await saveClient({
        clinicalMaterials: materials,
        intake: {
          fields,
          rawPaste: pasteText || undefined,
          updatedAt: new Date().toISOString(),
          extractedFindings: nextFindings,
          riskReviewRequired: detectRiskReviewRequired(materialText) || riskAlert || undefined,
        },
        setupProgress: {
          ...(client?.setupProgress ?? {}),
          materialComplete: true,
          lastStep: 'initial-reasoning',
        },
      });
      setMaterialText('');
      setStep('initial-reasoning');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save material');
    } finally {
      setBusy(false);
    }
  };

  const saveApproachAndFinish = async () => {
    setBusy(true);
    try {
      let next = client!;
      next = setPrimaryTreatmentApproach(next, approach);
      await saveClient({
        primaryTreatmentApproach: next.primaryTreatmentApproach,
        treatmentApproachHistory: next.treatmentApproachHistory,
        activeClinicalLenses: next.activeClinicalLenses,
        setupProgress: {
          ...(client?.setupProgress ?? {}),
          approachSelected: true,
          ready: true,
          lastStep: 'ready',
        },
      });
      setStep('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save approach');
    } finally {
      setBusy(false);
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <AppShell activeNav="clients">
        <main className="practice-main">
          <Link className="btn primary" to="/account">
            Sign in
          </Link>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="clients" contentWidth="wide">
      <main className="practice-main pf-client-setup">
        <header className="pf-page-header">
          <p className="pf-breadcrumb">
            <Link to="/clients">Clients</Link>
            <span aria-hidden> › </span>
            <Link to={`/clients/${clientId}`}>{client?.displayName || 'Client'}</Link>
            <span aria-hidden> › </span>
            Setup
          </p>
          <h1>{client?.displayName || 'Client'}</h1>
          <p className="pf-subtitle">New client setup</p>
        </header>

        {riskAlert && (
          <div className="pf-clinical-review-alert" role="alert">
            <strong>CLINICAL REVIEW REQUIRED</strong>
            <p>
              Risk-related content appears in intake or clinical material. Do not infer severity.
              Review before proceeding with modality reasoning.
            </p>
          </div>
        )}

        {error && <p className="ci-error-banner">{error}</p>}

        <ol className="pf-setup-progress" aria-label="Setup progress">
          {SETUP_STEPS.map((s) => (
            <li key={s.id} className={step === s.id ? 'is-active' : ''}>
              <button type="button" className="pf-setup-step-btn" onClick={() => setStep(s.id)}>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        {step === 'basic-details' && (
          <section className="pf-surface-card">
            <h2>Basic Details</h2>
            <p className="pf-meta">Identity is already saved. Continue to intake.</p>
            <button type="button" className="btn primary" onClick={() => setStep('intake')}>
              Continue to Intake
            </button>
          </section>
        )}

        {step === 'intake' && (
          <section className="pf-surface-card">
            <h2>Intake</h2>
            <p className="pf-meta">
              Intake is a clinical evidence source. Pathfinder does not diagnose or select a modality
              from intake alone.
            </p>
            <div className="clients-filters" role="group" aria-label="Intake mode">
              {(
                [
                  ['paste', 'Paste Intake Form'],
                  ['manual', 'Complete manually'],
                  ['skip', 'Skip for now'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={intakeMode === id ? 'is-active' : ''}
                  onClick={() => setIntakeMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {intakeMode === 'skip' && (
              <div className="stack-btns horizontal wrap" style={{ marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn primary"
                  disabled={busy}
                  onClick={() => {
                    void saveClient({
                      setupProgress: {
                        ...(client?.setupProgress ?? {}),
                        intakeSkipped: true,
                        lastStep: 'existing-material',
                      },
                    }).then(() => setStep('existing-material'));
                  }}
                >
                  Skip Intake
                </button>
              </div>
            )}

            {intakeMode === 'paste' && (
              <>
                <label className="field" style={{ marginTop: '1rem' }}>
                  <span>Paste completed intake form</span>
                  <textarea
                    className="ci-transcript-editor"
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste the completed intake here…"
                  />
                </label>
                <div className="stack-btns horizontal wrap">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy || !pasteText.trim()}
                    onClick={() => void analyseIntake()}
                  >
                    {busy ? 'Analysing…' : 'Analyse Intake'}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={!findings.length}
                    onClick={() => {
                      approveAllPending();
                      setStep('existing-material');
                    }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {intakeMode === 'manual' && (
              <>
                <div className="pf-intake-fields">
                  {(Object.keys(INTAKE_FIELD_LABELS) as IntakeFieldKey[]).map((key) => (
                    <label key={key} className="field">
                      <span>{INTAKE_FIELD_LABELS[key]}</span>
                      <textarea
                        rows={2}
                        value={fields[key] ?? ''}
                        onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
                <div className="stack-btns horizontal wrap">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy}
                    onClick={() => void analyseIntake()}
                  >
                    {busy ? 'Analysing…' : 'Analyse Intake'}
                  </button>
                  <button type="button" className="btn secondary" onClick={() => setStep('existing-material')}>
                    Continue
                  </button>
                </div>
              </>
            )}

            {findings.length > 0 && (
              <IntakeFindingsReview findings={findings} onChange={setFindings} />
            )}
          </section>
        )}

        {step === 'existing-material' && (
          <section className="pf-surface-card">
            <h2>Existing Material</h2>
            <p className="pf-meta">Every source is labelled by type and kept with provenance.</p>
            <div className="clients-filters" role="group" aria-label="Material type">
              {MATERIAL_TYPES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={materialType === m.id ? 'is-active' : ''}
                  onClick={() => setMaterialType(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <label className="field" style={{ marginTop: '1rem' }}>
              <span>Material text</span>
              <textarea
                className="ci-transcript-editor"
                value={materialText}
                onChange={(e) => setMaterialText(e.target.value)}
              />
            </label>
            <div className="stack-btns horizontal wrap">
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() => void saveMaterial(false)}
              >
                {busy ? 'Saving…' : 'Add & Analyse'}
              </button>
              <button type="button" className="btn ghost" disabled={busy} onClick={() => void saveMaterial(true)}>
                Skip
              </button>
            </div>
          </section>
        )}

        {step === 'initial-reasoning' && (
          <section className="pf-surface-card">
            <h2>Initial Clinical Understanding</h2>
            <p className="pf-meta">
              Build a modality-neutral formulation from available sources. No EMDR constructs are
              applied automatically.
            </p>
            {findings.length > 0 && (
              <IntakeFindingsReview findings={findings} onChange={setFindings} />
            )}
            {!findings.length && !hasCoreFormulationContent(client?.coreFormulation) && (
              <p className="pf-meta">Add intake or clinical material first, or continue to choose approach.</p>
            )}
            <div className="stack-btns horizontal wrap">
              <button
                type="button"
                className="btn primary"
                disabled={busy || (!findings.length && !hasCoreFormulationContent(client?.coreFormulation))}
                onClick={() => void buildInitialFormulation()}
              >
                Build Initial Formulation
              </button>
              <button type="button" className="btn secondary" onClick={() => setStep('current-approach')}>
                Continue without formulation
              </button>
            </div>
            {hasCoreFormulationContent(client?.coreFormulation) && (
              <CoreSummary core={client!.coreFormulation!} />
            )}
          </section>
        )}

        {step === 'current-approach' && (
          <section className="pf-surface-card">
            <h2>Current Treatment Approach</h2>
            <p className="pf-meta">
              Default is Not yet decided. Never default to EMDR. Lens considerations are not treatment
              recommendations.
            </p>
            <label className="field">
              <span>Approach</span>
              <select
                value={approach}
                onChange={(e) => setApproach(e.target.value as PrimaryTreatmentApproach)}
              >
                {APPROACH_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a === 'integrated-ta-emdr' ? 'Integrated' : PRIMARY_APPROACH_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
            <div className="pf-lens-considerations">
              <h3>Possible complementary lenses</h3>
              <ul>
                <li>
                  <strong>Transactional Analysis</strong> — Potentially useful when relational patterns,
                  scripts or ego-state dynamics are prominent.
                </li>
                <li>
                  <strong>Gestalt</strong> — Potentially useful when present-moment contact and unfinished
                  business are central.
                </li>
                <li>
                  <strong>EMDR</strong> — Potentially useful when adaptive information processing of
                  specific memories is indicated — only if you select it.
                </li>
              </ul>
              <p className="hint">These are clinical lens considerations, not recommendations.</p>
            </div>
            <button type="button" className="btn primary" disabled={busy} onClick={() => void saveApproachAndFinish()}>
              Save approach & continue
            </button>
          </section>
        )}

        {step === 'ready' && (
          <section className="pf-surface-card">
            <h2>Ready</h2>
            <p>
              {client?.displayName} is ready for clinical work.
              {approach !== 'unspecified' && (
                <>
                  {' '}
                  Current approach: <strong>{PRIMARY_APPROACH_LABELS[approach]}</strong>.
                </>
              )}
            </p>
            <div className="stack-btns horizontal wrap">
              <Link className="btn primary" to={`/clients/${clientId}?tab=preparation`}>
                Prepare Session
              </Link>
              <Link className="btn secondary" to={`/clients/${clientId}`}>
                Open Client Overview
              </Link>
            </div>
          </section>
        )}

        <div className="stack-btns horizontal wrap" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="btn ghost" disabled={busy} onClick={() => void saveLater()}>
            Save & Continue Later
          </button>
        </div>
      </main>
    </AppShell>
  );
}

function IntakeFindingsReview({
  findings,
  onChange,
}: {
  findings: IntakeExtractedFinding[];
  onChange: (f: IntakeExtractedFinding[]) => void;
}) {
  const sections: Array<{ id: string; title: string; cats: IntakeExtractedFinding['category'][] }> = [
    { id: 'presenting', title: 'Presenting Concerns', cats: ['presenting-problem', 'symptom', 'functional-impact'] },
    { id: 'life', title: 'Current Life', cats: ['trigger', 'support'] },
    { id: 'history', title: 'Relevant History', cats: ['significant-experience'] },
    { id: 'rel', title: 'Relationships', cats: ['relational-pattern'] },
    { id: 'res', title: 'Resources', cats: ['resource', 'strength'] },
    { id: 'risk', title: 'Risk / Clinical Review', cats: ['risk'] },
    { id: 'goals', title: 'Goals', cats: ['goal'] },
    { id: 'clarify', title: 'Still to Clarify', cats: ['outstanding', 'working-hypothesis'] },
  ];

  return (
    <div className="pf-intake-review" style={{ marginTop: '1.5rem' }}>
      <h3>Extracted findings</h3>
      <p className="hint">
        Possible clinical considerations and working hypotheses only — not diagnoses. Approve or edit
        each item.
      </p>
      {sections.map((sec) => {
        const items = findings.filter((f) => sec.cats.includes(f.category));
        if (!items.length) return null;
        return (
          <details key={sec.id} className="pf-intake-section" open>
            <summary>{sec.title}</summary>
            <ul className="pf-finding-list">
              {items.map((f) => (
                <li key={f.id}>
                  <div className="pf-finding-main">
                    <strong>{f.therapistEditedValue ?? f.text}</strong>
                    <span className="pf-meta">
                      {f.framing.replace(/-/g, ' ')}
                      {f.provenance.status === 'corroborated' ? ' · Already known / corroborated' : ''}
                      {f.provenance.status === 'conflict' ? ' · Possible update / conflict' : ''}
                    </span>
                    <span className="pf-meta">
                      Sources: {f.provenance.sourceTypes.join(', ')}
                    </span>
                  </div>
                  <div className="stack-btns horizontal wrap">
                    <button
                      type="button"
                      className="btn tertiary"
                      onClick={() =>
                        onChange(
                          findings.map((x) =>
                            x.id === f.id ? { ...x, reviewStatus: 'approved' } : x,
                          ),
                        )
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() =>
                        onChange(
                          findings.map((x) =>
                            x.id === f.id ? { ...x, reviewStatus: 'rejected' } : x,
                          ),
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function CoreSummary({ core }: { core: NonNullable<ClientRecord['coreFormulation']> }) {
  return (
    <div className="pf-core-summary" style={{ marginTop: '1rem' }}>
      <h3>INITIAL CLINICAL UNDERSTANDING</h3>
      <dl className="ci-kv">
        <dt>Presenting problems</dt>
        <dd>{core.presentingProblems.map((p) => p.text).join('; ') || '—'}</dd>
        <dt>Current patterns</dt>
        <dd>{(core.repeatingPatterns ?? []).map((p) => p.text).join('; ') || '—'}</dd>
        <dt>Relational patterns</dt>
        <dd>{(core.relationships ?? []).map((p) => p.text).join('; ') || '—'}</dd>
        <dt>Resources</dt>
        <dd>{(core.resources ?? []).map((p) => p.text).join('; ') || '—'}</dd>
        <dt>Working hypotheses</dt>
        <dd>{(core.workingHypotheses ?? []).map((p) => p.statement).join('; ') || '—'}</dd>
        <dt>Outstanding questions</dt>
        <dd>{(core.outstandingQuestions ?? []).map((p) => p.text).join('; ') || '—'}</dd>
        <dt>Therapeutic goals</dt>
        <dd>{(core.goals ?? []).map((p) => p.text).join('; ') || '—'}</dd>
      </dl>
    </div>
  );
}

function coreishToFindings(result: unknown, sourceId: string): IntakeExtractedFinding[] {
  const out: IntakeExtractedFinding[] = [];
  const r = result as Record<string, unknown>;
  const pushArr = (key: string, category: IntakeExtractedFinding['category'], textKey = 'text') => {
    const arr = r[key];
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      const text =
        typeof item === 'string'
          ? item
          : String((item as Record<string, unknown>)[textKey] ?? (item as Record<string, unknown>).statement ?? '');
      if (!text.trim()) continue;
      out.push({
        id: `ai_${category}_${Math.abs(hash(text)).toString(36)}`,
        category,
        text: text.trim(),
        framing:
          category === 'working-hypothesis'
            ? 'possible-working-hypothesis'
            : category === 'outstanding'
              ? 'information-requiring-clarification'
              : 'possible-clinical-consideration',
        provenance: {
          sourceIds: [sourceId],
          sourceTypes: ['intake'],
          status: 'single',
        },
        reviewStatus: 'pending',
      });
    }
  };
  pushArr('presentingProblems', 'presenting-problem');
  pushArr('symptoms', 'symptom');
  pushArr('currentTriggers', 'trigger');
  pushArr('significantExperiences', 'significant-experience', 'headline');
  pushArr('relationships', 'relational-pattern');
  pushArr('resources', 'resource');
  pushArr('strengths', 'strength');
  pushArr('goals', 'goal');
  pushArr('workingHypotheses', 'working-hypothesis', 'statement');
  pushArr('outstandingQuestions', 'outstanding');
  return out;
}

function mergeCoreArrays(
  prior: NonNullable<ClientRecord['coreFormulation']>,
  patch: Partial<NonNullable<ClientRecord['coreFormulation']>>,
) {
  const merge = <T extends { id: string }>(a: T[] = [], b: T[] = []) => {
    const map = new Map(a.map((x) => [x.id, x]));
    for (const x of b) map.set(x.id, x);
    return [...map.values()];
  };
  return {
    presentingProblems: merge(prior.presentingProblems, patch.presentingProblems),
    symptoms: merge(prior.symptoms, patch.symptoms),
    currentTriggers: merge(prior.currentTriggers, patch.currentTriggers),
    repeatingPatterns: merge(prior.repeatingPatterns, patch.repeatingPatterns),
    significantExperiences: merge(prior.significantExperiences, patch.significantExperiences),
    relationships: merge(prior.relationships, patch.relationships),
    resources: merge(prior.resources, patch.resources),
    strengths: merge(prior.strengths, patch.strengths),
    vulnerabilities: merge(prior.vulnerabilities, patch.vulnerabilities),
    goals: merge(prior.goals, patch.goals),
    workingHypotheses: merge(prior.workingHypotheses, patch.workingHypotheses),
    outstandingQuestions: merge(prior.outstandingQuestions, patch.outstandingQuestions),
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
