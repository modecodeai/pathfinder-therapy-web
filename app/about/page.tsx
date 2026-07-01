import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata("/about/", "About | Pathfinder Therapy");

export default function Page() {
  return (
    <main className="simple-page">
      <Link href="/" className="back-link">← Pathfinder</Link>
      <p className="eyebrow">Pathfinder</p>
      <h1>Coming soon.</h1>
      <p>This page will follow the locked Pathfinder Design Language 1.0.</p>
    </main>
  );
}
