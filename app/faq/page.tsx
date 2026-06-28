import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="site-shell">
      <Sidebar />
      <main className="main simple-page">
        <p className="kicker">Pathfinder Therapy</p>
        <h1>Frequently Asked Questions</h1>
        <p>A simple place for common questions about therapy, online sessions, fees, and beginning.</p>
        <Link className="button" href="/contact">Book a Consultation</Link>
      </main>
      <Footer />
    </div>
  );
}
