import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>Crisis support</h1>
      <p>Pathfinder Therapy is not an emergency service. If you are at immediate risk, contact local emergency services.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
