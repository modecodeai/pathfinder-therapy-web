import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { chapters } from "@/data/site";

export function RightRail() {
  return (
    <aside className="right-rail" aria-label="Pathfinder chapters">
      <div className="rail-heading">
        <span>Chapters</span>
        <span>01—04</span>
      </div>
      <div className="chapter-list">
        {chapters.map((chapter) => (
          <Link href={chapter.href} className="chapter" key={chapter.number}>
            <div className="chapter-image-wrap">
              <Image src={chapter.image} alt="" width={500} height={320} className="chapter-image" />
            </div>
            <div className="chapter-copy">
              <span className="chapter-number">{chapter.number}</span>
              <h2>{chapter.title}</h2>
              <p>{chapter.body}</p>
            </div>
            <ArrowUpRight className="chapter-arrow" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </aside>
  );
}
