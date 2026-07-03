import {
  BOOKING_LABEL,
  BOOKING_PATH,
  extractPageParts,
  wrapInShellV2
} from "./site-shell-v2.mjs";

export const SPRINT2_CSS = `<style id="pathfinder-sprint2">
.lpHome { display: grid; gap: 0; }
.lpHomeHeroWrap { padding: clamp(24px, 4vw, 48px) clamp(16px, 3vw, 40px); border-bottom: 1px solid rgba(246,242,234,.08); background: linear-gradient(180deg, rgba(8,16,15,.2), rgba(8,16,15,.75)), url(/assets/images/hero-01.webp) center/cover no-repeat; }
.lpHomeHeroWrap .lpGrid { max-width: 1180px; margin: 0 auto; }
.lpSection { padding: clamp(40px, 6vw, 72px) clamp(16px, 3vw, 40px); border-bottom: 1px solid rgba(246,242,234,.06); max-width: 1180px; margin: 0 auto; }
.lpSectionHead { display: grid; gap: 12px; max-width: 40rem; margin-bottom: 28px; }
.lpSectionTitle { margin: 0; font-family: Georgia, serif; font-size: clamp(1.6rem, 3vw, 2.2rem); line-height: 1.12; color: #f6f2ea; font-weight: 600; }
.lpSectionLead { margin: 0; font-size: 1.05rem; line-height: 1.7; color: rgba(246,242,234,.72); }
.lpCardGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.lpCard { padding: 20px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.45); display: grid; gap: 10px; }
.lpCard h3 { margin: 0; font-size: 1.05rem; color: #f6f2ea; font-weight: 600; }
.lpCard p { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.lpCard a { color: #d9b777; font-size: 13px; font-weight: 600; text-decoration: none; }
.lpServiceGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.lpServiceCard { padding: 18px; border: 1px solid rgba(200,154,88,.22); border-radius: 14px; background: rgba(200,154,88,.06); }
.lpServiceCard h3 { margin: 0 0 8px; font-size: 1rem; color: #f6f2ea; }
.lpServiceCard p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.68); }
.lpFaqList { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.lpFaqList details { border: 1px solid rgba(246,242,234,.1); border-radius: 12px; padding: 14px 16px; background: rgba(8,16,15,.35); }
.lpFaqList summary { cursor: pointer; font-weight: 600; color: #f6f2ea; list-style: none; }
.lpFaqList summary::-webkit-details-marker { display: none; }
.lpFaqList p { margin: 12px 0 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.lpPullQuote { margin: 0; padding: 48px clamp(16px, 3vw, 40px) 64px; text-align: center; font-family: Georgia, serif; font-size: clamp(1.4rem, 3vw, 1.9rem); font-style: italic; color: rgba(246,242,234,.58); max-width: 1180px; margin-inline: auto; }
.lpPageGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: clamp(24px, 4vw, 40px); align-items: start; padding: clamp(20px, 4vw, 40px) clamp(16px, 3vw, 40px) 64px; max-width: 1280px; margin: 0 auto; }
.lpPageContent { min-width: 0; }
.lpPageContent .siteMain, .lpPageContent .interiorMain, .lpPageContent .aboutPage, .lpPageContent .therapyPage { margin: 0 !important; width: 100% !important; }
.lpBookingPanel { position: sticky; top: 88px; display: grid; gap: 14px; padding: clamp(18px, 3vw, 22px); border: 1px solid rgba(246,242,234,.12); border-radius: 18px; background: rgba(8,16,15,.78); box-shadow: 0 24px 80px rgba(0,0,0,.24); }
.lpBookingPanelTitle { margin: 0; font-family: Georgia, serif; font-size: 1.35rem; line-height: 1.2; color: #f6f2ea; font-weight: 600; }
.lpBookingPanelText { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.72); }
.lpAboutStrip { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 20px; align-items: center; padding: 24px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.4); }
.lpAboutStrip img { width: 120px; height: 120px; border-radius: 12px; object-fit: cover; }
.lpAboutStrip p { margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: rgba(246,242,234,.76); }
@media (max-width: 900px) {
  .lpCardGrid, .lpServiceGrid { grid-template-columns: 1fr; }
  .lpPageGrid { grid-template-columns: 1fr; padding-bottom: 24px; }
  .lpBookingPanel { position: static; order: 2; }
  .lpPageContent { order: 1; }
  .lpAboutStrip { grid-template-columns: 1fr; text-align: left; }
  .lpAboutStrip img { width: 88px; height: 88px; border-radius: 50%; }
  .lpHomeHeroWrap .lpGrid { grid-template-columns: 1fr; }
  .lpHomeHeroWrap .lpHero { order: 1; }
  .lpHomeHeroWrap .lpBookingPanel { order: 2; }
}
</style>`;

const TRUST_PILLS = `<ul class="lpTrustList" aria-label="Professional reassurance">
  <li>NCPS registered</li>
  <li>Trauma-informed</li>
  <li>EMDR</li>
  <li>Confidential</li>
  <li>English-speaking</li>
</ul>`;

const STEPS = `<ol class="lpSteps" aria-label="What happens next">
  <li><span class="lpStepNum">1</span><span>Send a brief secure enquiry — no detailed history needed.</span></li>
  <li><span class="lpStepNum">2</span><span>Brent replies within one working day.</span></li>
  <li><span class="lpStepNum">3</span><span>Arrange your first session in Lisbon or online (from €75).</span></li>
</ol>`;

export function buildBookingPanel() {
  return `<aside class="lpBookingPanel" aria-label="Arrange a consultation">
  <p class="lpKicker">Next step</p>
  <h2 class="lpBookingPanelTitle">Book an initial Zoom call</h2>
  <p class="lpBookingPanelText">Choose a time for a confidential initial consultation via Zoom — or send a brief enquiry first if you prefer.</p>
  ${TRUST_PILLS}
  ${STEPS}
  <div class="lpHeroActions">
    <a class="lpPrimaryCta" href="/book/">Book initial Zoom call</a>
    <a class="lpSecondaryCta" href="${BOOKING_PATH}">Send a brief enquiry</a>
  </div>
  <p class="lpReassurance">Sessions from €75 · Lisbon clinic or secure online · Non-urgent enquiries only</p>
</aside>`;
}

export function wrapWithBookingPanel(mainInner) {
  return `<div class="lpPageGrid">
  <div class="lpPageContent">${mainInner}</div>
  ${buildBookingPanel()}
</div>`;
}

export function buildHomePageBody() {
  return `<div class="lpHome">
  <div class="lpHomeHeroWrap">
    <div class="lpGrid">
      <section class="lpHero" aria-labelledby="home-title">
        <p class="lpKicker">English-speaking psychotherapist · Lisbon clinic &amp; online</p>
        <h1 class="lpTitle" id="home-title">Trauma-informed psychotherapy with Brent Kelly in Lisbon and online.</h1>
        <p class="lpLead">Support for adults and couples navigating trauma, anxiety, attachment, and major life transitions — in person at our Lisbon clinic or securely online across Portugal.</p>
        <div class="lpHeroActions">
          <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
          <a class="lpSecondaryCta" href="https://wa.me/351914775365">WhatsApp Brent</a>
        </div>
        <div class="lpTherapist">
          <img src="/assets/images/about-brent.webp" width="72" height="72" alt="Brent Kelly, psychotherapist at Pathfinder Therapy Lisbon" loading="eager" decoding="async" />
          <div>
            <p class="lpTherapistName">Brent Kelly</p>
            <p class="lpTherapistRole">Registered psychotherapist · trauma, EMDR, veterans, couples &amp; individual therapy</p>
          </div>
        </div>
        ${TRUST_PILLS}
        ${STEPS}
      </section>
      ${buildBookingPanel()}
    </div>
  </div>

  <section class="lpSection" aria-labelledby="home-who">
    <div class="lpSectionHead">
      <p class="lpKicker">Who this is for</p>
      <h2 class="lpSectionTitle" id="home-who">You do not need to have everything figured out.</h2>
      <p class="lpSectionLead">Many people begin with a feeling, a pattern, or a sense that something needs attention — not a diagnosis.</p>
    </div>
    <div class="lpCardGrid">
      <article class="lpCard">
        <h3>Trauma &amp; anxiety</h3>
        <p>When the past still shapes the present — including PTSD, complex trauma, and persistent anxiety.</p>
        <a href="/therapy/">How therapy helps →</a>
      </article>
      <article class="lpCard">
        <h3>Relationships &amp; attachment</h3>
        <p>Individual and couples therapy for patterns that repeat in intimacy, trust, and communication.</p>
        <a href="/therapy/">Couples &amp; individual therapy →</a>
      </article>
      <article class="lpCard">
        <h3>Life transitions &amp; veterans</h3>
        <p>Support through change, expatriation, military experiences, and periods when life no longer fits.</p>
        <a href="/about/">About Brent →</a>
      </article>
    </div>
  </section>

  <section class="lpSection" aria-labelledby="home-approach">
    <div class="lpSectionHead">
      <p class="lpKicker">How therapy helps</p>
      <h2 class="lpSectionTitle" id="home-approach">What if your patterns make sense?</h2>
      <p class="lpSectionLead">Pathfinder is a space to understand what has shaped you, what still protects you, and what might now be ready to change. Therapy begins by listening carefully to the ways you have adapted — not by asking what is wrong with you.</p>
    </div>
    <div class="lpCardGrid">
      <article class="lpCard">
        <h3>Understand</h3>
        <p>Explore what happened, how you adapted, and what your feelings and body responses may still be trying to protect.</p>
      </article>
      <article class="lpCard">
        <h3>Heal</h3>
        <p>Trauma-informed psychotherapy and EMDR where appropriate — paced carefully around your nervous system.</p>
      </article>
      <article class="lpCard">
        <h3>Move forward</h3>
        <p>Therapy shaped around your life, not a formula. Relational, integrated, and grounded in real conversation.</p>
      </article>
    </div>
    <div class="lpHeroActions" style="margin-top:24px">
      <a class="lpSecondaryCta" href="/approach/">Read about the approach</a>
    </div>
  </section>

  <section class="lpSection" aria-labelledby="home-about">
    <div class="lpSectionHead">
      <p class="lpKicker">About Brent</p>
      <h2 class="lpSectionTitle" id="home-about">Relationship focused. Personal and authentic.</h2>
    </div>
    <div class="lpAboutStrip">
      <img src="/assets/images/about-brent.webp" width="120" height="120" alt="Brent Kelly, psychotherapist" loading="lazy" decoding="async" />
      <div>
        <p>Pathfinder is built around evidence-informed care, real conversation, and a steady therapeutic relationship. Brent works with adults and couples in English — in Lisbon and online.</p>
        <p><strong>NCPS registered</strong> · EMDR · Transactional Analysis · clinical supervision · military veterans experience</p>
        <a class="lpSecondaryCta" href="/about/" style="display:inline-flex;margin-top:8px">Meet Brent →</a>
      </div>
    </div>
  </section>

  <section class="lpSection" aria-labelledby="home-services">
    <div class="lpSectionHead">
      <p class="lpKicker">Services</p>
      <h2 class="lpSectionTitle" id="home-services">Therapy shaped around your life.</h2>
    </div>
    <div class="lpServiceGrid">
      <article class="lpServiceCard"><h3>Individual therapy</h3><p>Trauma-informed psychotherapy for adults — anxiety, trauma, attachment, and life transitions.</p></article>
      <article class="lpServiceCard"><h3>Couples therapy</h3><p>Relational work for couples navigating conflict, disconnection, and repeating patterns.</p></article>
      <article class="lpServiceCard"><h3>EMDR</h3><p>Eye Movement Desensitisation and Reprocessing where clinically appropriate for trauma processing.</p></article>
      <article class="lpServiceCard"><h3>Online therapy</h3><p>Secure online sessions across Portugal and internationally where appropriate.</p></article>
    </div>
    <div class="lpHeroActions" style="margin-top:24px">
      <a class="lpPrimaryCta" href="/therapy/">View therapy services</a>
      <a class="lpSecondaryCta" href="/fees/">See fees</a>
    </div>
  </section>

  <section class="lpSection" aria-labelledby="home-faq">
    <div class="lpSectionHead">
      <p class="lpKicker">Common questions</p>
      <h2 class="lpSectionTitle" id="home-faq">Clear answers before you reach out</h2>
    </div>
    <ul class="lpFaqList">
      <li><details><summary>How do I arrange an initial consultation?</summary><p>Use the <a href="${BOOKING_PATH}">consultation enquiry form</a>. Brent replies within one working day to arrange an initial conversation.</p></details></li>
      <li><details><summary>Can I see Brent in person or online?</summary><p>Yes — sessions are available at the Lisbon clinic (R. Rodrigues Sampaio 76) and securely online across Portugal.</p></details></li>
      <li><details><summary>How much do sessions cost?</summary><p>Individual sessions are from €75 for 50 minutes. See the <a href="/fees/">fees page</a> for details.</p></details></li>
      <li><details><summary>Do you offer EMDR and trauma therapy?</summary><p>Yes. Brent offers trauma-informed psychotherapy and EMDR where clinically appropriate.</p></details></li>
    </ul>
    <div class="lpHeroActions" style="margin-top:20px">
      <a class="lpSecondaryCta" href="/faq/">Read all FAQs</a>
    </div>
  </section>

  <p class="lpPullQuote">Every life leaves a trail.</p>
</div>`;
}

export function buildHomePageV2(homeHtml) {
  const parts = extractPageParts(homeHtml);
  let head = parts.head.replace("</head>", `${SPRINT2_CSS}\n</head>`);
  return wrapInShellV2({
    ...parts,
    head,
    route: "/",
    mainInner: buildHomePageBody(),
    interior: false
  });
}

export function applySprint2Transforms(html, route) {
  if (route !== "/therapy/" && route !== "/about/") {
    return html;
  }

  const parts = extractPageParts(html);
  const mainInner = wrapWithBookingPanel(parts.mainInner);
  let next = html.replace(
    /(<main class="lpMain[^"]*" id="main-content" tabindex="-1">\s*<div class="lpInteriorBody">)[\s\S]*(<\/div>\s*<\/main>)/,
    `$1${mainInner}$2`
  );
  next = next.replace('class="lpMain lpMainInterior"', 'class="lpMain"');
  if (!next.includes("pathfinder-sprint2")) {
    next = next.replace("</head>", `${SPRINT2_CSS}\n</head>`);
  }
  return next;
}
