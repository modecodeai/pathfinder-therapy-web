import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>I'll walk alongside you.</h1>
      <p>I'm Brent. Pathfinder is built around understanding before judgement, relationship before technique, and the belief that people make sense.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
