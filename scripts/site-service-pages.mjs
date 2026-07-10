import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";
import { extractPageParts, wrapInShellV2 } from "./site-shell-v2.mjs";

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
  { title: "Choose a consultation time", copy: "Select a convenient time through the secure booking page." },
  { title: "Meet Brent by Zoom", copy: "Use the initial conversation to briefly discuss what brings you to therapy and ask questions." },
  { title: "Decide on the next step", copy: "There is no obligation to continue unless the working relationship feels appropriate." }
];

export const SERVICE_PAGES = [
  {
    slug: "individual",
    route: "/therapy/individual/",
    title: "Individual Therapy | Pathfinder Therapy Lisbon",
    description:
      "Trauma-informed individual psychotherapy for adults in Lisbon and online. Confidential 50-minute sessions from €75 with Brent Kelly.",
    canonical: "https://www.pathfindertherapy.com/therapy/individual/",
    label: "For adults",
    h1: "Individual therapy",
    heroLead: "A steady one-to-one space to make sense of what you carry — and to move differently through it.",
    image: "/assets/images/understanding.webp",
    imageAlt: "Atmospheric forest path — individual therapy at Pathfinder Therapy Lisbon",
    fee: "€75",
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
      "Individual therapy offers a regular, confidential space that belongs to you. Brent works relationally and in a trauma-informed way — drawing on Transactional Analysis, EMDR where appropriate, and steady attention to what your mind and body may still be protecting.",
      "Sessions are 50 minutes, in person at the Lisbon clinic or securely online across Portugal and internationally where appropriate. Therapy is paced carefully; you do not need a diagnosis to begin.",
      "Brent works with adults navigating trauma, anxiety, attachment difficulties, military experiences, expatriation, and significant life transitions — always in English."
    ],
    approach:
      "Therapy is collaborative rather than formulaic. Brent listens carefully, asks thoughtful questions, and works at a pace that respects your nervous system — with evidence-informed methods including EMDR where clinically appropriate."
  },
  {
    slug: "couples",
    route: "/therapy/couples/",
    title: "Couples Therapy | Pathfinder Therapy Lisbon",
    description:
      "Relational couples therapy in Lisbon and online. 90-minute sessions from €120 with Brent Kelly — trauma-informed and English-speaking.",
    canonical: "https://www.pathfindertherapy.com/therapy/couples/",
    label: "For couples",
    h1: "Couples therapy",
    heroLead: "Relational work for couples navigating conflict, disconnection, and repeating patterns.",
    image: "/assets/images/working-together.webp",
    imageAlt: "Warm therapy room — couples therapy at Pathfinder Therapy Lisbon",
    fee: "€120",
    duration: "90 minutes",
    format: "In person at the Lisbon clinic or securely online where appropriate.",
    helpsWith: [
      "Conflict and difficult conversations",
      "Disconnection and loss of intimacy",
      "Trust, attachment and repeating patterns",
      "Life transitions affecting the relationship",
      "Deciding whether and how to move forward together"
    ],
    paragraphs: [
      "Couples therapy offers a structured, confidential space to understand what is happening between you — not to assign blame, but to see patterns clearly and explore whether change feels possible.",
      "Sessions are 90 minutes, allowing time to slow down, listen, and work with what arises. Brent works relationally and trauma-informed, with attention to how past experiences may shape present dynamics.",
      "Couples can attend in person at the Lisbon clinic or online where appropriate. An initial consultation is a good first step if you are unsure whether couples work feels right."
    ],
    approach:
      "Brent holds a steady, non-judgemental space for both partners. Work may draw on Transactional Analysis and trauma-informed understanding — always paced to what the relationship can hold in the room."
  },
  {
    slug: "emdr",
    route: "/therapy/emdr/",
    title: "EMDR Therapy | Pathfinder Therapy Lisbon",
    description:
      "EMDR within trauma-informed psychotherapy in Lisbon and online. 60-minute sessions from €95 with Brent Kelly, EATA registered.",
    canonical: "https://www.pathfindertherapy.com/therapy/emdr/",
    label: "Trauma processing",
    h1: "EMDR",
    heroLead: "Eye Movement Desensitisation and Reprocessing within broader trauma-informed care — paced carefully around your nervous system.",
    image: "/assets/images/hero-01.webp",
    imageAlt: "Atmospheric landscape — EMDR within trauma-informed psychotherapy",
    fee: "€95",
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
      "Work takes place in English, in person at the Lisbon clinic or online where appropriate. Brent is EATA registered with training in EMDR as part of integrative trauma-informed practice."
    ],
    approach:
      "EMDR is integrated thoughtfully with relational psychotherapy and nervous-system awareness. Brent does not rush processing — stabilisation and trust in the therapeutic relationship come first."
  },
  {
    slug: "online",
    route: "/therapy/online/",
    title: "Online Therapy | Pathfinder Therapy Lisbon",
    description:
      "Secure online psychotherapy in English across Portugal and internationally where appropriate. 50-minute sessions from €75 with Brent Kelly.",
    canonical: "https://www.pathfindertherapy.com/therapy/online/",
    label: "Anywhere in Portugal",
    h1: "Online therapy",
    heroLead: "Secure English-speaking psychotherapy when travel, location or schedule makes in-person sessions difficult.",
    image: "/assets/images/journal.webp",
    imageAlt: "Quiet workspace — secure online therapy with Pathfinder Therapy",
    fee: "€75",
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
      "Online therapy offers the same relational, trauma-informed approach as in-person work — held securely by video. Brent works with adults and couples across Portugal and internationally where clinically and practically appropriate.",
      "Individual online sessions are 50 minutes from €75. Couples sessions online follow the same fee structure as in person — see the fees page for current rates.",
      "You do not need to be in Lisbon to begin. An initial consultation by Zoom is often the simplest way to discuss what you are looking for and whether online work feels appropriate."
    ],
    approach:
      "Online sessions are structured with the same care as clinic-based work: clear boundaries, confidentiality, and attention to creating a psychologically safe space on screen."
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
      <p class="pfSectionLead">Arrange a short confidential consultation by Zoom to discuss what brings you to therapy and whether working together may feel appropriate.</p>
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
      </div>
      <aside class="pfServicePanel" aria-labelledby="service-helps">
        <h2 id="service-helps">This may help with</h2>
        ${buildHelpsList(service.helpsWith)}
        <p class="pfServicePanelMeta"><strong>${service.duration}</strong> · ${service.format}<br><strong>${service.fee}</strong> per session · <a href="/fees/">See fees</a></p>
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
  let head = parts.head.replace("</head>", `${preload}\n${SERVICE_PAGE_CSS}\n</head>`);
  let html = wrapInShellV2({
    ...parts,
    head,
    route: service.route,
    mainInner: buildServicePageBody(service),
    interior: false
  });
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
