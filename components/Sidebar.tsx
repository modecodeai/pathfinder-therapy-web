import Link from "next/link";
import { navItems, site } from "@/data/site";
import { Compass } from "@/components/Compass";

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Pathfinder navigation">
      <div className="brand-block">
        <Link href="/" className="brand-mark" aria-label="Pathfinder Therapy home">
          <span className="brand-symbol">P</span>
          <span className="brand-name">Pathfinder</span>
        </Link>
        <p className="brand-line">Find your bearings.</p>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-lower">
        <Link href="/contact" className="sidebar-cta">Book a Consultation</Link>
        <p className="sidebar-philosophy">{site.description}</p>
        <Compass />
        <div className="seasonal">
          <span>Summer</span>
          <span>Portugal</span>
          <span>Est. 2026</span>
        </div>
      </div>
    </aside>
  );
}
