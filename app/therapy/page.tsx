import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>A space to understand.</h1>
      <p>Private therapy in Lisbon and online for English-speaking adults and couples seeking clarity, connection and meaningful change.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
