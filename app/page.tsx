import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionHeading } from "@/components/SectionHeading";
import { principles, site, supportThemes } from "@/data/site";

export default function Home() {
  return (
    <main id="top" className="min-h-screen bg-linen text-ink">
      <section className="relative min-h-[92vh] overflow-hidden bg-ink">
        <Image
          src="/pathfinder-therapy-room.png"
          alt="A calm therapy room in Lisbon with chairs and natural daylight"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/62 to-ink/20" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-linen to-transparent" />
        <Header />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-6xl items-center px-5 pb-20 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-sage">
              Pathfinder Therapy
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-[1.08] text-linen sm:text-6xl lg:text-7xl">
              Helping you understand yourself, your relationships, and the path ahead.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-linen/86 sm:text-xl">
              Private therapy in Lisbon and online for English-speaking clients seeking greater
              clarity, connection, and meaningful change.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-linen px-6 text-sm font-bold text-ink transition hover:bg-white"
              >
                Start an enquiry
              </a>
              <a
                href="#approach"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-linen/48 px-6 text-sm font-bold text-linen transition hover:border-white hover:bg-white/10"
              >
                Explore the approach
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="approach" className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <SectionHeading
            eyebrow="Approach"
            title="Therapy that helps make sense of what you have been carrying."
            text="Pathfinder Therapy offers a reflective, relational space for English-speaking adults who want to understand patterns, soften old defences, and move with more steadiness."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="min-h-56 border-l-2 border-moss/40 bg-white/50 p-6 shadow-sm"
              >
                <h3 className="font-serif text-xl font-semibold text-ink">{principle.title}</h3>
                <p className="mt-4 text-sm leading-7 text-ink/70">{principle.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="therapy" className="bg-sage/55 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Therapy"
            title="For clients seeking clarity, connection, and meaningful change."
            text="Sessions can support you when familiar ways of coping no longer feel enough, or when a transition asks you to understand yourself differently."
          />
          <div className="grid gap-3">
            {supportThemes.map((theme) => (
              <div
                key={theme}
                className="flex min-h-16 items-center border border-ink/10 bg-linen px-5 text-base font-semibold text-ink shadow-sm"
              >
                {theme}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="location" className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Location"
              title="In-person therapy in Lisbon, with online sessions available."
              text="Pathfinder Therapy works with English-speaking clients living in Portugal, relocating to Lisbon, or seeking online therapy from a familiar language and cultural frame."
            />
          </div>
          <div className="bg-ink p-8 text-linen shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-sage">
              Availability
            </p>
            <p className="mt-5 font-serif text-2xl leading-snug">
              Private sessions are offered by enquiry, with appointments available in Lisbon and
              online.
            </p>
            <a
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-linen px-6 text-sm font-bold text-ink transition hover:bg-white"
              href={`mailto:${site.email}`}
            >
              {site.email}
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-oat px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-clay">
              Contact
            </p>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-ink sm:text-5xl">
              Begin with a short, confidential enquiry.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink/72">
              Share a little about what brings you to therapy and whether you are looking for
              sessions in Lisbon or online.
            </p>
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-linen transition hover:bg-moss"
            >
              Email Pathfinder Therapy
            </a>
            <a
              href="#top"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/20 px-6 text-sm font-bold text-ink transition hover:border-ink"
            >
              Back to top
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
