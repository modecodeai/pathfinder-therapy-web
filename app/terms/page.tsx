import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>Terms</h1>
      <p>Website terms and practical information for Pathfinder Therapy.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
