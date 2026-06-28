import Link from "next/link";
import { chapters } from "@/data/site";

export function RightRail() {
  return (
    <aside className="right-rail" aria-label="Pathfinder chapters">
      <div className="rail-header">
        <span>Chapters</span>
        <span>Arrival</span>
      </div>
      <div className="chapter-stack">
        {chapters.map((chapter) => (
          <Link href={chapter.href} className="chapter" key={chapter.number}>
            <div className="chapter-image" data-tone={chapter.tone} />
            <div className="chapter-copy">
              <span>{chapter.number}</span>
              <h2>{chapter.title}</h2>
              <p>{chapter.text}</p>
            </div>
            <span className="chapter-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
