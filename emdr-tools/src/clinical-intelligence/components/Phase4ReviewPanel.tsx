import type {
  ClinicalSuggestion,
  MemorySuggestion,
  Phase4DesensitisationAnalysis,
  ProcessingSequenceStep,
  ReviewStatus,
} from '../types';
import { CompactFindingCard } from './CompactFindingCard';

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
  const setList = (
    key: keyof Phase4DesensitisationAnalysis,
    id: string,
    status: ReviewStatus,
    edited?: string,
  ) => {
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
      <CompactFindingCard
        finding={result.summary.value}
        evidenceLevel={result.summary.evidenceLevel}
        confidence={result.summary.confidence}
        reviewStatus={result.summary.reviewStatus}
        evidence={result.summary.evidence}
        findingDelta={result.summary.findingDelta}
        meta="Summary"
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
        onViewEvidence={onHighlight}
      />

      <div className="ci-finding-section">
        <h3>Processing sequence (transcript order)</h3>
        <ol className="ci-processing-sequence">
          {result.sequence.map((step: ProcessingSequenceStep) => (
            <li key={step.id}>
              <CompactFindingCard
                finding={step.value}
                evidenceLevel={step.evidenceLevel}
                confidence={step.confidence}
                reviewStatus={step.reviewStatus}
                evidence={step.evidence}
                findingDelta={step.findingDelta}
                meta={`${step.order}. ${step.sequenceLabel} · ${step.category}${
                  step.timestamp ? ` · ${step.timestamp}` : ' · no clock time'
                }`}
                onStatus={(s, e) => setStep(step.id, s, e)}
                onViewEvidence={onHighlight}
              />
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
              <CompactFindingCard
                key={item.id}
                finding={item.value}
                evidenceLevel={item.evidenceLevel}
                confidence={item.confidence}
                reviewStatus={item.reviewStatus}
                evidence={item.evidence}
                findingDelta={item.findingDelta}
                onStatus={(s, e) => setList(key, item.id, s, e)}
                onViewEvidence={onHighlight}
              />
            ))}
          </div>
        );
      })}

      {!!result.newMemories.length && (
        <div className="ci-finding-section">
          <h3>New memories</h3>
          {result.newMemories.map((m: MemorySuggestion) => (
            <CompactFindingCard
              key={m.id}
              finding={m.headline}
              evidenceLevel={m.evidenceLevel}
              confidence={m.confidence}
              reviewStatus={m.reviewStatus}
              evidence={m.evidence}
              findingDelta={m.findingDelta}
              meta={[
                m.approximateAge != null ? `Age ~${m.approximateAge}` : null,
                m.description || null,
              ]
                .filter(Boolean)
                .join(' · ')}
              onStatus={(s, e) =>
                onChange({ ...result, newMemories: patchStatus(result.newMemories, m.id, s, e) })
              }
              onViewEvidence={onHighlight}
            />
          ))}
        </div>
      )}
    </div>
  );
}
