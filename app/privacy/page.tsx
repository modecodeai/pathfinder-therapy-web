import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>Privacy</h1>
      <p>Privacy information for Pathfinder Therapy clients and website visitors.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
