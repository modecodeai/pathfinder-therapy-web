import { site } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink px-5 py-10 text-linen sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-lg">{site.name}</p>
        <p className="text-linen/72">
          Private therapy in Lisbon and online. © {new Date().getFullYear()} Pathfinder Therapy.
        </p>
      </div>
    </footer>
  );
}
