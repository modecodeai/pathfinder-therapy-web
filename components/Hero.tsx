export function Hero() {
  return (
    <main className="hero-stage">
      <section className="hero-image" aria-label="Misty Portuguese mountain landscape at sunrise">
        <div className="sun" />
        <div className="ridge ridge-back" />
        <div className="ridge ridge-mid" />
        <div className="ridge ridge-front" />
        <div className="mist mist-one" />
        <div className="mist mist-two" />
        <div className="figure" aria-hidden="true" />
        <div className="contour contour-one" />
        <div className="contour contour-two" />
        <div className="hero-overlay" />
      </section>

      <section className="hero-copy" aria-labelledby="arrival-title">
        <p className="eyebrow">A space to understand.</p>
        <h1 id="arrival-title">Every life<br />leaves a trail.</h1>
        <div className="hero-rule" />
        <p className="hero-support">You don’t need to have the answers.</p>
        <p className="hero-support muted">You don’t even need to know the questions.</p>
        <p className="hero-body">Some paths bring us closer to ourselves. Others lead us away.</p>
        <a className="scroll-cue" href="#begin">Scroll to begin <span>↓</span></a>
      </section>
    </main>
  );
}
