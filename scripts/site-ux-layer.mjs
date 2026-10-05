export const CONSULTATION_PATH = "https://booking.pathfindertherapy.com/book";
export const ENQUIRY_PATH = "/start/#enquiry";
/** Primary CTA — native Pathfinder booking. */
export const BOOKING_PATH = CONSULTATION_PATH;
export const BOOKING_LABEL = "Arrange an initial consultation";
/** Secondary CTA — written enquiry form. */
export const ENQUIRY_LABEL = "Send an enquiry";
/** Public Client Login — My Pathfinder hostname only. Do not add Access, tokens, or credential collection. */
export const CLIENT_LOGIN_URL = "https://my.pathfindertherapy.org.uk/my/login";
export const CLIENT_LOGIN_LABEL = "Client Login";

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
  <p class="pfHeroKicker">English-speaking therapist · Lisbon &amp; online</p>
  <p class="pfHeroValue"><strong>Brent Kelly</strong> leads Pathfinder Therapy in Lisbon, with trusted online therapy support from Tim Felton and Sophie Gidley where clinically appropriate.</p>
  <ul class="pfHeroTrust" aria-label="Areas of support">
    <li>Trauma &amp; anxiety</li>
    <li>EMDR</li>
    <li>Online couples therapy</li>
    <li>Veterans</li>
    <li>English-speaking</li>
    <li>Confidential</li>
  </ul>
  <div class="pfHeroActions">
    <a class="pfHeroPrimary" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
    <a class="pfHeroSecondary" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
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
  <p><strong>EATA registered · ITAA member</strong> · trauma-informed · EMDR · Transactional Analysis · clinical supervision · professional indemnity insurance · sessions in English</p>
  <p>Pathfinder Therapy supports adults and couples navigating trauma, anxiety, attachment, and major life transitions — in person with Brent at the Lisbon clinic or securely online through the Pathfinder team.</p>
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
  next = next.replaceAll("Book initial Zoom call", BOOKING_LABEL);
  next = next.replaceAll("Book Zoom call", BOOKING_LABEL);
  next = next.replaceAll("Book an initial Zoom call", BOOKING_LABEL);
  next = next.replaceAll("Send a brief enquiry", ENQUIRY_LABEL);
  next = next.replaceAll("Send enquiry", ENQUIRY_LABEL);
  next = next.replaceAll("Make an enquiry", ENQUIRY_LABEL);
  next = next.replaceAll("Make an Enquiry", ENQUIRY_LABEL);
  next = next.replaceAll('href="/contact/#contact-form"', `href="${ENQUIRY_PATH}"`);
  next = next.replaceAll("href=\"/contact/#contact-form\"", `href="${ENQUIRY_PATH}"`);

  if (route === "/") {
    next = applyHomepageUx(next);
  }

  if (route === "/contact/" && !hasHtmlClass(next, "pfContactBanner")) {
    next = next.replace(
      '<main id="main-content" class="siteMain interiorMain" tabindex="-1">',
      `<main id="main-content" class="siteMain interiorMain" tabindex="-1"><div class="approachEssayInner"><p class="pfContactBanner">Prefer a written enquiry first? <a href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a> — or <a href="${BOOKING_PATH}">${BOOKING_LABEL}</a> to choose a time directly. Response within one working day.</p></div>`
    );
  }

  if (!hasHtmlClass(next, "pfStickyBook")) {
    next = next.replace("</body>", `${SITE_UX_STICKY}\n</body>`);
  }

  return next;
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

> English-speaking trauma-informed psychotherapy with Brent Kelly in Lisbon, nature-based therapy incorporating Eco-TA and EMDR where appropriate in Alcobaça, and online therapy across Portugal.

## Primary pages
- https://www.pathfindertherapy.com/
- https://www.pathfindertherapy.com/about/
- https://www.pathfindertherapy.com/therapy/
- https://www.pathfindertherapy.com/approach/
- https://www.pathfindertherapy.com/faq/
- https://www.pathfindertherapy.com/fees/
- https://www.pathfindertherapy.com/contact/
- https://www.pathfindertherapy.com/crisis-support/
- https://www.pathfindertherapy.com/knowledge-library/

## Local service pages (Lisbon)
- https://www.pathfindertherapy.com/psychotherapy-lisbon/
- https://www.pathfindertherapy.com/trauma-therapy-lisbon/
- https://www.pathfindertherapy.com/emdr-therapy-lisbon/
- https://www.pathfindertherapy.com/english-speaking-therapist-lisbon/

## Service pages
- [Nature-based therapy in Alcobaça: Eco-TA and EMDR](https://www.pathfindertherapy.com/nature-based-therapy-alcobaca/)
- [Individual therapy in Lisbon](https://www.pathfindertherapy.com/therapy/individual/)
- [Online couples therapy with Sophie Gidley](https://www.pathfindertherapy.com/therapy/couples/)
- [EMDR in Lisbon](https://www.pathfindertherapy.com/therapy/emdr/)
- [Online therapy](https://www.pathfindertherapy.com/therapy/online/)
- [Online EMDR for UK clients](https://www.pathfindertherapy.com/online-emdr-therapy-uk/)

## Booking
- Arrange a free 30-minute initial consultation by Zoom: https://booking.pathfindertherapy.com/book
- Send an enquiry: https://www.pathfindertherapy.com/start/#enquiry
- Email: hi@pathfindertherapy.com
- Phone/WhatsApp: +351 914 775 365

## Services
Individual therapy, online couples therapy, EMDR, online therapy, trauma-informed psychotherapy, nature-based therapy incorporating Ecological Transactional Analysis (Eco-TA).

## Location
Pathfinder Therapy Lisbon Clinic, R. Rodrigues Sampaio 76 1º Andar, 1150-281 Lisboa, Portugal.
Pathfinder Therapy Alcobaça nature-based practice, around 10 minutes from the centre of Alcobaça, Portugal. Sessions by arrangement; directions and arrival details are shared when a session is arranged. Availability, suitability, session length, fees and outdoor conditions are discussed before attendance.

## Legal entity
Pathfinder Therapy is a trading name of Pathfinder Therapy CIC, a community interest company registered in England and Wales under company number 17248842.
Pathfinder Therapy CIC is an NCPS Recognised Counselling Service (membership number RCS6035).

## Clinical Team
Brent Kelly — trauma-informed psychotherapist and EMDR Therapist (EATA registered · ITAA member), leading the Lisbon clinic and face-to-face provision. Tim Felton — online therapist and EMDR Therapist; UK EMDR sessions are online only. Sophie Gidley — online couples therapist. Availability and suitability are discussed before therapy begins.

## Fees
Lisbon and Portugal online individual therapy: from EUR 75 for 50 minutes. Portugal EMDR: EUR 95 for 60 minutes with Brent Kelly, in person in Lisbon or online where appropriate. UK online EMDR: GBP 80 for 60 minutes with Brent Kelly or Tim Felton, subject to assessment. The initial 30-minute Zoom consultation with Brent is free and is separate from a paid therapy session. Check https://www.pathfindertherapy.com/fees/ and the UK EMDR page for service-specific terms. Non-urgent enquiries only — not a crisis service.
`;
}

export function buildAiSummaryJson() {
  return JSON.stringify(
    {
      name: "Pathfinder Therapy",
      legal_name: "Pathfinder Therapy CIC",
      trading_name_statement: "Pathfinder Therapy is a trading name of Pathfinder Therapy CIC.",
      company_number: "17248842",
      type: "Private psychotherapy practice",
      url: "https://www.pathfindertherapy.com",
      locale: "en-GB",
      recognition: {
        ncps: {
          status: "NCPS Recognised Counselling Service",
          membership_number: "RCS6035",
          url: "https://ncps.com/about-us/our-community/our-recognised-counselling-services"
        }
      },
      clinical_team: {
        name: "Brent Kelly",
        role: "Lead therapist and EMDR Therapist, Lisbon clinic, Alcobaça nature-based practice and online",
        registrations: ["EATA"],
        memberships: ["ITAA"],
        specialties: ["Trauma", "EMDR", "Transactional Analysis", "Ecological Transactional Analysis (Eco-TA)", "Military veterans", "Attachment"],
        online_collaborators: [
          { name: "Tim Felton", role: "Online therapist and EMDR Therapist" },
          { name: "Sophie Gidley", role: "Online couples therapist", approach: "Transactional Analysis" }
        ]
      },
      locations: [
        {
          city: "Lisboa",
          country: "Portugal",
          address: "R. Rodrigues Sampaio 76 1º Andar, 1150-281 Lisboa"
        },
        {
          city: "Alcobaça",
          country: "Portugal",
          name: "Pathfinder Therapy Alcobaça nature-based practice",
          location_description: "Around 10 minutes from the centre of Alcobaça",
          delivery: "Nature-based psychotherapy incorporating Eco-TA and EMDR where clinically appropriate",
          access: "Sessions by arrangement; directions and arrival details shared when a session is arranged",
          practicalities: "Availability, suitability, session length, fees, privacy, access and weather arrangements agreed before attendance",
          url: "https://www.pathfindertherapy.com/nature-based-therapy-alcobaca/"
        }
      ],
      services: ["Trauma-informed psychotherapy", "Individual therapy", "Online couples therapy", "EMDR", "Online therapy", "Nature-based therapy incorporating Eco-TA"],
      languages: ["English"],
      fees: {
        lisbon_individual: { currency: "EUR", from: 75, duration_minutes: 50, source: "https://www.pathfindertherapy.com/fees/" },
        portugal_emdr: { currency: "EUR", amount: 95, duration_minutes: 60, practitioners: ["Brent Kelly"], delivery: "In person in Lisbon or online across Portugal", subject_to_assessment: true, source: "https://www.pathfindertherapy.com/emdr-therapy-lisbon/" },
        uk_online_emdr: { currency: "GBP", amount: 80, duration_minutes: 60, practitioners: ["Brent Kelly", "Tim Felton"], delivery: "Online only", subject_to_assessment: true, source: "https://www.pathfindertherapy.com/online-emdr-therapy-uk/" }
      },
      service_pages: ["https://www.pathfindertherapy.com/therapy/individual/", "https://www.pathfindertherapy.com/therapy/couples/", "https://www.pathfindertherapy.com/therapy/emdr/", "https://www.pathfindertherapy.com/therapy/online/", "https://www.pathfindertherapy.com/online-emdr-therapy-uk/", "https://www.pathfindertherapy.com/nature-based-therapy-alcobaca/"],
      booking: {
        consultation_url: "https://booking.pathfindertherapy.com/book",
        consultation_description: "Free 30-minute initial consultation by Zoom, with no obligation to continue",
        enquiry_url: "https://www.pathfindertherapy.com/start/#enquiry",
        email: "hi@pathfindertherapy.com",
        phone: "+351914775365"
      },
      seo_topics: [
        "Therapist Lisbon",
        "Trauma therapist Lisbon",
        "EMDR Lisbon",
        "English speaking therapist Lisbon",
        "Online therapy Portugal",
        "Nature-based therapy Alcobaça",
        "Eco-TA Alcobaça"
      ],
      local_pages: [
        "https://www.pathfindertherapy.com/psychotherapy-lisbon/",
        "https://www.pathfindertherapy.com/trauma-therapy-lisbon/",
        "https://www.pathfindertherapy.com/emdr-therapy-lisbon/",
        "https://www.pathfindertherapy.com/english-speaking-therapist-lisbon/"
      ],
      crisis_support: "https://www.pathfindertherapy.com/crisis-support/"
    },
    null,
    2
  );
}
