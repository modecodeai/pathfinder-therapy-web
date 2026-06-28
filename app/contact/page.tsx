import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>Begin therapy.</h1>
      <p>You do not need to have the answers before you begin. Curiosity is enough.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
