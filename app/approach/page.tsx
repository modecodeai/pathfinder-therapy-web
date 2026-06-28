import Link from "next/link";

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="section-kicker">Pathfinder Therapy</p>
      <h1>People make sense.</h1>
      <p>Every feeling, behaviour and relationship pattern has developed within the context of a life lived.</p>
      <Link href="/contact" className="primary-button">Book a consultation</Link>
    </main>
  );
}
