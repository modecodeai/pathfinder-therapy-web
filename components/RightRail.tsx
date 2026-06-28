import Link from "next/link";
import { featurePanels } from "@/data/site";

export function RightRail() {
  return (
    <aside className="right-rail" aria-label="Pathfinder highlights">
      <div className="rail-top">A space to understand. <span className="hamb">☰</span></div>
      {featurePanels.map((panel) => (
        <Link className="rail-card" href={panel.href} key={panel.title}>
          <div className="rail-copy">
            <p className="kicker">{panel.kicker}</p>
            <h3>{panel.title}</h3>
            <p>{panel.body}</p>
            <span>Learn more →</span>
          </div>
          <div className="rail-image" style={{ backgroundImage: `url(${panel.image})` }} />
        </Link>
      ))}
      <div className="subscribe-panel">
        <p className="kicker">Stay connected</p>
        <p>Thoughtful reflections, resources and updates. No noise, just meaningful content to support your journey.</p>
        <form><input placeholder="Your email address" aria-label="Email address" /><button>Subscribe</button></form>
      </div>
    </aside>
  );
}
