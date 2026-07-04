import { BOOKING_LABEL, BOOKING_PATH } from "./site-ux-layer.mjs";

export { BOOKING_LABEL, BOOKING_PATH };

export const NAV_ITEMS = [
  { href: "/therapy/", label: "Therapy" },
  { href: "/about/", label: "About" },
  { href: "/fees/", label: "Fees" },
  { href: "/faq/", label: "FAQ" },
  { href: "/contact/", label: "Contact" }
];

export const EXPLORE_LINKS = [
  { href: "/approach/", label: "Approach" },
  { href: "/knowledge-library/", label: "Knowledge Library" },
  { href: "/journal/", label: "Journal" },
  { href: "/retreats/", label: "Retreats" }
];

export const SHELL_V2_CSS = `<style id="pathfinder-shell-v2">
.lpShell { min-height: 100vh; background: var(--color-forest-deep, #08100f); color: var(--color-linen, #f6f2ea); }
.lpHeader { position: sticky; top: 0; z-index: 40; background: rgba(8,16,15,.94); border-bottom: 1px solid rgba(246,242,234,.08); backdrop-filter: blur(10px); }
.lpHeaderInner { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px clamp(16px, 3vw, 32px); max-width: 1280px; margin: 0 auto; }
.lpBrand { color: var(--color-bronze, #c89a58); font-family: Georgia, serif; letter-spacing: .08em; font-size: 13px; text-decoration: none; white-space: nowrap; }
.lpTopNav { display: none; gap: 4px; align-items: center; }
.lpTopNav a { padding: 8px 12px; border-radius: 999px; font-size: 13px; font-weight: 500; color: rgba(246,242,234,.78); text-decoration: none; }
.lpTopNav a:hover { color: #d9b777; background: rgba(200,154,88,.08); }
.lpTopNav a[aria-current="page"] { color: #d9b777; background: rgba(200,154,88,.12); }
.lpHeaderActions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.lpHeaderPhone { display: none; border: 1px solid rgba(200,154,88,.45); color: #d9b777; padding: 8px 12px; border-radius: 999px; font-size: 12px; text-decoration: none; white-space: nowrap; }
.lpHeaderCta { display: none; align-items: center; min-height: 40px; padding: 0 14px; border-radius: 999px; background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: #d9b777; font-size: 12px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.lpMenuBtn { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid rgba(246,242,234,.14); border-radius: 999px; background: transparent; color: #d9b777; cursor: pointer; }
.lpMobileNav { display: none; flex-direction: column; gap: 4px; padding: 12px clamp(16px, 3vw, 32px) 20px; border-top: 1px solid rgba(246,242,234,.08); background: rgba(8,16,15,.98); }
.lpMobileNav.isOpen { display: flex; }
.lpMobileNav a { min-height: 44px; display: flex; align-items: center; padding: 0 12px; border-radius: 10px; color: rgba(246,242,234,.86); text-decoration: none; font-size: 15px; }
.lpMobileNav a[aria-current="page"] { color: #d9b777; background: rgba(200,154,88,.1); }
.lpMobileNavExplore { margin-top: 8px; padding-top: 12px; border-top: 1px solid rgba(246,242,234,.08); }
.lpMobileNavExplore p { margin: 0 0 8px 12px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: rgba(246,242,234,.48); }
.lpMain { padding: clamp(20px, 4vw, 40px) clamp(16px, 3vw, 40px) 80px; max-width: 1280px; margin: 0 auto; }
.lpMainInterior { max-width: none; padding: 0; }
.lpInteriorBody { width: 100%; }
.lpSiteFooter { margin-top: 48px; padding: 24px clamp(16px, 3vw, 40px) calc(24px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(246,242,234,.08); background: rgba(8,16,15,.6); }
.lpSiteFooterInner { max-width: 1280px; margin: 0 auto; display: grid; gap: 20px; }
.lpSiteFooterTop { display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: center; justify-content: space-between; }
.lpSiteFooterNav, .lpSiteFooterExplore { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.lpSiteFooterNav a, .lpSiteFooterExplore a { font-size: 13px; color: rgba(246,242,234,.62); text-decoration: none; }
.lpSiteFooterNav a:hover, .lpSiteFooterExplore a:hover { color: #d9b777; }
.lpSiteFooterMeta { font-size: 12px; line-height: 1.7; color: rgba(246,242,234,.42); }
.lpStickyCta { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; display: block; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: rgba(8,16,15,.94); border-top: 1px solid rgba(246,242,234,.1); backdrop-filter: blur(10px); }
.lpStickyCta a { display: flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 999px; background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: #d9b777; font-weight: 600; text-decoration: none; font-size: 14px; }
.lpGrid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr); gap: clamp(24px, 4vw, 40px); align-items: start; }
.lpHero { display: grid; gap: 18px; }
.lpKicker { margin: 0; color: #d9b777; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; }
.lpTitle { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(2rem, 4.8vw, 3.2rem); line-height: 1.05; font-weight: 600; color: #f6f2ea; text-wrap: balance; }
.lpLead { margin: 0; font-size: clamp(1.05rem, 2.2vw, 1.22rem); line-height: 1.65; color: rgba(246,242,234,.84); max-width: 38rem; }
.lpHeroActions { display: flex; flex-wrap: wrap; gap: 12px; }
.lpPrimaryCta, .lpSecondaryCta { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: .04em; }
.lpPrimaryCta { background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: #d9b777; }
.lpSecondaryCta { border: 1px solid rgba(246,242,234,.18); color: rgba(246,242,234,.88); }
.lpTherapist { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 14px; align-items: center; padding: 16px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.45); }
.lpTherapist img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
.lpTherapistName { margin: 0 0 4px; font-weight: 600; }
.lpTherapistRole { margin: 0; font-size: 14px; color: rgba(246,242,234,.72); line-height: 1.5; }
.lpTrustList { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.lpTrustList li { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(200,154,88,.28); background: rgba(200,154,88,.08); font-size: 12px; letter-spacing: .04em; color: rgba(246,242,234,.84); }
.lpSteps { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.lpSteps li { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; align-items: start; font-size: 15px; line-height: 1.55; color: rgba(246,242,234,.78); }
.lpStepNum { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; border: 1px solid rgba(200,154,88,.45); color: #d9b777; font-size: 12px; font-weight: 700; }
.lpFormPanel { position: sticky; top: 88px; border: 1px solid rgba(246,242,234,.12); border-radius: 18px; padding: clamp(18px, 3vw, 24px); background: rgba(8,16,15,.72); box-shadow: 0 24px 80px rgba(0,0,0,.28); }
.lpFormIntro { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: rgba(246,242,234,.76); }
.lpFormPanel .contactForm { margin-top: 0; max-width: none; }
.lpFormPanel .contactSubmit { width: 100%; min-height: 52px; font-size: 14px; }
.lpReassurance { margin: 14px 0 0; font-size: 13px; line-height: 1.6; color: rgba(246,242,234,.62); }
.siteShell, .siteSidebar, .siteRail, .mobileSidebar, .mobileSidebarPanel, .collapsibleRail { display: none !important; }
.lpShell .siteMain, .lpShell main.siteMain, .lpInteriorBody .siteMain { margin: 0 !important; margin-left: 0 !important; margin-right: 0 !important; height: auto !important; min-height: 0 !important; overflow: visible !important; width: 100% !important; }
.lpInteriorBody .interiorMain { background: transparent; }
a:focus-visible, button:focus-visible, summary:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #d9b777; outline-offset: 2px; }
@media (min-width: 901px) {
  .lpTopNav { display: flex; }
  .lpHeaderPhone, .lpHeaderCta { display: inline-flex; align-items: center; }
  .lpMenuBtn { display: none; }
  .lpMobileNav { display: none !important; }
  .lpStickyCta { display: none; }
  body.lpBody { padding-bottom: 0; }
}
@media (max-width: 900px) {
  .lpGrid { grid-template-columns: 1fr; }
  .lpFormPanel { position: static; order: 2; }
  .lpHero { order: 1; }
  .lpHeaderPhone span { display: none; }
  body.lpBody { padding-bottom: 84px; }
  .lpHeaderCta { display: none; }
}
</style>`;

export const SHELL_V2_SCRIPT = `<script id="pathfinder-shell-v2">
document.addEventListener("DOMContentLoaded", function () {
  var menuBtn = document.querySelector(".lpMenuBtn");
  var mobileNav = document.querySelector(".lpMobileNav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("isOpen");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (event) {
      if (!mobileNav.classList.contains("isOpen")) return;
      if (event.target.closest(".lpHeader")) return;
      mobileNav.classList.remove("isOpen");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  }
  document.querySelectorAll("[data-scroll-target]").forEach(function (button) {
    button.addEventListener("click", function (event) {
      var target = document.querySelector(button.getAttribute("data-scroll-target"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});
</script>`;

function unwrapInteriorBody(content) {
  const match = content.match(/^<div class="lpInteriorBody">\s*([\s\S]*)\s*<\/div>\s*$/);
  return match ? match[1].trim() : content;
}

export function extractPageParts(html) {
  const headEnd = html.indexOf("</head>") + 7;
  const head = html.slice(0, headEnd);
  const mainMatch = html.match(/<main[^>]*\bid="main-content"[^>]*>([\s\S]*?)<\/main>/);
  const mainInner = unwrapInteriorBody(mainMatch ? mainMatch[1].trim() : "");
  const tailMatch = html.match(/<script id="pathfinder-google-tag-loader"[\s\S]*$/);
  const tail = tailMatch ? tailMatch[0].replace("</body></html>", "") : "";

  const bodyStart = html.indexOf("<body");
  const mainTagMatch = html.match(/<main[^>]*\bid="main-content"[^>]*>/);
  const mainStart = mainTagMatch ? html.indexOf(mainTagMatch[0]) : -1;
  const bodySchemas = [];
  if (bodyStart >= 0 && mainStart > bodyStart) {
    const bodyOpenEnd = html.indexOf(">", bodyStart) + 1;
    const between = html.slice(bodyOpenEnd, mainStart);
    for (const script of between.match(/<script[\s\S]*?<\/script>/g) ?? []) {
      bodySchemas.push(script);
    }
  }

  return { head, mainInner, tail, bodySchemas };
}

function navLink(item, route) {
  const current = route === item.href ? ' aria-current="page"' : "";
  return `<a href="${item.href}"${current}>${item.label}</a>`;
}

export function buildHeader(route) {
  const primary = NAV_ITEMS.map((item) => navLink(item, route)).join("");
  const explore = EXPLORE_LINKS.map((item) => navLink(item, route)).join("");

  return `<header class="lpHeader">
  <div class="lpHeaderInner">
    <a class="lpBrand" href="/" aria-label="Pathfinder Therapy home">PATHFINDER THERAPY</a>
    <nav class="lpTopNav" aria-label="Main navigation">${primary}</nav>
    <div class="lpHeaderActions">
      <a class="lpHeaderPhone" href="tel:+351914775365" aria-label="Call Pathfinder Therapy"><span>Call</span> +351 914 775 365</a>
      <a class="lpHeaderCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <button class="lpMenuBtn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="lpMobileNav">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"/></svg>
      </button>
    </div>
  </div>
  <nav class="lpMobileNav" id="lpMobileNav" aria-label="Mobile navigation">
    ${primary}
    <a href="tel:+351914775365">Call +351 914 775 365</a>
    <a href="${BOOKING_PATH}"><strong>${BOOKING_LABEL}</strong></a>
    <div class="lpMobileNavExplore">
      <p>Explore</p>
      ${explore}
    </div>
  </nav>
</header>`;
}

export function buildSiteFooter() {
  const primary = NAV_ITEMS.map((item) => `<a href="${item.href}">${item.label}</a>`).join("");
  const explore = EXPLORE_LINKS.map((item) => `<a href="${item.href}">${item.label}</a>`).join("");

  return `<footer class="lpSiteFooter">
  <div class="lpSiteFooterInner">
    <div class="lpSiteFooterTop">
      <nav class="lpSiteFooterNav" aria-label="Footer navigation">${primary}</nav>
      <nav class="lpSiteFooterExplore" aria-label="Explore">${explore}</nav>
    </div>
    <p class="lpSiteFooterMeta">Pathfinder Therapy · R. Rodrigues Sampaio 76, Lisboa · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · <a href="/crisis-support/">Crisis support</a> · <a href="#" data-cookie-manage>Manage cookies</a> · Non-urgent enquiries only</p>
  </div>
</footer>`;
}

export function buildStickyBar(href = BOOKING_PATH, label = BOOKING_LABEL) {
  return `<div class="lpStickyCta" role="region" aria-label="Book consultation">
  <a href="${href}"${href.startsWith("#") ? ` data-scroll-target="${href}"` : ""}>${label}</a>
</div>`;
}

export function wrapInShellV2({ head, route, mainInner, tail, bodySchemas = [], interior = true }) {
  const mainClass = interior ? "lpMain lpMainInterior" : "lpMain";
  const schemas = bodySchemas.join("\n");

  return `${head}${SHELL_V2_CSS}
</head><body class="lpShell lpBody">
<a class="skipLink" href="#main-content">Skip to main content</a>
${schemas}
${buildHeader(route)}
<main class="${mainClass}" id="main-content" tabindex="-1">
<div class="lpInteriorBody">
${mainInner}
</div>
</main>
${buildSiteFooter()}
${buildStickyBar()}
${tail}
${SHELL_V2_SCRIPT}
</body></html>`;
}

export function applyShellV2(html, route) {
  if (route === "/start/" || route === "/thank-you/") {
    return html;
  }

  const parts = extractPageParts(html);
  let next = wrapInShellV2({ ...parts, route });
  next = next.replaceAll("Book a consultation", BOOKING_LABEL);
  next = next.replaceAll('href="/contact/#contact-form"', `href="${BOOKING_PATH}"`);
  return next;
}

export function buildContactPageBody(formHtml) {
  return `<div class="lpGrid">
  <section class="lpHero" aria-labelledby="contact-title">
    <p class="lpKicker">Contact · Lisbon clinic &amp; online</p>
    <h1 class="lpTitle" id="contact-title">Arrange an initial consultation with Brent Kelly.</h1>
    <p class="lpLead">Send a brief, secure enquiry — Brent responds to non-urgent messages within one working day. No detailed clinical history needed at this stage.</p>
    <div class="lpHeroActions">
      <a class="lpPrimaryCta" href="#consultation-form" data-scroll-target="#consultation-form">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="https://wa.me/351914775365">WhatsApp Brent</a>
    </div>
    <div class="lpTherapist">
      <img src="/assets/images/about-brent.webp" width="72" height="72" alt="Brent Kelly, therapist at Pathfinder Therapy Lisbon" loading="eager" decoding="async" />
      <div>
        <p class="lpTherapistName">Brent Kelly</p>
        <p class="lpTherapistRole">Therapist · trauma, EMDR, veterans, couples &amp; individual therapy</p>
      </div>
    </div>
    <ul class="lpTrustList" aria-label="Professional reassurance">
      <li>EATA registered</li>
      <li>Trauma-informed</li>
      <li>EMDR</li>
      <li>Confidential</li>
      <li>Supervised practice</li>
    </ul>
    <ol class="lpSteps" aria-label="What happens next">
      <li><span class="lpStepNum">1</span><span>Send your enquiry using the secure form.</span></li>
      <li><span class="lpStepNum">2</span><span>Brent replies within one working day.</span></li>
      <li><span class="lpStepNum">3</span><span>Arrange your first session in Lisbon or online (from €75).</span></li>
    </ol>
  </section>
  <section class="lpFormPanel" id="consultation-form" aria-labelledby="consultation-form-intro">
    <p class="lpKicker">Confidential enquiry</p>
    <p class="lpFormIntro" id="consultation-form-intro">This takes about two minutes. Your details are sent securely to Brent — for non-urgent enquiries only.</p>
    ${formHtml}
    <p class="lpReassurance">Sessions from €75 · Lisbon clinic or secure online · Professional indemnity insurance · Clinical supervision in place</p>
  </section>
</div>`;
}
