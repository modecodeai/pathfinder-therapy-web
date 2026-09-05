import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GuidedScriptStep, ScriptSize } from '../types/guidedScript';
import { SCRIPT_SIZE_PX } from '../types/guidedScript';
import { loadScriptSize, saveScriptSize } from '../lib/scriptSize';

interface Props {
  title: string;
  sourceLabel?: string;
  steps?: GuidedScriptStep[];
  /** Fallback when steps are empty — rendered as large readable text */
  plainText?: string;
  followMode?: boolean;
  onFollowModeChange?: (v: boolean) => void;
  autoScroll?: boolean;
  onAutoScrollChange?: (v: boolean) => void;
  stepIndex?: number;
  onStepIndexChange?: (i: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onRepeat?: () => void;
  onStartBls?: () => void;
  onStopBls?: () => void;
  onRecordResponse?: () => void;
  blsRunning?: boolean;
  toolbarExtra?: ReactNode;
  children?: ReactNode;
}

const TYPE_LABEL: Record<GuidedScriptStep['type'], string> = {
  say: 'SAY',
  'clinician-note': 'CLINICIAN NOTE',
  'bls-action': 'BLS',
  decision: 'DECISION POINT',
  capture: 'CAPTURE',
  warning: 'WARNING',
};

export function TherapistScriptPanel({
  title,
  sourceLabel,
  steps = [],
  plainText,
  followMode = false,
  onFollowModeChange,
  autoScroll = true,
  onAutoScrollChange,
  stepIndex = 0,
  onStepIndexChange,
  onPrev,
  onNext,
  onRepeat,
  onStartBls,
  onStopBls,
  onRecordResponse,
  blsRunning,
  toolbarExtra,
  children,
}: Props) {
  const [size, setSize] = useState<ScriptSize>(() => loadScriptSize());
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  const fontPx = SCRIPT_SIZE_PX[size];
  const safeIndex = steps.length ? Math.min(Math.max(0, stepIndex), steps.length - 1) : 0;

  const sizeButtons = useMemo(
    () =>
      (
        [
          ['small', 'S'],
          ['medium', 'M'],
          ['large', 'L'],
          ['xl', 'XL'],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`btn ghost script-size-btn${size === id ? ' is-active' : ''}`}
          onClick={() => {
            setSize(id);
            saveScriptSize(id);
          }}
          aria-pressed={size === id}
          title={`Script size ${id}`}
        >
          {label}
        </button>
      )),
    [size],
  );

  useEffect(() => {
    if (!followMode || !autoScroll || blsRunning) return;
    const el = activeRef.current;
    const vp = viewportRef.current;
    if (!el || !vp) return;
    const top = el.offsetTop - vp.clientHeight / 2 + el.clientHeight / 2;
    vp.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [safeIndex, followMode, autoScroll, blsRunning, steps.length]);

  return (
    <section className="therapist-script-panel" aria-label="Therapist script">
      <header className="therapist-script-head">
        <div>
          <h2>{title}</h2>
          {sourceLabel && (
            <p className="script-source">
              <span className="badge-protocol">Source</span> {sourceLabel}
            </p>
          )}
        </div>
        <div className="therapist-script-toolbar">
          <div className="script-size-group" role="group" aria-label="Script size">
            <span className="hint">Script size</span>
            {sizeButtons}
          </div>
          {onFollowModeChange && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={followMode}
                onChange={(e) => onFollowModeChange(e.target.checked)}
              />
              <span>Script Follow Mode</span>
            </label>
          )}
          {onAutoScrollChange && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => onAutoScrollChange(e.target.checked)}
                disabled={!followMode}
              />
              <span>Follow Script Automatically</span>
            </label>
          )}
          {toolbarExtra}
        </div>
      </header>

      {followMode && (
        <div className="script-follow-controls" role="toolbar" aria-label="Script follow controls">
          <button type="button" className="btn" onClick={onPrev} disabled={safeIndex <= 0}>
            Previous
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={onNext}
            disabled={steps.length === 0 || safeIndex >= steps.length - 1}
          >
            Next
          </button>
          <button type="button" className="btn ghost" onClick={onRepeat}>
            Repeat
          </button>
          {onStartBls && !blsRunning && (
            <button type="button" className="btn primary" onClick={onStartBls}>
              Start BLS
            </button>
          )}
          {onStopBls && blsRunning && (
            <button type="button" className="btn danger" onClick={onStopBls}>
              Stop BLS
            </button>
          )}
          {onRecordResponse && (
            <button type="button" className="btn" onClick={onRecordResponse}>
              Record Response
            </button>
          )}
          <span className="hint">
            Step {steps.length ? safeIndex + 1 : 0}/{steps.length}
            {' · '}← → · Space BLS · R record · Esc stop
          </span>
        </div>
      )}

      <div
        ref={viewportRef}
        className="therapist-script-viewport"
        style={{ fontSize: `${fontPx}px`, lineHeight: 1.62 }}
      >
        {steps.length > 0 ? (
          steps.map((step, i) => {
            const active = followMode && i === safeIndex;
            return (
              <article
                key={step.id}
                ref={active ? (el) => { activeRef.current = el; } : undefined}
                className={`script-step script-step-${step.type}${active ? ' is-active' : ''}`}
                onClick={() => onStepIndexChange?.(i)}
              >
                <span className="script-step-label">{TYPE_LABEL[step.type]}</span>
                <p className="script-step-text">{step.text}</p>
              </article>
            );
          })
        ) : plainText ? (
          <pre className="therapist-script-plain">{plainText}</pre>
        ) : (
          <p className="hint">No script loaded for this stage.</p>
        )}
        {children}
      </div>
    </section>
  );
}
