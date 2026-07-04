import {
  BOOKING_LABEL,
  BOOKING_PATH,
  extractPageParts,
  wrapInShellV2
} from "./site-shell-v2.mjs";
import { buildEataBadge, EATA_BADGE_CSS } from "./site-eata.mjs";

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
.lpTrustStrip { display: grid; gap: 12px; margin-top: 4px; }
.lpTrustStripNote { margin: 0; font-size: 13px; line-height: 1.65; color: rgba(246,242,234,.62); max-width: 38rem; }
.lpAdLandingStrip { display: none; padding: 14px clamp(16px, 3vw, 40px); border-bottom: 1px solid rgba(200,154,88,.28); background: rgba(200,154,88,.08); }
.lpAdLandingStrip.isVisible { display: block; }
.lpAdLandingInner { max-width: 1180px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; justify-content: space-between; }
.lpAdLandingCopy { margin: 0; font-size: 14px; line-height: 1.55; color: rgba(246,242,234,.84); max-width: 36rem; }
.lpAdLandingActions { display: flex; flex-wrap: wrap; gap: 10px; }
.lpPageGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: clamp(32px, 5vw, 48px); align-items: start; padding: clamp(20px, 4vw, 40px) clamp(16px, 3vw, 40px) 64px; max-width: 1280px; margin: 0 auto; }
.lpPageContent { min-width: 0; overflow: hidden; }
.lpLocalLanding { width: 100%; margin: 0; }
.lpLocalHero { display: grid; gap: 18px; padding-bottom: clamp(28px, 4vw, 40px); border-bottom: 1px solid rgba(246,242,234,.08); }
.lpLocalSection { padding: clamp(32px, 5vw, 48px) 0; border-bottom: 1px solid rgba(246,242,234,.06); }
.lpLocalSectionInner { display: grid; gap: 12px; max-width: 42rem; }
.lpLocalBody p { margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: rgba(246,242,234,.76); }
.lpLocalBody p:last-child { margin-bottom: 0; }
.lpLocalBody ul { margin: 0; padding-left: 1.2rem; display: grid; gap: 8px; }
.lpLocalBody a { color: #d9b777; text-decoration: none; }
.lpLocalBody a:hover { text-decoration: underline; }
.lpGeoGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.lpGeoCard { padding: 18px; border: 1px solid rgba(200,154,88,.22); border-radius: 14px; background: rgba(200,154,88,.06); display: grid; gap: 8px; }
.lpGeoCard h3 { margin: 0; font-size: 1rem; font-weight: 600; }
.lpGeoCard h3 a { color: #f6f2ea; text-decoration: none; }
.lpGeoCard h3 a:hover { color: #d9b777; }
.lpGeoCard p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.68); }
.lpGeoSection .lpSectionLead { max-width: 42rem; }
.lpPageContent .siteMain, .lpPageContent .interiorMain, .lpPageContent .aboutPage, .lpPageContent .therapyPage { margin: 0 !important; width: 100% !important; }
.lpPageContent .aboutPage, .lpPageContent .approachPage, .lpPageContent .therapyPage { max-width: none !important; }
.lpPageContent .aboutHero, .lpPageContent .approachHero, .lpPageContent .aboutFinalCta, .lpPageContent .aboutSectionGrid, .lpPageContent .approachSpread, .lpPageContent .philosophyGrid, .lpPageContent .aboutBrentEditorial { grid-template-columns: 1fr !important; min-height: auto !important; }
.lpPageContent .aboutHeroCopy, .lpPageContent .approachHeroCopy, .lpPageContent .aboutHeroTitle, .lpPageContent .approachHeroTitle, .lpPageContent .aboutHeroText, .lpPageContent .approachHeroText { max-width: none !important; }
.lpPageContent .aboutPortrait, .lpPageContent .aboutInlinePortrait, .lpPageContent .approachHeroImage, .lpPageContent .approachSpreadImage, .lpPageContent .aboutCtaPortrait { width: min(100%, 42rem) !important; max-width: 100% !important; justify-self: stretch !important; margin-top: 24px !important; margin-inline: auto !important; }
.lpPageContent .aboutHero, .lpPageContent .approachHero { padding: clamp(28px, 4vw, 48px) clamp(12px, 2vw, 24px) !important; }
.lpPageContent .aboutIntro, .lpPageContent .aboutSection, .lpPageContent .aboutFinalCta, .lpPageContent .approachEssay, .lpPageContent .approachSpread, .lpPageContent .approachLifeForce, .lpPageContent .approachBlocksSection, .lpPageContent .approachPrinciplesSection, .lpPageContent .approachFinalCta { padding-inline: clamp(12px, 2vw, 24px) !important; }
.lpPageContent .relatedPagesGrid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
.lpArticleContent .aboutHero, .lpArticleContent .approachHero, .lpArticleContent .approachSpread, .lpArticleContent .aboutSectionGrid { grid-template-columns: 1fr !important; min-height: auto !important; }
.lpArticleContent .approachHeroImage, .lpArticleContent .approachSpreadImage, .lpArticleContent .aboutPortrait { width: min(100%, 42rem) !important; max-width: 100% !important; margin-inline: auto !important; }
.lpBookingPanel { position: sticky; top: 88px; display: grid; gap: 14px; padding: clamp(18px, 3vw, 22px); border: 1px solid rgba(246,242,234,.12); border-radius: 18px; background: rgba(8,16,15,.78); box-shadow: 0 24px 80px rgba(0,0,0,.24); }
.lpBookingPanelTitle { margin: 0; font-family: Georgia, serif; font-size: 1.35rem; line-height: 1.2; color: #f6f2ea; font-weight: 600; }
.lpBookingPanelText { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.72); }
.lpAboutStrip { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 20px; align-items: center; padding: 24px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.4); }
.lpAboutStrip img { width: 120px; height: 120px; border-radius: 12px; object-fit: cover; }
.lpAboutStrip p { margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: rgba(246,242,234,.76); }
@media (max-width: 900px) {
  .lpCardGrid, .lpServiceGrid, .lpGeoGrid { grid-template-columns: 1fr; }
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
  <li>EATA registered</li>
  <li>Trauma-informed</li>
  <li>EMDR</li>
  <li>Transactional Analysis</li>
  <li>Supervised practice</li>
  <li>Confidential</li>
  <li>English-speaking</li>
</ul>`;

const TRUST_STRIP = `<div class="lpTrustStrip" aria-label="Professional credentials">
  ${buildEataBadge()}
  <p class="lpTrustStripNote">EATA registered therapist · clinical supervision · professional indemnity insurance · sessions from €75 · Lisbon clinic or secure online</p>
</div>`;

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
  ${buildEataBadge()}
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

const LISBON_GEO_LINKS = `<section class="lpSection" aria-labelledby="home-lisbon">
    <div class="lpSectionHead">
      <p class="lpKicker">Lisbon &amp; online</p>
      <h2 class="lpSectionTitle" id="home-lisbon">Therapy in Lisbon</h2>
      <p class="lpSectionLead">English-speaking psychotherapy in central Lisbon and securely online across Portugal.</p>
    </div>
    <div class="lpGeoGrid">
      <article class="lpGeoCard"><h3><a href="/psychotherapy-lisbon/">Psychotherapy Lisbon</a></h3><p>Trauma-informed psychotherapy for adults and couples — in person or online.</p></article>
      <article class="lpGeoCard"><h3><a href="/trauma-therapy-lisbon/">Trauma therapy Lisbon</a></h3><p>Support for PTSD, complex trauma, and anxiety — EMDR where appropriate.</p></article>
      <article class="lpGeoCard"><h3><a href="/emdr-therapy-lisbon/">EMDR therapy Lisbon</a></h3><p>Eye Movement Desensitisation and Reprocessing within trauma-informed care.</p></article>
      <article class="lpGeoCard"><h3><a href="/english-speaking-therapist-lisbon/">English-speaking therapist</a></h3><p>Therapy in English for expats and international clients in Lisbon.</p></article>
    </div>
  </section>`;

export function buildHomePageBody() {
  return `<div class="lpAdLandingStrip" id="lpAdLandingStrip" aria-label="Get started">
  <div class="lpAdLandingInner">
    <p class="lpAdLandingCopy"><strong>Ready to begin?</strong> Choose the path that suits you — book a Zoom call now or send a brief enquiry first.</p>
    <div class="lpAdLandingActions">
      <a class="lpPrimaryCta" href="/book/">Book Zoom call</a>
      <a class="lpSecondaryCta" href="${BOOKING_PATH}">Send enquiry</a>
    </div>
  </div>
</div>
<div class="lpHome">
  <div class="lpHomeHeroWrap">
    <div class="lpGrid">
      <section class="lpHero" aria-labelledby="home-title">
        <p class="lpKicker">English-speaking therapist · Lisbon clinic &amp; online</p>
        <h1 class="lpTitle" id="home-title">Trauma-informed psychotherapy with Brent Kelly in Lisbon and online.</h1>
        <p class="lpLead">Support for adults and couples navigating trauma, anxiety, attachment, and major life transitions — in person at our Lisbon clinic or securely online across Portugal.</p>
        <div class="lpHeroActions">
          <a class="lpPrimaryCta" href="/book/">Book initial Zoom call</a>
          <a class="lpSecondaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
        </div>
        <div class="lpTherapist">
          <img src="/assets/images/about-brent.webp" width="72" height="72" alt="Brent Kelly, therapist at Pathfinder Therapy Lisbon" loading="eager" decoding="async" />
          <div>
            <p class="lpTherapistName">Brent Kelly</p>
            <p class="lpTherapistRole">Therapist · trauma, EMDR, veterans, couples &amp; individual therapy</p>
          </div>
        </div>
        ${TRUST_PILLS}
        ${TRUST_STRIP}
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
      <img src="/assets/images/about-brent.webp" width="120" height="120" alt="Brent Kelly, therapist" loading="lazy" decoding="async" />
      <div>
        <p>Pathfinder is built around evidence-informed care, real conversation, and a steady therapeutic relationship. Brent works with adults and couples in English — in Lisbon and online.</p>
        <p><strong>EATA registered</strong> · EMDR · Transactional Analysis · clinical supervision · military veterans experience</p>
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

  ${LISBON_GEO_LINKS}

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

export const AD_LANDING_SCRIPT = `<script id="pathfinder-ad-landing">
(function () {
  if (window.location.pathname !== "/") return;
  var params = new URLSearchParams(window.location.search);
  var paid =
    params.has("gclid") ||
    params.has("fbclid") ||
    params.get("utm_medium") === "cpc" ||
    params.get("utm_medium") === "ppc" ||
    params.get("utm_source") === "google";
  if (!paid) return;
  var strip = document.getElementById("lpAdLandingStrip");
  if (strip) strip.classList.add("isVisible");
  if (window.pathfinderLead) window.pathfinderLead.capture();
  if (typeof window.gtag === "function") {
    window.gtag("event", "ad_landing_view", { event_category: "paid_traffic", event_label: "homepage" });
  }
})();
</script>`;

const THERAPY_GEO_LINKS = `<section class="lpLocalSection lpGeoSection" aria-labelledby="therapy-lisbon">
  <div class="lpLocalSectionInner">
    <p class="lpKicker">Lisbon &amp; online</p>
    <h2 class="lpSectionTitle" id="therapy-lisbon">Therapy in Lisbon</h2>
    <p class="lpSectionLead">English-speaking psychotherapy in central Lisbon and securely online across Portugal.</p>
  </div>
  <div class="lpGeoGrid" style="margin-top:20px">
    <article class="lpGeoCard"><h3><a href="/psychotherapy-lisbon/">Psychotherapy Lisbon</a></h3><p>Trauma-informed psychotherapy for adults and couples.</p></article>
    <article class="lpGeoCard"><h3><a href="/trauma-therapy-lisbon/">Trauma therapy Lisbon</a></h3><p>Support for PTSD, complex trauma, and anxiety.</p></article>
    <article class="lpGeoCard"><h3><a href="/emdr-therapy-lisbon/">EMDR therapy Lisbon</a></h3><p>EMDR within broader trauma-informed psychotherapy.</p></article>
    <article class="lpGeoCard"><h3><a href="/english-speaking-therapist-lisbon/">English-speaking therapist</a></h3><p>Therapy in English for expats and international clients.</p></article>
  </div>
</section>`;

export function injectTherapyGeoLinks(mainInner) {
  if (mainInner.includes("therapy-lisbon")) {
    return mainInner;
  }
  if (mainInner.includes('class="relatedPages"')) {
    return mainInner.replace('<aside class="relatedPages"', `${THERAPY_GEO_LINKS}<aside class="relatedPages"`);
  }
  return mainInner.replace("</article>", `${THERAPY_GEO_LINKS}</article>`);
}

export function trimAboutPagePortraits(html) {
  return html
    .replace(/<figure class="aboutInlinePortrait">[\s\S]*?<\/figure>/g, "")
    .replace(/<figure class="aboutCtaPortrait">[\s\S]*?<\/figure>/g, "");
}

export function applySprint2Transforms(html, route) {
  if (route !== "/therapy/" && route !== "/about/") {
    return html;
  }

  const parts = extractPageParts(html);
  let mainInner = parts.mainInner;
  if (route === "/about/") {
    mainInner = trimAboutPagePortraits(mainInner);
  }
  if (route === "/therapy/") {
    mainInner = injectTherapyGeoLinks(mainInner);
  }
  mainInner = wrapWithBookingPanel(mainInner);
  let next = html.replace(
    /(<main class="lpMain[^"]*" id="main-content" tabindex="-1">\s*<div class="lpInteriorBody">)[\s\S]*(<\/div>\s*<\/main>)/,
    `$1${mainInner}$2`
  );
  if (!next.includes("pathfinder-sprint2")) {
    next = next.replace("</head>", `${SPRINT2_CSS}\n</head>`);
  }
  return next;
}
