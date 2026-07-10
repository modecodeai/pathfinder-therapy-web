import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";
import { buildEataBadge } from "./site-eata.mjs";
import { buildPublicFeedbackSection } from "./site-reviews.mjs";

export const HOMEPAGE_VISUAL_CSS = `<style id="pathfinder-home-visual">
.lpHome { display: grid; gap: 0; }
.pfHero { position: relative; min-height: min(88vh, 760px); display: grid; align-items: center; padding: clamp(48px, 8vw, 96px) var(--pf-space-inline); background: linear-gradient(135deg, rgba(10,15,13,.92) 0%, rgba(10,15,13,.78) 45%, rgba(10,15,13,.88) 100%), url(/assets/images/hero-01.webp) center/cover no-repeat; overflow: hidden; }
.pfHero::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 70% 40%, rgba(200,154,88,.06), transparent 60%); pointer-events: none; }
.pfHeroInner { position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .5fr); gap: clamp(24px, 4vw, 48px); align-items: center; }
.pfHeroCopy { display: grid; gap: clamp(16px, 2.5vw, 22px); max-width: 38rem; }
.pfHeroMark { width: 72px; height: 72px; opacity: .35; }
.pfHeroActions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.pfHeroTrust { margin: 0; font-family: var(--pf-font-sans); font-size: 0.8125rem; color: rgba(246,242,234,.62); letter-spacing: .02em; }
.pfHeroTextLink { display: inline-flex; align-items: center; min-height: 44px; padding: 0 4px; color: var(--pf-bronze-soft); font-family: var(--pf-font-sans); font-size: 0.9375rem; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
.pfConcernGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.pfConcernCard { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 14px; padding: 18px; border: 1px solid var(--pf-border-light); border-radius: var(--pf-radius-md); background: #fff; transition: border-color var(--pf-duration), box-shadow var(--pf-duration); }
.pfConcernCard:hover, .pfConcernCard:focus-within { border-color: rgba(200,154,88,.35); box-shadow: var(--pf-shadow-card); }
.pfConcernIcon { width: 48px; height: 48px; border-radius: var(--pf-radius-sm); display: grid; place-items: center; background: rgba(200,154,88,.12); color: var(--pf-bronze); }
.pfConcernCard h3 { margin: 0 0 6px; font-family: var(--pf-font-serif); font-size: 1.125rem; font-weight: 600; color: var(--pf-stone); }
.pfConcernCard p { margin: 0 0 8px; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: var(--pf-stone-muted); }
.pfConcernCard a { font-family: var(--pf-font-sans); font-size: 0.8125rem; font-weight: 600; color: var(--pf-bronze); text-decoration: none; }
.pfConcernCard a:hover { text-decoration: underline; }
.pfProcessWrap { position: relative; display: grid; gap: clamp(28px, 4vw, 40px); }
.pfProcessPath { position: absolute; left: 50%; top: 12%; bottom: 12%; width: 2px; transform: translateX(-50%); background: linear-gradient(180deg, transparent, rgba(200,154,88,.35), rgba(200,154,88,.35), transparent); }
.pfProcessStages { display: grid; gap: clamp(32px, 5vw, 48px); position: relative; z-index: 1; }
.pfProcessStage { display: grid; grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr); gap: clamp(16px, 3vw, 32px); align-items: center; }
.pfProcessStage:nth-child(even) .pfProcessContent { grid-column: 3; }
.pfProcessStage:nth-child(even) .pfProcessNode { grid-column: 2; }
.pfProcessStage:nth-child(odd) .pfProcessContent { grid-column: 1; }
.pfProcessStage:nth-child(odd) .pfProcessNode { grid-column: 2; }
.pfProcessStage:nth-child(odd) .pfProcessSpacer { grid-column: 3; }
.pfProcessStage:nth-child(even) .pfProcessSpacer { grid-column: 1; }
.pfProcessNode { width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(200,154,88,.5); display: grid; place-items: center; font-family: var(--pf-font-sans); font-size: 0.875rem; font-weight: 700; color: var(--pf-bronze-soft); background: var(--pf-forest-elevated); }
.pfProcessContent { padding: 20px 22px; border: 1px solid var(--pf-border-dark); border-radius: var(--pf-radius-md); background: rgba(15,24,22,.72); }
.pfProcessContent h3 { margin: 0 0 8px; font-family: var(--pf-font-serif); font-size: 1.25rem; color: var(--pf-linen); }
.pfProcessContent p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: var(--pf-linen-muted); }
.pfAboutSplit { display: grid; grid-template-columns: minmax(280px, .95fr) minmax(0, 1.05fr); gap: clamp(28px, 5vw, 48px); align-items: center; }
.pfAboutPortrait { margin: 0; border-radius: var(--pf-radius-lg); overflow: hidden; box-shadow: var(--pf-shadow-soft); }
.pfAboutPortrait img { display: block; width: 100%; height: auto; aspect-ratio: 4/5; object-fit: cover; }
.pfAboutCopy { display: grid; gap: 16px; }
.pfAboutCopy p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body); line-height: var(--pf-leading-body); color: var(--pf-stone-muted); }
.pfCredentials { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); color: var(--pf-stone); }
.pfServiceList { display: grid; gap: 0; border: 1px solid var(--pf-border-light); border-radius: var(--pf-radius-lg); overflow: hidden; background: #fff; }
.pfServiceRow { display: grid; grid-template-columns: 88px minmax(0, 1fr) auto; gap: clamp(16px, 2.5vw, 24px); align-items: center; padding: clamp(16px, 2.5vw, 22px); border-bottom: 1px solid var(--pf-border-light); text-decoration: none; color: inherit; min-height: 44px; transition: background var(--pf-duration); }
.pfServiceRow:last-child { border-bottom: none; }
.pfServiceRow:hover, .pfServiceRow:focus-visible { background: rgba(200,154,88,.06); outline: none; }
.pfServiceThumb { width: 88px; height: 64px; border-radius: var(--pf-radius-sm); object-fit: cover; }
.pfServiceMeta { display: grid; gap: 4px; }
.pfServiceLabel { margin: 0; font-family: var(--pf-font-sans); font-size: 0.6875rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--pf-bronze); }
.pfServiceMeta h3 { margin: 0; font-family: var(--pf-font-serif); font-size: 1.2rem; font-weight: 600; color: var(--pf-stone); }
.pfServiceMeta p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: 1.55; color: var(--pf-stone-muted); }
.pfServiceArrow { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--pf-border-light); display: grid; place-items: center; color: var(--pf-bronze); flex-shrink: 0; }
.pfReassuranceStrip { margin: 0; padding: clamp(22px, 3vw, 28px); border: 1px solid var(--pf-border-dark); border-radius: var(--pf-radius-md); background: rgba(15,24,22,.65); display: grid; gap: 14px; max-width: 44rem; }
.pfReassuranceStrip h2 { margin: 0; font-family: var(--pf-font-serif); font-size: clamp(1.2rem, 2.4vw, 1.45rem); color: var(--pf-linen); }
.pfReassuranceStrip p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body); line-height: var(--pf-leading-body); color: var(--pf-linen-muted); }
.pfFinalCta { text-align: center; }
.pfFinalCta .pfSectionHead { margin-inline: auto; text-align: center; }
.pfFinalCta .pfHeroActions { justify-content: center; }
.pfGeoQuiet { opacity: .9; }
.pfGeoQuiet .pfSectionTitle { font-size: clamp(1.2rem, 2vw, 1.45rem); font-weight: 500; }
.pfGeoGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.pfGeoCard { padding: 14px 16px; border: 1px solid var(--pf-border-dark); border-radius: var(--pf-radius-sm); background: rgba(10,15,13,.35); }
.pfGeoCard h3 { margin: 0 0 6px; font-family: var(--pf-font-sans); font-size: 0.9375rem; font-weight: 600; }
.pfGeoCard h3 a { color: var(--pf-linen); text-decoration: none; }
.pfGeoCard h3 a:hover { color: var(--pf-bronze-soft); }
.pfGeoCard p { margin: 0; font-size: 0.8125rem; line-height: 1.55; color: rgba(246,242,234,.58); }
.pfStepsGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
.pfStepCard { padding: 20px; border: 1px solid var(--pf-border-dark); border-radius: var(--pf-radius-md); background: rgba(15,24,22,.5); display: grid; gap: 8px; }
.pfStepCard h3 { margin: 0; font-family: var(--pf-font-serif); font-size: 1.05rem; color: var(--pf-linen); }
.pfStepCard p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: var(--pf-linen-muted); }
@media (max-width: 900px) {
  .pfHeroInner { grid-template-columns: 1fr; }
  .pfHeroMark { display: none; }
  .pfConcernGrid { grid-template-columns: 1fr; }
  .pfProcessPath { display: none; }
  .pfProcessStage, .pfProcessStage:nth-child(even) { grid-template-columns: 56px minmax(0, 1fr); }
  .pfProcessStage .pfProcessContent, .pfProcessStage:nth-child(even) .pfProcessContent { grid-column: 2; }
  .pfProcessStage .pfProcessNode, .pfProcessStage:nth-child(even) .pfProcessNode { grid-column: 1; }
  .pfProcessSpacer { display: none; }
  .pfAboutSplit { grid-template-columns: 1fr; }
  .pfAboutPortrait { max-width: 320px; }
  .pfServiceRow { grid-template-columns: 72px minmax(0, 1fr); }
  .pfServiceArrow { display: none; }
  .pfServiceThumb { width: 72px; height: 56px; }
  .pfStepsGrid, .pfGeoGrid { grid-template-columns: 1fr; }
  .pfHeroActions { flex-direction: column; align-items: stretch; }
  .pfHeroActions .lpPrimaryCta { width: 100%; }
}
</style>`;

const CONCERN_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 3c-4 3-7 7-7 11a7 7 0 1014 0c0-4-3-8-7-11z" stroke="currentColor" stroke-width="1.5"/></svg>`;

const PROCESS_STAGES = [
  {
    title: "Understand",
    copy: "Explore what happened, how you adapted, and what your feelings and body responses may still be trying to protect."
  },
  {
    title: "Heal",
    copy: "Trauma-informed psychotherapy and EMDR where appropriate — paced carefully around your nervous system."
  },
  {
    title: "Move forward",
    copy: "Therapy shaped around your life, not a formula. Relational, integrated, and grounded in real conversation."
  }
];

const SERVICES = [
  {
    href: "/therapy/individual/",
    label: "For adults",
    title: "Individual therapy",
    copy: "Trauma-informed psychotherapy for adults — anxiety, trauma, attachment, and life transitions.",
    image: "/assets/images/understanding.webp",
    alt: "Forest path — individual therapy"
  },
  {
    href: "/therapy/couples/",
    label: "For couples",
    title: "Couples therapy",
    copy: "Relational work for couples navigating conflict, disconnection, and repeating patterns.",
    image: "/assets/images/working-together.webp",
    alt: "Therapy room — couples therapy"
  },
  {
    href: "/therapy/emdr/",
    label: "Trauma processing",
    title: "EMDR",
    copy: "Eye Movement Desensitisation and Reprocessing where clinically appropriate for trauma processing.",
    image: "/assets/images/hero-01.webp",
    alt: "Atmospheric landscape — EMDR within trauma-informed care"
  },
  {
    href: "/therapy/online/",
    label: "Anywhere in Portugal",
    title: "Online therapy",
    copy: "Secure online sessions across Portugal and internationally where appropriate.",
    image: "/assets/images/journal.webp",
    alt: "Quiet workspace — online therapy"
  }
];

function buildProcessSection() {
  const stages = PROCESS_STAGES.map(
    (stage, index) => `<div class="pfProcessStage">
  <div class="pfProcessSpacer" aria-hidden="true"></div>
  <div class="pfProcessNode" aria-hidden="true">${index + 1}</div>
  <div class="pfProcessContent">
    <h3>${stage.title}</h3>
    <p>${stage.copy}</p>
  </div>
</div>`
  ).join("");

  return `<section class="pfSection pfSection--dark" aria-labelledby="home-approach">
  <div class="pfSectionInner">
    <div class="pfSectionHead">
      <p class="pfKicker">The Pathfinder process</p>
      <h2 class="pfSectionTitle" id="home-approach">Understand · Heal · Move forward</h2>
      <p class="pfSectionLead">Pathfinder is a space to understand what has shaped you, what still protects you, and what might now be ready to change.</p>
    </div>
    <div class="pfProcessWrap">
      <div class="pfProcessPath" aria-hidden="true"></div>
      <div class="pfProcessStages">${stages}</div>
    </div>
    <div class="pfHeroActions" style="margin-top:28px">
      <a class="pfHeroTextLink" href="/approach/">Read about the approach</a>
    </div>
  </div>
</section>`;
}

function buildConcernsSection() {
  return `<section class="pfSection pfSection--light" aria-labelledby="home-who">
  <div class="pfSectionInner">
    <div class="pfSectionHead">
      <h2 class="pfSectionTitle" id="home-who">You do not need to have everything figured out.</h2>
      <p class="pfSectionLead">Many people begin with a feeling, a pattern, or a sense that something needs attention — not a diagnosis.</p>
    </div>
    <div class="pfConcernGrid">
      <article class="pfConcernCard">
        <div class="pfConcernIcon">${CONCERN_ICON}</div>
        <div>
          <h3>Trauma and anxiety</h3>
          <p>When the past still shapes the present — including PTSD, complex trauma, and persistent anxiety.</p>
          <a href="/therapy/">How therapy helps →</a>
        </div>
      </article>
      <article class="pfConcernCard">
        <div class="pfConcernIcon">${CONCERN_ICON}</div>
        <div>
          <h3>Attachment and relationships</h3>
          <p>Individual and couples therapy for patterns that repeat in intimacy, trust, and communication.</p>
          <a href="/therapy/">Couples &amp; individual therapy →</a>
        </div>
      </article>
      <article class="pfConcernCard">
        <div class="pfConcernIcon">${CONCERN_ICON}</div>
        <div>
          <h3>Identity and life transitions</h3>
          <p>Support through change, expatriation, military experiences, and periods when life no longer fits.</p>
          <a href="/about/">About Brent →</a>
        </div>
      </article>
      <article class="pfConcernCard">
        <div class="pfConcernIcon">${CONCERN_ICON}</div>
        <div>
          <h3>Emotional shutdown or overwhelm</h3>
          <p>When feelings feel distant, unmanageable, or difficult to name — therapy offers a steady place to begin.</p>
          <a href="/therapy/">Explore therapy →</a>
        </div>
      </article>
    </div>
  </div>
</section>`;
}

function buildAboutSection() {
  return `<section class="pfSection pfSection--light" aria-labelledby="home-about">
  <div class="pfSectionInner">
    <div class="pfAboutSplit">
      <figure class="pfAboutPortrait">
        <img src="/assets/images/about-brent.webp" width="480" height="600" alt="Brent Kelly, therapist at Pathfinder Therapy Lisbon" loading="lazy" decoding="async" />
      </figure>
      <div class="pfAboutCopy">
        <p class="pfKicker">About Brent</p>
        <h2 class="pfSectionTitle" id="home-about">Relationship focused. Personal and authentic.</h2>
        <p>Pathfinder is built around evidence-informed care, real conversation, and a steady therapeutic relationship. Brent Kelly works with adults and couples in English — in Lisbon and online.</p>
        <p class="pfCredentials"><strong>EATA registered</strong> · EMDR · Transactional Analysis · clinical supervision</p>
        ${buildEataBadge()}
        <div class="pfHeroActions">
          <a class="lpSecondaryCta" href="/about/">Meet Brent →</a>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function buildReassuranceStrip() {
  return `<section class="pfSection pfSection--dark" style="padding-top:0">
  <div class="pfSectionInner">
    <div class="pfReassuranceStrip" aria-labelledby="home-reassurance">
      <h2 id="home-reassurance">Not sure where to begin?</h2>
      <p>Arrange a confidential initial conversation directly, or send an enquiry first if you would prefer to ask a question.</p>
      <div class="pfHeroActions">
        <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
        <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
      </div>
    </div>
  </div>
</section>`;
}

function buildServicesSection() {
  const rows = SERVICES.map(
    (service) => `<a class="pfServiceRow" href="${service.href}" aria-label="${service.title} — learn more">
  <img class="pfServiceThumb" src="${service.image}" width="88" height="64" alt="" loading="lazy" decoding="async" />
  <div class="pfServiceMeta">
    <p class="pfServiceLabel">${service.label}</p>
    <h3>${service.title}</h3>
    <p>${service.copy}</p>
  </div>
  <span class="pfServiceArrow" aria-hidden="true">↗</span>
</a>`
  ).join("");

  return `<section class="pfSection pfSection--muted" aria-labelledby="home-services">
  <div class="pfSectionInner">
    <div class="pfSectionHead">
      <p class="pfKicker">Therapy services</p>
      <h2 class="pfSectionTitle" id="home-services">Ways we can walk this together</h2>
      <p class="pfSectionLead">Therapy shaped around your life — in person at our Lisbon clinic or securely online.</p>
    </div>
    <div class="pfServiceList">${rows}</div>
    <div class="pfHeroActions" style="margin-top:24px">
      <a class="lpSecondaryCta" href="/fees/">See fees</a>
    </div>
  </div>
</section>`;
}

function buildWhatHappensNext() {
  return `<section class="pfSection pfSection--dark" aria-labelledby="home-next">
  <div class="pfSectionInner">
    <div class="pfSectionHead">
      <p class="pfKicker">Getting started</p>
      <h2 class="pfSectionTitle" id="home-next">What happens next</h2>
    </div>
    <ol class="pfStepsGrid">
      <li class="pfStepCard">
        <h3>Choose an initial consultation</h3>
        <p>Select a convenient time for a short confidential conversation.</p>
      </li>
      <li class="pfStepCard">
        <h3>Talk about what brings you here</h3>
        <p>You can ask questions and briefly explain what you are looking for.</p>
      </li>
      <li class="pfStepCard">
        <h3>Decide whether it feels right</h3>
        <p>There is no obligation to continue unless the working relationship feels appropriate.</p>
      </li>
    </ol>
  </div>
</section>`;
}

function buildFinalCta() {
  return `<section class="pfSection pfSection--dark pfFinalCta" aria-labelledby="home-final-cta">
  <div class="pfSectionInner">
    <div class="pfSectionHead">
      <h2 class="pfSectionTitle" id="home-final-cta">${BOOKING_LABEL}</h2>
      <p class="pfSectionLead">Choose a convenient time for a confidential initial conversation by Zoom — or send an enquiry first if you would prefer to ask a question.</p>
    </div>
    <div class="pfHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
  </div>
</section>`;
}

const GEO_LINKS = `<section class="pfSection pfSection--dark pfGeoQuiet" aria-labelledby="home-lisbon">
  <div class="pfSectionInner">
    <div class="pfSectionHead">
      <p class="pfKicker">Further reading</p>
      <h2 class="pfSectionTitle" id="home-lisbon">Therapy in Lisbon</h2>
      <p class="pfSectionLead">English-speaking psychotherapy in central Lisbon and securely online across Portugal.</p>
    </div>
    <div class="pfGeoGrid">
      <article class="pfGeoCard"><h3><a href="/psychotherapy-lisbon/">Psychotherapy Lisbon</a></h3><p>Trauma-informed psychotherapy for adults and couples — in person or online.</p></article>
      <article class="pfGeoCard"><h3><a href="/trauma-therapy-lisbon/">Trauma therapy Lisbon</a></h3><p>Support for PTSD, complex trauma, and anxiety — EMDR where appropriate.</p></article>
      <article class="pfGeoCard"><h3><a href="/emdr-therapy-lisbon/">EMDR therapy Lisbon</a></h3><p>Eye Movement Desensitisation and Reprocessing within trauma-informed care.</p></article>
      <article class="pfGeoCard"><h3><a href="/english-speaking-therapist-lisbon/">English-speaking therapist</a></h3><p>Therapy in English for expats and international clients in Lisbon.</p></article>
    </div>
  </div>
</section>`;

export function buildVisualHomePageBody() {
  return `<div class="lpHome">
  <section class="pfHero lpHomeHeroWrap" aria-labelledby="home-title">
    <div class="pfHeroInner">
      <div class="pfHeroCopy">
        <p class="pfKicker">English-speaking therapy · Lisbon and online</p>
        <h1 class="pfTitle" id="home-title">Trauma-informed psychotherapy in Lisbon and online</h1>
        <p class="pfLead" style="color:rgba(246,242,234,.84)">Therapy for adults and couples navigating trauma, anxiety, attachment difficulties and significant life transitions.</p>
        <div class="pfHeroActions">
          <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
          <a class="pfHeroTextLink" href="/therapy/">Explore therapy</a>
        </div>
        <p class="pfHeroTrust">EATA registered · Confidential · Sessions from €75</p>
      </div>
      <div class="pfHeroMark" aria-hidden="true">
        <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" stroke="#c89a58" stroke-width="1" opacity=".5"/><path d="M16 52c12-18 24-26 40-30 8 10 12 22 12 34" stroke="#c89a58" stroke-width="1.5" stroke-linecap="round"/></svg>
      </div>
    </div>
  </section>
  ${buildConcernsSection()}
  ${buildProcessSection()}
  ${buildAboutSection()}
  ${buildReassuranceStrip()}
  ${buildServicesSection()}
  ${buildWhatHappensNext()}
  ${buildPublicFeedbackSection({ visual: true })}
  ${buildFinalCta()}
  ${GEO_LINKS}
</div>`;
}
