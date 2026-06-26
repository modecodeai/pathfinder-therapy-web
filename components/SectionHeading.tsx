import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  text?: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, text, className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-clay">{eyebrow}</p>
      <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {text ? <p className="mt-5 text-lg leading-8 text-ink/72">{text}</p> : null}
    </div>
  );
}
