import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";

export default function Page() {
  return (
    <div className="site-shell">
      <Sidebar />
      <main className="main simple-page">
        <p className="kicker">Pathfinder Therapy</p>
        <h1>Therapist. Veteran. Human.</h1>
        <p>Brent brings clinical training, lived experience, and a grounded respect for the ways people adapt to difficult terrain.</p>
        <Link className="button" href="/contact">Book a Consultation</Link>
      </main>
      <Footer />
    </div>
  );
}
