import { buildBreadcrumbSchema, buildServiceSchema, buildFaqSchema } from "./site-schema.mjs";
import { buildPublicFeedbackSection } from "./site-reviews.mjs";
import { getClinicDirectionsUrl } from "./site-location.mjs";

const SITE = "https://www.pathfindertherapy.com";
const DIRECTIONS_LINK = `<p><a class="lpLocationMapLink" href="${getClinicDirectionsUrl()}" target="_blank" rel="noopener noreferrer">Get directions on Google Maps →</a></p>`;
const TRAUMA_FAQS = [
  { question: "Can I have trauma therapy in English with Brent Kelly?", answer: "Yes. Brent Kelly is an EMDR Therapist offering trauma-informed psychotherapy in English for adults at Pathfinder Therapy in Lisbon and online across Portugal. EMDR and Transactional Analysis are used where clinically appropriate." },
  { question: "Where is the Lisbon clinic?", answer: "The Pathfinder Therapy Lisbon clinic is at R. Rodrigues Sampaio 76, 1º Andar, 1150-281 Lisboa, Portugal. Brent holds face-to-face sessions at this clinic." },
  { question: "How much does trauma therapy or EMDR cost?", answer: "Individual therapy in Lisbon or online across Portugal starts from €75 for 50 minutes. EMDR sessions in Lisbon or online across Portugal cost €95 for 60 minutes. The separate <a href=\"/online-emdr-therapy-uk/\">UK online EMDR service</a> with Brent Kelly or Tim Felton costs £80 for 60 minutes." },
  { question: "Do I need a diagnosis or have to share my full history straight away?", answer: "No diagnosis is needed to begin a conversation. The first meeting helps clarify what brings you to therapy and whether the approach is suitable. There is no pressure to share your full history immediately; EMDR is considered following assessment and preparation." },
  { question: "Is the initial consultation free?", answer: "Yes. The initial 30-minute Zoom consultation with Brent is free and separate from a paid therapy session. You can ask about the approach, fees and suitability, with no obligation to continue. Fees are agreed before therapy begins." },
];
const EMDR_FAQS = [
  { question: "Who offers EMDR therapy in English in Lisbon?", answer: "Brent Kelly is an EMDR Therapist offering EMDR in English for adults through Pathfinder Therapy, in person in Lisbon and online across Portugal where clinically appropriate." },
  { question: "Where are in-person EMDR sessions held?", answer: "Brent holds in-person sessions at Pathfinder Therapy, R. Rodrigues Sampaio 76, 1º Andar, 1150-281 Lisboa, Portugal." },
  { question: "Can I have EMDR online in Portugal?", answer: "Yes. EMDR is available online in English across Portugal where assessment indicates that the approach and format are suitable. Your therapist discusses preparation, privacy and practical arrangements before processing begins." },
  { question: "How much does EMDR cost in Portugal and the UK?", answer: "EMDR with Brent in Lisbon or online across Portugal costs €95 for a 60-minute session. The separate <a href=\"/online-emdr-therapy-uk/\">UK online EMDR service</a> with Brent Kelly or Tim Felton costs £80 for 60 minutes and is online only. Suitability and availability are discussed before sessions are agreed." },
  { question: "Is EMDR suitable for everyone?", answer: "No. Your therapist assesses whether EMDR is appropriate for your circumstances and plans the work with you. Assessment, preparation and the therapeutic relationship come before processing; another approach or more preparation may be suggested." },
  { question: "Is the initial EMDR consultation free?", answer: "The initial 30-minute Zoom consultation with Brent is free and separate from a paid EMDR session. It is a chance to ask questions and discuss suitability, with no obligation to continue. EMDR processing does not have to begin in the first therapy session." },
];

function section(kicker, title, id, bodyHtml) {
  return `<section class="lpLocalSection" aria-labelledby="${id}">
  <div class="lpLocalSectionInner">
    <p class="lpKicker">${kicker}</p>
    <h2 class="lpSectionTitle" id="${id}">${title}</h2>
    <div class="lpLocalBody">${bodyHtml}</div>
  </div>
</section>`;
}

function hero(kicker, title, id, lead) {
  return `<section class="lpLocalHero" aria-labelledby="${id}">
  <p class="lpKicker">${kicker}</p>
  <h1 class="lpTitle" id="${id}">${title}</h1>
  <p class="lpLead">${lead}</p>
</section>`;
}

export const LOCAL_LANDING_PAGES = [
  {
    route: "/psychotherapy-lisbon/",
    title: "Psychotherapy Lisbon | English-Speaking Therapist | Pathfinder",
    description:
      "Trauma-informed psychotherapy in Lisbon with Brent Kelly. English-speaking therapy for adults, with online couples therapy available through Pathfinder.",
    serviceName: "Psychotherapy in Lisbon",
    serviceType: "Psychotherapy",
    hero: {
      kicker: "Psychotherapy · Lisbon & online",
      title: "Psychotherapy in Lisbon with an English-speaking therapist.",
      lead: "Pathfinder Therapy offers calm, trauma-informed psychotherapy for adults in central Lisbon and online therapy support across Portugal. Sessions from €75."
    },
    sections: [
      section(
        "Location",
        "Therapy in central Lisbon",
        "psy-location",
        `<p>Pathfinder Therapy is based at <strong>R. Rodrigues Sampaio 76</strong>, Lisboa — accessible from Avenidas Novas and central Lisbon. Secure online sessions are available across Portugal if travel or schedule makes in-person sessions difficult.</p>
        ${DIRECTIONS_LINK}`
      ),
      section(
        "Approach",
        "Trauma-informed and relational",
        "psy-approach",
        `<p>Brent Kelly works with trauma, anxiety, attachment, relationships, and major life transitions as an EMDR Therapist, using EMDR and Transactional Analysis where clinically appropriate. Therapy is paced carefully and shaped around your life, not a formula.</p>
        <p><a href="/approach/">Read about the approach</a> · <a href="/therapy/">View therapy services</a> · <a href="/faq/">FAQ</a> · <a href="/fees/">Fees from €75</a></p>`
      )
    ],
    links: [
      { href: "/knowledge-library/what-happens-in-a-first-therapy-session/", label: "What happens in a first session?" },
      { href: "/knowledge-library/online-therapy/", label: "Online therapy in Portugal" }
    ]
  },
  {
    route: "/trauma-therapy-lisbon/",
    title: "English-Speaking Trauma Therapist Lisbon | Brent Kelly",
    description:
      "Trauma-informed psychotherapy in Lisbon with Brent Kelly, EMDR Therapist. Support for PTSD, complex trauma, and anxiety — EMDR where appropriate. English-speaking sessions in Lisbon or online.",
    serviceName: "Trauma therapy in Lisbon",
    faqs: TRAUMA_FAQS,
    serviceType: "Trauma therapy",
    hero: {
      kicker: "Trauma therapy · Lisbon",
      title: "Trauma therapy in English with Brent Kelly.",
      lead: "Brent Kelly offers trauma-informed psychotherapy in English for adults in Lisbon and online across Portugal. EMDR and Transactional Analysis are used where clinically appropriate. Start with a free 30-minute initial consultation by Zoom."
    },
    sections: [
      section(
        "Who this helps",
        "When trauma therapy may help",
        "trauma-who",
        `<p>Many people seek trauma therapy when anxiety, flashbacks, hypervigilance, relationship patterns, or a sense of shutdown persist long after difficult events. You do not need a formal diagnosis to begin a conversation.</p>
        <p><a href="/about/#brent-kelly">Brent Kelly</a> works with military veterans, expatriates, and adults facing complex life experiences — always at a pace that respects your nervous system.</p>`
      ),
      section(
        "Methods",
        "EMDR and relational psychotherapy",
        "trauma-methods",
        `<p>Pathfinder offers trauma-informed psychotherapy and <strong>EMDR</strong> where clinically appropriate, alongside Transactional Analysis and relational work. Brent is EATA registered, a member of ITAA, and receives clinical supervision.</p>
        <p><a href="/knowledge-library/what-is-trauma-therapy/">What is trauma therapy?</a> · <a href="/knowledge-library/the-body-remembers/">The body remembers</a></p>`
      ),
      section(
        "Location",
        "Lisbon clinic and online",
        "trauma-location",
        `<p>Sessions at the Lisbon clinic (R. Rodrigues Sampaio 76) or securely online across Portugal. English-speaking throughout.</p>
        ${DIRECTIONS_LINK}`
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
      "EMDR therapy in English with Brent Kelly. €95 for 60 minutes, in Lisbon or online across Portugal. Start with a free initial consultation.",
    serviceName: "EMDR therapy in Lisbon",
    serviceType: "EMDR",
    faqs: EMDR_FAQS,
    hero: {
      kicker: "EMDR · Lisbon & online",
      title: "EMDR therapy in Lisbon with a trauma-informed therapist.",
      lead: "Brent Kelly, EMDR Therapist, offers EMDR in English for adults in Lisbon and online across Portugal. Eye Movement Desensitisation and Reprocessing is integrated within trauma-informed psychotherapy, following individual assessment and preparation."
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
        `<p>EMDR sessions with Brent are available in English at R. Rodrigues Sampaio 76, 1º Andar, 1150-281 Lisboa, Portugal, or online across Portugal. Portugal sessions are €95 for 60 minutes. Start with a free 30-minute initial consultation by Zoom to discuss suitability; this is separate from a paid therapy session. <a href="/fees/">See fees</a>.</p>
        <p>Joining from the UK? Our <a href="/online-emdr-therapy-uk/">UK online EMDR service</a> with Brent Kelly or Tim Felton costs £80 for 60 minutes, subject to suitability and availability.</p>
        ${DIRECTIONS_LINK}`
      )
    ],
    links: [
      { href: "/knowledge-library/how-does-emdr-work/", label: "How does EMDR work?" },
      { href: "/knowledge-library/what-is-trauma-therapy/", label: "What is trauma therapy?" }
    ]
  },
  {
    route: "/english-speaking-therapist-lisbon/",
    title: "English-Speaking Therapist Lisbon | Brent Kelly, Pathfinder",
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
        `<p>Individual therapy, online couples therapy, EMDR, and online sessions across Portugal. Trauma-informed throughout.</p>
        <p><a href="/therapy/">View all therapy services</a> · <a href="/about/">About the team</a></p>`
      ),
      section(
        "Location",
        "Central Lisbon clinic",
        "en-location",
        `<p><strong>Pathfinder Therapy</strong><br>R. Rodrigues Sampaio 76 1º Andar<br>1150-281 Lisboa, Portugal</p>
        <p>Near Avenidas Novas. Online sessions available if you are elsewhere in Portugal.</p>
        ${DIRECTIONS_LINK}`
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
  return `<article class="lpLocalLanding">
${hero(page.hero.kicker, page.hero.title, "local-landing-title", page.hero.lead)}
${page.sections.join("\n")}
${page.faqs ? section("Practical questions", "Questions about therapy", "local-questions", page.faqs.map((faq) => `<h3>${faq.question}</h3><p>${faq.answer}</p>`).join("")) : ""}
${buildPublicFeedbackSection({ compact: true })}
<section class="lpLocalSection" aria-labelledby="local-related">
  <div class="lpLocalSectionInner">
    <p class="lpKicker">Learn more</p>
    <h2 class="lpSectionTitle" id="local-related">Related reading</h2>
    <div class="lpLocalBody"><ul>${related}</ul></div>
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
    serviceType: page.serviceType,
    ...(page.serviceType === "EMDR" ? { price: 95 } : {})
  })}
${buildBreadcrumbSchema([
    { name: "Home", url: `${SITE}/` },
    { name: page.serviceName, url: canonicalUrl }
  ])}${page.faqs ? buildFaqSchema(page.faqs) : ""}`;

  return buildInteriorPageWithBookingPanel(shellHtml, {
    title: page.title,
    description: page.description,
    canonical: canonicalUrl,
    mainInner: buildLocalLandingBody(page),
    schema,
    slimBookingPanel: true
  });
}

export function getLocalLandingRoutes() {
  return LOCAL_LANDING_PAGES.map((p) => p.route);
}
