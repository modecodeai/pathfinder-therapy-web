import Link from "next/link";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";

const paths = [
  ["Understanding Yourself", "For when you want to make sense of who you are, what shaped you, and why certain patterns keep returning."],
  ["Healing from Trauma", "For difficult experiences that still echo in the body, relationships, identity, or sense of safety."],
  ["Navigating Relationships", "For couples and individuals wanting to understand communication, conflict, intimacy, trust, and repair."],
  ["Life Transitions", "For relocation, loss, career change, ageing, injury, parenthood, separation, or moments when life asks you to reorient."],
  ["Anxiety and Overthinking", "For minds that rarely rest, bodies that stay alert, and the pressure of trying to hold everything together."],
  ["Working Online", "For private therapy in English wherever you are, when consistency and flexibility matter."]
];

const principles = [
  ["Adaptation is intelligent.", "What looks like a problem today may once have been a solution."],
  ["Understanding creates choice.", "When you understand your patterns, you are no longer only living inside them."],
  ["Growth remains possible.", "Human beings move naturally towards growth when the right conditions are present."]
];

export default function Home(){return <main>
  <section className="relative min-h-screen overflow-hidden bg-ink text-linen contours">
    <div className="absolute inset-0 bg-gradient-to-br from-ink via-forest to-ink/80" />
    <div className="compass absolute right-[-8rem] top-28 h-96 w-96 rounded-full opacity-70" />
    <Container className="relative flex min-h-screen items-center py-32">
      <div className="max-w-4xl">
        <p className="mb-10 max-w-3xl serif text-4xl leading-tight text-linen/95 sm:text-6xl lg:text-7xl">Every life leaves a trail.</p>
        <div className="max-w-2xl space-y-4 text-xl leading-9 text-linen/78">
          <p>Some paths bring us closer to ourselves.</p>
          <p>Others lead us away.</p>
          <p>Pathfinder exists to help you find your bearings again.</p>
        </div>
        <div className="mt-16 border-t border-sand/30 pt-10">
          <h1 className="serif text-5xl leading-none sm:text-7xl">Find your bearings.</h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-linen/78">Helping you understand yourself, your relationships, and the path ahead.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button href="/contact">Book a consultation</Button><Button href="#approach" secondary>Explore the Pathfinder approach</Button></div>
        </div>
      </div>
    </Container>
  </section>

  <section className="bg-linen py-24 sm:py-32">
    <Container className="max-w-5xl">
      <h2 className="serif text-4xl leading-tight sm:text-6xl">Life rarely announces the moment we begin to lose our way.</h2>
      <div className="mt-12 grid gap-10 text-lg leading-9 text-ink/72 md:grid-cols-2">
        <div className="space-y-5"><p>More often, it happens gradually.</p><p>We adapt. We become busy. We meet expectations. We keep going.</p></div>
        <div className="space-y-5"><p>From the outside, life may appear capable, successful, even settled.</p><p>Inside, something no longer feels quite right.</p><p>Therapy offers a place to pause, understand what has shaped you, and reconnect with the person you are becoming.</p></div>
      </div>
    </Container>
  </section>

  <section id="paths" className="bg-sand/55 py-24 sm:py-32">
    <Container>
      <p className="text-sm font-semibold uppercase tracking-[.22em] text-clay">The Paths</p>
      <h2 className="serif mt-4 max-w-3xl text-4xl leading-tight sm:text-6xl">What are you hoping to understand?</h2>
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{paths.map(([title,copy])=><article key={title} className="group rounded-[2rem] border border-ink/10 bg-linen/75 p-8 shadow-sm transition hover:-translate-y-1 hover:bg-linen"><h3 className="serif text-2xl text-ink">{title}</h3><p className="mt-5 leading-7 text-ink/68">{copy}</p></article>)}</div>
    </Container>
  </section>

  <section id="approach" className="bg-ink py-24 text-linen sm:py-32">
    <Container>
      <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <div><p className="text-sm font-semibold uppercase tracking-[.22em] text-sand">The Pathfinder Approach</p><h2 className="serif mt-4 text-5xl leading-tight sm:text-7xl">People make sense.</h2></div>
        <div className="space-y-6 text-lg leading-9 text-linen/76"><p>Every feeling, behaviour, and relationship pattern has developed within the context of a life lived.</p><p>Many of the strategies people struggle with today were once intelligent adaptations.</p><p>Some helped us survive. Some helped us belong. Some helped us avoid pain. Some helped us keep going when stopping did not feel possible.</p><p>Therapy is not about judging these adaptations. It is about understanding them, recognising whether they still serve you, and discovering what becomes possible when you have more choice.</p></div>
      </div>
      <div className="mt-16 grid gap-5 md:grid-cols-3">{principles.map(([title,copy])=><div key={title} className="rounded-[2rem] border border-sand/20 bg-linen/5 p-8"><h3 className="serif text-2xl">{title}</h3><p className="mt-4 leading-7 text-linen/68">{copy}</p></div>)}</div>
    </Container>
  </section>

  <section className="bg-linen py-24 sm:py-32">
    <Container className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <div className="aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-forest to-moss p-8 text-linen shadow-xl"><div className="flex h-full items-end rounded-[2rem] border border-sand/25 p-8"><p className="serif text-4xl">Brent Kelly</p></div></div>
      <div><p className="text-sm font-semibold uppercase tracking-[.22em] text-clay">Meet Brent</p><h2 className="serif mt-4 text-4xl leading-tight sm:text-6xl">Who will walk alongside me?</h2><div className="mt-8 space-y-5 text-lg leading-9 text-ink/72"><p>I am Brent Kelly, a psychotherapist in private practice working in Lisbon and online.</p><p>My work is shaped by a belief that people are far more understandable than they often imagine.</p><p>I bring together clinical training, lived experience, curiosity, and a grounded respect for the ways people adapt to difficult terrain.</p><p>Whether you come with trauma, anxiety, relationship difficulties, or a quieter sense that something in life needs to change, my role is not to tell you who to become.</p><p>It is to help you understand yourself well enough to decide that for yourself.</p></div><Link href="/about" className="mt-8 inline-flex text-sm font-semibold text-clay underline underline-offset-8">Meet Brent</Link></div>
    </Container>
  </section>

  <section className="bg-forest py-24 text-linen sm:py-32"><Container className="max-w-4xl text-center"><h2 className="serif text-4xl leading-tight sm:text-6xl">Your journey does not begin when life falls apart.</h2><p className="mx-auto mt-8 max-w-2xl text-xl leading-9 text-linen/76">It begins the moment you become curious about yourself.</p><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-linen/68">If you are ready to pause, reflect, and begin finding your bearings, you are welcome to get in touch.</p><div className="mt-10"><Button href="/contact">Book a consultation</Button></div></Container></section>
</main>}
