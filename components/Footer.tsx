import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <p>Pathfinder Therapy — Lisbon and online</p>
      <div>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/crisis-support">Crisis support</Link>
      </div>
    </footer>
  );
}
