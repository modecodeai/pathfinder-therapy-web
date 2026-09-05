import { Hero } from "@/components/Hero";
import { RightRail } from "@/components/RightRail";
import { Sidebar } from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="arrival-shell">
      <Sidebar />
      <Hero />
      <RightRail />
      <section id="begin" className="mobile-begin" aria-label="Begin">
        <p>Before we begin</p>
        <h2>You don’t need to know exactly what is wrong.</h2>
        <p>Curiosity is enough. That is where therapy begins.</p>
      </section>
    </div>
  );
}
