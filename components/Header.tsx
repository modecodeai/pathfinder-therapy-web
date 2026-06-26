import { navItems, site } from "@/data/site";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <a
          className="font-serif text-xl font-semibold tracking-normal text-linen"
          href="#top"
          aria-label="Pathfinder Therapy home"
        >
          {site.name}
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-linen/86 md:flex">
          {navItems.map((item) => (
            <a key={item.href} className="transition hover:text-white" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a
          className="rounded-full border border-linen/50 px-4 py-2 text-sm font-semibold text-linen transition hover:border-white hover:bg-white hover:text-ink"
          href="#contact"
        >
          Enquire
        </a>
      </div>
    </header>
  );
}
