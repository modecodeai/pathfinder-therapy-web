import Link from "next/link";
import { CompassMark } from "@/components/CompassMark";
import { navItems, site } from "@/data/site";

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-block">
        <Link href="/" className="brand-mark" aria-label="Pathfinder Therapy home">
          <span className="brand-symbol">P</span>
          <span className="brand-name">Pathfinder</span>
        </Link>
        <p className="brand-tagline">Find your bearings.</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </nav>

      <Link className="sidebar-cta" href="/contact">Book a consultation</Link>

      <p className="sidebar-philosophy">{site.description}</p>

      <div className="sidebar-bottom">
        <CompassMark />
        <div className="season-block">
          <span>Summer</span>
          <span>Portugal</span>
          <span>Est. 2023</span>
        </div>
      </div>
    </aside>
  );
}
