const chapters = [
  {
    number: "01",
    title: "Understanding",
    body: "Our approach is evidence-based, experiential and deeply human.",
    image: "/images/approach.jpg",
    href: "/approach/",
  },
  {
    number: "02",
    title: "Working Together",
    body: "Therapy for individuals and couples.",
    image: "/images/therapy.jpg",
    href: "/therapy/",
  },
  {
    number: "03",
    title: "Retreat",
    body: "Time and space for deep change.",
    image: "/images/retreat.jpg",
    href: "/retreats/",
  },
  {
    number: "04",
    title: "Journal",
    body: "Reflections on life, therapy and what it means to grow.",
    image: "/images/journal.jpg",
    href: "/journal/",
  },
];

const navItems = ["Home", "Approach", "Therapy", "Retreats", "Journal", "About", "Contact"];

function Logo() {
  return (
    <div className="brand" aria-label="Pathfinder Therapy">
      <div className="brand-mark">P</div>
      <div className="brand-name">
        <span>Pathfinder</span>
        <em>Therapy</em>
      </div>
    </div>
  );
}

function Compass() {
  return (
    <div className="compass" aria-label="Compass showing north, east, south and west">
      <span className="north">N</span>
      <span className="east">E</span>
      <span className="south">S</span>
      <span className="west">W</span>
      <div className="rose">
        <div className="needle needle-vertical" />
        <div className="needle needle-horizontal" />
        <div className="needle needle-diagonal-a" />
        <div className="needle needle-diagonal-b" />
        <div className="rose-centre" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="arrival" id="top">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="terrain terrain-top" />
        <Logo />

        <div className="rule" />
        <p className="sidebar-tagline">Find your bearings.</p>

        <nav className="nav">
          {navItems.map((item) => (
            <a key={item} className={item === "Home" ? "active" : ""} href={item === "Home" ? "/" : `/${item.toLowerCase()}/`}>
              {item}
            </a>
          ))}
        </nav>

        <a className="consultation" href="/contact/">
          <span>Book a</span>
          <span>Consultation</span>
          <b>→</b>
        </a>

        <p className="promise">
          We create the conditions in which people can understand themselves well enough to live more freely.
        </p>

        <div className="sidebar-bottom">
          <Compass />
          <p>Summer · Portugal</p>
          <p>Est. 2023</p>
        </div>
      </aside>

      <section className="hero" aria-labelledby="arrival-heading">
        <div className="hero-bg" />
        <div className="hero-vignette" />
        <div className="hero-content">
          <h1 id="arrival-heading">Every life<br />leaves a trail.</h1>
          <div className="accent-line" />
          <p>You don’t need to have<br className="desktop-break" /> the answers.</p>
          <p>You don’t even need to<br className="desktop-break" /> know the questions.</p>
        </div>
        <div className="scroll-cue">
          <span>Scroll</span>
          <i />
          <b />
        </div>
      </section>

      <section className="chapter-rail" aria-label="Pathfinder chapters">
        {chapters.map((chapter) => (
          <a className="chapter" href={chapter.href} key={chapter.number}>
            <img src={chapter.image} alt="" aria-hidden="true" />
            <span className="chapter-shade" />
            <div className="chapter-copy">
              <span className="chapter-number">{chapter.number}</span>
              <h2>{chapter.title}</h2>
              <div className="small-line" />
              <p>{chapter.body}</p>
            </div>
            <span className="chapter-arrow">→</span>
          </a>
        ))}
      </section>

      <section className="mobile-intro" aria-label="Pathfinder introduction">
        <p>We create the conditions in which people can understand themselves well enough to live more freely.</p>
        <a href="/contact/">Book a consultation</a>
      </section>
    </main>
  );
}
