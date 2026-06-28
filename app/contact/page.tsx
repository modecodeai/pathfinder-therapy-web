import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="site-shell">
      <Sidebar />
      <main className="main simple-page">
        <p className="kicker">Pathfinder Therapy</p>
        <h1>Begin therapy.</h1>
        <p>You do not need to have the answers before you begin. Curiosity is enough.</p>
        <Link className="button" href="/contact">Book a Consultation</Link>
      </main>
      <Footer />
    </div>
  );
}
