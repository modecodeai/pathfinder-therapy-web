import type {
  ClinicalSuggestion,
  CognitionSuggestion,
  Phase3AssessmentAnalysis,
  ReviewStatus,
} from '../types';
import { CompactFindingCard } from './CompactFindingCard';
import { NotEstablished } from './ReviewShared';

function FieldCard({
  title,
  item,
  onStatus,
  onHighlight,
  extra,
}: {
  title: string;
  item: ClinicalSuggestion | CognitionSuggestion | null;
  onStatus: (status: ReviewStatus, edited?: string) => void;
  onHighlight: (excerpt: string) => void;
  extra?: string;
}) {
  if (!item) return <NotEstablished label={title} />;
  return (
    <CompactFindingCard
      finding={`${title}: ${item.value}`}
      evidenceLevel={item.evidenceLevel}
      confidence={item.confidence}
      reviewStatus={item.reviewStatus}
      evidence={item.evidence}
      findingDelta={item.findingDelta}
      onStatus={onStatus}
      onViewEvidence={onHighlight}
      meta={
        [
          extra,
          'kind' in item ? `${item.kind} · ${item.polarity}` : null,
        ]
          .filter(Boolean)
          .join(' · ') || undefined
      }
    />
  );
}

interface Props {
  result: Phase3AssessmentAnalysis;
  onChange: (next: Phase3AssessmentAnalysis) => void;
  onHighlight: (excerpt: string) => void;
}

export function Phase3ReviewPanel({ result, onChange, onHighlight }: Props) {
  const patchField = (
    key: keyof Phase3AssessmentAnalysis,
    status: ReviewStatus,
    edited?: string,
  ) => {
    const current = result[key];
    if (!current || typeof current !== 'object' || !('reviewStatus' in current)) return;
    const field = current as ClinicalSuggestion;
    onChange({
      ...result,
      [key]: {
        ...field,
        reviewStatus: status,
        ...(status === 'edited'
          ? {
              originalAIValue: field.value,
              therapistEditedValue: edited,
              value: edited ?? field.value,
            }
          : {}),
      },
    });
  };

  return (
    <div className="ci-phase3-review">
      <FieldCard
        title="Summary"
        item={result.summary}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('summary', s, e)}
      />
      <FieldCard
        title="Target"
        item={result.target}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('target', s, e)}
      />
      <FieldCard
        title="Worst part"
        item={result.worstPart}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('worstPart', s, e)}
      />
      <FieldCard
        title="Image"
        item={result.image}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('image', s, e)}
      />
      <FieldCard
        title="Negative Cognition"
        item={result.negativeCognition}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('negativeCognition', s, e)}
      />
      <FieldCard
        title="Positive Cognition"
        item={result.positiveCognition}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('positiveCognition', s, e)}
      />
      {result.vocNumeric == null ? (
        <NotEstablished label="VoC" />
      ) : (
        <FieldCard
          title="VoC"
          item={result.voc}
          extra={`Numeric VoC (explicit only): ${result.vocNumeric}`}
          onHighlight={onHighlight}
          onStatus={(s, e) => patchField('voc', s, e)}
        />
      )}
      <FieldCard
        title="Emotion"
        item={result.emotion}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('emotion', s, e)}
      />
      {result.sudNumeric == null ? (
        <NotEstablished label="SUD" />
      ) : (
        <FieldCard
          title="SUD"
          item={result.sud}
          extra={`Numeric SUD (explicit only): ${result.sudNumeric}`}
          onHighlight={onHighlight}
          onStatus={(s, e) => patchField('sud', s, e)}
        />
      )}
      <FieldCard
        title="Body location"
        item={result.bodyLocation}
        onHighlight={onHighlight}
        onStatus={(s, e) => patchField('bodyLocation', s, e)}
      />
      {!!result.unansweredQuestions.length && (
        <div className="ci-finding-section">
          <h3>Information still needed</h3>
          <ul className="ci-needed-list">
            {result.unansweredQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
