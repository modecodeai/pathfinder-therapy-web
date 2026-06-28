import Link from "next/link";
import { Compass } from "lucide-react";
import { nav } from "@/data/site";
import { Logo } from "./Logo";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="side-nav" aria-label="Main navigation">
        {nav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
      <Link href="/contact" className="side-button">Book a Consultation</Link>
      <div className="side-promise">
        <span />
        <p>Every interaction should help people understand themselves a little more than they did before.</p>
      </div>
      <div className="side-footer"><Compass size={18} /> Find your bearings.</div>
    </aside>
  );
}
