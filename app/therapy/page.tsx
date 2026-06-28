import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="site-shell">
      <Sidebar />
      <main className="main simple-page">
        <p className="kicker">Pathfinder Therapy</p>
        <h1>A space to explore. A path to clarity.</h1>
        <p>Private therapy in Lisbon and online for English-speaking adults and couples seeking clarity, connection, and meaningful change.</p>
        <Link className="button" href="/contact">Book a Consultation</Link>
      </main>
      <Footer />
    </div>
  );
}
