import {
  BOOKING_LABEL,
  BOOKING_PATH,
  ENQUIRY_LABEL,
  ENQUIRY_PATH,
  extractPageParts,
  wrapInShellV2
} from "./site-shell-v2.mjs";
import { buildEataBadge, EATA_BADGE_CSS } from "./site-eata.mjs";
import { enhanceTherapyLocationSection, injectLocationStyles } from "./site-location.mjs";
import { buildPublicFeedbackSection, REVIEWS_CSS } from "./site-reviews.mjs";
import { applyContentFixes, fixAboutPageContent } from "./site-content-fixes.mjs";
import { buildVisualHomePageBody, HOMEPAGE_VISUAL_CSS } from "./site-home-visual.mjs";

export const SPRINT2_CSS = `${REVIEWS_CSS}
<style id="pathfinder-sprint2">
.lpHome { display: grid; gap: 0; }
.lpHomeHeroWrap { padding: clamp(24px, 4vw, 48px) clamp(16px, 3vw, 40px); border-bottom: 1px solid rgba(246,242,234,.08); background: linear-gradient(180deg, rgba(8,16,15,.2), rgba(8,16,15,.75)), url(/assets/images/hero-01.webp) center/cover no-repeat; }
.lpHomeHeroWrap .lpGrid { max-width: 1180px; margin: 0 auto; }
.lpSection { padding: clamp(40px, 6vw, 72px) clamp(16px, 3vw, 40px); border-bottom: 1px solid rgba(246,242,234,.06); max-width: 1180px; margin: 0 auto; }
.lpSectionHead { display: grid; gap: 12px; max-width: 40rem; margin-bottom: 28px; }
.lpSectionTitle { margin: 0; font-family: Georgia, serif; font-size: clamp(1.6rem, 3vw, 2.2rem); line-height: 1.12; color: #f6f2ea; font-weight: 600; }
.lpSectionLead { margin: 0; font-size: 1.05rem; line-height: 1.7; color: rgba(246,242,234,.72); }
.lpCardGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.lpCard { padding: 20px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.45); display: grid; gap: 10px; align-content: start; min-height: 100%; }
.lpCard h3 { margin: 0; font-size: 1.05rem; color: #f6f2ea; font-weight: 600; }
.lpCard p { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.lpCard a { color: #d9b777; font-size: 13px; font-weight: 600; text-decoration: none; }
.lpCard a:hover, .lpCard a:focus-visible { text-decoration: underline; }
.lpServiceGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: stretch; }
.lpServiceCard { padding: 18px; border: 1px solid rgba(200,154,88,.22); border-radius: 14px; background: rgba(200,154,88,.06); display: grid; gap: 8px; align-content: start; min-height: 100%; transition: border-color .2s ease, background .2s ease; }
.lpServiceCard:hover, .lpServiceCard:focus-within { border-color: rgba(200,154,88,.45); background: rgba(200,154,88,.1); }
.lpServiceCard h3 { margin: 0; font-size: 1rem; color: #f6f2ea; }
.lpServiceCard p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.68); }
.lpServiceCard a { display: grid; gap: 8px; color: inherit; text-decoration: none; min-height: 100%; }
.lpServiceCard a:focus-visible { outline: 2px solid #d9b777; outline-offset: 2px; border-radius: 12px; }
.lpServiceCardLink { color: #d9b777; font-size: 13px; font-weight: 600; }
.lpHeroTrustLine { margin: 0; font-size: 13px; letter-spacing: .04em; color: rgba(246,242,234,.62); }
.lpHeroTextLink { display: inline-flex; align-items: center; min-height: 44px; color: #d9b777; font-size: 14px; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
.lpReassuranceStrip { margin: 0; padding: 20px; border: 1px solid rgba(246,242,234,.1); border-radius: 14px; background: rgba(8,16,15,.5); display: grid; gap: 14px; max-width: 42rem; }
.lpReassuranceStrip h2 { margin: 0; font-family: Georgia, serif; font-size: clamp(1.15rem, 2.4vw, 1.35rem); line-height: 1.2; color: #f6f2ea; font-weight: 600; }
.lpReassuranceStrip p { margin: 0; font-size: 15px; line-height: 1.65; color: rgba(246,242,234,.76); }
.lpReassuranceStrip .lpHeroActions { margin-top: 4px; }
.lpTertiaryLink { margin: 0; font-size: 14px; line-height: 1.6; }
.lpTertiaryLink a { color: rgba(246,242,234,.62); text-decoration: underline; text-underline-offset: 3px; }
.lpTertiaryLink a:hover { color: #d9b777; }
.lpTherapyEnquiryNote { margin: 16px 0 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.lpTherapyEnquiryNote a { color: #d9b777; font-weight: 600; text-decoration: none; }
.lpTherapyEnquiryNote a:hover { text-decoration: underline; }
.lpStepsSection { display: grid; gap: 20px; }
.lpStepsGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
.lpStepCard { padding: 20px; border: 1px solid rgba(246,242,234,.1); border-radius: 14px; background: rgba(8,16,15,.35); display: grid; gap: 8px; }
.lpStepCard h3 { margin: 0; font-size: 1rem; color: #f6f2ea; font-weight: 600; }
.lpStepCard p { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.lpFinalCta { text-align: center; display: grid; gap: 16px; justify-items: center; }
.lpFinalCta .lpSectionLead { max-width: 36rem; }
.lpGeoSectionQuiet { opacity: .92; }
.lpGeoSectionQuiet .lpSectionTitle { font-size: clamp(1.25rem, 2.2vw, 1.5rem); font-weight: 500; }
.lpGeoSectionQuiet .lpSectionLead { font-size: 14px; }
.lpGeoSectionQuiet .lpGeoCard { padding: 14px; background: rgba(8,16,15,.35); border-color: rgba(246,242,234,.08); }
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
.lpPageContent { min-width: 0; }
.lpLocalLanding { width: 100%; margin: 0; max-width: 100%; }
.lpLocalHero { display: grid; gap: 18px; padding-bottom: clamp(28px, 4vw, 40px); border-bottom: 1px solid rgba(246,242,234,.08); max-width: 100%; }
.lpLocalHero .lpTitle { max-width: 100%; overflow-wrap: break-word; }
.lpLocalSection { padding: clamp(32px, 5vw, 48px) clamp(16px, 3vw, 40px); border-bottom: 1px solid rgba(246,242,234,.06); }
.lpLocalSectionInner { display: grid; gap: 12px; max-width: 42rem; }
.lpLocationSection .lpLocalSectionInner { max-width: 1180px; }
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
.lpPageContent .aboutHeroCopy, .lpPageContent .approachHeroCopy, .lpPageContent .aboutHeroText, .lpPageContent .approachHeroText { max-width: none !important; }
.lpPageContent .aboutHeroTitle, .lpPageContent .approachHeroTitle { max-width: 100% !important; font-size: clamp(1.75rem, 4.2vw, 3.2rem) !important; line-height: 1.08 !important; overflow-wrap: break-word; }
.lpPageContent .aboutPortrait, .lpPageContent .aboutInlinePortrait, .lpPageContent .approachHeroImage, .lpPageContent .approachSpreadImage, .lpPageContent .aboutCtaPortrait { width: min(100%, 42rem) !important; max-width: 100% !important; justify-self: stretch !important; margin-top: 24px !important; margin-inline: auto !important; }
.lpPageContent .aboutHero, .lpPageContent .approachHero { padding: clamp(28px, 4vw, 48px) clamp(12px, 2vw, 24px) !important; }
.lpPageContent .aboutIntro, .lpPageContent .aboutSection, .lpPageContent .aboutFinalCta, .lpPageContent .approachEssay, .lpPageContent .approachSpread, .lpPageContent .approachLifeForce, .lpPageContent .approachBlocksSection, .lpPageContent .approachPrinciplesSection, .lpPageContent .approachFinalCta { padding-inline: clamp(12px, 2vw, 24px) !important; }
.lpPageContent .relatedPagesGrid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
.lpInteriorBody > article.approachPage > section,
.lpInteriorBody > article.approachPage > aside,
.lpInteriorBody > article.aboutPage > section,
.lpInteriorBody > article.aboutPage > aside {
  padding-inline: clamp(16px, 3vw, 40px);
  box-sizing: border-box;
}
.lpInteriorBody > article.approachPage > .approachHero,
.lpInteriorBody > article.aboutPage > .aboutHero {
  padding-block: clamp(28px, 4vw, 48px);
  padding-inline: clamp(16px, 3vw, 40px);
}
.lpInteriorBody .lpEndCta {
  padding-block: clamp(28px, 4vw, 40px);
  padding-inline: clamp(16px, 3vw, 40px);
}
.lpInteriorBody .relatedPages {
  padding-block: clamp(28px, 4vw, 40px);
  padding-inline: clamp(16px, 3vw, 40px);
}
.lpInteriorBody .approachEssayInner,
.lpInteriorBody .approachLifeForceInner,
.lpInteriorBody .lpEndCtaInner,
.lpInteriorBody .lpLocalSectionInner {
  max-width: 1180px;
  margin-inline: auto;
  width: 100%;
}
.lpArticleContent .aboutHero, .lpArticleContent .approachHero, .lpArticleContent .approachSpread, .lpArticleContent .aboutSectionGrid { grid-template-columns: 1fr !important; min-height: auto !important; }
.lpArticleContent .approachHeroImage, .lpArticleContent .approachSpreadImage, .lpArticleContent .aboutPortrait { width: min(100%, 42rem) !important; max-width: 100% !important; margin-inline: auto !important; }
.lpBookingPanel { position: sticky; top: 88px; display: grid; gap: 14px; padding: clamp(18px, 3vw, 22px); border: 1px solid rgba(246,242,234,.12); border-radius: 18px; background: rgba(8,16,15,.78); box-shadow: 0 24px 80px rgba(0,0,0,.24); }
.lpBookingPanelTitle { margin: 0; font-family: Georgia, serif; font-size: 1.35rem; line-height: 1.2; color: #f6f2ea; font-weight: 600; }
.lpBookingPanelText { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(246,242,234,.72); }
.lpAboutStrip { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 20px; align-items: center; padding: 24px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.4); }
.lpAboutStrip img { width: 120px; height: 120px; border-radius: 12px; object-fit: cover; }
.lpAboutStrip p { margin: 0 0 12px; font-size: 15px; line-height: 1.65; color: rgba(246,242,234,.76); }
.lpAboutStrip .lpEataWrap { margin-top: 4px; }
@media (max-width: 1024px) {
  .lpPageGrid { grid-template-columns: 1fr; padding-bottom: 24px; }
  .lpBookingPanel { position: static; order: 2; }
  .lpPageContent { order: 1; }
}
@media (max-width: 900px) {
  .lpCardGrid, .lpServiceGrid, .lpGeoGrid, .lpStepsGrid { grid-template-columns: 1fr; }
  .lpAboutStrip { grid-template-columns: 1fr; text-align: left; }
  .lpAboutStrip img { width: 88px; height: 88px; border-radius: 50%; }
  .lpHomeHeroWrap .lpHero { max-width: none; }
  .lpHeroActions { flex-direction: column; align-items: stretch; }
  .lpHeroActions .lpPrimaryCta { width: 100%; }
}
@media (max-width: 320px) {
  .lpSection { padding-inline: 16px; }
  .lpHomeHeroWrap { padding-inline: 16px; }
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

const BOOKING_FIRST_STEPS = `<ul class="lpSteps" aria-label="What happens next">
  <li><span class="lpStepNum" aria-hidden="true">1</span><span><strong>Choose a consultation time</strong> — select a convenient time through the secure booking page.</span></li>
  <li><span class="lpStepNum" aria-hidden="true">2</span><span><strong>Meet Brent by Zoom</strong> — use the initial conversation to briefly discuss what brings you to therapy and ask questions.</span></li>
  <li><span class="lpStepNum" aria-hidden="true">3</span><span><strong>Decide on the next step</strong> — there is no obligation to continue unless the working relationship feels appropriate.</span></li>
</ul>`;

export function buildBookingPanel({ slim = false } = {}) {
  if (slim) {
    return `<aside class="lpBookingPanel" aria-label="Arrange a consultation">
  <p class="lpKicker">Next step</p>
  <h2 class="lpBookingPanelTitle">${BOOKING_LABEL}</h2>
  <p class="lpBookingPanelText">Choose a convenient time for a confidential initial conversation by Zoom — or send an enquiry first if you prefer.</p>
  <div class="lpHeroActions">
    <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
    <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
  </div>
  <p class="lpReassurance">Sessions from €75 · Lisbon clinic or secure online · Non-urgent enquiries only</p>
</aside>`;
  }

  return `<aside class="lpBookingPanel" aria-label="Arrange a consultation">
  <p class="lpKicker">Next step</p>
  <h2 class="lpBookingPanelTitle">${BOOKING_LABEL}</h2>
  <p class="lpBookingPanelText">Choose a convenient time for a confidential initial conversation by Zoom — or send an enquiry first if you prefer.</p>
  ${TRUST_PILLS}
  ${buildEataBadge()}
  ${BOOKING_FIRST_STEPS}
  <div class="lpHeroActions">
    <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
    <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
  </div>
  <p class="lpReassurance">Sessions from €75 · Lisbon clinic or secure online · Non-urgent enquiries only</p>
</aside>`;
}

export function wrapWithBookingPanel(mainInner, { slim = false } = {}) {
  return `<div class="lpPageGrid">
  <div class="lpPageContent">${mainInner}</div>
  ${buildBookingPanel({ slim })}
</div>`;
}

const LISBON_GEO_LINKS = `<section class="lpSection lpGeoSectionQuiet" aria-labelledby="home-lisbon">
    <div class="lpSectionHead">
      <p class="lpKicker">Further reading</p>
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

function buildWhatHappensNextSection() {
  return `<section class="lpSection lpStepsSection" aria-labelledby="home-next">
    <div class="lpSectionHead">
      <p class="lpKicker">Getting started</p>
      <h2 class="lpSectionTitle" id="home-next">What happens next</h2>
    </div>
    <ol class="lpStepsGrid">
      <li class="lpStepCard">
        <h3>Choose an initial consultation</h3>
        <p>Select a convenient time for a short confidential conversation.</p>
      </li>
      <li class="lpStepCard">
        <h3>Talk about what brings you here</h3>
        <p>You can ask questions and briefly explain what you are looking for.</p>
      </li>
      <li class="lpStepCard">
        <h3>Decide whether it feels right</h3>
        <p>There is no obligation to continue unless the working relationship feels appropriate.</p>
      </li>
    </ol>
  </section>`;
}

function buildHomeReassuranceStrip() {
  return `<section class="lpReassuranceStrip" aria-labelledby="home-reassurance">
  <h2 id="home-reassurance">Not sure where to begin?</h2>
  <p>Arrange a confidential initial conversation directly, or send an enquiry first if you would prefer to ask a question.</p>
  <div class="lpHeroActions">
    <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
    <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
  </div>
</section>`;
}

function buildFinalCtaSection() {
  return `<section class="lpSection lpFinalCta" aria-labelledby="home-final-cta">
    <div class="lpSectionHead" style="text-align:center;margin-inline:auto">
      <h2 class="lpSectionTitle" id="home-final-cta">${BOOKING_LABEL}</h2>
      <p class="lpSectionLead">Choose a convenient time for a confidential initial conversation by Zoom — or send an enquiry first if you would prefer to ask a question.</p>
    </div>
    <div class="lpHeroActions" style="justify-content:center">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
  </section>`;
}

export function buildHomePageBody() {
  return `<div class="lpHome">
  <div class="lpHomeHeroWrap">
    <section class="lpHero" aria-labelledby="home-title">
      <p class="lpKicker">English-speaking therapy · Lisbon and online</p>
      <h1 class="lpTitle" id="home-title">Trauma-informed psychotherapy in Lisbon and online</h1>
      <p class="lpLead">Therapy for adults and couples navigating trauma, anxiety, attachment difficulties and significant life transitions.</p>
      <div class="lpHeroActions">
        <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
        <a class="lpHeroTextLink" href="/therapy/">Explore therapy</a>
      </div>
      <p class="lpHeroTrustLine">EATA registered · Confidential · Sessions from €75</p>
    </section>
  </div>

  <section class="lpSection" aria-labelledby="home-who">
    <div class="lpSectionHead">
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
      <h2 class="lpSectionTitle" id="home-approach">Understand · Heal · Move forward</h2>
      <p class="lpSectionLead">Pathfinder is a space to understand what has shaped you, what still protects you, and what might now be ready to change.</p>
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
      <a class="lpHeroTextLink" href="/approach/">Read about the approach</a>
    </div>
  </section>

  <section class="lpSection" aria-labelledby="home-about">
    <div class="lpSectionHead">
      <p class="lpKicker">About Brent</p>
      <h2 class="lpSectionTitle" id="home-about">Relationship focused. Personal and authentic.</h2>
    </div>
    <div class="lpAboutStrip">
      <img src="/assets/images/about-brent.webp" width="120" height="120" alt="Brent Kelly, therapist at Pathfinder Therapy Lisbon" loading="lazy" decoding="async" />
      <div>
        <p>Pathfinder is built around evidence-informed care, real conversation, and a steady therapeutic relationship. Brent Kelly works with adults and couples in English — in Lisbon and online.</p>
        <p><strong>EATA registered</strong> · EMDR · Transactional Analysis · clinical supervision</p>
        ${buildEataBadge()}
        <a class="lpSecondaryCta" href="/about/" style="display:inline-flex;margin-top:8px">Meet Brent →</a>
      </div>
    </div>
  </section>

  <div class="lpSection" style="padding-top:0;padding-bottom:32px">
    ${buildHomeReassuranceStrip()}
  </div>

  <section class="lpSection" aria-labelledby="home-services">
    <div class="lpSectionHead">
      <h2 class="lpSectionTitle" id="home-services">Therapy services</h2>
      <p class="lpSectionLead">Therapy shaped around your life — in person at our Lisbon clinic or securely online.</p>
    </div>
    <div class="lpServiceGrid">
      <article class="lpServiceCard"><a href="/therapy/" aria-label="Individual therapy — learn more"><h3>Individual therapy</h3><p>Trauma-informed psychotherapy for adults — anxiety, trauma, attachment, and life transitions.</p><span class="lpServiceCardLink">Learn more →</span></a></article>
      <article class="lpServiceCard"><a href="/therapy/" aria-label="Couples therapy — learn more"><h3>Couples therapy</h3><p>Relational work for couples navigating conflict, disconnection, and repeating patterns.</p><span class="lpServiceCardLink">Learn more →</span></a></article>
      <article class="lpServiceCard"><a href="/therapy/" aria-label="EMDR — learn more"><h3>EMDR</h3><p>Eye Movement Desensitisation and Reprocessing where clinically appropriate for trauma processing.</p><span class="lpServiceCardLink">Learn more →</span></a></article>
      <article class="lpServiceCard"><a href="/therapy/" aria-label="Online therapy — learn more"><h3>Online therapy</h3><p>Secure online sessions across Portugal and internationally where appropriate.</p><span class="lpServiceCardLink">Learn more →</span></a></article>
    </div>
    <div class="lpHeroActions" style="margin-top:24px">
      <a class="lpSecondaryCta" href="/fees/">See fees</a>
    </div>
  </section>

  ${buildWhatHappensNextSection()}

  ${buildPublicFeedbackSection()}

  ${buildFinalCtaSection()}

  ${LISBON_GEO_LINKS}
</div>`;
}

export function buildHomePageV2(homeHtml) {
  const parts = extractPageParts(homeHtml);
  let head = parts.head.replace("</head>", `${HOMEPAGE_VISUAL_CSS}\n${REVIEWS_CSS}\n</head>`);
  return wrapInShellV2({
    ...parts,
    head,
    route: "/",
    mainInner: buildVisualHomePageBody(),
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
  let mainInner = applyContentFixes(parts.mainInner, route);

  if (route === "/about/") {
    mainInner = trimAboutPagePortraits(mainInner);
    mainInner = fixAboutPageContent(mainInner);
  }

  if (route === "/therapy/") {
    mainInner = injectTherapyGeoLinks(mainInner);
    mainInner = enhanceTherapyLocationSection(mainInner);
  }

  let next = html.replace(
    /(<main class="lpMain[^"]*" id="main-content" tabindex="-1">\s*<div class="lpInteriorBody">)[\s\S]*(<\/div>\s*<\/main>)/,
    `$1${mainInner}$2`
  );
  if (!next.includes("pathfinder-sprint2")) {
    next = next.replace("</head>", `${SPRINT2_CSS}\n</head>`);
  }
  if (route === "/therapy/") {
    next = injectLocationStyles(next);
  }
  return next;
}
