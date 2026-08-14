import type {
  AssessmentTarget,
  CompanionSessionState,
  EMDRPhase,
} from '../types/emdr';

interface Props {
  phase: EMDRPhase;
  companion: CompanionSessionState;
  target: AssessmentTarget;
  onTarget: (p: Partial<AssessmentTarget>) => void;
  onCompanion: (p: Partial<CompanionSessionState>) => void;
  onBeginDesensitisation: () => void;
  why: string;
  whyOpen: boolean;
  onToggleWhy: () => void;
  stopSignalEstablished: boolean;
  onStopSignal: (v: boolean) => void;
  onFocusField: (f: 'sud' | 'voc' | 'nc' | null) => void;
  onOpenHelp: () => void;
  onSelectInfinity: () => void;
}

export function ClinicalPhasePanel(props: Props) {
  const { phase } = props;
  return (
    <div className="panel clinical-phase">
      {phase === 'history' && <HistoryPanel {...props} />}
      {phase === 'preparation' && <PreparationPanel {...props} />}
      {phase === 'assessment' && <AssessmentPanel {...props} />}
      {phase === 'desensitisation' && <DesensitisationPanel {...props} />}
      {phase === 'installation' && <InstallationPanel {...props} />}
      {phase === 'body-scan' && <BodyScanPanel {...props} />}
      {phase === 'closure' && <ClosurePanel {...props} />}
      {phase === 'reevaluation' && <ReevaluationPanel {...props} />}
      {phase === 'future-template' && <FutureTemplatePanel {...props} />}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onFocus,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  multiline?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} />
      )}
    </label>
  );
}

function Scale({
  label,
  min,
  max,
  value,
  onChange,
  onFocus,
}: {
  label: string;
  min: number;
  max: number;
  value?: number;
  onChange: (v: number) => void;
  onFocus?: () => void;
}) {
  return (
    <div className="scale-block" onFocus={onFocus}>
      <span>{label}</span>
      <div className="scale-btns">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <button
            key={n}
            type="button"
            className={value === n ? 'chip is-active' : 'chip'}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ companion, onCompanion, onOpenHelp }: Props) {
  return (
    <>
      <h2>History & treatment planning</h2>
      <Field
        label="Presenting issue"
        value={companion.presentingIssue ?? ''}
        onChange={(v) => onCompanion({ presentingIssue: v })}
        multiline
      />
      <Field
        label="Therapy goal"
        value={companion.therapyGoal ?? ''}
        onChange={(v) => onCompanion({ therapyGoal: v })}
      />
      <h3>AIP Past → Present → Future</h3>
      <Field
        label="Past"
        value={companion.aipPast ?? ''}
        onChange={(v) => onCompanion({ aipPast: v })}
        multiline
      />
      <Field
        label="Present"
        value={companion.aipPresent ?? ''}
        onChange={(v) => onCompanion({ aipPresent: v })}
        multiline
      />
      <Field
        label="Future"
        value={companion.aipFuture ?? ''}
        onChange={(v) => onCompanion({ aipFuture: v })}
        multiline
      />
      <Field
        label="Target map notes"
        value={companion.target.memory ?? ''}
        onChange={(v) => onCompanion({ target: { ...companion.target, memory: v } })}
        multiline
      />
      <button type="button" className="btn" onClick={onOpenHelp}>
        Help & Scripts
      </button>
    </>
  );
}

function PreparationPanel({
  companion,
  onCompanion,
  stopSignalEstablished,
  onStopSignal,
  onOpenHelp,
}: Props) {
  return (
    <>
      <h2>Preparation</h2>
      <p className="hint">Orientation · stop signal · Safe/Calm State · Container · readiness</p>
      <label className="toggle block">
        <input
          type="checkbox"
          checked={stopSignalEstablished}
          onChange={(e) => onStopSignal(e.target.checked)}
        />
        <span>Stop signal established</span>
      </label>
      <Field
        label="Readiness notes"
        value={companion.readinessNotes ?? ''}
        onChange={(v) => onCompanion({ readinessNotes: v })}
        multiline
      />
      <p className="hint">Resource / Stabilisation — Slower · approximately 8 passes</p>
      <button type="button" className="btn" onClick={onOpenHelp}>
        Open Safe/Calm Place & Container help
      </button>
    </>
  );
}

function AssessmentPanel({
  target,
  onTarget,
  onBeginDesensitisation,
  onFocusField,
  onOpenHelp,
}: Props) {
  return (
    <>
      <h2>Target memory assessment</h2>
      <Field
        label="Target memory / event"
        value={target.title ?? target.memory ?? ''}
        onChange={(v) => onTarget({ title: v, memory: v })}
      />
      <Field label="Image" value={target.image ?? ''} onChange={(v) => onTarget({ image: v })} />
      <Field
        label="Negative Cognition"
        value={target.negativeCognition ?? ''}
        onChange={(v) => onTarget({ negativeCognition: v })}
        onFocus={() => {
          onFocusField('nc');
          onOpenHelp();
        }}
      />
      <Field
        label="Positive Cognition"
        value={target.positiveCognition ?? ''}
        onChange={(v) => onTarget({ positiveCognition: v })}
      />
      <Scale
        label="VOC 1–7"
        min={1}
        max={7}
        value={target.currentVOC ?? target.initialVOC}
        onChange={(v) => onTarget({ currentVOC: v, initialVOC: target.initialVOC ?? v })}
        onFocus={() => {
          onFocusField('voc');
          onOpenHelp();
        }}
      />
      <Field label="Emotion" value={target.emotion ?? ''} onChange={(v) => onTarget({ emotion: v })} />
      <Scale
        label="SUD 0–10"
        min={0}
        max={10}
        value={target.currentSUD ?? target.initialSUD}
        onChange={(v) => onTarget({ currentSUD: v, initialSUD: target.initialSUD ?? v })}
        onFocus={() => {
          onFocusField('sud');
          onOpenHelp();
        }}
      />
      <Field
        label="Body location / sensation"
        value={target.bodyLocation ?? ''}
        onChange={(v) => onTarget({ bodyLocation: v })}
      />
      <p className="hint ok">Assessment complete — target network activated when ready</p>
      <button type="button" className="btn primary large" onClick={onBeginDesensitisation}>
        Begin Desensitisation
      </button>
    </>
  );
}

function DesensitisationPanel({ target, onTarget, onFocusField, onOpenHelp }: Props) {
  return (
    <>
      <h2>Current target</h2>
      <p>
        <strong>Image:</strong> {target.image || '—'}
      </p>
      <p>
        <strong>NC:</strong> {target.negativeCognition || '—'}
      </p>
      <p>
        <strong>Initial SUD:</strong> {target.initialSUD ?? '—'}
      </p>
      <h3>Current processing</h3>
      <Field
        label="Current association"
        value={target.memory ?? ''}
        onChange={(v) => onTarget({ memory: v })}
      />
      <Scale
        label="Current SUD"
        min={0}
        max={10}
        value={target.currentSUD}
        onChange={(v) => onTarget({ currentSUD: v })}
        onFocus={() => {
          onFocusField('sud');
          onOpenHelp();
        }}
      />
    </>
  );
}

function InstallationPanel({ target, onTarget, onFocusField, onOpenHelp }: Props) {
  return (
    <>
      <h2>Installation</h2>
      <p>
        <strong>Target:</strong> {target.image || target.title || '—'}
      </p>
      <Field
        label="Positive Cognition"
        value={target.positiveCognition ?? ''}
        onChange={(v) => onTarget({ positiveCognition: v })}
      />
      <Scale
        label="VOC 1–7"
        min={1}
        max={7}
        value={target.currentVOC}
        onChange={(v) => onTarget({ currentVOC: v })}
        onFocus={() => {
          onFocusField('voc');
          onOpenHelp();
        }}
      />
      <label className="toggle block">
        <input
          type="checkbox"
          checked={!!target.ecologicalVOC}
          onChange={(e) => onTarget({ ecologicalVOC: e.target.checked })}
        />
        <span>Ecologically appropriate</span>
      </label>
      <p className="hint">Do not automatically mark complete at VOC 7.</p>
    </>
  );
}

function BodyScanPanel({ target, onTarget }: Props) {
  return (
    <>
      <h2>Body Scan</h2>
      <p>
        <strong>Target:</strong> {target.image || target.title || '—'}
      </p>
      <p>
        <strong>PC:</strong> {target.positiveCognition || '—'}
      </p>
      <Field
        label="Body sensation"
        value={target.bodyLocation ?? ''}
        onChange={(v) => onTarget({ bodyLocation: v })}
      />
      <div className="chip-grid">
        {['Clear / neutral', 'Positive sensation', 'Residual disturbance', 'New material'].map(
          (label) => (
            <button
              key={label}
              type="button"
              className="chip"
              onClick={() => onTarget({ bodyLocation: label })}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <p className="hint">Residual disturbance may warrant further BLS — therapist decides.</p>
    </>
  );
}

function ClosurePanel({ companion, onCompanion, onSelectInfinity, onOpenHelp }: Props) {
  return (
    <>
      <h2>Closure</h2>
      <div className="segmented">
        <button
          type="button"
          className={companion.closurePath === 'completed' ? 'is-active' : ''}
          onClick={() => onCompanion({ closurePath: 'completed' })}
        >
          Completed target
        </button>
        <button
          type="button"
          className={companion.closurePath === 'incomplete' ? 'is-active' : ''}
          onClick={() => onCompanion({ closurePath: 'incomplete' })}
        >
          Incomplete session
        </button>
      </div>
      {companion.closurePath === 'incomplete' && (
        <>
          <p className="hint">
            Do not force SUD to zero because time has ended. Options: grounding, Safe/Calm State,
            Container, Infinity, manual BLS, or no BLS.
          </p>
          <div className="stack-btns">
            <button type="button" className="btn primary" onClick={onSelectInfinity}>
              Infinity / De-arousal
            </button>
            <button type="button" className="btn" onClick={onOpenHelp}>
              Incomplete closure help
            </button>
          </div>
        </>
      )}
      {companion.closurePath === 'completed' && (
        <button type="button" className="btn" onClick={onOpenHelp}>
          Completed closure help
        </button>
      )}
    </>
  );
}

function ReevaluationPanel({ target, onTarget, onFocusField, onOpenHelp }: Props) {
  return (
    <>
      <h2>Reevaluation</h2>
      <h3>Target-specific</h3>
      <Scale
        label="SUD"
        min={0}
        max={10}
        value={target.currentSUD}
        onChange={(v) => onTarget({ currentSUD: v })}
        onFocus={() => {
          onFocusField('sud');
          onOpenHelp();
        }}
      />
      <Scale
        label="VOC"
        min={1}
        max={7}
        value={target.currentVOC}
        onChange={(v) => onTarget({ currentVOC: v })}
      />
      <Field
        label="Body response / new associations"
        value={target.bodyLocation ?? ''}
        onChange={(v) => onTarget({ bodyLocation: v })}
      />
      <h3>Global</h3>
      <Field
        label="Changes since last session"
        value={target.memory ?? ''}
        onChange={(v) => onTarget({ memory: v })}
        multiline
      />
      <p className="hint">Therapist decides next step — resume processing, present triggers, Future Template, or another target.</p>
    </>
  );
}

function FutureTemplatePanel({ target, onTarget }: Props) {
  return (
    <>
      <h2>Future Template</h2>
      <Field
        label="Future situation"
        value={target.title ?? ''}
        onChange={(v) => onTarget({ title: v })}
      />
      <Field
        label="Desired response"
        value={target.memory ?? ''}
        onChange={(v) => onTarget({ memory: v })}
      />
      <Field
        label="Positive Cognition"
        value={target.positiveCognition ?? ''}
        onChange={(v) => onTarget({ positiveCognition: v })}
      />
      <Scale
        label="VOC 1–7"
        min={1}
        max={7}
        value={target.currentVOC}
        onChange={(v) => onTarget({ currentVOC: v })}
      />
      <p className="hint">
        Continuous BLS available. If significant disturbance emerges, consider separate assessment.
      </p>
    </>
  );
}
