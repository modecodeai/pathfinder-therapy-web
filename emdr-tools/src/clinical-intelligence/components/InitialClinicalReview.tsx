import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { ExtractedIntake, IntakeExtractionWarning } from '../lib/intakeExtraction';
import type { ClinicalEvidence } from '../lib/intakeSemanticEvidence';
import type { IntakeCoreFinding } from '../lib/intakeReasoning';
import {
  buildInitialClinicalReviewModel,
  countUnresolvedHighPriority,
  findingsEligibleForApproveAllConfirmed,
  type ClinicalReviewItem,
  type ReviewConfidenceLabel,
} from '../lib/initialClinicalBrief';
import {
  buildFirstSessionPreparation,
  firstSessionPreparationPlainText,
} from '../lib/firstSessionPrep';
import type { ClientRecord } from '../types';

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
      {finding && onApprove && (
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

function Section({
  title,
  children,
  onEditSection,
}: {
  title: string;
  children: ReactNode;
  onEditSection?: () => void;
}) {
  return (
    <section className="pf-icr-section">
      <div className="pf-icr-section-head">
        <h3>{title}</h3>
        {onEditSection && (
          <button type="button" className="btn ghost pf-icr-section-edit" onClick={onEditSection}>
            Edit section
          </button>
        )}
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
  onConfirmAndAnalyse,
  onFindingsChange,
  onSaveReview,
  onApproveAndPrepare,
  onMarkRiskReviewed,
  rawText,
}: {
  client: ClientRecord;
  extracted: ExtractedIntake | null;
  evidence: ClinicalEvidence[];
  findings: IntakeCoreFinding[];
  warnings: IntakeExtractionWarning[];
  busy: boolean;
  needsConfirm: boolean;
  onConfirmAndAnalyse: () => void;
  onFindingsChange: (next: IntakeCoreFinding[]) => void;
  onSaveReview: () => void;
  onApproveAndPrepare: () => void;
  onMarkRiskReviewed: () => void;
  rawText: string | null;
}) {
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

  const prepPreview = useMemo(() => {
    if (!findings.length) return '';
    const prep = buildFirstSessionPreparation(client, findings);
    return firstSessionPreparationPlainText(prep);
  }, [client, findings]);

  const unresolved = countUnresolvedHighPriority(findings);
  const eligibleIds = findingsEligibleForApproveAllConfirmed(findings);
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
    // Soft match by text/category for facts linked after corroboration
    const t = item.title.toLowerCase();
    return findings.find((f) => {
      const blob = `${f.text} ${f.clientStatement ?? ''}`.toLowerCase();
      if (item.kind === 'fact' && /anxiety/.test(t) && /anxiety/.test(blob) && f.category === 'symptom')
        return true;
      if (item.kind === 'fact' && /sleep/.test(t) && /sleep/.test(blob)) return true;
      if (item.kind === 'pattern' && blob.includes(t.slice(0, 20).toLowerCase())) return true;
      return false;
    });
  };

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

          {model.warningGroups.important.length > 0 && (
            <details className="pf-icr-warnings" open>
              <summary>Important to review ({model.warningGroups.important.length})</summary>
              <ul>
                {model.warningGroups.important.map((w) => (
                  <li key={w.key}>{w.message}</li>
                ))}
              </ul>
            </details>
          )}
          {model.warningGroups.formUnrecoverable.length > 0 && (
            <details className="pf-icr-warnings">
              <summary>
                Form responses not recoverable ({model.warningGroups.formUnrecoverable.length})
              </summary>
              <ul>
                {model.warningGroups.formUnrecoverable.map((w) => (
                  <li key={w.key}>{w.message}</li>
                ))}
              </ul>
            </details>
          )}
          {model.warningGroups.other.length > 0 && (
            <details className="pf-icr-warnings">
              <summary>Other ({model.warningGroups.other.length})</summary>
              <ul>
                {model.warningGroups.other.map((w) => (
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
                  onApprove={!needsConfirm ? approve : undefined}
                  onEdit={!needsConfirm ? edit : undefined}
                  onReject={!needsConfirm ? reject : undefined}
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

          <Section title="Patterns the client identifies">
            <p className="pf-meta">Client-identified patterns — not theoretical constructs.</p>
            <div className="pf-icr-grid">
              {model.patterns.map((item) => (
                <FactCard
                  key={item.id}
                  item={item}
                  finding={!needsConfirm ? matchFinding(item) : undefined}
                  onApprove={!needsConfirm ? approve : undefined}
                  onEdit={!needsConfirm ? edit : undefined}
                  onReject={!needsConfirm ? reject : undefined}
                />
              ))}
              {!model.patterns.length && (
                <p className="pf-icr-empty">Not established from available intake.</p>
              )}
            </div>
          </Section>

          <Section title="Resources & strengths">
            <div className="pf-icr-grid">
              {model.resources.map((item) => (
                <FactCard key={item.id} item={item} />
              ))}
            </div>
            {model.currentCosts.length > 0 && (
              <>
                <h4 className="pf-icr-subhead">Current costs / difficulties</h4>
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
                <button type="button" className="btn tertiary" onClick={onMarkRiskReviewed}>
                  Mark reviewed
                </button>
              )}
            </section>
          )}

          <Section title="Important questions / clarifications">
            <ul className="pf-icr-bullets">
              {model.clarifications.map((c) => (
                <li key={c.id}>{c.title}</li>
              ))}
            </ul>
          </Section>

          {!needsConfirm && model.hypotheses.length > 0 && (
            <Section title="Working hypotheses">
              <p className="pf-meta">Suggested only — visually separate from confirmed facts. No TA/EMDR language.</p>
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

          {!needsConfirm && prepPreview && (
            <section className="pf-icr-prep">
              <h3>First session preparation preview</h3>
              <p className="pf-meta">Updates as findings are approved or edited.</p>
              <pre className="pf-icr-prep-pre">{prepPreview}</pre>
            </section>
          )}

          <details className="pf-icr-raw">
            <summary>View original submission</summary>
            <pre>{rawText || 'No raw submission stored.'}</pre>
          </details>
        </div>

        <aside className="pf-icr-side">
          <div className="pf-icr-side-card">
            <h3>Review status</h3>
            <p className="pf-meta">
              {needsConfirm
                ? 'Awaiting confirmation of initial information'
                : `${findings.filter((f) => f.reviewStatus === 'approved' || f.reviewStatus === 'edited').length} approved · ${findings.filter((f) => f.reviewStatus === 'pending' || !f.reviewStatus).length} pending`}
            </p>
            {!needsConfirm && (
              <button
                type="button"
                className="btn tertiary"
                disabled={busy || !eligibleIds.length}
                onClick={approveAllConfirmed}
              >
                Approve all confirmed
              </button>
            )}
            <p className="pf-meta">
              Approves high-confidence facts only — not hypotheses, risk assumptions, or ambiguous items.
            </p>
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

          <div className="pf-icr-side-card">
            <h3>First-session readiness</h3>
            <p className="pf-meta">
              {needsConfirm
                ? 'Confirm information first'
                : unresolved > 0
                  ? `${unresolved} item${unresolved === 1 ? '' : 's'} still require clinical review`
                  : 'Ready to prepare first session'}
            </p>
          </div>
        </aside>
      </div>

      {!needsConfirm && (
        <div className="pf-icr-sticky" role="region" aria-label="Review actions">
          {unresolved > 0 && (
            <p className="pf-icr-sticky-note">
              {unresolved} item{unresolved === 1 ? '' : 's'} still require clinical review.
            </p>
          )}
          <div className="pf-icr-sticky-actions">
            <button type="button" className="btn tertiary" disabled={busy} onClick={onSaveReview}>
              Save review
            </button>
            <button type="button" className="btn primary" disabled={busy} onClick={onApproveAndPrepare}>
              {busy ? 'Saving…' : 'Approve confirmed & prepare first session'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
