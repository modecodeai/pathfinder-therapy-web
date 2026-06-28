import Link from "next/link";
import { BookOpen, Compass, Heart, Mountain, Sprout } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <div className="site-shell">
        <Sidebar />
        <main className="main">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-content">
              <p className="overline">A space to understand.</p>
              <h1 id="hero-title">You don’t need<br />to have the answers.</h1>
              <div className="separator" />
              <p className="subline">You don’t even need to<br />know the questions.</p>
              <div className="separator" />
              <p className="trail">Every life leaves a trail.</p>
              <p className="body">Some paths bring us closer to ourselves. Others lead us away.</p>
              <p className="scroll">Scroll to begin <span>↓</span></p>
            </div>
          </section>

          <section className="intro" aria-labelledby="before-title">
            <div>
              <p className="kicker" id="before-title">Before we begin</p>
              <div className="separator" />
            </div>
            <div className="intro-copy">
              <p>You don’t need to know exactly what is wrong.<br />You don’t need to explain yourself perfectly.<br />You don’t need to arrive with certainty.<br />Curiosity is enough.</p>
              <p>That is where therapy begins.</p>
            </div>
          </section>

          <section className="work" aria-labelledby="work-title">
            <div className="work-image" />
            <div className="work-content">
              <div>
                <p className="kicker">What we do</p>
                <h2 id="work-title">Therapy. Retreats. Resources. For real life and meaningful change.</h2>
              </div>
              <div className="cards">
                <article className="card"><Sprout className="icon" /><h3>Therapy</h3><p>Individual and couples therapy tailored to you. A space to understand your patterns, heal, and grow.</p></article>
                <article className="card"><Mountain className="icon" /><h3>Retreats</h3><p>Immersive experiences in nature that create space for reflection, connection, and renewal.</p></article>
                <article className="card"><BookOpen className="icon" /><h3>Journal</h3><p>Thoughts, reflections, and guides to support you between sessions.</p></article>
              </div>
            </div>
          </section>

          <section className="cta-strip">
            <div className="cta-text"><span className="compass"><Compass size={24} /></span><span>Find your bearings.<br />We’ll walk alongside you.</span></div>
            <Link href="/contact" className="button">Book a Consultation</Link>
            <Link href="/approach" className="text-link">Learn More About Our Approach →</Link>
          </section>

          <section className="reflection">
            <div className="quote">
              <h2>“What if nothing is wrong with you?”</h2>
              <p>Perhaps your life simply taught you ways of surviving that no longer fit the life you’re trying to live.</p>
              <div className="separator" />
              <Link href="/approach" className="text-link">Learn more about our approach →</Link>
            </div>
            <div className="brent-copy">
              <p className="kicker">About Brent</p>
              <h2>Therapist. Veteran. Human.</h2>
              <p>Brent brings both professional expertise and lived experience to his work. He understands the impact of trauma, the importance of connection, and the courage it takes to change.</p>
              <Link href="/about" className="text-link">More about Brent →</Link>
            </div>
            <div className="brent-image" />
          </section>
        </main>
        <RightRail />
        <Footer />
      </div>
    </>
  );
}
