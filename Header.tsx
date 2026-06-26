import Link from "next/link";
import { navItems, site } from "@/data/site";
import { cn } from "@/lib/utils";

type HeaderProps = {
  tone?: "light" | "dark";
  position?: "absolute" | "static";
};

export function Header({ tone = "light", position = "absolute" }: HeaderProps) {
  const isLight = tone === "light";

  return (
    <header
      className={cn("inset-x-0 top-0 z-20", position === "absolute" ? "absolute" : "relative")}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <Link
          className={cn(
            "font-serif text-xl font-semibold tracking-normal transition",
            isLight ? "text-linen hover:text-white" : "text-ink hover:text-moss",
          )}
          href="/#top"
          aria-label="Pathfinder Therapy home"
        >
          {site.name}
        </Link>
        <nav
          className={cn(
            "hidden items-center gap-6 text-sm font-medium md:flex",
            isLight ? "text-linen/86" : "text-ink/72",
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={cn("transition", isLight ? "hover:text-white" : "hover:text-ink")}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            isLight
              ? "border-linen/50 text-linen hover:border-white hover:bg-white hover:text-ink"
              : "border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-linen",
          )}
          href="/#book"
        >
          Book a Consultation
        </Link>
      </div>
    </header>
  );
}
