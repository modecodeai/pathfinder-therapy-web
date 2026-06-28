import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>FAQ</h1>
      <p>Common questions about beginning therapy with Pathfinder.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
