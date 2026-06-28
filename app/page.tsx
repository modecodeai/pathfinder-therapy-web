import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="site-shell">
      <Sidebar />
      <main className="main-canvas">
        <section className="hero-panel" aria-labelledby="hero-title">
          <div className="hero-photo" />
          <div className="hero-shade" />
          <div className="terrain-lines" />
          <div className="hero-content">
            <p className="hero-overline">A space to understand</p>
            <h1 id="hero-title">Every life<br />leaves a trail.</h1>
            <div className="hero-rule" />
            <p className="hero-secondary">You don&apos;t need<br />to have the answers.</p>
            <p className="hero-soft">You don&apos;t even need to know the questions.</p>
            <Link href="#begin" className="scroll-cue" aria-label="Scroll to begin">
              <span>Scroll to begin</span>
              <ArrowDown size={18} />
            </Link>
          </div>
        </section>

        <section id="begin" className="editorial-section before-section">
          <p className="section-kicker">Before we begin</p>
          <div className="editorial-copy large-copy">
            <p>You don&apos;t need to know exactly what is wrong.</p>
            <p>You don&apos;t need to explain yourself perfectly.</p>
            <p>You don&apos;t need to arrive with certainty.</p>
            <p><strong>Curiosity is enough.</strong></p>
          </div>
          <p className="quiet-line">That is where therapy begins.</p>
        </section>

        <section className="split-story adapt-section">
          <div className="story-image story-image-one" />
          <div className="story-copy">
            <p className="section-kicker">The Pathfinder approach</p>
            <h2>We all adapt.</h2>
            <p>Some strive. Some withdraw. Some become responsible for everyone else. Some stop trusting. Some never stop thinking. Some simply keep going.</p>
            <p>None of these responses are signs that something is wrong with you.</p>
            <p>They are signs that, at one time, they helped.</p>
          </div>
        </section>

        <section className="dark-moment">
          <div className="dark-moment-inner">
            <p className="section-kicker bronze">Understanding creates freedom</p>
            <h2>What if nothing is wrong with you?</h2>
            <p>Perhaps your life simply taught you ways of surviving that no longer fit the life you&apos;re trying to live.</p>
            <p>Therapy is not about fixing you. It is about understanding yourself well enough to choose what comes next.</p>
          </div>
        </section>

        <section className="brent-section">
          <div className="brent-copy">
            <p className="section-kicker">About Brent</p>
            <h2>I&apos;ll walk alongside you.</h2>
            <p>I&apos;m Brent, a therapist working in Lisbon and online. My work is shaped by clinical training, lived experience and a grounded respect for the ways people adapt to difficult terrain.</p>
            <p>My role is not to tell you who to become. It is to help you understand yourself well enough to decide that for yourself.</p>
            <Link href="/about" className="text-arrow">More about Brent <ArrowUpRight size={18} /></Link>
          </div>
          <div className="brent-image" />
        </section>

        <section className="final-cta">
          <p className="section-kicker">Begin</p>
          <h2>Your journey begins here.</h2>
          <p>Not because life has fallen apart. Because you have become curious.</p>
          <Link href="/contact" className="primary-button">Book a consultation</Link>
        </section>
        <Footer />
      </main>
      <RightRail />
    </div>
  );
}
