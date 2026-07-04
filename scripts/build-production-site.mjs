import { mkdir, readFile, writeFile, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOOKING_LABEL,
  BOOKING_PATH,
  buildAiSummaryJson,
  buildLlmsTxt
} from "./site-ux-layer.mjs";
import {
  applyShellV2,
  buildContactPageBody,
  buildStickyBar,
  extractPageParts,
  wrapInShellV2
} from "./site-shell-v2.mjs";
import { buildHomePageV2, SPRINT2_CSS, wrapWithBookingPanel, AD_LANDING_SCRIPT } from "./site-sprint2.mjs";
import { applySprint3Transforms, stripHydrationScripts } from "./site-sprint3.mjs";
import {
  BOOK_CONFIRMED_PATH,
  BOOK_PATH,
  buildBookConfirmedBody,
  buildBookPageBody,
  CALENDLY_CSS,
  CALENDLY_INLINE_SCRIPT,
  DEFAULT_CALENDLY_URL
} from "./site-calendly.mjs";
import {
  GOOGLE_ADS_HELPER_SCRIPT,
  injectGtag,
  logGoogleAdsBuildConfig
} from "./site-google-ads.mjs";
import { applyCredentialCopy } from "./site-credentials.mjs";
import { buildEataBadge, injectEataBadgeStyles } from "./site-eata.mjs";
import { injectCookieConsent } from "./site-cookie-consent.mjs";
import { patchGlobalSchema } from "./site-schema.mjs";
import { buildCrisisPage } from "./site-crisis.mjs";
import {
  LOCAL_LANDING_PAGES,
  buildLocalLandingPage,
  getLocalLandingRoutes
} from "./site-local-landings.mjs";

const PREVIEW_ORIGIN =
  process.env.PATHFINDER_PREVIEW_ORIGIN ?? "https://9aa49f15.pathfinder-therapy-web.pages.dev";
const LIVE_SITEMAP =
  process.env.PATHFINDER_SITEMAP_URL ?? "https://www.pathfindertherapy.com/sitemap.xml";
const FALLBACK_SITEMAP = `${PREVIEW_ORIGIN}/sitemap.xml`;
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "out");

const ATTRIBUTION_SCRIPT = `<script id="pathfinder-lead-attribution">
(function () {
  var KEY = "pathfinder_lead_attribution";
  var PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];

  function readParams() {
    var params = new URLSearchParams(window.location.search);
    var incoming = {};
    PARAMS.forEach(function (key) {
      var value = params.get(key);
      if (value) incoming[key] = value;
    });
    return incoming;
  }

  function loadStored() {
    try {
      var raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function saveStored(next) {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  }

  function capture() {
    var incoming = readParams();
    if (!Object.keys(incoming).length) return loadStored();
    var existing = loadStored();
    var merged = Object.assign({}, existing, incoming, {
      landing_page: existing.landing_page || window.location.pathname,
      captured_at: new Date().toISOString()
    });
    saveStored(merged);
    return merged;
  }

  function appendAttribution(url) {
    var stored = loadStored();
    var next = new URL(url, window.location.origin);
    PARAMS.forEach(function (key) {
      if (stored[key] && !next.searchParams.has(key)) next.searchParams.set(key, stored[key]);
    });
    return next.pathname + next.search + next.hash;
  }

  window.pathfinderLead = {
    capture: capture,
    appendAttribution: appendAttribution,
    payload: function () {
      return loadStored();
    }
  };

  capture();

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href");
    if (!href || href.indexOf("http") === 0 || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
    if (href.indexOf("/contact") === 0 || href.indexOf("/start") === 0 || href.indexOf("/book") === 0) {
      var nextHref = appendAttribution(href);
      if (nextHref !== href) link.setAttribute("href", nextHref);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('a[href="/contact/"], a[href="/contact/#contact-form"]').forEach(function (link) {
      link.setAttribute("href", appendAttribution("/start/"));
    });
  });
})();
</script>`;

const FORM_ENHANCEMENT_SCRIPT = `<script id="pathfinder-form-enhancement">
(function () {
  function track(eventName, label) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, { event_category: "lead_funnel", event_label: label });
    }
  }

  var originalFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input.url;
    var nextInit = init ? Object.assign({}, init) : undefined;

    if (url.indexOf("/api/contact") >= 0 && nextInit && nextInit.body && typeof nextInit.body === "string") {
      try {
        var body = JSON.parse(nextInit.body);
        var payload = window.pathfinderLead ? window.pathfinderLead.payload() : {};
        Object.assign(body, payload);
        body.source = window.location.pathname.indexOf("/start") === 0 ? "start_landing" : "contact_page";
        nextInit.body = JSON.stringify(body);
      } catch (error) {}
    }

    return originalFetch.call(this, input, nextInit).then(function (response) {
      if (url.indexOf("/api/contact") >= 0) {
        response.clone().json().then(function (data) {
          if (data && data.ok) {
            setTimeout(function () {
              window.location.href = "/thank-you/";
            }, 600);
          }
        }).catch(function () {});
      }
      return response;
    });
  };

  function bodySource() {
    return window.location.pathname.indexOf("/start") === 0 ? "start_landing" : "contact_page";
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname.indexOf("/start") === 0) {
      track("ad_landing_view", "start");
    }

    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      link.addEventListener("click", function () {
        track("phone_click", bodySource());
        if (window.pathfinderAds) {
          window.pathfinderAds.firePhoneConversion();
        }
      });
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
      link.addEventListener("click", function () {
        track("whatsapp_click", bodySource());
      });
    });

    document.querySelectorAll("form.contactForm").forEach(function (form) {
      var started = false;
      form.addEventListener("focusin", function () {
        if (started) return;
        started = true;
        track("form_start", bodySource());
      });

      form.addEventListener("submit", function (event) {
        if (form.dataset.enhanced === "true") return;
        event.preventDefault();
        form.dataset.enhanced = "true";
        var submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Sending...";
        }
        var fields = Object.fromEntries(new FormData(form).entries());
        var payload = window.pathfinderLead ? window.pathfinderLead.payload() : {};
        Object.assign(fields, payload, { source: bodySource() });
        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields)
        })
          .then(function (response) {
            return response.json().then(function (data) {
              return { response: response, data: data };
            });
          })
          .then(function (result) {
            if (!result.response.ok || !result.data.ok) {
              throw new Error(result.data.message || "The enquiry could not be sent.");
            }
            window.location.href = "/thank-you/";
          })
          .catch(function (error) {
            form.dataset.enhanced = "false";
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = submitButton.dataset.label || "Arrange an initial consultation";
            }
            var status = form.querySelector(".contactStatus");
            if (!status) {
              status = document.createElement("p");
              status.className = "contactStatus contactStatus-error";
              status.setAttribute("role", "alert");
              form.appendChild(status);
            }
            status.textContent = error.message || "The enquiry could not be sent. Please contact us directly.";
          });
      });
    });
  });
})();
</script>`;

const THANK_YOU_SCRIPT = `<script id="pathfinder-thank-you-conversion">
document.addEventListener("DOMContentLoaded", function () {
  if (window.pathfinderAds) window.pathfinderAds.fireLeadConversion("thank_you_page");
});
</script>`;

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function extractAssetPaths(html) {
  const assets = new Set();
  const patterns = [
    /\/_next\/static\/[A-Za-z0-9_./-]+/g,
    /\/assets\/[A-Za-z0-9_./-]+/g,
    /\/favicon\.(?:ico|svg)/g
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      assets.add(match[0].split("?")[0]);
    }
  }

  return assets;
}

function routeToFilePath(route) {
  let pathname = route;
  if (!pathname.endsWith("/")) pathname += "/";
  if (pathname === "/") return "index.html";
  return `${pathname.slice(1)}index.html`;
}

async function writeRoute(origin, route, html) {
  const filePath = path.join(OUT_DIR, routeToFilePath(route));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, applyCredentialCopy(html), "utf8");
}

function injectBeforeBodyClose(html, snippet) {
  if (html.includes(snippet)) return html;
  return html.replace("</body>", `${snippet}\n</body>`);
}

function patchOpenGraph(html, { title, description, canonical, ogImage }) {
  let next = html;
  const ogTitle = title;
  const ogDescription = description;
  const ogUrl = canonical;
  const image =
    ogImage || "https://www.pathfindertherapy.com/assets/images/hero-01.webp";

  next = next.replace(/<meta property="og:title" content="[^"]*"\/>/g, "");
  next = next.replace(/<meta property="og:description" content="[^"]*"\/>/g, "");
  next = next.replace(/<meta property="og:url" content="[^"]*"\/>/g, "");
  next = next.replace(/<meta name="twitter:title" content="[^"]*"\/>/g, "");
  next = next.replace(/<meta name="twitter:description" content="[^"]*"\/>/g, "");

  const ogBlock = `<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Pathfinder Therapy"/>
<meta property="og:title" content="${ogTitle}"/>
<meta property="og:description" content="${ogDescription}"/>
<meta property="og:url" content="${ogUrl}"/>
<meta property="og:image" content="${image}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${ogTitle}"/>
<meta name="twitter:description" content="${ogDescription}"/>
<meta name="twitter:image" content="${image}"/>`;

  return next.replace("</head>", `${ogBlock}\n</head>`);
}

function patchHtml(html, { robots = null, title = null, canonical = null, description = null, ogImage = null } = {}) {
  let next = html;

  if (robots) {
    next = next.replace(/<meta name="robots" content="[^"]*"\/>/g, "");
    next = next.replace("</head>", `<meta name="robots" content="${robots}"/>\n</head>`);
  }

  if (title) {
    next = next.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  }

  if (description) {
    next = next.replace(/<meta name="description" content="[^"]*"\/>/g, "");
    next = next.replace("</head>", `<meta name="description" content="${description}"/>\n</head>`);
  }

  if (canonical) {
    next = next.replace(/<link rel="canonical" href="[^"]*"\/>/g, "");
    next = next.replace("</head>", `<link rel="canonical" href="${canonical}"/>\n</head>`);
  }

  if (title && description && canonical) {
    next = patchOpenGraph(next, { title, description, canonical, ogImage });
  }

  next = injectGtag(next);
  next = injectEataBadgeStyles(next);
  next = patchGlobalSchema(next);
  next = injectCookieConsent(next);
  next = injectBeforeBodyClose(next, GOOGLE_ADS_HELPER_SCRIPT);
  next = injectBeforeBodyClose(next, ATTRIBUTION_SCRIPT);
  next = injectBeforeBodyClose(next, FORM_ENHANCEMENT_SCRIPT);
  return next;
}

const LANDING_CSS = `<style id="pathfinder-landing-cro">
.lpShell { min-height: 100vh; background: var(--color-forest-deep, #08100f); color: var(--color-linen, #f6f2ea); }
.lpHeader { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px clamp(20px, 4vw, 40px); border-bottom: 1px solid rgba(246,242,234,.08); }
.lpBrand { display: flex; align-items: center; gap: 12px; color: var(--color-bronze, #c89a58); text-decoration: none; }
.lpBrandWord { font-family: Georgia, serif; letter-spacing: .08em; font-size: 14px; }
.lpHeaderPhone { border: 1px solid rgba(200,154,88,.55); color: var(--color-bronze-soft, #d9b777); padding: 10px 14px; border-radius: 999px; font-size: 13px; text-decoration: none; white-space: nowrap; }
.lpMain { padding: clamp(20px, 4vw, 40px) clamp(20px, 4vw, 48px) 120px; max-width: 1180px; margin: 0 auto; }
.lpGrid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr); gap: clamp(24px, 4vw, 40px); align-items: start; }
.lpHero { display: grid; gap: 18px; }
.lpKicker { margin: 0; color: var(--color-bronze-soft, #d9b777); font-size: 12px; letter-spacing: .18em; text-transform: uppercase; }
.lpTitle { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(2rem, 4.8vw, 3.4rem); line-height: 1.02; font-weight: 600; color: var(--color-linen, #f6f2ea); text-wrap: balance; }
.lpLead { margin: 0; font-size: clamp(1.05rem, 2.2vw, 1.25rem); line-height: 1.65; color: color-mix(in srgb, var(--color-linen, #f6f2ea) 86%, #8d867b); max-width: 38rem; }
.lpHeroActions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
.lpPrimaryCta, .lpSecondaryCta { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: .04em; }
.lpPrimaryCta { background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: var(--color-bronze-soft, #d9b777); }
.lpSecondaryCta { border: 1px solid rgba(246,242,234,.18); color: rgba(246,242,234,.88); }
.lpTherapist { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 14px; align-items: center; padding: 16px; border: 1px solid rgba(246,242,234,.1); border-radius: 16px; background: rgba(8,16,15,.45); }
.lpTherapist img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
.lpTherapistName { margin: 0 0 4px; font-weight: 600; }
.lpTherapistRole { margin: 0; font-size: 14px; color: rgba(246,242,234,.72); line-height: 1.5; }
.lpTrustList { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.lpTrustList li { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(200,154,88,.28); background: rgba(200,154,88,.08); font-size: 12px; letter-spacing: .04em; color: rgba(246,242,234,.84); }
.lpSteps { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.lpSteps li { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; align-items: start; font-size: 15px; line-height: 1.55; color: rgba(246,242,234,.78); }
.lpStepNum { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; border: 1px solid rgba(200,154,88,.45); color: var(--color-bronze-soft, #d9b777); font-size: 12px; font-weight: 700; }
.lpFormPanel { position: sticky; top: 20px; border: 1px solid rgba(246,242,234,.12); border-radius: 18px; padding: clamp(18px, 3vw, 24px); background: rgba(8,16,15,.72); box-shadow: 0 24px 80px rgba(0,0,0,.28); }
.lpFormIntro { margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: rgba(246,242,234,.76); }
.lpFormPanel .contactForm { margin-top: 0; max-width: none; }
.lpFormPanel .contactSubmit { width: 100%; min-height: 52px; font-size: 14px; }
.lpReassurance { margin: 14px 0 0; font-size: 13px; line-height: 1.6; color: rgba(246,242,234,.62); }
.lpTrustStrip { margin-top: 36px; display: grid; gap: 12px; padding-top: 24px; border-top: 1px solid rgba(246,242,234,.08); }
.lpTrustStrip p { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.72); }
.lpLocal { margin-top: 28px; font-size: 14px; line-height: 1.7; color: rgba(246,242,234,.58); }
.lpFooter { margin-top: 28px; padding-top: 18px; border-top: 1px solid rgba(246,242,234,.08); font-size: 12px; color: rgba(246,242,234,.48); display: flex; flex-wrap: wrap; gap: 12px 20px; }
.lpFooter a { color: rgba(246,242,234,.62); }
.lpStickyCta { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; display: none; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: rgba(8,16,15,.94); border-top: 1px solid rgba(246,242,234,.1); backdrop-filter: blur(10px); }
.lpStickyCta a { display: flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 999px; background: rgba(200,154,88,.18); border: 1px solid rgba(200,154,88,.75); color: var(--color-bronze-soft, #d9b777); font-weight: 600; text-decoration: none; }
.siteShell, .siteSidebar, .mobileSidebar, .mobileSidebarPanel { display: none !important; }
@media (max-width: 900px) {
  .lpGrid { grid-template-columns: 1fr; }
  .lpFormPanel { position: static; order: 2; }
  .lpHero { order: 1; }
  .lpStickyCta { display: block; }
  .lpHeaderPhone span { display: none; }
}
</style>`;

const LANDING_SCRIPT = `<script id="pathfinder-landing-cro">
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-scroll-target]').forEach(function (button) {
    button.addEventListener("click", function (event) {
      var target = document.querySelector(button.getAttribute("data-scroll-target"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});
</script>`;

const LANDING_SCHEMA = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"MedicalWebPage","name":"Arrange an initial psychotherapy consultation in Lisbon","url":"https://www.pathfindertherapy.com/start/","about":{"@type":"MedicalTherapy","name":"Trauma-informed psychotherapy"},"mainEntity":{"@type":"MedicalBusiness","name":"Pathfinder Therapy","url":"https://www.pathfindertherapy.com","telephone":"+351914775365","priceRange":"EUR75","medicalSpecialty":["Psychotherapy","Trauma therapy","EMDR"],"address":{"@type":"PostalAddress","addressLocality":"Lisboa","addressCountry":"PT"}},"provider":{"@type":"Person","name":"Brent Kelly","jobTitle":"Therapist","knowsAbout":["Trauma","EMDR","Transactional Analysis","Military veterans"]}}
</script>`;

function prepareLandingForm(formHtml) {
  return formHtml
    .replace(
      /<button class="contactSubmit" type="submit">[^<]*<\/button>/,
      '<button class="contactSubmit" type="submit" data-label="Arrange an initial consultation">Arrange an initial consultation</button>'
    )
    .replace(/value="yes"/, 'value="on"')
    .replace(
      /<textarea([^>]*)><\/textarea>/,
      '<textarea$1 placeholder="A brief note is enough — no need to share your full history here."></textarea>'
    )
    .replace(
      '<p class="contactSecureIntro">',
      '<p class="contactSecureIntro" id="consultation-form-intro">'
    );
}

function extractHeadAndTail(contactHtml) {
  const headEnd = contactHtml.indexOf("</head>") + 7;
  const head = contactHtml.slice(0, headEnd);
  const tailMatch = contactHtml.match(/<script id="pathfinder-google-tag-loader"[\s\S]*$/);
  const tail = tailMatch ? tailMatch[0].replace("</body></html>", "") : "";
  return { head, tail };
}

function buildStartPage(contactHtml) {
  const { head, tail } = extractHeadAndTail(contactHtml);
  const formHtml = prepareLandingForm(
    contactHtml.match(/<form class="contactForm"[\s\S]*?<\/form>/)?.[0] ?? ""
  );

  const body = `<body class="lpShell">
<a class="skipLink" href="#main-content">Skip to main content</a>
<header class="lpHeader">
  <a class="lpBrand" href="/" aria-label="Pathfinder Therapy home">
    <span class="lpBrandWord">PATHFINDER THERAPY</span>
  </a>
  <a class="lpHeaderPhone" href="tel:+351914775365" aria-label="Call Pathfinder Therapy">
    <span>Call</span> +351 914 775 365
  </a>
</header>
<main class="lpMain" id="main-content">
  <div class="lpGrid">
    <section class="lpHero" aria-labelledby="start-title">
      <p class="lpKicker">English-speaking therapist · Lisbon clinic &amp; online</p>
      <h1 class="lpTitle" id="start-title">Find out if therapy is right for you — with a therapist in Lisbon or online.</h1>
      <p class="lpLead">Trauma-informed psychotherapy for anxiety, trauma, relationships, and life transitions. Brent Kelly responds to non-urgent enquiries within one working day.</p>
      <div class="lpHeroActions">
        <a class="lpPrimaryCta" href="#consultation-form" data-scroll-target="#consultation-form">Arrange an initial consultation</a>
        <a class="lpSecondaryCta" href="https://wa.me/351914775365">WhatsApp Brent</a>
      </div>
      <div class="lpTherapist">
        <img src="/assets/images/about-brent.webp" width="72" height="72" alt="Brent Kelly, therapist at Pathfinder Therapy Lisbon" loading="eager" decoding="async" />
        <div>
          <p class="lpTherapistName">Brent Kelly</p>
          <p class="lpTherapistRole">Therapist · trauma, EMDR, veterans, couples &amp; individual therapy · Lisbon &amp; online</p>
        </div>
      </div>
      <ul class="lpTrustList" aria-label="Professional reassurance">
        <li>EATA registered</li>
        <li>Trauma-informed</li>
        <li>EMDR</li>
        <li>Transactional Analysis</li>
        <li>Veterans experience</li>
        <li>Confidential</li>
        <li>Supervised practice</li>
      </ul>
      ${buildEataBadge()}
      <ol class="lpSteps" aria-label="What happens next">
        <li><span class="lpStepNum">1</span><span>Send a brief, secure enquiry — no detailed clinical history needed.</span></li>
        <li><span class="lpStepNum">2</span><span>Brent replies within one working day to arrange an initial conversation.</span></li>
        <li><span class="lpStepNum">3</span><span>If it feels like a fit, book your first session in Lisbon or online.</span></li>
      </ol>
    </section>
    <section class="lpFormPanel" id="consultation-form" aria-labelledby="consultation-form-intro">
      <p class="lpKicker">Confidential enquiry</p>
      <p class="lpFormIntro" id="consultation-form-intro">This takes about two minutes. Your details are sent securely to Brent — for non-urgent enquiries only.</p>
      ${formHtml}
      <p class="lpReassurance">Sessions from €75 · Lisbon clinic or secure online · Professional indemnity insurance · Clinical supervision in place</p>
    </section>
  </div>
  <section class="lpTrustStrip" aria-label="Why Pathfinder Therapy">
    <p class="lpKicker">Why people choose Pathfinder</p>
    <p>Pathfinder Therapy offers calm, trauma-informed psychotherapy for adults and couples in Lisbon and across Portugal online. Brent works with trauma, anxiety, attachment, military veterans, and complex life experiences — using EMDR and Transactional Analysis where appropriate.</p>
  </section>
  <p class="lpLocal">Therapist in Lisbon · trauma therapist Lisbon · EMDR Lisbon · English-speaking therapy in Portugal · online psychotherapy Portugal</p>
  <footer class="lpFooter">
    <span>Pathfinder Therapy · R. Rodrigues Sampaio 76, Lisboa</span>
    <a href="/privacy/">Privacy</a>
    <a href="/crisis-support/">Crisis support</a>
    <a href="#" data-cookie-manage>Manage cookies</a>
    <span>Non-urgent enquiries only</span>
  </footer>
</main>
<div class="lpStickyCta">
  <a href="#consultation-form" data-scroll-target="#consultation-form">Arrange an initial consultation</a>
</div>
${tail}
${LANDING_SCRIPT}
</body></html>`;

  let html = `${head}${LANDING_CSS}${LANDING_SCHEMA}${body}`;
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Arrange an Initial Consultation | Therapist Lisbon | Pathfinder Therapy",
    description:
      "Arrange a confidential initial psychotherapy consultation with Brent Kelly in Lisbon or online. Trauma-informed therapy, EMDR, English-speaking. Response within one working day.",
    canonical: "https://www.pathfindertherapy.com/start/"
  });
  return html;
}

const BOOK_CONFIRMED_SCRIPT = `<script id="pathfinder-book-confirmed-conversion">
document.addEventListener("DOMContentLoaded", function () {
  if (window.pathfinderAds) window.pathfinderAds.fireBookingConversion("book_confirmed_page");
});
</script>`;

function buildBookPage(contactHtml) {
  const { head, tail } = extractHeadAndTail(contactHtml);
  const calendlyHead = head.replace(
    "</head>",
    `<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">\n${CALENDLY_CSS}\n</head>`
  );

  const body = `<body class="lpShell">
<a class="skipLink" href="#main-content">Skip to main content</a>
<header class="lpHeader">
  <a class="lpBrand" href="/" aria-label="Pathfinder Therapy home">
    <span class="lpBrandWord">PATHFINDER THERAPY</span>
  </a>
  <a class="lpHeaderPhone" href="tel:+351914775365" aria-label="Call Pathfinder Therapy">
    <span>Call</span> +351 914 775 365
  </a>
</header>
<main class="lpMain" id="main-content">
  ${buildBookPageBody()}
  <footer class="lpFooter">
    <span>Pathfinder Therapy · R. Rodrigues Sampaio 76, Lisboa</span>
    <a href="/privacy/">Privacy</a>
    <a href="/crisis-support/">Crisis support</a>
    <a href="#" data-cookie-manage>Manage cookies</a>
    <span>Non-urgent enquiries only</span>
  </footer>
</main>
<div class="lpStickyCta">
  <a href="#calendly-booking" data-scroll-target="#calendly-booking">Book initial Zoom call</a>
</div>
${tail}
${LANDING_SCRIPT}
${CALENDLY_INLINE_SCRIPT}
</body></html>`;

  let html = `${calendlyHead}${LANDING_CSS}${body}`;
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Book Initial Zoom Consultation | Pathfinder Therapy Lisbon",
    description:
      "Book a confidential initial Zoom consultation with Brent Kelly, therapist in Lisbon and online. Trauma-informed therapy in English.",
    canonical: `https://www.pathfindertherapy.com${BOOK_PATH}`
  });
  return html;
}

function buildBookConfirmedPage(contactHtml) {
  const { head, tail } = extractHeadAndTail(contactHtml);

  const body = `<body class="lpShell">
<a class="skipLink" href="#main-content">Skip to main content</a>
<header class="lpHeader">
  <a class="lpBrand" href="/" aria-label="Pathfinder Therapy home"><span class="lpBrandWord">PATHFINDER THERAPY</span></a>
</header>
<main class="lpMain" id="main-content">
  ${buildBookConfirmedBody()}
</main>
${tail}
${BOOK_CONFIRMED_SCRIPT}
</body></html>`;

  let html = `${head}${LANDING_CSS}${body}`;
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Zoom Consultation Booked | Pathfinder Therapy",
    description: "Your initial Zoom consultation with Pathfinder Therapy is confirmed.",
    canonical: `https://www.pathfindertherapy.com${BOOK_CONFIRMED_PATH}`
  });
  return html;
}

function buildInteriorPageWithBookingPanel(shellHtml, { title, description, canonical, mainInner, schema = "" }) {
  const route = new URL(canonical).pathname;
  const parts = extractPageParts(shellHtml);
  let head = parts.head;
  if (schema) {
    head = head.replace("</head>", `${schema}\n</head>`);
  }
  if (!head.includes("pathfinder-sprint2")) {
    head = head.replace("</head>", `${SPRINT2_CSS}\n</head>`);
  }
  let html = wrapInShellV2({
    ...parts,
    head,
    route,
    mainInner: wrapWithBookingPanel(mainInner)
  });
  html = patchHtml(html, { title, description, canonical });
  return html;
}

function buildInteriorPageV2(shellHtml, { title, description, canonical, mainInner, schema = "" }) {
  const route = new URL(canonical).pathname;
  const parts = extractPageParts(shellHtml);
  let head = parts.head;
  if (schema) {
    head = head.replace("</head>", `${schema}\n</head>`);
  }
  let html = wrapInShellV2({ ...parts, head, route, mainInner });
  html = patchHtml(html, { title, description, canonical });
  return html;
}

function buildContactPageV2(contactHtml) {
  const parts = extractPageParts(contactHtml);
  const formHtml = prepareLandingForm(
    contactHtml.match(/<form class="contactForm"[\s\S]*?<\/form>/)?.[0] ?? ""
  );
  const mainInner = buildContactPageBody(formHtml);
  let html = wrapInShellV2({
    ...parts,
    route: "/contact/",
    mainInner,
    interior: false
  });
  html = html.replace(
    buildStickyBar(),
    buildStickyBar("#consultation-form", BOOKING_LABEL)
  );
  html = patchHtml(html, {
    title: "Contact | Arrange a Consultation | Pathfinder Therapy Lisbon",
    description:
      "Contact Brent Kelly to arrange a confidential initial psychotherapy consultation in Lisbon or online. Response within one working day.",
    canonical: "https://www.pathfindertherapy.com/contact/"
  });
  return html;
}

function replaceMainContent(html, mainInner) {
  return html.replace(
    /<main id="main-content"[\s\S]*?<\/main>/,
    `<main id="main-content" class="siteMain interiorMain" tabindex="-1">${mainInner}</main>`
  );
}

function buildInteriorPage(shellHtml, options) {
  return buildInteriorPageV2(shellHtml, options);
}

function buildFaqPage(shellHtml) {
  const mainInner = `<article class="approachPage">
<section class="approachHero" aria-labelledby="faq-title">
  <div class="approachHeroCopy">
    <p class="sectionKicker">Questions</p>
    <h1 class="approachHeroTitle" id="faq-title">Frequently asked questions</h1>
    <p class="approachHeroText">Clear answers about therapy with Brent Kelly in Lisbon and online — so you can decide your next step with less uncertainty.</p>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-booking">
  <div class="approachEssayInner">
    <p class="sectionKicker">Booking</p>
    <h2 class="approachSectionTitle" id="faq-booking">How do I arrange an initial consultation?</h2>
    <div class="approachBody">
      <p>Book an initial Zoom call via <a href="/book/">online booking</a>, or send a brief enquiry via the <a href="${BOOKING_PATH}">consultation form</a>. Brent replies to non-urgent messages within one working day.</p>
      <p>You can also email <a href="mailto:hi@pathfindertherapy.com">hi@pathfindertherapy.com</a> or call/WhatsApp <a href="tel:+351914775365">+351 914 775 365</a>.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-who">
  <div class="approachEssayInner">
    <p class="sectionKicker">Who this is for</p>
    <h2 class="approachSectionTitle" id="faq-who">Who do you work with?</h2>
    <div class="approachBody">
      <p>Adults and couples navigating trauma, anxiety, attachment, relationship difficulties, life transitions, and complex experiences — including military veterans. Sessions are in English.</p>
      <p>You do not need a diagnosis to begin. Many people start with a feeling, a pattern, or a sense that something needs attention.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-location">
  <div class="approachEssayInner">
    <p class="sectionKicker">Location</p>
    <h2 class="approachSectionTitle" id="faq-location">Can I see you in person or online?</h2>
    <div class="approachBody">
      <p>Yes. Brent offers sessions at the Pathfinder Therapy clinic in Lisbon (R. Rodrigues Sampaio 76) and secure online therapy across Portugal and internationally where appropriate.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-first">
  <div class="approachEssayInner">
    <p class="sectionKicker">First session</p>
    <h2 class="approachSectionTitle" id="faq-first">What happens in a first session?</h2>
    <div class="approachBody">
      <p>The first meeting is a chance to understand what brings you to therapy, ask questions, and sense whether the approach feels like a fit. There is no pressure to share your full history immediately.</p>
      <p><a href="/knowledge-library/what-happens-in-a-first-therapy-session/">Read more about first sessions</a>.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-emdr">
  <div class="approachEssayInner">
    <p class="sectionKicker">EMDR &amp; trauma</p>
    <h2 class="approachSectionTitle" id="faq-emdr">Do you offer EMDR and trauma therapy?</h2>
    <div class="approachBody">
      <p>Yes. Brent offers trauma-informed psychotherapy and EMDR where clinically appropriate, alongside Transactional Analysis and relational work.</p>
      <p><a href="/knowledge-library/what-is-trauma-therapy/">What is trauma therapy?</a> · <a href="/knowledge-library/how-does-emdr-work/">How does EMDR work?</a></p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-fees">
  <div class="approachEssayInner">
    <p class="sectionKicker">Fees</p>
    <h2 class="approachSectionTitle" id="faq-fees">How much do sessions cost?</h2>
    <div class="approachBody">
      <p>Individual sessions are from €75 for 50 minutes. Couples sessions may differ — see the <a href="/fees/">fees page</a> or ask when you enquire.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-confidential">
  <div class="approachEssayInner">
    <p class="sectionKicker">Confidentiality</p>
    <h2 class="approachSectionTitle" id="faq-confidential">Is therapy confidential?</h2>
    <div class="approachBody">
      <p>Yes. Sessions are confidential within ethical and legal limits. Brent is registered with EATA, holds professional indemnity insurance, and receives clinical supervision.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-crisis">
  <div class="approachEssayInner">
    <p class="sectionKicker">Urgent support</p>
    <h2 class="approachSectionTitle" id="faq-crisis">Is this a crisis service?</h2>
    <div class="approachBody">
      <p>No. Pathfinder Therapy is for non-urgent enquiries only. If you are in crisis or immediate danger, contact local emergency services or see our <a href="/crisis-support/">crisis support page</a>.</p>
    </div>
  </div>
</section>
</article>`;

  const schema = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{"@type":"Question","name":"How do I arrange an initial consultation?","acceptedAnswer":{"@type":"Answer","text":"Book an initial Zoom call at pathfindertherapy.com/book or use the consultation enquiry form at pathfindertherapy.com/start. Brent replies within one working day."}},
{"@type":"Question","name":"Can I see Brent in person or online?","acceptedAnswer":{"@type":"Answer","text":"Yes. Sessions are available at the Lisbon clinic and securely online across Portugal."}},
{"@type":"Question","name":"How much do sessions cost?","acceptedAnswer":{"@type":"Answer","text":"Individual sessions are from EUR 75 for 50 minutes."}},
{"@type":"Question","name":"Do you offer EMDR and trauma therapy?","acceptedAnswer":{"@type":"Answer","text":"Yes. Brent offers trauma-informed psychotherapy and EMDR where clinically appropriate."}}
]}
</script>`;

  return buildInteriorPageWithBookingPanel(shellHtml, {
    title: "FAQ | Therapist Lisbon | Pathfinder Therapy",
    description:
      "Answers about booking, fees, online therapy, EMDR, trauma therapy, and first sessions with Brent Kelly in Lisbon.",
    canonical: "https://www.pathfindertherapy.com/faq/",
    mainInner,
    schema
  });
}

function buildFeesPage(shellHtml) {
  const mainInner = `<article class="approachPage">
<section class="approachHero" aria-labelledby="fees-title">
  <div class="approachHeroCopy">
    <p class="sectionKicker">Fees</p>
    <h1 class="approachHeroTitle" id="fees-title">Session fees</h1>
    <p class="approachHeroText">Transparent pricing for private psychotherapy in Lisbon and online. Fees are discussed clearly before work begins.</p>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-individual">
  <div class="approachEssayInner">
    <p class="sectionKicker">Individual</p>
    <h2 class="approachSectionTitle" id="fees-individual">Individual therapy</h2>
    <div class="approachBody">
      <p><strong>From €75</strong> per 50-minute session.</p>
      <p>Trauma-informed psychotherapy for adults — in person at our Lisbon clinic or securely online.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-couples">
  <div class="approachEssayInner">
    <p class="sectionKicker">Couples</p>
    <h2 class="approachSectionTitle" id="fees-couples">Couples therapy</h2>
    <div class="approachBody">
      <p>Fees for couples sessions may differ from individual work. Brent will confirm the rate when you enquire and before your first appointment.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-consultation">
  <div class="approachEssayInner">
    <p class="sectionKicker">Initial consultation</p>
    <h2 class="approachSectionTitle" id="fees-consultation">Initial consultation</h2>
    <div class="approachBody">
      <p>Book an initial Zoom call via <a href="/book/">online booking</a>, or send a brief enquiry via the <a href="${BOOKING_PATH}">consultation form</a>. Brent will reply within one working day to arrange an initial conversation and confirm fees, format (in person or online), and next steps.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-payment">
  <div class="approachEssayInner">
    <p class="sectionKicker">Payment</p>
    <h2 class="approachSectionTitle" id="fees-payment">Payment and cancellation</h2>
    <div class="approachBody">
      <p>Payment arrangements are agreed before sessions begin. Cancellation terms are shared at booking so expectations are clear for both parties.</p>
      <p>Pathfinder Therapy is a private practice. Sessions are not typically covered by public health insurance in Portugal.</p>
    </div>
  </div>
</section>
</article>`;

  const schema = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"MedicalBusiness","name":"Pathfinder Therapy","url":"https://www.pathfindertherapy.com/fees/","priceRange":"EUR75","makesOffer":{"@type":"Offer","price":"75","priceCurrency":"EUR","description":"Individual psychotherapy session (50 minutes)"}}
</script>`;

  return buildInteriorPageWithBookingPanel(shellHtml, {
    title: "Fees | Therapist Lisbon | Pathfinder Therapy",
    description:
      "Session fees for individual and couples therapy with Brent Kelly in Lisbon and online. Individual sessions from €75.",
    canonical: "https://www.pathfindertherapy.com/fees/",
    mainInner,
    schema
  });
}

function patchSitemap(sitemapXml) {
  let next = sitemapXml;
  const today = new Date().toISOString().slice(0, 10);
  const additions = [
    { loc: "https://www.pathfindertherapy.com/faq/", priority: "0.75" },
    { loc: "https://www.pathfindertherapy.com/fees/", priority: "0.75" },
    { loc: "https://www.pathfindertherapy.com/crisis-support/", priority: "0.55" },
    { loc: "https://www.pathfindertherapy.com/psychotherapy-lisbon/", priority: "0.88" },
    { loc: "https://www.pathfindertherapy.com/trauma-therapy-lisbon/", priority: "0.88" },
    { loc: "https://www.pathfindertherapy.com/emdr-therapy-lisbon/", priority: "0.88" },
    { loc: "https://www.pathfindertherapy.com/english-speaking-therapist-lisbon/", priority: "0.88" }
  ];

  for (const entry of additions) {
    if (next.includes(entry.loc)) continue;
    next = next.replace(
      "</urlset>",
      `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${entry.priority}</priority>\n  </url>\n</urlset>`
    );
  }

  return next;
}

function buildThankYouPage(contactHtml) {
  const { head, tail } = extractHeadAndTail(contactHtml);

  const body = `<body class="lpShell">
<a class="skipLink" href="#main-content">Skip to main content</a>
<header class="lpHeader">
  <a class="lpBrand" href="/" aria-label="Pathfinder Therapy home"><span class="lpBrandWord">PATHFINDER THERAPY</span></a>
</header>
<main class="lpMain" id="main-content">
  <section class="lpHero" style="max-width:42rem">
    <p class="lpKicker">Enquiry received</p>
    <h1 class="lpTitle">Thank you — Brent will be in touch soon.</h1>
    <p class="lpLead">Your enquiry was sent securely. Brent responds to non-urgent messages within one working day, usually sooner.</p>
    <ol class="lpSteps">
      <li><span class="lpStepNum">✓</span><span>Your message has been received confidentially.</span></li>
      <li><span class="lpStepNum">2</span><span>Brent will reply by email to arrange an initial conversation.</span></li>
      <li><span class="lpStepNum">3</span><span>If you both agree it feels right, your first session can be booked in Lisbon or online.</span></li>
    </ol>
    <div class="lpHeroActions">
      <a class="lpSecondaryCta" href="/">Return to homepage</a>
      <a class="lpSecondaryCta" href="https://wa.me/351914775365">WhatsApp +351 914 775 365</a>
    </div>
    <p class="lpReassurance">If you are in crisis or immediate danger, contact local emergency services. This service is for non-urgent enquiries only.</p>
  </section>
</main>
${tail}
</body></html>`;

  let html = `${head}${LANDING_CSS}${body}`;
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Thank You | Pathfinder Therapy",
    description: "Your enquiry has been received securely by Pathfinder Therapy.",
    canonical: "https://www.pathfindertherapy.com/thank-you/"
  });
  html = injectBeforeBodyClose(html, THANK_YOU_SCRIPT);
  return html;
}

async function downloadAsset(assetPath) {
  const url = `${PREVIEW_ORIGIN}${assetPath}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Skipping missing asset ${url}`);
    return;
  }

  const target = path.join(OUT_DIR, assetPath.replace(/^\//, ""));
  await mkdir(path.dirname(target), { recursive: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(target, buffer);
}

async function main() {
  console.log(`Building production mirror from ${PREVIEW_ORIGIN}`);
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const eataLogoSource = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "public/assets/images/eata-logo.svg"
  );
  const eataLogoTarget = path.join(OUT_DIR, "assets/images/eata-logo.svg");
  await mkdir(path.dirname(eataLogoTarget), { recursive: true });
  await cp(eataLogoSource, eataLogoTarget);

  let sitemapXml;
  try {
    sitemapXml = await fetchText(LIVE_SITEMAP);
  } catch {
    console.warn(`Primary sitemap unavailable at ${LIVE_SITEMAP}, falling back to preview.`);
    sitemapXml = await fetchText(FALLBACK_SITEMAP);
  }
  const routes = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1]);
    return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  });

  const builtRoutes = new Set([
    "/start/",
    "/thank-you/",
    "/book/",
    "/book-confirmed/",
    "/faq/",
    "/fees/",
    "/contact/",
    "/crisis-support/",
    "/",
    ...getLocalLandingRoutes()
  ]);
  const assetPaths = new Set(["/robots.txt", "/rss.xml", "/sitemap.xml", "/favicon.ico", "/favicon.svg"]);
  let contactHtml = "";
  let homeHtml = "";

  for (const route of routes) {
    if (builtRoutes.has(route)) {
      if (route === "/") {
        const previewUrl = `${PREVIEW_ORIGIN}${route}`;
        try {
          homeHtml = await fetchText(previewUrl);
          for (const asset of extractAssetPaths(homeHtml)) assetPaths.add(asset);
        } catch (error) {
          console.warn(`Skipping unavailable route ${route}: ${error.message}`);
        }
      }
      console.log(`Skipping ${route} (built separately)`);
      continue;
    }

    const previewUrl = `${PREVIEW_ORIGIN}${route}`;
    let html;
    try {
      html = await fetchText(previewUrl);
    } catch (error) {
      console.warn(`Skipping unavailable route ${route}: ${error.message}`);
      continue;
    }
    if (route === "/contact/") {
      contactHtml = html;
    }
    for (const asset of extractAssetPaths(html)) assetPaths.add(asset);
    let patched = applyShellV2(patchHtml(html), route);
    patched = applySprint3Transforms(patched, route);
    patched = stripHydrationScripts(patched);
    await writeRoute(PREVIEW_ORIGIN, route, patched);
    const sprintNote =
      route === "/therapy/" || route === "/about/"
        ? " + booking panel"
        : route === "/approach/" || route === "/knowledge-library/"
          ? " + essay/booking panel"
          : route.startsWith("/knowledge-library/")
            ? " + article CTA"
            : ["/journal/", "/retreats/", "/research/"].includes(route)
              ? " + end CTA"
              : "";
    console.log(`Mirrored ${route} (shell v2${sprintNote})`);
  }

  if (!homeHtml) {
    homeHtml = await fetchText(`${PREVIEW_ORIGIN}/`);
  }

  let homePageV2 = stripHydrationScripts(
    patchHtml(buildHomePageV2(homeHtml), {
      title: "Trauma-Informed Psychotherapy in Lisbon | Pathfinder Therapy",
      description:
        "Trauma-informed psychotherapy with Brent Kelly in Lisbon and online. English-speaking therapy for adults and couples. Arrange an initial consultation.",
      canonical: "https://www.pathfindertherapy.com/"
    })
  );
  homePageV2 = injectBeforeBodyClose(homePageV2, AD_LANDING_SCRIPT);
  for (const asset of extractAssetPaths(homePageV2)) assetPaths.add(asset);
  await writeRoute(PREVIEW_ORIGIN, "/", homePageV2);
  console.log("Added / (homepage sprint 2 rebuild)");

  if (!contactHtml) {
    contactHtml = await fetchText(`${PREVIEW_ORIGIN}/contact/`);
  }

  const contactPageV2 = stripHydrationScripts(buildContactPageV2(contactHtml));
  for (const asset of extractAssetPaths(contactPageV2)) assetPaths.add(asset);
  await writeRoute(PREVIEW_ORIGIN, "/contact/", contactPageV2);
  console.log("Added /contact/ (shell v2)");

  const startHtml = buildStartPage(contactHtml);
  const thankYouHtml = buildThankYouPage(contactHtml);
  const bookHtml = buildBookPage(contactHtml);
  const bookConfirmedHtml = buildBookConfirmedPage(contactHtml);
  for (const asset of extractAssetPaths(startHtml)) assetPaths.add(asset);
  for (const asset of extractAssetPaths(thankYouHtml)) assetPaths.add(asset);
  for (const asset of extractAssetPaths(bookHtml)) assetPaths.add(asset);
  for (const asset of extractAssetPaths(bookConfirmedHtml)) assetPaths.add(asset);
  await writeRoute(PREVIEW_ORIGIN, "/start/", startHtml);
  await writeRoute(PREVIEW_ORIGIN, "/thank-you/", thankYouHtml);
  await writeRoute(PREVIEW_ORIGIN, BOOK_PATH, bookHtml);
  await writeRoute(PREVIEW_ORIGIN, BOOK_CONFIRMED_PATH, bookConfirmedHtml);
  console.log("Added /start/, /thank-you/, /book/, and /book-confirmed/");
  console.log(`Calendly embed: ${DEFAULT_CALENDLY_URL.replace(/^https?:\/\//, "")}`);
  logGoogleAdsBuildConfig();

  const shellHtml = await fetchText(`${PREVIEW_ORIGIN}/approach/`);
  const faqHtml = stripHydrationScripts(buildFaqPage(shellHtml));
  const feesHtml = stripHydrationScripts(buildFeesPage(shellHtml));
  for (const asset of extractAssetPaths(faqHtml)) assetPaths.add(asset);
  for (const asset of extractAssetPaths(feesHtml)) assetPaths.add(asset);
  await writeRoute(PREVIEW_ORIGIN, "/faq/", faqHtml);
  await writeRoute(PREVIEW_ORIGIN, "/fees/", feesHtml);
  console.log("Added /faq/ and /fees/");

  const crisisHtml = stripHydrationScripts(buildCrisisPage(shellHtml, buildInteriorPageV2));
  await writeRoute(PREVIEW_ORIGIN, "/crisis-support/", crisisHtml);
  console.log("Added /crisis-support/");

  for (const page of LOCAL_LANDING_PAGES) {
    const landingHtml = stripHydrationScripts(
      buildLocalLandingPage(shellHtml, page, buildInteriorPageWithBookingPanel)
    );
    await writeRoute(PREVIEW_ORIGIN, page.route, landingHtml);
    console.log(`Added ${page.route} (local landing)`);
  }

  await writeFile(path.join(OUT_DIR, "llms.txt"), applyCredentialCopy(buildLlmsTxt()), "utf8");
  await writeFile(path.join(OUT_DIR, "ai-summary.json"), applyCredentialCopy(buildAiSummaryJson()), "utf8");
  console.log("Added llms.txt and ai-summary.json");

  for (const assetPath of assetPaths) {
    await downloadAsset(assetPath);
  }

  const sitemapPath = path.join(OUT_DIR, "sitemap.xml");
  try {
    const existingSitemap = await readFile(sitemapPath, "utf8");
    await writeFile(sitemapPath, patchSitemap(existingSitemap), "utf8");
  } catch {
    await writeFile(sitemapPath, patchSitemap(sitemapXml), "utf8");
  }

  const redirectsSource = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "_redirects");
  try {
    await cp(redirectsSource, path.join(OUT_DIR, "_redirects"));
  } catch {
    // Optional redirects file.
  }

  console.log(`Production build written to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
