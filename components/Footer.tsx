import Link from "next/link";
import { Logo } from "./Logo";
import { nav } from "@/data/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand"><Logo /><p>Creating the conditions in which people can understand themselves well enough to live more freely.</p></div>
      <div className="footer-links">{nav.map((n) => <Link key={n.href} href={n.href}>{n.label}</Link>)}</div>
      <div className="footer-links"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms & Conditions</Link><Link href="/faq">FAQs</Link><Link href="/crisis-support">Crisis Support</Link></div>
      <div className="footer-note">A space to understand.<div className="socials">◎ in ✉</div></div>
    </footer>
  );
}
