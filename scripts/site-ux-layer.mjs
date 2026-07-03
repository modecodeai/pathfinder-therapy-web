export const BOOKING_PATH = "/start/";
export const BOOKING_LABEL = "Arrange an initial consultation";

export const SITE_UX_CSS = `<style id="pathfinder-site-ux">
.pfStickyBook { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; display: none; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: rgba(8,16,15,.94); border-top: 1px solid rgba(246,242,234,.1); backdrop-filter: blur(10px); }
.pfStickyBook a { display: flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 999px; background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: #d9b777; font-weight: 600; text-decoration: none; font-size: 14px; }
.pfHeroConversion { margin-top: 24px; display: grid; gap: 16px; max-width: 42rem; padding: clamp(18px, 3vw, 24px); border: 1px solid rgba(200,154,88,.35); border-radius: 18px; background: rgba(8,16,15,.78); backdrop-filter: blur(10px); box-shadow: 0 20px 60px rgba(0,0,0,.35); }
.pfHeroKicker { margin: 0; color: #d9b777; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; }
.pfHeroValue { margin: 0; font-size: clamp(1.05rem, 2.2vw, 1.2rem); line-height: 1.65; color: rgba(246,242,234,.92); }
.pfHeroTrust { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.pfHeroTrust li { padding: 7px 11px; border-radius: 999px; border: 1px solid rgba(200,154,88,.28); background: rgba(8,16,15,.35); font-size: 11px; letter-spacing: .04em; color: rgba(246,242,234,.82); }
.pfHeroActions { display: flex; flex-wrap: wrap; gap: 12px; }
.pfHeroPrimary, .pfHeroSecondary { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px; border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; letter-spacing: .03em; }
.pfHeroPrimary { background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: #d9b777; }
.pfHeroSecondary { border: 1px solid rgba(246,242,234,.18); color: rgba(246,242,234,.88); }
.pfHeroSteps { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.pfHeroSteps li { font-size: 14px; line-height: 1.55; color: rgba(246,242,234,.72); padding-left: 18px; position: relative; }
.pfHeroSteps li:before { content: "→"; position: absolute; left: 0; color: #d9b777; }
.pfTrustBand { margin-top: 28px; padding: 20px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.45); }
.pfTrustBand p { margin: 0 0 10px; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.pfContactBanner { margin: 0 0 24px; padding: 16px 18px; border: 1px solid rgba(200,154,88,.28); border-radius: 14px; background: rgba(200,154,88,.08); color: rgba(246,242,234,.82); font-size: 15px; line-height: 1.6; }
.pfContactBanner a { color: #d9b777; font-weight: 600; }
.button, .contactSubmit, .sidebarCta .button { min-height: 48px; }
a:focus-visible, button:focus-visible, summary:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #d9b777; outline-offset: 2px; }
@media (max-width: 900px) {
  .pfStickyBook { display: block; }
  body { padding-bottom: 84px; }
  .hero .scrollCue { display: none; }
}
@media (min-width: 901px) {
  .pfStickyBook { display: none !important; }
  .pfDesktopBook { display: inline-flex; }
}
.pfDesktopBook { display: none; align-items: center; justify-content: center; min-height: 44px; padding: 0 16px; border-radius: 999px; background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: #d9b777; font-weight: 600; text-decoration: none; font-size: 13px; margin-top: 8px; }
</style>`;

export const SITE_UX_STICKY = `<div class="pfStickyBook" role="region" aria-label="Book consultation">
  <a href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
</div>`;

const HOMEPAGE_HERO_INJECTION = `<div class="pfHeroConversion">
  <p class="pfHeroKicker">English-speaking psychotherapist · Lisbon &amp; online</p>
  <p class="pfHeroValue"><strong>Brent Kelly</strong> offers trauma-informed psychotherapy for adults and couples — in person in <strong>Lisbon</strong> or securely <strong>online across Portugal</strong>.</p>
  <ul class="pfHeroTrust" aria-label="Areas of support">
    <li>Trauma &amp; anxiety</li>
    <li>EMDR</li>
    <li>Couples therapy</li>
    <li>Veterans</li>
    <li>English-speaking</li>
    <li>Confidential</li>
  </ul>
  <div class="pfHeroActions">
    <a class="pfHeroPrimary" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
    <a class="pfHeroSecondary" href="https://wa.me/351914775365">WhatsApp Brent</a>
  </div>
  <ol class="pfHeroSteps" aria-label="What happens next">
    <li>Send a brief secure enquiry — no detailed history needed.</li>
    <li>Brent replies within one working day.</li>
    <li>Arrange your first session in Lisbon or online (from €75).</li>
  </ol>
</div>`;

function hasHtmlClass(html, className) {
  return (
    html.includes(`class="${className}"`) ||
    html.includes(`class="${className} `) ||
    html.includes(` ${className}"`)
  );
}

const BEGIN_SECTION_TRUST = `<div class="pfTrustBand" aria-label="Professional reassurance">
  <p><strong>NCPS registered</strong> · trauma-informed · EMDR · Transactional Analysis · clinical supervision · professional indemnity insurance · sessions in English</p>
  <p>Pathfinder Therapy supports adults and couples navigating trauma, anxiety, attachment, and major life transitions — in person at our Lisbon clinic or securely online.</p>
</div>`;

export function applySiteWideUx(html, route) {
  if (route === "/start/" || route === "/thank-you/") {
    return html;
  }

  let next = html;

  if (!next.includes("pathfinder-site-ux")) {
    next = next.replace("</head>", `${SITE_UX_CSS}\n</head>`);
  }

  next = next.replaceAll("Book a consultation", BOOKING_LABEL);
  next = next.replaceAll('href="/contact/#contact-form"', `href="${BOOKING_PATH}"`);
  next = next.replaceAll("href=\"/contact/#contact-form\"", `href="${BOOKING_PATH}"`);

  if (route === "/") {
    next = applyHomepageUx(next);
  }

  if (route === "/contact/" && !hasHtmlClass(next, "pfContactBanner")) {
    next = next.replace(
      '<main id="main-content" class="siteMain interiorMain" tabindex="-1">',
      `<main id="main-content" class="siteMain interiorMain" tabindex="-1"><div class="approachEssayInner"><p class="pfContactBanner">Prefer a focused consultation form? <a href="${BOOKING_PATH}">${BOOKING_LABEL}</a> — designed for a quick, confidential first enquiry. Response within one working day.</p></div>`
    );
  }

  if (["/therapy/", "/about/", "/approach/"].includes(route)) {
    next = injectPageCta(next);
  }

  if (!hasHtmlClass(next, "pfStickyBook")) {
    next = next.replace("</body>", `${SITE_UX_STICKY}\n</body>`);
  }

  if (route !== "/" && !hasHtmlClass(next, "pfDesktopBook")) {
    next = next.replace(
      '<div class="sidebarCta">',
      `<a class="pfDesktopBook" href="${BOOKING_PATH}">${BOOKING_LABEL}</a><div class="sidebarCta">`
    );
  }

  return next;
}

const PAGE_CTA_BLOCK = `<section class="approachEssay pfPageCta" aria-label="Arrange a consultation">
  <div class="approachEssayInner">
    ${BEGIN_SECTION_TRUST}
    <div class="pfHeroActions" style="margin-top:16px">
      <a class="pfHeroPrimary" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="pfHeroSecondary" href="tel:+351914775365">Call +351 914 775 365</a>
    </div>
  </div>
</section>`;

function injectPageCta(html) {
  if (hasHtmlClass(html, "pfPageCta")) {
    return html;
  }
  return html.replace("</main>", `${PAGE_CTA_BLOCK}\n</main>`);
}

function applyHomepageUx(html) {
  let next = html;

  if (!hasHtmlClass(next, "pfHeroConversion")) {
    next = next.replace(
      '<p class="heroMicrocopy">Some paths bring us closer to ourselves. Others lead us away.</p></div>',
      `<p class="heroMicrocopy">Some paths bring us closer to ourselves. Others lead us away.</p>${HOMEPAGE_HERO_INJECTION}</div>`
    );
  }

  if (!hasHtmlClass(next, "pfTrustBand")) {
    next = next.replace(
      '<p class="sectionBody">Pathfinder is a space to understand what has shaped you, what still protects you, and what might now be ready to change.</p>',
      `<p class="sectionBody">Pathfinder is a space to understand what has shaped you, what still protects you, and what might now be ready to change.</p>${BEGIN_SECTION_TRUST}`
    );
  }

  return next;
}

export function buildLlmsTxt() {
  return `# Pathfinder Therapy — Private Practice (.com)

> Trauma-informed psychotherapy with Brent Kelly in Lisbon and online across Portugal.

## Primary pages
- https://www.pathfindertherapy.com/
- https://www.pathfindertherapy.com/about/
- https://www.pathfindertherapy.com/therapy/
- https://www.pathfindertherapy.com/approach/
- https://www.pathfindertherapy.com/faq/
- https://www.pathfindertherapy.com/fees/
- https://www.pathfindertherapy.com/contact/
- https://www.pathfindertherapy.com/knowledge-library/

## Booking
- Book initial Zoom consultation: https://www.pathfindertherapy.com/book/
- Consultation enquiry form: https://www.pathfindertherapy.com/start/
- Email: hi@pathfindertherapy.com
- Phone/WhatsApp: +351 914 775 365

## Services
Individual therapy, couples therapy, EMDR, online therapy, trauma-informed psychotherapy.

## Location
Pathfinder Therapy Lisbon Clinic, R. Rodrigues Sampaio 76 1º Andar, 1150-281 Lisboa, Portugal.

## Clinician
Brent Kelly — registered psychotherapist (NCPS). Specialities: trauma, EMDR, Transactional Analysis, military veterans, attachment.

## Fees
Sessions from EUR 75. Non-urgent enquiries only — not a crisis service.
`;
}

export function buildAiSummaryJson() {
  return JSON.stringify(
    {
      name: "Pathfinder Therapy",
      type: "Private psychotherapy practice",
      url: "https://www.pathfindertherapy.com",
      locale: "en-GB",
      clinician: {
        name: "Brent Kelly",
        role: "Psychotherapist",
        registrations: ["NCPS"],
        specialties: ["Trauma", "EMDR", "Transactional Analysis", "Military veterans", "Couples therapy"]
      },
      locations: [
        {
          city: "Lisboa",
          country: "Portugal",
          address: "R. Rodrigues Sampaio 76 1º Andar, 1150-281 Lisboa"
        }
      ],
      services: ["Individual therapy", "Couples therapy", "EMDR", "Online therapy"],
      languages: ["English"],
      fees: { currency: "EUR", from: 75 },
      booking: {
        enquiry_url: "https://www.pathfindertherapy.com/start/",
        email: "hi@pathfindertherapy.com",
        phone: "+351914775365"
      },
      seo_topics: [
        "Psychotherapist Lisbon",
        "Trauma therapist Lisbon",
        "EMDR Lisbon",
        "English speaking therapist Lisbon",
        "Online therapy Portugal"
      ]
    },
    null,
    2
  );
}
