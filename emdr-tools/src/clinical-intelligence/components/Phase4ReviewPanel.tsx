import type {
  ClinicalSuggestion,
  MemorySuggestion,
  Phase4DesensitisationAnalysis,
  ProcessingSequenceStep,
  ReviewStatus,
  TranscriptEvidence,
} from '../types';
import { DeltaBadge, ReviewActions } from './ReviewShared';

function EvidenceList({
  evidence,
  onHighlight,
}: {
  evidence: TranscriptEvidence[];
  onHighlight: (excerpt: string) => void;
}) {
  if (!evidence?.length) return null;
  return (
    <ul className="ci-evidence-list">
      {evidence.map((e, i) => (
        <li key={i}>
          <button type="button" className="btn ghost" onClick={() => onHighlight(e.excerpt)}>
            “{e.excerpt}”{e.speaker ? ` (${e.speaker})` : ''}
          </button>
        </li>
      ))}
    </ul>
  );
}

function patchStatus<T extends { id: string; reviewStatus: ReviewStatus; value?: string; headline?: string }>(
  items: T[],
  id: string,
  status: ReviewStatus,
  edited?: string,
): T[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    if (status === 'edited') {
      return {
        ...item,
        reviewStatus: 'edited',
        originalAIValue: item.value ?? item.headline,
        therapistEditedValue: edited,
        ...(item.value !== undefined ? { value: edited ?? item.value } : {}),
        ...(item.headline !== undefined ? { headline: edited ?? item.headline } : {}),
      };
    }
    return { ...item, reviewStatus: status };
  });
}

interface Props {
  result: Phase4DesensitisationAnalysis;
  onChange: (next: Phase4DesensitisationAnalysis) => void;
  onHighlight: (excerpt: string) => void;
}

export function Phase4ReviewPanel({ result, onChange, onHighlight }: Props) {
  const setStep = (id: string, status: ReviewStatus, edited?: string) => {
    onChange({ ...result, sequence: patchStatus(result.sequence, id, status, edited) });
  };
  const setList = (key: keyof Phase4DesensitisationAnalysis, id: string, status: ReviewStatus, edited?: string) => {
    const arr = result[key];
    if (!Array.isArray(arr)) return;
    onChange({ ...result, [key]: patchStatus(arr as ClinicalSuggestion[], id, status, edited) });
  };

  return (
    <div className="ci-phase4-review">
      <p className="hint">
        Resolution status from AI: <strong>{result.resolutionStatus}</strong> (therapist-judged only —
        Clinical Intelligence will not declare a target resolved).
      </p>
      <article className={`ci-finding-card status-${result.summary.reviewStatus}`}>
        <header className="ci-finding-head">
          <h4>Summary</h4>
          <DeltaBadge delta={result.summary.findingDelta} />
        </header>
        <p>{result.summary.value}</p>
        <EvidenceList evidence={result.summary.evidence} onHighlight={onHighlight} />
        <ReviewActions
          status={result.summary.reviewStatus}
          onStatus={(s, e) =>
            onChange({
              ...result,
              summary: {
                ...result.summary,
                reviewStatus: s,
                ...(s === 'edited'
                  ? {
                      originalAIValue: result.summary.value,
                      therapistEditedValue: e,
                      value: e ?? result.summary.value,
                    }
                  : {}),
              },
            })
          }
        />
      </article>

      <div className="ci-finding-section">
        <h3>Processing sequence (transcript order)</h3>
        <ol className="ci-processing-sequence">
          {result.sequence.map((step: ProcessingSequenceStep) => (
            <li key={step.id} className={`ci-finding-card status-${step.reviewStatus}`}>
              <header className="ci-finding-head">
                <strong>
                  {step.order}. {step.sequenceLabel}
                </strong>
                <DeltaBadge delta={step.findingDelta} />
              </header>
              <p className="hint">
                {step.category}
                {step.timestamp ? ` · ${step.timestamp}` : ' · no clock time'}
              </p>
              <p>{step.value}</p>
              <EvidenceList evidence={step.evidence} onHighlight={onHighlight} />
              <ReviewActions status={step.reviewStatus} onStatus={(s, e) => setStep(step.id, s, e)} />
            </li>
          ))}
        </ol>
      </div>

      {(
        [
          ['associations', 'Associations'],
          ['adaptiveInformation', 'Adaptive information'],
          ['sudChanges', 'SUD changes'],
          ['feederMemories', 'Possible feeder memories'],
          ['blockingBeliefs', 'Possible blocking beliefs'],
          ['therapistInterventions', 'Therapist interventions'],
          ['imageThoughtEmotionBodyChanges', 'Image / thought / emotion / body changes'],
        ] as const
      ).map(([key, label]) => {
        const items = result[key] as ClinicalSuggestion[];
        if (!items.length) return null;
        return (
          <div className="ci-finding-section" key={key}>
            <h3>{label}</h3>
            {items.map((item) => (
              <article key={item.id} className={`ci-finding-card status-${item.reviewStatus}`}>
                <header className="ci-finding-head">
                  <p>{item.value}</p>
                  <DeltaBadge delta={item.findingDelta} />
                </header>
                <EvidenceList evidence={item.evidence} onHighlight={onHighlight} />
                <ReviewActions status={item.reviewStatus} onStatus={(s, e) => setList(key, item.id, s, e)} />
              </article>
            ))}
          </div>
        );
      })}

      {!!result.newMemories.length && (
        <div className="ci-finding-section">
          <h3>New memories</h3>
          {result.newMemories.map((m: MemorySuggestion) => (
            <article key={m.id} className={`ci-finding-card status-${m.reviewStatus}`}>
              <header className="ci-finding-head">
                <p>
                  <strong>{m.headline}</strong>
                  {m.approximateAge != null ? ` (age ~${m.approximateAge})` : ''}
                </p>
                <DeltaBadge delta={m.findingDelta} />
              </header>
              {m.description && <p>{m.description}</p>}
              <EvidenceList evidence={m.evidence} onHighlight={onHighlight} />
              <ReviewActions
                status={m.reviewStatus}
                onStatus={(s, e) =>
                  onChange({ ...result, newMemories: patchStatus(result.newMemories, m.id, s, e) })
                }
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
