"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { appendAttributionToUrl } from "@/lib/lead-attribution";
import { trackLeadCtaClick } from "@/lib/analytics";

type LeadCtaLinkProps = {
  href: string;
  className?: string;
  label: string;
  children: ReactNode;
};

export function LeadCtaLink({ href, className, label, children }: LeadCtaLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const destination = appendAttributionToUrl(href);
    trackLeadCtaClick(label, destination);
    router.push(destination);
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
