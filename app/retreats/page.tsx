import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="site-shell">
      <Sidebar />
      <main className="main simple-page">
        <p className="kicker">Pathfinder Therapy</p>
        <h1>Step away. Recalibrate. Reconnect.</h1>
        <p>Future Pathfinder retreats will create reflective spaces in nature for pause, reconnection, and growth.</p>
        <Link className="button" href="/contact">Book a Consultation</Link>
      </main>
      <Footer />
    </div>
  );
}
