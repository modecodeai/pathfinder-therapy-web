import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TerrainLines } from "@/components/TerrainLines";

export const metadata: Metadata = {
  title: "Pathfinder Insights",
  description:
    "Thoughtful writing on understanding ourselves, relationships, trauma, growth, meaning, and the path towards living more freely.",
};

export default function InsightsPage() {
  return (
    <main className="min-h-screen bg-linen text-ink">
      <Header tone="dark" position="static" />
      <section className="relative min-h-[72vh] overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
        <TerrainLines className="right-[-14rem] top-12 h-[38rem] w-[52rem] text-moss" />
        <div className="relative mx-auto max-w-6xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-clay">
            Pathfinder Therapy
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-tight text-ink sm:text-7xl">
            Pathfinder Insights
          </h1>
          <p className="mt-8 max-w-3xl text-xl leading-9 text-ink/72 sm:text-2xl sm:leading-10">
            Thoughtful writing on understanding ourselves, relationships, trauma, growth, meaning,
            and the path towards living more freely.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
