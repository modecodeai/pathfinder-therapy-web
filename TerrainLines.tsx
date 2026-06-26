import { cn } from "@/lib/utils";

type TerrainLinesProps = {
  className?: string;
};

export function TerrainLines({ className }: TerrainLinesProps) {
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute text-current", className)}
      viewBox="0 0 820 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M34 348C95 267 176 230 276 237C379 245 436 313 536 319C637 325 704 276 786 187" stroke="currentColor" strokeWidth="1.4" opacity="0.22" />
      <path d="M70 408C139 319 204 289 296 298C392 307 444 374 542 378C633 383 708 331 776 263" stroke="currentColor" strokeWidth="1.4" opacity="0.2" />
      <path d="M103 471C162 389 232 351 322 361C416 371 472 429 568 427C652 425 715 382 785 319" stroke="currentColor" strokeWidth="1.4" opacity="0.18" />
      <path d="M7 285C78 205 151 169 250 173C357 178 421 244 520 251C627 258 699 213 813 93" stroke="currentColor" strokeWidth="1.4" opacity="0.17" />
      <path d="M161 537C217 468 282 428 365 435C457 443 503 496 592 493C675 490 729 448 809 384" stroke="currentColor" strokeWidth="1.4" opacity="0.14" />
      <circle cx="649" cy="174" r="58" stroke="currentColor" strokeWidth="1.2" opacity="0.16" />
      <circle cx="649" cy="174" r="24" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />
      <path d="M649 105L662 174L649 243L636 174L649 105Z" stroke="currentColor" strokeWidth="1.2" opacity="0.2" />
    </svg>
  );
}
