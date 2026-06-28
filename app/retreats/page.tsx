import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>Space away from the noise.</h1>
      <p>Future Pathfinder retreats will create reflective spaces in nature for pause, reconnection and growth.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
