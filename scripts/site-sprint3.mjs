import { BOOKING_LABEL, BOOKING_PATH } from "./site-ux-layer.mjs";
import { extractPageParts } from "./site-shell-v2.mjs";
import { SPRINT2_CSS, applySprint2Transforms, buildBookingPanel, wrapWithBookingPanel } from "./site-sprint2.mjs";

export const SPRINT3_CSS = `<style id="pathfinder-sprint3">
.lpInlineCta { margin: 32px 0; padding: 22px; border: 1px solid rgba(200,154,88,.28); border-radius: 16px; background: rgba(200,154,88,.08); display: grid; gap: 12px; }
.lpInlineCtaText { margin: 0; font-size: 15px; line-height: 1.65; color: rgba(246,242,234,.78); }
.lpEndCta { margin-top: 48px; padding: clamp(28px, 4vw, 40px); border-top: 1px solid rgba(246,242,234,.08); }
.lpEndCtaInner { max-width: 40rem; display: grid; gap: 14px; }
.lpArticleGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 300px); gap: clamp(24px, 4vw, 36px); align-items: start; padding: clamp(12px, 2vw, 24px) clamp(16px, 3vw, 40px) 48px; max-width: 1180px; margin: 0 auto; }
.lpArticleContent { min-width: 0; }
@media (max-width: 900px) {
  .lpArticleGrid { grid-template-columns: 1fr; padding-bottom: 16px; }
  .lpArticleGrid .lpBookingPanel { order: 2; }
  .lpArticleContent { order: 1; }
}
</style>`;

const INLINE_CTA = `<aside class="lpInlineCta" aria-label="Therapy enquiry">
  <p class="lpKicker">Wondering if therapy could help?</p>
  <p class="lpInlineCtaText">You do not need a diagnosis to begin. Send a brief enquiry — Brent replies within one working day.</p>
  <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
</aside>`;

const END_CTA = `<section class="lpEndCta" aria-label="Arrange a consultation">
  <div class="lpEndCtaInner">
    <p class="lpKicker">Next step</p>
    <h2 class="lpSectionTitle">Arrange an initial consultation</h2>
    <p class="lpSectionLead">Trauma-informed psychotherapy with Brent Kelly in Lisbon and online. Non-urgent enquiries only.</p>
    <div class="lpHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="https://wa.me/351914775365">WhatsApp Brent</a>
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

function applyBookingPanelLayout(html) {
  const parts = extractPageParts(html);
  const mainInner = wrapWithBookingPanel(parts.mainInner);
  let next = replaceInteriorBody(html, mainInner);
  next = next.replace('class="lpMain lpMainInterior"', 'class="lpMain"');
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
  ${buildBookingPanel()}
</div>`;

  let next = replaceInteriorBody(html, mainInner);
  next = next.replace('class="lpMain lpMainInterior"', 'class="lpMain"');
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

  if (route === "/approach/" || route === "/knowledge-library/") {
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
