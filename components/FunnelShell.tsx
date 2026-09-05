import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/data/site";

type FunnelShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  intro?: string;
};

export function FunnelShell({ children, eyebrow, title, intro }: FunnelShellProps) {
  return (
    <div className="funnel-shell">
      <header className="funnel-header">
        <Link href="/" className="brand-mark" aria-label="Pathfinder Therapy home">
          <span className="brand-symbol">P</span>
          <span className="brand-name">Pathfinder</span>
        </Link>
        <LeadCtaFallback />
      </header>

      <main className="funnel-main">
        <section className="funnel-intro">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {intro ? <p className="funnel-lead">{intro}</p> : null}
        </section>
        {children}
      </main>
    </div>
  );
}

function LeadCtaFallback() {
  return (
    <a className="funnel-header-cta" href={`tel:${site.phoneE164}`}>
      Call now
    </a>
  );
}
