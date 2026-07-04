import { BOOKING_LABEL, BOOKING_PATH } from "./site-ux-layer.mjs";
import { buildBreadcrumbSchema, buildServiceSchema } from "./site-schema.mjs";
import { buildEataBadge } from "./site-eata.mjs";

const SITE = "https://www.pathfindertherapy.com";

function section(kicker, title, id, bodyHtml) {
  return `<section class="approachEssay" aria-labelledby="${id}">
  <div class="approachEssayInner">
    <p class="sectionKicker">${kicker}</p>
    <h2 class="approachSectionTitle" id="${id}">${title}</h2>
    <div class="approachBody">${bodyHtml}</div>
  </div>
</section>`;
}

function hero(kicker, title, id, lead) {
  return `<section class="approachHero" aria-labelledby="${id}">
  <div class="approachHeroCopy">
    <p class="sectionKicker">${kicker}</p>
    <h1 class="approachHeroTitle" id="${id}">${title}</h1>
    <p class="approachHeroText">${lead}</p>
    <div class="lpHeroActions" style="margin-top:16px">
      <a class="lpPrimaryCta" href="/book/">Book initial Zoom call</a>
      <a class="lpSecondaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
    </div>
    ${buildEataBadge()}
  </div>
</section>`;
}

export const LOCAL_LANDING_PAGES = [
  {
    route: "/psychotherapy-lisbon/",
    title: "Psychotherapy Lisbon | English-Speaking Therapist | Pathfinder",
    description:
      "Trauma-informed psychotherapy in Lisbon with Brent Kelly. English-speaking therapy for adults and couples — in person near Avenidas Novas or securely online across Portugal.",
    serviceName: "Psychotherapy in Lisbon",
    serviceType: "Psychotherapy",
    hero: {
      kicker: "Psychotherapy · Lisbon & online",
      title: "Psychotherapy in Lisbon with an English-speaking therapist.",
      lead: "Pathfinder Therapy offers calm, trauma-informed psychotherapy for adults and couples in central Lisbon and online across Portugal. Sessions from €75."
    },
    sections: [
      section(
        "Location",
        "Therapy in central Lisbon",
        "psy-location",
        `<p>Pathfinder Therapy is based at <strong>R. Rodrigues Sampaio 76</strong>, Lisboa — accessible from Avenidas Novas and central Lisbon. Secure online sessions are available across Portugal if travel or schedule makes in-person sessions difficult.</p>`
      ),
      section(
        "Approach",
        "Trauma-informed and relational",
        "psy-approach",
        `<p>Brent Kelly works with trauma, anxiety, attachment, relationships, and major life transitions — using EMDR and Transactional Analysis where clinically appropriate. Therapy is paced carefully and shaped around your life, not a formula.</p>
        <p><a href="/approach/">Read about the approach</a> · <a href="/therapy/">View therapy services</a></p>`
      ),
      section(
        "Next step",
        "Arrange an initial consultation",
        "psy-next",
        `<p>Book an initial Zoom call or send a brief enquiry. Brent replies within one working day to non-urgent messages.</p>
        <p><a href="/faq/">FAQ</a> · <a href="/fees/">Fees from €75</a></p>`
      )
    ],
    links: [
      { href: "/knowledge-library/what-happens-in-a-first-therapy-session/", label: "What happens in a first session?" },
      { href: "/knowledge-library/online-therapy/", label: "Online therapy in Portugal" }
    ]
  },
  {
    route: "/trauma-therapy-lisbon/",
    title: "Trauma Therapy Lisbon | Trauma-Informed Therapist | Pathfinder",
    description:
      "Trauma-informed psychotherapy in Lisbon with Brent Kelly. Support for PTSD, complex trauma, and anxiety — EMDR where appropriate. English-speaking sessions in Lisbon or online.",
    serviceName: "Trauma therapy in Lisbon",
    serviceType: "Trauma therapy",
    hero: {
      kicker: "Trauma therapy · Lisbon",
      title: "Trauma therapy in Lisbon — when the past still shapes the present.",
      lead: "Trauma-informed psychotherapy for adults navigating PTSD, complex trauma, anxiety, and life after difficult experiences. In person in Lisbon or securely online."
    },
    sections: [
      section(
        "Who this helps",
        "When trauma therapy may help",
        "trauma-who",
        `<p>Many people seek trauma therapy when anxiety, flashbacks, hypervigilance, relationship patterns, or a sense of shutdown persist long after difficult events. You do not need a formal diagnosis to begin a conversation.</p>
        <p>Brent works with military veterans, expatriates, and adults facing complex life experiences — always at a pace that respects your nervous system.</p>`
      ),
      section(
        "Methods",
        "EMDR and relational psychotherapy",
        "trauma-methods",
        `<p>Pathfinder offers trauma-informed psychotherapy and <strong>EMDR</strong> where clinically appropriate, alongside Transactional Analysis and relational work. Brent is EATA registered and receives clinical supervision.</p>
        <p><a href="/knowledge-library/what-is-trauma-therapy/">What is trauma therapy?</a> · <a href="/knowledge-library/the-body-remembers/">The body remembers</a></p>`
      ),
      section(
        "Location",
        "Lisbon clinic and online",
        "trauma-location",
        `<p>Sessions at the Lisbon clinic (R. Rodrigues Sampaio 76) or securely online across Portugal. English-speaking throughout.</p>`
      )
    ],
    links: [
      { href: "/knowledge-library/veterans-and-trauma/", label: "Veterans and trauma" },
      { href: "/emdr-therapy-lisbon/", label: "EMDR therapy Lisbon" }
    ]
  },
  {
    route: "/emdr-therapy-lisbon/",
    title: "EMDR Therapist Lisbon | Pathfinder Therapy",
    description:
      "EMDR therapy in Lisbon with Brent Kelly. Trauma-informed EMDR for adults — English-speaking sessions in Lisbon or online across Portugal. Book an initial consultation.",
    serviceName: "EMDR therapy in Lisbon",
    serviceType: "EMDR",
    hero: {
      kicker: "EMDR · Lisbon & online",
      title: "EMDR therapy in Lisbon with a trauma-informed therapist.",
      lead: "Eye Movement Desensitisation and Reprocessing (EMDR) where clinically appropriate — integrated within broader trauma-informed psychotherapy, not as a standalone quick fix."
    },
    sections: [
      section(
        "What is EMDR",
        "How EMDR fits therapy",
        "emdr-what",
        `<p>EMDR is a structured approach that can help process distressing memories and reduce their emotional intensity over time. It is used within a wider therapeutic relationship — Brent assesses suitability carefully before recommending EMDR.</p>
        <p><a href="/knowledge-library/how-does-emdr-work/">How does EMDR work?</a></p>`
      ),
      section(
        "Who it may suit",
        "Trauma, anxiety, and persistent distress",
        "emdr-who",
        `<p>EMDR is often considered for trauma-related symptoms, persistent anxiety linked to past events, and patterns that feel stuck despite talking therapy. Suitability is discussed in an initial consultation.</p>
        <p><a href="/trauma-therapy-lisbon/">Trauma therapy Lisbon</a></p>`
      ),
      section(
        "Practical details",
        "Sessions in English — Lisbon or online",
        "emdr-practical",
        `<p>EMDR sessions are available in English at the Lisbon clinic or online. Individual sessions from €75 for 50 minutes. <a href="/fees/">See fees</a>.</p>`
      )
    ],
    links: [
      { href: "/knowledge-library/how-does-emdr-work/", label: "How does EMDR work?" },
      { href: "/knowledge-library/what-is-trauma-therapy/", label: "What is trauma therapy?" }
    ]
  },
  {
    route: "/english-speaking-therapist-lisbon/",
    title: "English Speaking Therapist Lisbon | Pathfinder Therapy",
    description:
      "English-speaking therapist in Lisbon — Brent Kelly offers trauma-informed psychotherapy for expats and international clients. In-person sessions in Lisbon or online across Portugal.",
    serviceName: "English-speaking therapy in Lisbon",
    serviceType: "Psychotherapy",
    hero: {
      kicker: "English-speaking · Lisbon & online",
      title: "English-speaking therapist in Lisbon for expats and international clients.",
      lead: "Therapy in English when navigating life in Portugal — trauma, anxiety, relationships, and transitions away from home. In person at our Lisbon clinic or securely online."
    },
    sections: [
      section(
        "Expats & internationals",
        "Therapy when home feels far away",
        "en-expats",
        `<p>Living abroad can bring isolation, identity shifts, relationship strain, and resurfacing of old patterns. Pathfinder offers a steady, confidential space in <strong>English</strong> — without needing to explain cultural context from scratch.</p>
        <p>Brent works with expatriates, international professionals, and military veterans in Lisbon and online.</p>`
      ),
      section(
        "Services",
        "Individual, couples, and trauma-informed work",
        "en-services",
        `<p>Individual therapy, couples therapy, EMDR, and online sessions across Portugal. Trauma-informed throughout.</p>
        <p><a href="/therapy/">View all therapy services</a> · <a href="/about/">About Brent</a></p>`
      ),
      section(
        "Location",
        "Central Lisbon clinic",
        "en-location",
        `<p><strong>Pathfinder Therapy</strong><br>R. Rodrigues Sampaio 76 1º Andar<br>1150-281 Lisboa, Portugal</p>
        <p>Near Avenidas Novas. Online sessions available if you are elsewhere in Portugal.</p>`
      )
    ],
    links: [
      { href: "/psychotherapy-lisbon/", label: "Psychotherapy Lisbon" },
      { href: "/knowledge-library/online-therapy/", label: "Online therapy Portugal" }
    ]
  }
];

export function buildLocalLandingBody(page) {
  const related = page.links
    .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
    .join("");
  return `<article class="approachPage">
${hero(page.hero.kicker, page.hero.title, "local-landing-title", page.hero.lead)}
${page.sections.join("\n")}
<section class="approachEssay" aria-labelledby="local-related">
  <div class="approachEssayInner">
    <p class="sectionKicker">Learn more</p>
    <h2 class="approachSectionTitle" id="local-related">Related reading</h2>
    <div class="approachBody"><ul>${related}</ul></div>
  </div>
</section>
</article>`;
}

export function buildLocalLandingPage(shellHtml, page, buildInteriorPageWithBookingPanel) {
  const canonicalUrl = `${SITE}${page.route}`;

  const schema = `${buildServiceSchema({
    name: page.serviceName,
    description: page.description,
    url: canonicalUrl,
    serviceType: page.serviceType
  })}
${buildBreadcrumbSchema([
    { name: "Home", url: `${SITE}/` },
    { name: page.serviceName, url: canonicalUrl }
  ])}`;

  return buildInteriorPageWithBookingPanel(shellHtml, {
    title: page.title,
    description: page.description,
    canonical: canonicalUrl,
    mainInner: buildLocalLandingBody(page),
    schema
  });
}

export function getLocalLandingRoutes() {
  return LOCAL_LANDING_PAGES.map((p) => p.route);
}
