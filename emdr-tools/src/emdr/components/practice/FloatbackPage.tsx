import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TherapistScriptPanel } from '../../guided/components/TherapistScriptPanel';
import { FLOATBACK_CAUTION, FLOATBACK_STEPS } from '../../guided/lib/standardSession';

interface Association {
  id: string;
  experience: string;
  age: string;
  first?: boolean;
  worst?: boolean;
  potentialTarget?: boolean;
}

export function FloatbackPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [followMode, setFollowMode] = useState(true);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [draft, setDraft] = useState({ experience: '', age: '' });

  const add = () => {
    if (!draft.experience.trim()) return;
    setAssociations((prev) => [
      ...prev,
      { id: `${Date.now()}`, experience: draft.experience.trim(), age: draft.age.trim() },
    ]);
    setDraft({ experience: '', age: '' });
  };

  const patch = (id: string, partial: Partial<Association>) => {
    setAssociations((prev) => prev.map((a) => (a.id === id ? { ...a, ...partial } : a)));
  };

  return (
    <div className="companion companion-v3 app-shell guided-practice-page floatback-page">
      <header className="companion-top">
        <Link to="/practice/standard" className="brand">
          <span className="brand-mark" aria-hidden />
          <span>
            <strong>Pathfinder</strong> Floatback
          </span>
        </Link>
        <Link className="btn ghost" to="/practice/standard">
          Back to Standard
        </Link>
      </header>
      <div className="floatback-layout">
        <TherapistScriptPanel
          title="Floatback"
          sourceLabel="The Center for Excellence in EMDR Therapy — Appendix B / Part I (March 2026)"
          steps={FLOATBACK_STEPS}
          followMode={followMode}
          onFollowModeChange={setFollowMode}
          stepIndex={stepIndex}
          onStepIndexChange={setStepIndex}
          onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
          onNext={() => setStepIndex((i) => Math.min(i + 1, FLOATBACK_STEPS.length - 1))}
          onRepeat={() => setStepIndex((i) => i)}
        >
          <aside className="panel caution-panel" role="note">
            <h3>Clinical caution</h3>
            <p>{FLOATBACK_CAUTION.text}</p>
            <p className="hint">Do not automatically launch Floatback based on symptoms.</p>
          </aside>
        </TherapistScriptPanel>
        <section className="panel memory-map" aria-label="Memory map">
          <h2>Memory map</h2>
          <div className="guided-capture-grid">
            <label className="field">
              <span>Experience</span>
              <input
                value={draft.experience}
                onChange={(e) => setDraft((d) => ({ ...d, experience: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Age</span>
              <input
                value={draft.age}
                onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
              />
            </label>
            <button type="button" className="btn primary" onClick={add}>
              Add Association
            </button>
          </div>
          <ol className="memory-map-list">
            {associations.map((a, i) => (
              <li key={a.id}>
                <strong>
                  {i + 1}. {a.experience}
                </strong>
                {a.age && <span> · age {a.age}</span>}
                <div className="stack-btns horizontal wrap">
                  <button type="button" className="btn ghost" onClick={() => patch(a.id, { first: !a.first })}>
                    {a.first ? 'First ✓' : 'Mark First'}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => patch(a.id, { worst: !a.worst })}>
                    {a.worst ? 'Worst ✓' : 'Mark Worst'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => patch(a.id, { potentialTarget: !a.potentialTarget })}
                  >
                    {a.potentialTarget ? 'Potential target ✓' : 'Select as Potential Target'}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
