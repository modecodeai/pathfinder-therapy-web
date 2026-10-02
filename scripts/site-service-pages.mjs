import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";
import { extractPageParts, wrapInShellV2 } from "./site-shell-v2.mjs";
import { buildBreadcrumbSchema, buildFaqSchema, buildServiceSchema } from "./site-schema.mjs";

export const SERVICE_PAGE_CSS = `<style id="pathfinder-service-pages">
.pfServicePage { display: grid; gap: 0; }
.pfServiceHero { position: relative; min-height: clamp(320px, 52vh, 480px); display: grid; align-items: end; padding: clamp(32px, 6vw, 64px) var(--pf-space-inline); color: var(--pf-linen); overflow: hidden; }
.pfServiceHeroMedia { position: absolute; inset: 0; z-index: 0; }
.pfServiceHeroMedia img { width: 100%; height: 100%; object-fit: cover; object-position: center 35%; }
.pfServiceHeroOverlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,15,13,.25) 0%, rgba(10,15,13,.72) 55%, rgba(10,15,13,.94) 100%); }
.pfServiceHeroContent { position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; width: 100%; display: grid; gap: 14px; }
.pfServiceBack { font-family: var(--pf-font-sans); font-size: 0.875rem; color: rgba(246,242,234,.68); text-decoration: none; width: fit-content; min-height: 44px; display: inline-flex; align-items: center; }
.pfServiceBack:hover { color: var(--pf-bronze-soft); }
.pfServiceLabel { display: inline-flex; width: fit-content; padding: 6px 12px; border: 1px solid rgba(200,154,88,.45); border-radius: var(--pf-radius-pill); font-family: var(--pf-font-sans); font-size: 0.6875rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--pf-bronze-soft); }
.pfServiceHeroTitle { margin: 0; font-family: var(--pf-font-serif); font-size: clamp(2.25rem, 5vw, 3.25rem); line-height: 1.05; font-weight: 600; max-width: 16ch; }
.pfServiceHeroLead { margin: 0; font-family: var(--pf-font-sans); font-size: clamp(1.0625rem, 2vw, 1.1875rem); line-height: var(--pf-leading-body); max-width: 38rem; color: rgba(246,242,234,.86); }
.pfServiceMain { padding: clamp(40px, 6vw, 72px) var(--pf-space-inline); background: var(--pf-parchment); color: var(--pf-stone); }
.pfServiceMainInner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr); gap: clamp(28px, 4vw, 40px); align-items: start; }
.pfServiceCopy { display: grid; gap: 18px; }
.pfServiceCopy p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body); line-height: var(--pf-leading-body); color: var(--pf-stone-muted); }
.pfServiceCopy h2 { margin: 24px 0 8px; font-family: var(--pf-font-serif); font-size: 1.5rem; color: var(--pf-stone); }
.pfServiceFaq { display: grid; gap: 14px; }
.pfServiceFaqItem { display: grid; gap: 8px; padding-top: 16px; border-top: 1px solid var(--pf-border-light); }
.pfServiceFaqItem h3 { margin: 0; font-family: var(--pf-font-sans); font-size: 1.0625rem; line-height: 1.45; color: var(--pf-stone); }
.pfServicePanel { position: sticky; top: calc(var(--pf-header-offset) + 16px); padding: 22px; border: 1px solid var(--pf-border-light); border-radius: var(--pf-radius-lg); background: #fff; box-shadow: var(--pf-shadow-card); display: grid; gap: 16px; }
.pfServicePanel h2 { margin: 0; font-family: var(--pf-font-sans); font-size: 0.75rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--pf-bronze); }
.pfServicePanelList { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.pfServicePanelList li { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 10px; align-items: start; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: 1.5; color: var(--pf-stone); }
.pfServicePanelList svg { margin-top: 2px; color: var(--pf-bronze); flex-shrink: 0; }
.pfServicePanelMeta { margin: 0; padding-top: 12px; border-top: 1px solid var(--pf-border-light); font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: 1.55; color: var(--pf-stone-muted); }
.pfServicePanelActions { display: grid; gap: 10px; }
.pfServicePanelActions .pfPanelCta { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); font-weight: 600; color: var(--pf-bronze); text-decoration: underline; text-underline-offset: 3px; }
.pfServicePanelActions .pfPanelCta:hover { color: var(--pf-stone); }
.pfServiceDark { padding: clamp(40px, 6vw, 64px) var(--pf-space-inline); background: var(--pf-forest-deep); color: var(--pf-linen); }
.pfServiceDarkInner { max-width: 1180px; margin: 0 auto; display: grid; gap: 20px; }
.pfServiceSteps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 0; padding: 0; list-style: none; }
.pfServiceSteps li { padding: 18px; border: 1px solid var(--pf-border-dark); border-radius: var(--pf-radius-md); background: rgba(15,24,22,.55); }
.pfServiceSteps h3 { margin: 0 0 8px; font-family: var(--pf-font-serif); font-size: 1.05rem; color: var(--pf-linen); }
.pfServiceSteps p { margin: 0; font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: var(--pf-linen-muted); }
.pfExploreMore { padding: clamp(40px, 6vw, 64px) var(--pf-space-inline); background: var(--pf-parchment-muted); }
.pfExploreGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; max-width: 1180px; margin: 0 auto; }
.pfExploreCard { position: relative; display: block; min-height: 200px; border-radius: var(--pf-radius-md); overflow: hidden; text-decoration: none; color: var(--pf-linen); border: 1px solid var(--pf-border-light); }
.pfExploreCard img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.pfExploreCardOverlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,15,13,.15) 20%, rgba(10,15,13,.92) 100%); }
.pfExploreCardTitle { position: absolute; left: 16px; right: 16px; bottom: 16px; margin: 0; font-family: var(--pf-font-serif); font-size: 1.25rem; font-weight: 600; z-index: 1; }
.pfExploreCard:hover .pfExploreCardOverlay, .pfExploreCard:focus-visible .pfExploreCardOverlay { background: linear-gradient(180deg, transparent 20%, rgba(10,15,13,.92) 100%); }
.pfExploreCard:focus-visible { outline: 2px solid var(--pf-bronze-soft); outline-offset: 3px; }
.pfServiceFinal { text-align: center; }
.pfServiceFinal .pfSectionHead { margin-inline: auto; text-align: center; }
.pfServiceFinal .pfHeroActions { justify-content: center; }
@media (max-width: 900px) {
  .pfServiceMainInner { grid-template-columns: 1fr; }
  .pfServicePanel { position: static; order: -1; }
  .pfServiceSteps, .pfExploreGrid { grid-template-columns: 1fr; }
  .pfServiceHeroMedia img { object-position: center 40%; }
}
</style>`;

const CHECK = `<svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none"><path d="M4 10.5 8 14.5 16 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const WHAT_HAPPENS = [
  { title: "Choose a free initial call", copy: "Book a free 30-minute initial conversation with Brent through the secure booking page. This is separate from a paid therapy session." },
  { title: "Meet by Zoom", copy: "Use the initial conversation to briefly discuss what brings you to therapy and ask questions." },
  { title: "Decide on the next step", copy: "There is no obligation to continue unless the working relationship feels appropriate." }
];

export const SERVICE_PAGES = [
  {
    slug: "individual",
    route: "/therapy/individual/",
    title: "Individual Therapy in Lisbon & Online | Pathfinder Therapy",
    description:
      "Trauma-informed individual psychotherapy for adults in Lisbon and online. Confidential 50-minute sessions from €75 with Brent Kelly.",
    canonical: "https://www.pathfindertherapy.com/therapy/individual/",
    serviceType: "Individual psychotherapy in English",
    label: "For adults",
    h1: "Individual therapy",
    heroLead: "A steady one-to-one space to make sense of what you carry — and to move differently through it.",
    image: "/assets/images/understanding.webp",
    imageAlt: "Atmospheric forest path — individual therapy at Pathfinder Therapy Lisbon",
    fee: "€75",
    feeFrom: true,
    minPrice: "75",
    priceCurrency: "EUR",
    duration: "50 minutes",
    format: "In person at the Lisbon clinic or securely online across Portugal.",
  helpsWith: [
      "Anxiety, overwhelm and persistent worry",
      "Trauma, PTSD and complex trauma",
      "Attachment and relationship patterns",
      "Identity shifts and life transitions",
      "Grief, loss and periods of change"
    ],
    paragraphs: [
      "Individual therapy offers a regular, confidential space that belongs to you. Brent works relationally and in a trauma-informed way as an EMDR Therapist — drawing on Transactional Analysis, EMDR where appropriate, and steady attention to what your mind and body may still be protecting.",
      "Sessions are 50 minutes, in person at the Lisbon clinic or securely online across Portugal and internationally where appropriate. Therapy is paced carefully; you do not need a diagnosis to begin.",
      "Brent works with adults navigating trauma, anxiety, attachment difficulties, military experiences, expatriation, and significant life transitions — always in English."
    ],
    approach:
      "Therapy is collaborative rather than formulaic. Brent listens carefully, asks thoughtful questions, and works at a pace that respects your nervous system — with evidence-informed methods including EMDR Therapist-led care where clinically appropriate."
  },
  {
    slug: "couples",
    route: "/therapy/couples/",
    title: "Online Couples Therapy | Pathfinder Therapy",
    description:
      "Online couples therapy through Pathfinder Therapy with Sophie Gidley, a TA-trained psychotherapeutic counsellor. Brent Kelly leads the Lisbon clinic.",
    canonical: "https://www.pathfindertherapy.com/therapy/couples/",
    serviceType: "Online couples therapy",
    providerId: "https://www.pathfindertherapy.com/about/#sophie-gidley",
    areaServed: [{ "@type": "Country", name: "Portugal" }],
    label: "For couples",
    h1: "Online couples therapy",
    heroLead: "Relational work for couples navigating conflict, disconnection, and repeating patterns.",
    image: "/assets/images/working-together.webp",
    imageAlt: "Warm therapy room — online couples therapy through Pathfinder Therapy",
    fee: "€120",
    price: "120",
    priceCurrency: "EUR",
    duration: "90 minutes",
    format: "Online with Sophie Gidley; Lisbon face-to-face enquiries are held separately with Brent.",
    helpsWith: [
      "Conflict and difficult conversations",
      "Disconnection and loss of intimacy",
      "Trust, attachment and repeating patterns",
      "Life transitions affecting the relationship",
      "Deciding whether and how to move forward together"
    ],
    paragraphs: [
      "Couples therapy offers a structured, confidential space to understand what is happening between you — not to assign blame, but to see patterns clearly and explore whether change feels possible.",
      "Through Pathfinder Therapy, online couples work is offered by Sophie Gidley, a psychotherapeutic counsellor whose practice is grounded in Transactional Analysis and couples counselling.",
      "Begin with a free, private 30-minute introductory call with Brent. Each partner has a separate conversation before the next step is agreed. Ongoing online couples sessions with Sophie are arranged separately and cost €120 for 90 minutes.",
      "Brent continues to lead the Lisbon clinic and face-to-face provision. If you are in Lisbon and unsure which route is right, an initial enquiry can clarify whether online couples therapy or another pathway is appropriate."
    ],
    approach:
      "Sophie offers a steady, non-judgemental space for both partners. Work may draw on Transactional Analysis, relationship patterns and communication — always paced to what the relationship can hold."
  },
  {
    slug: "emdr",
    route: "/therapy/emdr/",
    title: "EMDR Therapy in Lisbon & Online | Pathfinder Therapy",
    description:
      "EMDR therapy in English with Brent Kelly, in Lisbon or online across Portugal. €95 for 60 minutes, following assessment. Free 30-minute initial call.",
    canonical: "https://www.pathfindertherapy.com/therapy/emdr/",
    serviceType: "EMDR therapy in English",
    label: "Trauma processing",
    h1: "EMDR therapy in Lisbon and online",
    heroLead: "EMDR therapy in English with Brent Kelly, at the Lisbon clinic or online across Portugal following assessment and preparation.",
    image: "/assets/images/hero-01.webp",
    imageAlt: "Atmospheric landscape — EMDR within trauma-informed psychotherapy",
    fee: "€95",
    price: "95",
    priceCurrency: "EUR",
    duration: "60 minutes",
    format: "In person at the Lisbon clinic or securely online where clinically appropriate.",
    helpsWith: [
      "PTSD and trauma-related symptoms",
      "Distressing memories that feel stuck",
      "Anxiety linked to past experiences",
      "Hypervigilance and nervous-system activation",
      "Processing when talk therapy alone feels insufficient"
    ],
    paragraphs: [
      "EMDR is offered within broader trauma-informed psychotherapy — not as a standalone technique. Brent assesses whether it feels clinically appropriate and prepares work carefully before processing begins.",
      "Sessions are 60 minutes. EMDR is not suitable for everyone; suitability is discussed openly in an initial consultation and ongoing therapy.",
      "Work takes place in English, in person at the Lisbon clinic or online across Portugal where appropriate. UK clients can explore our <a href=\"/online-emdr-therapy-uk/\">separate online EMDR service at £80 for 60 minutes</a>. Brent is EATA registered and an ITAA member, with training in EMDR as part of integrative trauma-informed practice."
    ],
    approach:
      "EMDR is integrated thoughtfully with relational psychotherapy and nervous-system awareness. Brent does not rush processing — stabilisation and trust in the therapeutic relationship come first.",
    faqTitle: "Questions about EMDR in Lisbon and online",
    faqs: [
      { question: "Who offers EMDR therapy at the Lisbon clinic?", answer: "Brent Kelly offers EMDR within trauma-informed psychotherapy for adults at Pathfinder Therapy's Lisbon clinic. Sessions are in English. Brent leads the Lisbon face-to-face provision; Tim Felton supports online care." },
      { question: "Can I have EMDR online in Portugal?", answer: "Online EMDR is available with Brent Kelly across Portugal where assessment indicates it is appropriate. Before starting, you discuss suitability, preparation, privacy, your location and practical support arrangements." },
      { question: "How much does EMDR therapy in Portugal cost?", answer: "A 60-minute EMDR session with Brent Kelly costs €95, in Lisbon or online across Portugal. The free 30-minute initial Zoom call with Brent is a separate conversation to discuss your needs, not a paid therapy session. <a href=\"/fees/\">See fees and practical details</a>." },
      { question: "Can I book online EMDR from the UK?", answer: "Pathfinder has a separate <a href=\"/online-emdr-therapy-uk/\">UK online EMDR service</a> with Brent Kelly or Tim Felton. UK sessions cost £80 for 60 minutes and are online only, subject to assessment and availability. The Portugal fee is €95 for 60 minutes." },
      { question: "What happens before EMDR processing begins?", answer: "Brent discusses what brings you to therapy, assesses whether EMDR is suitable and agrees preparation and a pace with you. EMDR is not suitable for everyone; processing begins only when clinically appropriate." }
    ]
  },
  {
    slug: "online",
    route: "/therapy/online/",
    title: "Online Therapy in English | Portugal | Pathfinder Therapy",
    description:
      "Online therapy in English across Portugal with Pathfinder Therapy. Individual sessions from €75 for 50 minutes. Explore EMDR and a free 30-minute initial call.",
    canonical: "https://www.pathfindertherapy.com/therapy/online/",
    serviceType: "Online psychotherapy in English",
    providerId: "https://www.pathfindertherapy.com/#organization",
    areaServed: [{ "@type": "Country", name: "Portugal" }],
    label: "Anywhere in Portugal",
    h1: "Online therapy in English",
    heroLead: "Trauma-informed psychotherapy in English across Portugal, with online EMDR available following assessment and preparation.",
    image: "/assets/images/journal.webp",
    imageAlt: "Quiet workspace — secure online therapy with Pathfinder Therapy",
    fee: "€75",
    feeFrom: true,
    minPrice: "75",
    priceCurrency: "EUR",
    duration: "50 minutes",
    format: "Secure video sessions — same clinical approach as in-person work.",
    helpsWith: [
      "Trauma, anxiety and attachment difficulties",
      "Life transitions and expatriation",
      "Sessions when Lisbon attendance is difficult",
      "Continuity of care while travelling",
      "Privacy and convenience without losing relational depth"
    ],
    paragraphs: [
      "Online therapy offers relational, trauma-informed attention by secure video for adults across Portugal. Brent Kelly leads Pathfinder Therapy's Lisbon clinic and offers individual online therapy in English. Tim Felton and Sophie Gidley support online provision where clinically appropriate; Sophie offers <a href=\"/therapy/couples/\">online couples therapy</a>.",
      "Individual online sessions start from €75 for 50 minutes. <a href=\"/therapy/emdr/\">EMDR therapy with Brent in Portugal</a> costs €95 for 60 minutes, subject to assessment and preparation. Online couples sessions with Sophie cost €120 for 90 minutes. <a href=\"/fees/\">See the fees page</a> for practical details.",
      "For clients in the UK, our <a href=\"/online-emdr-therapy-uk/\">dedicated UK online EMDR service</a> is offered by Brent Kelly or Tim Felton at £80 for 60 minutes. This is an online-only service with its own assessment and arrangements.",
      "You do not need to travel to Lisbon to begin online therapy. Start with a free 30-minute initial Zoom call with Brent to discuss what you are looking for and whether online work is suitable. The initial call is separate from paid therapy; there is no obligation to continue."
    ],
    approach:
      "Online sessions are structured with the same care as clinic-based work: clear boundaries, confidentiality, and attention to creating a psychologically safe space on screen.",
    faqTitle: "Questions about online therapy in English",
    faqs: [
      { question: "Can I have online therapy in English from anywhere in Portugal?", answer: "Pathfinder Therapy offers online psychotherapy in English for adults across Portugal, including people who cannot attend the Lisbon clinic. Suitability and practical arrangements are discussed before therapy begins." },
      { question: "Who will I work with online?", answer: "Brent Kelly offers individual therapy and EMDR and leads the Lisbon clinic. Tim Felton supports online therapy, including the UK online EMDR service. Sophie Gidley offers online couples therapy. Your needs, practitioner preference and availability help determine the appropriate next step." },
      { question: "How much does online therapy cost in Portugal?", answer: "Individual online therapy starts from €75 for 50 minutes. EMDR with Brent Kelly costs €95 for 60 minutes. Online couples therapy with Sophie Gidley costs €120 for 90 minutes. <a href=\"/fees/\">Check fees and practical details</a> before booking." },
      { question: "Is online EMDR available for UK clients?", answer: "The <a href=\"/online-emdr-therapy-uk/\">dedicated UK online EMDR service</a> with Brent Kelly or Tim Felton costs £80 for a 60-minute session. UK EMDR appointments are online only and subject to assessment and availability." },
      { question: "How do you assess whether online therapy is suitable?", answer: "An initial conversation explores what you need and whether online work is appropriate. Before starting, your practitioner discusses your location, privacy, reliable internet access, connection interruptions and relevant support arrangements. EMDR also requires assessment and preparation." },
      { question: "Is the first therapy session free?", answer: "The initial 30-minute Zoom call with Brent is free. It is a conversation to discuss your needs and possible next steps, separate from a paid therapy session. Ongoing therapy is paid at the relevant service fee." }
    ]
  }
];

export function getServicePageRoutes() {
  return SERVICE_PAGES.map((page) => page.route);
}

function buildHelpsList(items) {
  return `<ul class="pfServicePanelList">${items
    .map((item) => `<li>${CHECK}<span>${item}</span></li>`)
    .join("")}</ul>`;
}

function buildRelatedServices(currentSlug) {
  const others = SERVICE_PAGES.filter((page) => page.slug !== currentSlug);
  const cards = others
    .map(
      (page) => `<a class="pfExploreCard" href="${page.route}" aria-label="${page.h1} — explore more">
  <img src="${page.image}" width="400" height="260" alt="" loading="lazy" decoding="async" />
  <span class="pfExploreCardOverlay" aria-hidden="true"></span>
  <h3 class="pfExploreCardTitle">${page.h1}</h3>
</a>`
    )
    .join("");

  return `<section class="pfExploreMore" aria-labelledby="explore-more">
  <div class="pfSectionInner" style="max-width:1180px;margin:0 auto">
    <div class="pfSectionHead">
      <p class="pfKicker">Explore more</p>
      <h2 class="pfSectionTitle" id="explore-more" style="color:var(--pf-stone)">Related therapy services</h2>
    </div>
    <div class="pfExploreGrid">${cards}</div>
  </div>
</section>`;
}

function buildWhatHappensSection() {
  const steps = WHAT_HAPPENS.map(
    (step) => `<li><h3>${step.title}</h3><p>${step.copy}</p></li>`
  ).join("");
  return `<section class="pfServiceDark" aria-labelledby="service-next">
  <div class="pfServiceDarkInner">
    <div class="pfSectionHead">
      <p class="pfKicker">Getting started</p>
      <h2 class="pfSectionTitle" id="service-next">What happens next</h2>
    </div>
    <ol class="pfServiceSteps">${steps}</ol>
    <p style="margin:0;font-size:var(--pf-text-body-sm);color:var(--pf-linen-muted)">Not ready to book? <a href="${ENQUIRY_PATH}" style="color:var(--pf-bronze-soft)">${ENQUIRY_LABEL}</a>.</p>
  </div>
</section>`;
}

function buildFinalCta() {
  return `<section class="pfServiceDark pfServiceFinal" aria-labelledby="service-final-cta">
  <div class="pfServiceDarkInner">
    <div class="pfSectionHead">
      <h2 class="pfSectionTitle" id="service-final-cta">${BOOKING_LABEL}</h2>
      <p class="pfSectionLead">Arrange a free, confidential 30-minute initial call with Brent by Zoom to discuss what brings you to therapy. This is separate from paid therapy, with no obligation to continue.</p>
    </div>
    <div class="pfHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
  </div>
</section>`;
}

export function buildServicePageBody(service) {
  const copyBlocks = service.paragraphs.map((p) => `<p>${p}</p>`).join("");
  const faqs = service.faqs?.length ? `<section class="pfServiceFaq" aria-labelledby="service-faq-title">
    <h2 id="service-faq-title">${service.faqTitle}</h2>
    ${service.faqs.map((faq) => `<div class="pfServiceFaqItem"><h3>${faq.question}</h3><p>${faq.answer}</p></div>`).join("")}
  </section>` : "";
  return `<article class="pfServicePage">
  <header class="pfServiceHero">
    <div class="pfServiceHeroMedia" aria-hidden="true">
      <img src="${service.image}" width="1440" height="640" alt="" fetchpriority="high" decoding="async" />
    </div>
    <div class="pfServiceHeroOverlay" aria-hidden="true"></div>
    <div class="pfServiceHeroContent">
      <a class="pfServiceBack" href="/therapy/">← Therapy overview</a>
      <p class="pfServiceLabel">${service.label}</p>
      <h1 class="pfServiceHeroTitle" id="service-title">${service.h1}</h1>
      <p class="pfServiceHeroLead">${service.heroLead}</p>
    </div>
  </header>
  <div class="pfServiceMain">
    <div class="pfServiceMainInner">
      <div class="pfServiceCopy">
        ${copyBlocks}
        <h2>Therapeutic approach</h2>
        <p>${service.approach}</p>
        ${faqs}
      </div>
      <aside class="pfServicePanel" aria-labelledby="service-helps">
        <h2 id="service-helps">This may help with</h2>
        ${buildHelpsList(service.helpsWith)}
        <p class="pfServicePanelMeta"><strong>${service.duration}</strong> · ${service.format}<br><strong>${service.feeFrom ? "From " : ""}${service.fee}</strong> per session · <a href="/fees/">See fees</a></p>
        <div class="pfServicePanelActions">
          <a class="pfPanelCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
          <a class="pfHeroTextLink" href="${ENQUIRY_PATH}" style="justify-content:center;min-height:44px">${ENQUIRY_LABEL}</a>
        </div>
      </aside>
    </div>
  </div>
  ${buildWhatHappensSection()}
  ${buildRelatedServices(service.slug)}
  ${buildFinalCta()}
</article>`;
}

export function buildServicePage(shellHtml, service) {
  const parts = extractPageParts(shellHtml);
  const preload = `<link rel="preload" as="image" href="${service.image}">`;
  const schema = `${buildServiceSchema({
    name: service.h1,
    description: service.description,
    url: service.canonical,
    serviceType: service.serviceType,
    providerId: service.providerId,
    areaServed: service.areaServed,
    price: service.price,
    minPrice: service.minPrice,
    priceCurrency: service.priceCurrency
  })}
${buildBreadcrumbSchema([
    { name: "Home", url: "https://www.pathfindertherapy.com/" },
    { name: "Therapy", url: "https://www.pathfindertherapy.com/therapy/" },
    { name: service.h1, url: service.canonical }
  ])}${service.faqs?.length ? buildFaqSchema(service.faqs) : ""}`;
  let head = parts.head.replace("</head>", `${preload}\n${schema}\n${SERVICE_PAGE_CSS}\n</head>`);
  let html = wrapInShellV2({
    ...parts,
    head,
    route: service.route,
    mainInner: buildServicePageBody(service),
    interior: false
  });
  if (service.slug === "couples") {
    const couplesBooking = new URL(BOOKING_PATH);
    couplesBooking.searchParams.set("intent", "couples");
    html = html.replaceAll(`href="${BOOKING_PATH}"`, `href="${couplesBooking.toString()}"`);
  }
  return html;
}

export function buildAllServicePages(shellHtml) {
  return SERVICE_PAGES.map((service) => ({
    route: service.route,
    html: buildServicePage(shellHtml, service),
    meta: {
      title: service.title,
      description: service.description,
      canonical: service.canonical
    }
  }));
}
