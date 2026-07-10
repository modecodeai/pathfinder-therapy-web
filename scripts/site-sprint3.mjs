import { BOOKING_LABEL, BOOKING_PATH, ENQUIRY_LABEL, ENQUIRY_PATH } from "./site-ux-layer.mjs";
import { extractPageParts } from "./site-shell-v2.mjs";
import { SPRINT2_CSS, applySprint2Transforms, buildBookingPanel, wrapWithBookingPanel } from "./site-sprint2.mjs";

export const SPRINT3_CSS = `<style id="pathfinder-sprint3">
.lpInlineCta { margin: 32px 0; padding: 22px; border: 1px solid rgba(200,154,88,.28); border-radius: 16px; background: rgba(200,154,88,.08); display: grid; gap: 12px; }
.lpInlineCtaText { margin: 0; font-size: 15px; line-height: 1.65; color: rgba(246,242,234,.78); }
.lpEndCta { margin-top: 48px; padding: clamp(28px, 4vw, 40px); border-top: 1px solid rgba(246,242,234,.08); }
.lpEndCtaInner { max-width: 40rem; display: grid; gap: 14px; }
.lpArticleGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 300px); gap: clamp(24px, 4vw, 36px); align-items: start; padding: clamp(12px, 2vw, 24px) clamp(16px, 3vw, 40px) 48px; max-width: 1180px; margin: 0 auto; }
.lpArticleContent { min-width: 0; }
.lpArticleContent .approachPage { max-width: none !important; width: 100% !important; margin: 0 !important; animation: none !important; }
.lpArticleContent .approachHero { min-height: auto !important; padding: 0 0 clamp(24px, 4vw, 36px) !important; border-bottom: 1px solid rgba(246,242,234,.08); grid-template-columns: 1fr !important; }
.lpArticleContent .approachHeroCopy { max-width: 42rem !important; display: grid; gap: 12px; }
.lpArticleContent .approachHeroTitle { font-size: clamp(1.6rem, 3.2vw, 2.35rem) !important; line-height: 1.12 !important; max-width: 100% !important; overflow-wrap: break-word; font-weight: 600 !important; }
.lpArticleContent .approachHeroText { max-width: 38rem !important; font-size: 1.05rem !important; line-height: 1.7 !important; margin-top: 0 !important; }
.lpArticleContent .approachHeroText p { margin: 0 0 8px; color: rgba(246,242,234,.78); font-size: inherit !important; line-height: inherit !important; }
.lpArticleContent .approachHeroText p:last-child { margin-bottom: 0; color: rgba(246,242,234,.52); font-size: 14px !important; }
.lpArticleContent .breadcrumbs { margin: 0 0 4px; font-size: 13px; }
.lpArticleContent .sectionKicker { font-size: 12px; margin: 0; }
.lpArticleContent .approachEssay, .lpArticleContent .approachLifeForce, .lpArticleContent .approachFinalCta, .lpArticleContent .relatedPages { padding: clamp(28px, 4vw, 40px) 0 !important; border-bottom: 1px solid rgba(246,242,234,.06); min-height: auto !important; }
.lpArticleContent .approachEssayInner, .lpArticleContent .approachLifeForceInner { max-width: 42rem; }
.lpArticleContent .approachSectionTitle { font-size: clamp(1.35rem, 2.4vw, 1.75rem) !important; line-height: 1.15 !important; max-width: 100% !important; }
.lpArticleContent .approachBody { margin-top: 12px !important; max-width: 42rem; }
.lpArticleContent .approachBody p { font-size: 15px !important; line-height: 1.75 !important; }
.lpArticleContent .authorityList li { font-size: 15px !important; line-height: 1.7 !important; }
.lpArticleContent .approachFinalCta { display: block !important; grid-template-columns: 1fr !important; }
.lpArticleContent .approachFinalCta .approachSectionTitle { font-size: clamp(1.4rem, 2.5vw, 1.85rem) !important; }
.lpArticleContent .approachFinalCta p { font-size: 15px !important; line-height: 1.75 !important; }
.lpArticleContent .relatedPages { padding-bottom: 0 !important; }
.lpArticleContent .relatedPagesGrid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }
.lpArticleContent .knowledgeInlineLinks a { font-size: 1rem !important; }
.lpPageContent .journalPage { max-width: none !important; width: 100% !important; margin: 0 !important; animation: none !important; }
.lpPageContent .journalHero { min-height: auto !important; padding: 0 0 clamp(24px, 4vw, 36px) !important; grid-template-columns: 1fr !important; border-bottom: 1px solid rgba(246,242,234,.08); }
.lpPageContent .journalHeroCopy { max-width: 42rem !important; display: grid; gap: 12px; }
.lpPageContent .journalHeroTitle { font-size: clamp(1.6rem, 3.2vw, 2.35rem) !important; line-height: 1.12 !important; font-weight: 600 !important; max-width: 100% !important; overflow-wrap: break-word; }
.lpPageContent .journalHeroText { font-size: 1.05rem !important; line-height: 1.7 !important; max-width: 38rem !important; margin-top: 0 !important; }
.lpPageContent .breadcrumbs { margin: 0 0 4px; font-size: 13px; }
.lpPageContent .sectionKicker { font-size: 12px; margin: 0; }
.lpPageContent .journalLatest, .lpPageContent .journalTopics, .lpPageContent .journalPhilosophy, .lpPageContent .relatedPages { padding: clamp(28px, 4vw, 40px) 0 !important; min-height: auto !important; border-bottom: 1px solid rgba(246,242,234,.06); }
.lpPageContent .journalSectionTitle { font-size: clamp(1.35rem, 2.4vw, 1.75rem) !important; line-height: 1.15 !important; max-width: 100% !important; }
.lpPageContent .journalBody p { font-size: 15px !important; line-height: 1.75 !important; }
.lpPageContent .knowledgeArticleItem { padding: 18px 0 !important; }
.lpPageContent .knowledgeArticleItem h3 { font-size: 1.05rem !important; line-height: 1.3 !important; }
.lpPageContent .knowledgeArticleItem > p:not(.journalEssayCategory) { font-size: 14px !important; line-height: 1.65 !important; }
.lpPageContent .knowledgeArticleItem small { font-size: 13px !important; }
.lpPageContent .knowledgeCategory span { font-size: clamp(1.15rem, 2vw, 1.45rem) !important; line-height: 1.2 !important; }
.lpPageContent .knowledgeCategory small { font-size: 13px !important; line-height: 1.6 !important; }
.lpPageContent .relatedPages { padding-bottom: 0 !important; }
@media (max-width: 900px) {
  .lpArticleGrid { grid-template-columns: 1fr; padding-bottom: 16px; }
  .lpArticleGrid .lpBookingPanel { order: 2; }
  .lpArticleContent { order: 1; }
  .lpArticleContent .approachHeroTitle { font-size: clamp(1.5rem, 6vw, 2rem) !important; }
  .lpPageContent .journalHeroTitle { font-size: clamp(1.5rem, 6vw, 2rem) !important; }
}
</style>`;

const INLINE_CTA = `<aside class="lpInlineCta" aria-label="Therapy enquiry">
  <p class="lpKicker">Wondering if therapy could help?</p>
  <p class="lpInlineCtaText">You do not need a diagnosis to begin. ${ENQUIRY_LABEL} — Brent replies within one working day.</p>
  <a class="lpPrimaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
</aside>`;

const END_CTA = `<section class="lpEndCta" aria-label="Arrange a consultation">
  <div class="lpEndCtaInner">
    <p class="lpKicker">Next step</p>
    <h2 class="lpSectionTitle">Arrange an initial consultation</h2>
    <p class="lpSectionLead">Trauma-informed psychotherapy with Brent Kelly in Lisbon and online. Non-urgent enquiries only.</p>
    <div class="lpHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
  </div>
</section>`;

function injectStyles(html) {
  let next = html;
  if (!next.includes("pathfinder-sprint2")) {
    next = next.replace("</head>", `${SPRINT2_CSS}\n</head>`);
  }
  if (!next.includes("pathfinder-sprint3")) {
    next = next.replace("</head>", `${SPRINT3_CSS}\n</head>`);
  }
  return next;
}

function replaceInteriorBody(html, mainInner) {
  return html.replace(
    /(<main class="lpMain[^"]*" id="main-content" tabindex="-1">\s*<div class="lpInteriorBody">)[\s\S]*(<\/div>\s*<\/main>)/,
    `$1${mainInner}$2`
  );
}

function applyBookingPanelLayout(html, { slim = false } = {}) {
  const parts = extractPageParts(html);
  const mainInner = wrapWithBookingPanel(parts.mainInner, { slim });
  let next = replaceInteriorBody(html, mainInner);
  return injectStyles(next);
}

function injectArticleCta(mainInner) {
  if (mainInner.includes("lpInlineCta")) {
    return mainInner;
  }

  let sectionCount = 0;
  let injected = mainInner.replace(/<\/section>/g, (match) => {
    sectionCount += 1;
    if (sectionCount === 2) {
      return `${match}${INLINE_CTA}`;
    }
    return match;
  });

  if (!injected.includes("lpEndCta") && injected.includes("</article>")) {
    injected = injected.replace("</article>", `${END_CTA}</article>`);
  }

  return injected;
}

function applyArticleLayout(html) {
  const parts = extractPageParts(html);
  const articleContent = injectArticleCta(parts.mainInner);
  const mainInner = `<div class="lpArticleGrid">
  <div class="lpArticleContent">${articleContent}</div>
  ${buildBookingPanel({ slim: true })}
</div>`;

  let next = replaceInteriorBody(html, mainInner);
  return injectStyles(next);
}

function applyEndCtaLayout(html) {
  const parts = extractPageParts(html);
  if (parts.mainInner.includes("lpEndCta")) {
    return injectStyles(html);
  }

  let mainInner = parts.mainInner;
  if (mainInner.includes("</article>")) {
    mainInner = mainInner.replace("</article>", `${END_CTA}</article>`);
  } else {
    mainInner = `${mainInner}${END_CTA}`;
  }

  let next = replaceInteriorBody(html, mainInner);
  return injectStyles(next);
}

export function applySprint3Transforms(html, route) {
  if (route === "/therapy/" || route === "/about/") {
    return applySprint2Transforms(html, route);
  }

  if (route === "/knowledge-library/") {
    return applyBookingPanelLayout(html, { slim: true });
  }

  if (route === "/approach/") {
    return applyBookingPanelLayout(html);
  }

  if (route.startsWith("/knowledge-library/")) {
    return applyArticleLayout(html);
  }

  if (["/journal/", "/retreats/", "/research/"].includes(route)) {
    return applyEndCtaLayout(html);
  }

  return html;
}

export function stripHydrationScripts(html) {
  let next = html;

  next = next.replace(/<link[^>]*rel="preload"[^>]*\/_next\/static\/[^>]*\/?>/gi, "");
  next = next.replace(/<script[^>]*src="\/_next\/static\/chunks\/[^"]+"[^>]*>\s*<\/script>/gi, "");
  next = next.replace(/<script[^>]*src="\/_next\/static\/chunks\/[^"]+"[^>]*\/>/gi, "");
  next = next.replace(/<script[^>]*id="_R_"[^>]*>\s*<\/script>/gi, "");
  next = next.replace(/<script[^>]*id="_R_"[^>]*\/>/gi, "");
  next = next.replace(/<script>\(self\.__next_f=self\.__next_f\|\|\[\]\)[\s\S]*?<\/script>/gi, "");
  next = next.replace(/<script>self\.__next_f[\s\S]*?<\/script>/gi, "");
  next = next.replace(/<div hidden="">[\s\S]*?<\/div>/, "");

  return next;
}

export function finalizeStaticPage(html) {
  return stripHydrationScripts(html);
}
