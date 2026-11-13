import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { ExtractedIntake, IntakeExtractionWarning } from '../lib/intakeExtraction';
import type { ClinicalEvidence } from '../lib/intakeSemanticEvidence';
import type { IntakeCoreFinding } from '../lib/intakeReasoning';
import {
  buildInitialClinicalReviewModel,
  countUnresolvedHighPriority,
  findingsEligibleForApproveAllConfirmed,
  reviewStatsWithEligible,
  type ClinicalReviewItem,
  type ReviewConfidenceLabel,
} from '../lib/initialClinicalBrief';
import {
  buildFirstSessionPreparation,
  firstSessionPreparationPlainText,
} from '../lib/firstSessionPrep';
import type { ClientRecord } from '../types';
import { PRIMARY_APPROACH_LABELS, type PrimaryTreatmentApproach } from '../clinicalReasoning';

function ConfidenceChip({ label }: { label: ReviewConfidenceLabel }) {
  const cls =
    label === 'Confirmed' || label === 'High confidence'
      ? 'pf-icr-chip is-confirmed'
      : label === 'Not established'
        ? 'pf-icr-chip is-unknown'
        : 'pf-icr-chip is-review';
  return <span className={cls}>{label}</span>;
}

function SourceToggle({ excerpt, field }: { excerpt?: string; field?: string }) {
  const [open, setOpen] = useState(false);
  if (!excerpt?.trim()) return null;
  return (
    <div className="pf-icr-source">
      <button type="button" className="pf-icr-source-btn" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide source' : 'View source'}
      </button>
      {open && (
        <blockquote className="pf-icr-source-quote">
          {field ? <span className="pf-meta">{field}</span> : null}
          <p>“{excerpt}”</p>
        </blockquote>
      )}
    </div>
  );
}

function FactCard({
  item,
  finding,
  showActions,
  onApprove,
  onEdit,
  onReject,
}: {
  item: ClinicalReviewItem;
  finding?: IntakeCoreFinding;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  const status = finding?.reviewStatus;
  return (
    <article className={`pf-icr-card pf-icr-fact${status === 'rejected' ? ' is-rejected' : ''}`}>
      <div className="pf-icr-card-head">
        <h4>{item.title}</h4>
        <ConfidenceChip label={item.confidence} />
      </div>
      <p className="pf-icr-card-body">{item.body}</p>
      {item.formSelectionNote && <p className="pf-icr-form-note">{item.formSelectionNote}</p>}
      <SourceToggle excerpt={item.sourceExcerpt} field={item.sourceField} />
      {showActions && finding && onApprove && (
        <div className="pf-icr-card-actions">
          <span className="pf-meta">
            Clinical record:{' '}
            {status === 'approved' || status === 'edited'
              ? 'Approved'
              : status === 'rejected'
                ? 'Rejected'
                : 'Pending'}
          </span>
          <button type="button" className="btn tertiary" onClick={() => onApprove(finding.id)}>
            Approve
          </button>
          {onEdit && (
            <button type="button" className="btn ghost" onClick={() => onEdit(finding.id)}>
              Edit
            </button>
          )}
          {onReject && (
            <button type="button" className="btn ghost" onClick={() => onReject(finding.id)}>
              Reject
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function HypothesisCard({
  item,
  finding,
  onApprove,
  onEdit,
  onReject,
}: {
  item: ClinicalReviewItem;
  finding?: IntakeCoreFinding;
  onApprove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  return (
    <article className="pf-icr-card pf-icr-hypothesis">
      <div className="pf-icr-card-head">
        <h4>{item.title}</h4>
        <span className="pf-icr-chip is-suggested">Suggested</span>
      </div>
      <p className="pf-icr-card-body">{item.body}</p>
      <SourceToggle excerpt={item.sourceExcerpt} field="Evidence" />
      {finding && onApprove && (
        <div className="pf-icr-card-actions">
          <button type="button" className="btn tertiary" onClick={() => onApprove(finding.id)}>
            Approve
          </button>
          {onEdit && (
            <button type="button" className="btn ghost" onClick={() => onEdit(finding.id)}>
              Edit
            </button>
          )}
          {onReject && (
            <button type="button" className="btn ghost" onClick={() => onReject(finding.id)}>
              Reject
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pf-icr-section">
      <div className="pf-icr-section-head">
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function InitialClinicalReview({
  client,
  extracted,
  evidence,
  findings,
  warnings,
  busy,
  needsConfirm,
  approach,
  onApproachChange,
  onConfirmAndAnalyse,
  onFindingsChange,
  onSaveReview,
  onApproveAndPrepare,
  onMarkRiskReviewed,
  onAddSafetyQuestion,
  rawText,
}: {
  client: ClientRecord;
  extracted: ExtractedIntake | null;
  evidence: ClinicalEvidence[];
  findings: IntakeCoreFinding[];
  warnings: IntakeExtractionWarning[];
  busy: boolean;
  needsConfirm: boolean;
  approach: PrimaryTreatmentApproach;
  onApproachChange: (a: PrimaryTreatmentApproach) => void;
  onConfirmAndAnalyse: () => void;
  onFindingsChange: (next: IntakeCoreFinding[]) => void;
  onSaveReview: () => void;
  onApproveAndPrepare: () => void;
  onMarkRiskReviewed: () => void;
  onAddSafetyQuestion: () => void;
  rawText: string | null;
}) {
  const [showIndividual, setShowIndividual] = useState(false);

  const model = useMemo(
    () =>
      buildInitialClinicalReviewModel({
        extracted,
        evidence,
        findings,
        warnings,
      }),
    [extracted, evidence, findings, warnings],
  );

  const stats = useMemo(() => reviewStatsWithEligible(findings), [findings]);
  const eligibleIds = useMemo(() => findingsEligibleForApproveAllConfirmed(findings), [findings]);
  const unresolved = countUnresolvedHighPriority(findings);
  const hasApproved = stats.approved > 0;
  const preparationApproved = Boolean(client.firstSessionPreparation) && client.intakeClinicalStatus === 'therapist-reviewed';

  /** Official prep from approved findings only */
  const approvedPrep = useMemo(() => {
    const approved = findings.filter((f) => f.reviewStatus === 'approved' || f.reviewStatus === 'edited');
    if (!approved.length) return '';
    return firstSessionPreparationPlainText(buildFirstSessionPreparation(client, approved));
  }, [client, findings]);

  /** Non-record preview: treat eligible + already approved as approved */
  const pendingPreview = useMemo(() => {
    if (!findings.length) return '';
    const eligible = new Set(eligibleIds);
    const simulated = findings.map((f) =>
      eligible.has(f.id) || f.reviewStatus === 'approved' || f.reviewStatus === 'edited'
        ? { ...f, reviewStatus: 'approved' as const }
        : f,
    );
    return firstSessionPreparationPlainText(buildFirstSessionPreparation(client, simulated));
  }, [client, findings, eligibleIds]);

  const findingById = useMemo(() => new Map(findings.map((f) => [f.id, f])), [findings]);

  const setStatus = (id: string, reviewStatus: IntakeCoreFinding['reviewStatus'], edited?: string) => {
    onFindingsChange(
      findings.map((f) =>
        f.id === id
          ? {
              ...f,
              reviewStatus,
              ...(edited != null ? { therapistEditedValue: edited } : {}),
            }
          : f,
      ),
    );
  };

  const approve = (id: string) => setStatus(id, 'approved');
  const reject = (id: string) => setStatus(id, 'rejected');
  const edit = (id: string) => {
    const f = findingById.get(id);
    if (!f) return;
    const next = window.prompt('Edit', f.therapistEditedValue ?? f.text);
    if (next == null) return;
    setStatus(id, 'edited', next);
  };

  const approveAllConfirmed = () => {
    const set = new Set(eligibleIds);
    onFindingsChange(
      findings.map((f) => (set.has(f.id) ? { ...f, reviewStatus: 'approved' as const } : f)),
    );
  };

  const matchFinding = (item: ClinicalReviewItem): IntakeCoreFinding | undefined => {
    if (item.findingId) return findingById.get(item.findingId);
    const t = item.title.toLowerCase();
    return findings.find((f) => {
      const blob = `${f.text} ${f.clientStatement ?? ''}`.toLowerCase();
      if (item.kind === 'fact' && /anxiety/.test(t) && /anxiety/.test(blob) && f.category === 'symptom') return true;
      if (item.kind === 'fact' && /sleep/.test(t) && /sleep/.test(blob)) return true;
      if (item.kind === 'pattern' && blob.includes(t.slice(0, 20).toLowerCase())) return true;
      return false;
    });
  };

  const importantWarnings = model.warningGroups.important.filter(
    (w) => w.code === 'truncated' || /trauma|abuse|risk|hopeless|femur/i.test(w.message + (w.fieldPath ?? '')),
  );
  const importNotes = [
    ...model.warningGroups.formUnrecoverable,
    ...model.warningGroups.other,
    ...model.warningGroups.important.filter((w) => !importantWarnings.some((i) => i.key === w.key)),
  ];

  const exceptionFindings = findings.filter(
    (f) =>
      (f.reviewStatus === 'pending' || !f.reviewStatus) &&
      f.category !== 'working-hypothesis' &&
      f.category !== 'risk-clinical-review' &&
      (f.category === 'outstanding-question' ||
        f.clinicalReviewRequired ||
        /source inconsistency|ambiguous|femur/i.test(f.text)),
  );

  return (
    <div className="pf-icr">
      <header className="pf-icr-header">
        <div>
          <p className="pf-icr-kicker">Intake</p>
          <h2>Initial Clinical Review</h2>
          <p className="pf-icr-subtitle">
            Review the client&apos;s initial information, clarify uncertain items, and approve what should inform
            the clinical record.
          </p>
        </div>
      </header>

      <div className="pf-icr-layout">
        <div className="pf-icr-main">
          <section className="pf-icr-brief" aria-label="Initial clinical brief">
            <h3>Initial clinical brief</h3>
            <p>{model.brief || 'Confirm initial information to generate a clinical brief.'}</p>
          </section>

          {importantWarnings.length > 0 && (
            <details className="pf-icr-warnings is-important" open>
              <summary>IMPORTANT TO REVIEW ({importantWarnings.length})</summary>
              <ul>
                {importantWarnings.map((w) => (
                  <li key={w.key}>{w.message}</li>
                ))}
              </ul>
            </details>
          )}
          {importNotes.length > 0 && (
            <details className="pf-icr-warnings is-import-notes">
              <summary>Import / form extraction notes ({importNotes.length})</summary>
              <ul>
                {importNotes.map((w) => (
                  <li key={w.key}>{w.message}</li>
                ))}
              </ul>
            </details>
          )}

          {needsConfirm && (
            <div className="pf-icr-confirm-banner">
              <p>
                Confirm this initial information to run clinical analysis. Form selections that could not be
                recovered remain Not established; narrative evidence is preserved separately.
              </p>
              <button type="button" className="btn primary" disabled={busy} onClick={onConfirmAndAnalyse}>
                {busy ? 'Analysing…' : 'Confirm initial information & analyse'}
              </button>
            </div>
          )}

          {!needsConfirm && findings.length > 0 && (
            <section className="pf-icr-bulk" aria-label="Review summary">
              <h3>
                {stats.total} findings
              </h3>
              <ul className="pf-icr-bulk-stats">
                <li>{stats.confirmedFacts} confirmed facts</li>
                <li>{stats.clinicalReviewItems} clinical-review items</li>
                <li>{stats.workingHypotheses} working hypotheses</li>
                <li>{stats.needClarification} need clarification</li>
              </ul>
              <div className="pf-icr-bulk-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={busy || !eligibleIds.length}
                  onClick={approveAllConfirmed}
                >
                  Approve all confirmed
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setShowIndividual((v) => !v)}
                >
                  {showIndividual ? 'Hide individual review' : 'Review individually'}
                </button>
              </div>
              <p className="pf-meta">
                Approves high-confidence facts only — not hypotheses, risk assumptions, or ambiguous items.
              </p>
            </section>
          )}

          <Section title="Current situation">
            {model.currentSituation.length ? (
              <ul className="pf-icr-bullets">
                {model.currentSituation.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="pf-icr-empty">Not established from available intake.</p>
            )}
          </Section>

          <Section title="What the client wants">
            {model.goals.length ? (
              <ul className="pf-icr-goal-list">
                {model.goals.map((g) => (
                  <li key={g.text}>
                    <span>{g.text}</span>
                    <SourceToggle excerpt={g.sourceExcerpt} field="Therapy goals" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pf-icr-empty">Not established from available intake.</p>
            )}
          </Section>

          <Section title="Current difficulties">
            <div className="pf-icr-grid">
              {model.difficulties.map((item) => (
                <FactCard
                  key={item.id}
                  item={item}
                  finding={!needsConfirm ? matchFinding(item) : undefined}
                  showActions={showIndividual && !needsConfirm}
                  onApprove={approve}
                  onEdit={edit}
                  onReject={reject}
                />
              ))}
              {!model.difficulties.length && (
                <p className="pf-icr-empty">Not established from available intake.</p>
              )}
            </div>
            {model.formVsEvidence.length > 0 && (
              <details className="pf-icr-form-vs">
                <summary>Form value vs clinical evidence</summary>
                <ul>
                  {model.formVsEvidence.map((row) => (
                    <li key={row.label}>
                      <strong>{row.label}</strong> — Clinical evidence: {row.clinical}. Original Yes/No:{' '}
                      {row.formValue}.
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Section>

          <Section title="Client-identified patterns">
            <p className="pf-meta">From the client&apos;s own description — not theoretical constructs.</p>
            <ul className="pf-icr-bullets">
              {model.patterns.map((item) => (
                <li key={item.id}>
                  {item.title}
                  <SourceToggle excerpt={item.sourceExcerpt} field={item.sourceField} />
                </li>
              ))}
              {!model.patterns.length && <li className="pf-icr-empty">Not established from available intake.</li>}
            </ul>
          </Section>

          <Section title="Resources & strengths">
            <div className="pf-icr-grid">
              {model.resources.map((item) => (
                <FactCard key={item.id} item={item} />
              ))}
              {model.selfDescribedQualities && (
                <article className="pf-icr-card pf-icr-fact">
                  <div className="pf-icr-card-head">
                    <h4>Self-described qualities</h4>
                    <ConfidenceChip label="High confidence" />
                  </div>
                  <p className="pf-icr-card-body">{model.selfDescribedQualities.display}</p>
                  <SourceToggle
                    excerpt={model.selfDescribedQualities.rawWords.join('\n')}
                    field="Five words describing self (raw)"
                  />
                </article>
              )}
            </div>
            {model.currentCosts.length > 0 && (
              <>
                <h4 className="pf-icr-subhead">Impact / current costs</h4>
                <div className="pf-icr-grid">
                  {model.currentCosts.map((item) => (
                    <FactCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section title="Important life context">
            <div className="pf-icr-grid">
              {model.lifeContext.map((item) => (
                <FactCard key={item.id} item={item} />
              ))}
              {!model.lifeContext.length && (
                <p className="pf-icr-empty">Not established from available intake.</p>
              )}
            </div>
          </Section>

          <Section title="Relationships">
            <div className="pf-icr-grid">
              {model.relationships.map((item) => (
                <FactCard key={item.id} item={item} />
              ))}
              {!model.relationships.length && (
                <p className="pf-icr-empty">Not established from available intake.</p>
              )}
            </div>
          </Section>

          <Section title="Significant experiences">
            <div className="pf-icr-grid">
              {model.significantExperiences.map((item) => (
                <FactCard key={item.id} item={item} />
              ))}
              {!model.significantExperiences.length && (
                <p className="pf-icr-empty">Not established from available intake.</p>
              )}
            </div>
          </Section>

          {model.ambiguities.map((item) => (
            <section key={item.id} className="pf-icr-ambiguity" aria-label="Ambiguity to clarify">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <SourceToggle excerpt={item.sourceExcerpt} field="Childhood / adolescent abuse section" />
            </section>
          ))}

          {model.riskPanel && (
            <section className="pf-icr-risk" aria-label="Clinical review required">
              <h3>Clinical review required</h3>
              <p>{model.riskPanel.reason}</p>
              <dl className="pf-icr-risk-dl">
                {model.riskPanel.items.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.status}</dd>
                  </div>
                ))}
              </dl>
              <p className="pf-meta">No risk tier is assigned from intake alone.</p>
              {!needsConfirm && (
                <div className="stack-btns horizontal wrap">
                  <button type="button" className="btn tertiary" onClick={onMarkRiskReviewed}>
                    Mark reviewed
                  </button>
                  <button type="button" className="btn ghost" onClick={onAddSafetyQuestion}>
                    Add to first-session questions
                  </button>
                </div>
              )}
            </section>
          )}

          <Section title="Important questions / clarifications">
            <ul className="pf-icr-bullets">
              {model.clarifications.map((c) => (
                <li key={c.id}>{c.title}</li>
              ))}
              {!model.clarifications.length && (
                <li className="pf-icr-empty">None outstanding from current intake.</li>
              )}
            </ul>
          </Section>

          {!needsConfirm && model.hypotheses.length > 0 && (
            <Section title="Working hypotheses">
              <p className="pf-meta">Suggested only — separate from confirmed facts. No TA/EMDR language.</p>
              <div className="pf-icr-grid">
                {model.hypotheses.map((item) => (
                  <HypothesisCard
                    key={item.id}
                    item={item}
                    finding={item.findingId ? findingById.get(item.findingId) : undefined}
                    onApprove={approve}
                    onEdit={edit}
                    onReject={reject}
                  />
                ))}
              </div>
            </Section>
          )}

          {!needsConfirm && exceptionFindings.length > 0 && (
            <Section title="Exceptions still pending">
              <p className="pf-meta">Review by exception — approve, edit, or reject these before relying on them in the record.</p>
              <div className="pf-icr-grid">
                {exceptionFindings.map((f) => (
                  <article key={f.id} className="pf-icr-card">
                    <div className="pf-icr-card-head">
                      <h4>{f.therapistEditedValue ?? f.text}</h4>
                      <span className="pf-icr-chip is-review">{f.category.replace(/-/g, ' ')}</span>
                    </div>
                    <div className="pf-icr-card-actions">
                      <button type="button" className="btn tertiary" onClick={() => approve(f.id)}>
                        Approve
                      </button>
                      <button type="button" className="btn ghost" onClick={() => edit(f.id)}>
                        Edit
                      </button>
                      <button type="button" className="btn ghost" onClick={() => reject(f.id)}>
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </Section>
          )}

          {!needsConfirm && (
            <section className="pf-icr-prep">
              {preparationApproved || (hasApproved && approvedPrep && !approvedPrep.includes('Not established from approved intake.')) ? (
                <>
                  <h3>Approved First Session Preparation</h3>
                  <p className="pf-meta">From approved clinical record items.</p>
                  <pre className="pf-icr-prep-pre">{approvedPrep || 'Approve confirmed facts to build preparation.'}</pre>
                </>
              ) : (
                <>
                  <h3>Preview from pending evidence</h3>
                  <p className="pf-icr-preview-banner">
                    Preview only — not yet part of the clinical record. Shows what First Session Preparation would
                    look like if current confirmed items were approved.
                  </p>
                  <pre className="pf-icr-prep-pre">{pendingPreview}</pre>
                </>
              )}
            </section>
          )}

          <details className="pf-icr-raw">
            <summary>View original submission</summary>
            <pre>{rawText || 'No raw submission stored.'}</pre>
          </details>
        </div>

        <aside className="pf-icr-side">
          <div className="pf-icr-side-card">
            <h3>First-session readiness</h3>
            <ul className="pf-icr-readiness">
              <li className="is-done">
                <span className="pf-icr-readiness-mark" aria-hidden="true">
                  ✓
                </span>
                Intake extracted
              </li>
              <li className={needsConfirm ? 'is-todo' : 'is-done'}>
                <span className="pf-icr-readiness-mark" aria-hidden="true">
                  {needsConfirm ? '○' : '✓'}
                </span>
                Core evidence identified
              </li>
              <li
                className={
                  eligibleIds.length > 0 && stats.approved === 0 ? 'is-todo' : 'is-done'
                }
              >
                <span className="pf-icr-readiness-mark" aria-hidden="true">
                  {eligibleIds.length > 0 && stats.approved === 0 ? '○' : '✓'}
                </span>
                {eligibleIds.length > 0 && stats.approved === 0
                  ? 'Confirmed facts awaiting approval'
                  : 'Confirmed facts'}
              </li>
              <li className={unresolved > 0 ? 'is-warn' : 'is-done'}>
                <span className="pf-icr-readiness-mark" aria-hidden="true">
                  {unresolved > 0 ? '⚠' : '✓'}
                </span>
                {unresolved > 0
                  ? `${unresolved} item${unresolved === 1 ? '' : 's'} require clinical review`
                  : 'Clinical review items addressed'}
              </li>
              <li className={preparationApproved ? 'is-done' : 'is-todo'}>
                <span className="pf-icr-readiness-mark" aria-hidden="true">
                  {preparationApproved ? '✓' : '○'}
                </span>
                {preparationApproved
                  ? 'First Session Preparation approved'
                  : 'First Session Preparation not yet approved'}
              </li>
            </ul>
            {!needsConfirm && (
              <button
                type="button"
                className="btn primary"
                style={{ marginTop: '0.65rem', width: '100%' }}
                disabled={busy || !eligibleIds.length}
                onClick={approveAllConfirmed}
              >
                Approve all confirmed
              </button>
            )}
          </div>

          <div className="pf-icr-side-card">
            <h3>Clinical approach</h3>
            <label className="field">
              <span>Current approach</span>
              <select
                value={approach}
                onChange={(e) => onApproachChange(e.target.value as PrimaryTreatmentApproach)}
              >
                {(
                  [
                    'unspecified',
                    'transactional-analysis',
                    'emdr',
                    'integrated-ta-emdr',
                    'general-integrative',
                    'pain',
                    'other',
                  ] as PrimaryTreatmentApproach[]
                ).map((a) => (
                  <option key={a} value={a}>
                    {a === 'integrated-ta-emdr' ? 'Integrated' : PRIMARY_APPROACH_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
            <p className="pf-meta" style={{ marginTop: '0.5rem' }}>
              Clinical lens status: Not yet applied to intake review.
              <br />
              Core formulation remains modality-neutral.
            </p>
            <button type="button" className="btn ghost" disabled title="Available after core approval — not from this screen">
              Run TA Lens After Core Approval
            </button>
          </div>

          <div className="pf-icr-side-card">
            <h3>Client details</h3>
            <dl className="pf-icr-details-dl">
              {model.clientDetails.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              {!model.clientDetails.length && <p className="pf-icr-empty">Not established</p>}
            </dl>
          </div>
        </aside>
      </div>

      {!needsConfirm && (
        <div className="pf-icr-sticky" role="region" aria-label="Review actions">
          <div className="pf-icr-sticky-actions">
            <button type="button" className="btn tertiary" disabled={busy} onClick={onSaveReview}>
              Save review
            </button>
            <button
              type="button"
              className="btn tertiary"
              disabled={busy || !eligibleIds.length}
              onClick={approveAllConfirmed}
            >
              Approve all confirmed
            </button>
            <button type="button" className="btn primary" disabled={busy} onClick={onApproveAndPrepare}>
              {busy ? 'Saving…' : 'Approve & prepare first session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
