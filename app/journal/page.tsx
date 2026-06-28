import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>Pathfinder Journal</h1>
      <p>Essays and reflections on adaptation, relationships, trauma, growth, meaning and living more freely.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
