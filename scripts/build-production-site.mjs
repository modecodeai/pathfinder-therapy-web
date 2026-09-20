import { mkdir, readFile, writeFile, cp, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOOKING_LABEL,
  BOOKING_PATH,
  ENQUIRY_LABEL,
  ENQUIRY_PATH,
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
  BOOKING_CSS,
  BOOKING_INLINE_SCRIPT,
  buildBookConfirmedBody,
  buildBookPageBody,
  DEFAULT_BOOKING_URL
} from "./site-booking.mjs";
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
import { injectLocationStyles } from "./site-location.mjs";
import {
  buildKnowledgeArticlePage,
  buildKnowledgeLibraryIndexPage,
  getKnowledgeLibraryBuiltRoutes,
  loadKnowledgeArticles
} from "./site-knowledge-articles.mjs";
import { buildAllServicePages, getServicePageRoutes } from "./site-service-pages.mjs";
import { applyUkEmdrLanding, UK_EMDR_ROUTE } from "./site-uk-emdr.mjs";
import { CONTACT_VISUAL_CSS } from "./site-contact-visual.mjs";
import { optimiseStaticSite } from "./optimise-static-site.mjs";
import { applyLisbonRedesign } from "./site-lisbon-redesign.mjs";

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
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch (error) {}
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
    return next.origin === window.location.origin ? next.pathname + next.search + next.hash : next.toString();
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
    if (!href || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
    var target = new URL(href, window.location.origin);
    if (target.origin === "https://booking.pathfindertherapy.com" && target.pathname === "/book") {
      link.setAttribute("href", appendAttribution(href));
      return;
    }
    if (target.origin !== window.location.origin) return;
    if (href.indexOf("/contact") === 0 || href.indexOf("/start") === 0 || href.indexOf("/book") === 0) {
      var nextHref = appendAttribution(href);
      if (nextHref !== href) link.setAttribute("href", nextHref);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('a[href^="https://booking.pathfindertherapy.com/book"]').forEach(function (link) {
      link.setAttribute("href", appendAttribution(link.getAttribute("href")));
    });
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

    document.querySelectorAll('select[name="enquiryType"]').forEach(function (select) {
      var params = new URLSearchParams(window.location.search);
      var value = params.get("enquiryType") || params.get("enquiry");
      if (!value) return;
      for (var i = 0; i < select.options.length; i += 1) {
        if (select.options[i].value === value || select.options[i].textContent === value) {
          select.selectedIndex = i;
          break;
        }
      }
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
              submitButton.textContent = submitButton.dataset.label || "Send an enquiry";
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

async function walkHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkHtmlFiles(fullPath)));
    } else if (entry.name === "index.html") {
      files.push(fullPath);
    }
  }
  return files;
}

async function embedBuildProvenance() {
  const sha = process.env.PATHFINDER_BUILD_SHA || process.env.GITHUB_SHA || "local";
  const marker = `<meta name="x-pathfinder-build-sha" content="${sha}"/>`;
  const htmlFiles = await walkHtmlFiles(OUT_DIR);
  for (const filePath of htmlFiles) {
    let html = await readFile(filePath, "utf8");
    html = html.replace(/<meta name="x-pathfinder-build-sha" content="[^"]*"\/?>\n?/g, "");
    if (!html.includes("</head>")) continue;
    html = html.replace("</head>", `${marker}\n</head>`);
    await writeFile(filePath, html, "utf8");
  }
  console.log(`Embedded build SHA ${sha} in ${htmlFiles.length} HTML files`);
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

  next = next.replace(/<meta\b(?=[^>]*(?:property="og:|name="twitter:))[^>]*>/g, "");

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
  let next = formHtml
    .replace(
      /<button class="contactSubmit" type="submit">[^<]*<\/button>/,
      '<button class="contactSubmit" type="submit" data-label="Send an enquiry">Send an enquiry</button>'
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

  if (!next.includes("Immersive EMDR Therapy")) {
    next = next.replace(
      "<option>EMDR</option>",
      "<option>EMDR</option><option>Immersive EMDR Therapy</option>"
    );
  }

  return next;
}

function extractHeadAndTail(contactHtml) {
  const headEnd = contactHtml.indexOf("</head>") + 7;
  const head = contactHtml.slice(0, headEnd);
  const tailMatch = contactHtml.match(/<script id="pathfinder-google-tag-loader"[\s\S]*$/);
  const tail = tailMatch ? tailMatch[0].replace("</body></html>", "") : "";
  return { head, tail };
}

const START_PAGE_CSS = `<style id="pathfinder-start-pathways">
.lpStartIntro { display: grid; gap: 18px; max-width: 44rem; margin-bottom: clamp(24px, 4vw, 36px); }
.lpStartPathways { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(20px, 4vw, 28px); align-items: start; }
.lpStartPathCard { padding: clamp(20px, 3vw, 24px); border: 1px solid rgba(246,242,234,.12); border-radius: 16px; background: rgba(8,16,15,.45); display: grid; gap: 14px; }
.lpStartPathCard--primary { border-color: rgba(200,154,88,.42); background: rgba(200,154,88,.08); }
.lpStartPathLabel { margin: 0; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #d9b777; }
.lpStartPathCard h2 { margin: 0; font-family: Georgia, serif; font-size: clamp(1.2rem, 2.4vw, 1.45rem); line-height: 1.2; color: #f6f2ea; font-weight: 600; }
.lpStartPathCard p { margin: 0; font-size: 14px; line-height: 1.65; color: rgba(246,242,234,.76); }
.lpStartPathCard .contactForm { margin-top: 4px; max-width: none; }
.lpStartPathCard .contactSubmit { width: 100%; }
#enquiry { scroll-margin-top: calc(var(--lp-header-offset, 72px) + 12px); }
.lpStartEnquiryPanel { display: none; margin-top: clamp(28px, 4vw, 36px); padding-top: clamp(24px, 4vw, 32px); border-top: 1px solid rgba(246,242,234,.08); max-width: 40rem; }
.lpStartEnquiryPanel.isOpen { display: grid; gap: 14px; }
.lpStartEnquiryPanel:target { display: grid; gap: 14px; }
@media (max-width: 900px) {
  .lpStartPathways { grid-template-columns: 1fr; }
  .lpHeroActions { flex-direction: column; align-items: stretch; }
  .lpHeroActions .lpPrimaryCta, .lpHeroActions .lpSecondaryCta { width: 100%; }
}
</style>`;

const START_ENQUIRY_SCRIPT = `<script id="pathfinder-start-enquiry">
document.addEventListener("DOMContentLoaded", function () {
  var panel = document.getElementById("enquiry");
  var header = document.querySelector(".lpHeader");
  function headerOffset() {
    return header ? Math.ceil(header.getBoundingClientRect().height) + 12 : 84;
  }
  function scrollToPanel() {
    if (!panel) return;
    var top = panel.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  }
  function focusEnquiry() {
    if (!panel) return;
    var first = panel.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea, select');
    var heading = document.getElementById("start-enquiry");
    requestAnimationFrame(function () {
      if (first) first.focus();
      else if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    });
  }
  function openEnquiry(options) {
    if (!panel) return;
    panel.classList.add("isOpen");
    if (options && options.scroll) scrollToPanel();
    if (!options || options.focus !== false) focusEnquiry();
  }
  document.querySelectorAll("[data-open-enquiry]").forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", "#enquiry");
      } else {
        window.location.hash = "enquiry";
      }
      openEnquiry({ scroll: true });
    });
  });
  window.addEventListener("hashchange", function () {
    if (window.location.hash === "#enquiry") openEnquiry({ scroll: true });
  });
  if (window.location.hash === "#enquiry") {
    openEnquiry({ scroll: true });
  }
});
</script>`;

function buildStartPageBody(formHtml) {
  return `<section class="lpStartIntro" aria-labelledby="start-title">
  <p class="lpKicker">Getting started · Lisbon and online</p>
  <h1 class="lpTitle" id="start-title">Begin with Pathfinder Therapy</h1>
  <p class="lpLead">Arrange a consultation directly or send an enquiry first — whichever feels easier. Both routes are confidential and non-urgent.</p>
</section>
<div class="lpStartPathways">
  <article class="lpStartPathCard lpStartPathCard--primary" aria-labelledby="start-book-direct">
    <p class="lpStartPathLabel">Fastest route</p>
    <h2 id="start-book-direct">Arrange a consultation directly</h2>
    <p>Choose a convenient time for a confidential initial conversation by Zoom.</p>
    <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
  </article>
  <article class="lpStartPathCard" aria-labelledby="start-enquiry-card">
    <h2 id="start-enquiry-card">Send an enquiry first</h2>
    <p>Ask a question or briefly explain what you are looking for before choosing a time.</p>
    <a class="lpSecondaryCta" href="#enquiry" data-open-enquiry>Open the enquiry form</a>
  </article>
</div>
<noscript><style>.lpStartEnquiryPanel { display: grid !important; gap: 14px; }</style></noscript>
<section class="lpStartEnquiryPanel" id="enquiry" aria-labelledby="start-enquiry">
  <h2 class="lpSectionTitle" id="start-enquiry" tabindex="-1">Confidential enquiry</h2>
  <p class="lpFormIntro" id="consultation-form-intro">This takes about two minutes. Your details are sent securely to Brent — for non-urgent enquiries only.</p>
  ${formHtml}
</section>`;
}

function buildStartPage(contactHtml) {
  const parts = extractPageParts(contactHtml);
  const formHtml = prepareLandingForm(
    contactHtml.match(/<form class="contactForm"[\s\S]*?<\/form>/)?.[0] ?? ""
  );
  let head = parts.head.replace("</head>", `${START_PAGE_CSS}\n</head>`);
  let html = wrapInShellV2({
    ...parts,
    head,
    route: "/start/",
    mainInner: buildStartPageBody(formHtml),
    interior: false
  });
  html = html.replace("</head>", `${LANDING_SCHEMA}\n</head>`);
  html = html.replace(buildStickyBar(), buildStickyBar("#enquiry", ENQUIRY_LABEL));
  html = injectBeforeBodyClose(html, START_ENQUIRY_SCRIPT);
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
  const parts = extractPageParts(contactHtml);
  let head = parts.head.replace(
    "</head>",
    `${BOOKING_CSS}\n</head>`
  );
  let html = wrapInShellV2({
    ...parts,
    head,
    route: BOOK_PATH,
    mainInner: buildBookPageBody(),
    interior: false
  });
  html = html.replace(buildStickyBar(), buildStickyBar("#native-booking", BOOKING_LABEL));
  html = injectBeforeBodyClose(html, `${LANDING_SCRIPT}\n${BOOKING_INLINE_SCRIPT}`);
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Arrange an Initial Consultation | Pathfinder Therapy Lisbon",
    description:
      "Arrange a confidential initial consultation with Brent Kelly by secure Zoom. Trauma-informed therapy in English — Lisbon and online.",
    canonical: `https://www.pathfindertherapy.com${BOOK_PATH}`
  });
  return html;
}

function buildBookConfirmedPage(contactHtml) {
  const parts = extractPageParts(contactHtml);
  let html = wrapInShellV2({
    ...parts,
    route: BOOK_CONFIRMED_PATH,
    mainInner: buildBookConfirmedBody(),
    interior: false
  });
  html = injectBeforeBodyClose(html, BOOK_CONFIRMED_SCRIPT);
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Zoom Consultation Booked | Pathfinder Therapy",
    description: "Your initial Zoom consultation with Pathfinder Therapy is confirmed.",
    canonical: `https://www.pathfindertherapy.com${BOOK_CONFIRMED_PATH}`
  });
  return html;
}

function buildInteriorPageWithBookingPanel(shellHtml, { title, description, canonical, mainInner, schema = "", slimBookingPanel = false }) {
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
    mainInner: wrapWithBookingPanel(mainInner, { slim: slimBookingPanel })
  });
  html = patchHtml(html, { title, description, canonical });
  return html;
}

function buildInteriorPageV2(shellHtml, { title, description, canonical, mainInner, schema = "", ogImage = null }) {
  const route = new URL(canonical).pathname;
  const parts = extractPageParts(shellHtml);
  let head = parts.head;
  if (schema) {
    head = head.replace("</head>", `${schema}\n</head>`);
  }
  let html = wrapInShellV2({ ...parts, head, route, mainInner });
  html = patchHtml(html, { title, description, canonical, ogImage });
  return html;
}

function buildContactPageV2(contactHtml) {
  const parts = extractPageParts(contactHtml);
  const formHtml = prepareLandingForm(
    contactHtml.match(/<form class="contactForm"[\s\S]*?<\/form>/)?.[0] ?? ""
  );
  const mainInner = buildContactPageBody(formHtml);
  let head = parts.head.replace("</head>", `${CONTACT_VISUAL_CSS}\n</head>`);
  let html = wrapInShellV2({
    ...parts,
    head,
    route: "/contact/",
    mainInner,
    interior: false
  });
  html = html.replace(
    buildStickyBar(),
    buildStickyBar(BOOKING_PATH, BOOKING_LABEL)
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

const ABOUT_PAGE_CSS = `<style id="pathfinder-about-team">
.pfAboutPage { display: grid; gap: 0; }
.pfAboutHero { padding: clamp(36px, 6vw, 72px) var(--pf-space-inline); border-bottom: 1px solid rgba(246,242,234,.08); }
.pfAboutHeroInner { max-width: 1180px; margin: 0 auto; display: grid; gap: 16px; }
.pfAboutHero .pfSectionTitle { max-width: 14ch; }
.pfAboutHero .pfSectionLead { max-width: 46rem; }
.pfAboutNote { margin: 4px 0 0; max-width: 54rem; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: var(--pf-linen-muted); }
.pfTeamSection { padding: clamp(40px, 6vw, 72px) var(--pf-space-inline); background: var(--pf-parchment); color: var(--pf-stone); }
.pfTeamInner { max-width: 1180px; margin: 0 auto; display: grid; gap: 28px; }
.pfTeamIntro { display: grid; gap: 10px; max-width: 48rem; }
.pfTeamIntro h2 { margin: 0; font-family: var(--pf-font-serif); font-size: clamp(1.8rem, 4vw, 3rem); line-height: 1.05; color: var(--pf-stone); }
.pfTeamIntro p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body); line-height: var(--pf-leading-body); color: var(--pf-stone-muted); }
.pfTeamGrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; align-items: stretch; }
.pfTherapistCard { display: grid; grid-template-rows: auto 1fr; overflow: hidden; border: 1px solid var(--pf-border-light); border-radius: var(--pf-radius-md); background: #fff; box-shadow: var(--pf-shadow-card); }
.pfTherapistCard img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; object-position: center 18%; display: block; background: #111a18; }
.pfTherapistCopy { display: grid; gap: 12px; padding: clamp(18px, 3vw, 24px); }
.pfTherapistAvailability { width: fit-content; margin: 0; padding: 6px 10px; border: 1px solid rgba(200,154,88,.4); border-radius: var(--pf-radius-pill); color: var(--pf-bronze); font-family: var(--pf-font-sans); font-size: 0.6875rem; font-weight: 700; letter-spacing: .11em; text-transform: uppercase; }
.pfTherapistCopy h3 { margin: 0; font-family: var(--pf-font-serif); font-size: clamp(1.6rem, 2.8vw, 2.15rem); line-height: 1.05; color: var(--pf-stone); }
.pfTherapistRole { margin: -4px 0 0; font-family: var(--pf-font-sans); font-weight: 700; color: var(--pf-stone); }
.pfTherapistCopy p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body-sm); line-height: var(--pf-leading-body); color: var(--pf-stone-muted); }
.pfTherapistTags { margin: 4px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
.pfTherapistTags li { padding: 6px 9px; border-radius: var(--pf-radius-pill); background: var(--pf-parchment-muted); color: var(--pf-stone); font-family: var(--pf-font-sans); font-size: 0.75rem; }
.pfAboutBoundary { padding: clamp(40px, 6vw, 72px) var(--pf-space-inline); background: var(--pf-forest-deep); color: var(--pf-linen); border-top: 1px solid rgba(246,242,234,.08); }
.pfAboutBoundaryInner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, .7fr) minmax(0, 1fr); gap: clamp(24px, 4vw, 52px); align-items: start; }
.pfAboutBoundary p { margin: 0; font-family: var(--pf-font-sans); font-size: var(--pf-text-body); line-height: var(--pf-leading-body); color: var(--pf-linen-muted); }
.pfAboutPage .lpEndCta { padding: clamp(40px, 6vw, 72px) var(--pf-space-inline); background: var(--pf-forest-deep); color: var(--pf-linen); border-top: 1px solid rgba(246,242,234,.08); }
.pfAboutPage .lpEndCtaInner { max-width: 1180px; margin: 0 auto; display: grid; gap: 16px; }
.pfAboutPage .lpEndCta .pfSectionTitle { max-width: 14ch; color: var(--pf-linen); }
.pfAboutPage .lpEndCta .pfSectionLead { color: var(--pf-linen-muted); }
@media (max-width: 960px) {
  .pfTeamGrid, .pfAboutBoundaryInner { grid-template-columns: 1fr; }
}
</style>`;

function buildAboutPage(shellHtml) {
  const therapists = [
    {
      name: "Brent Kelly",
      role: "Trauma-informed psychotherapist",
      availability: "Lisbon clinic and online",
      image: "/assets/images/team/brent-kelly.jpeg",
      alt: "Brent Kelly, therapist at Pathfinder Therapy Lisbon",
      summary:
        "Brent leads Pathfinder Therapy in Lisbon and holds the face-to-face clinical space for clients who want to meet in person.",
      detail:
        "His work is relational, trauma-informed and grounded in Transactional Analysis, EMDR and careful attention to attachment, identity, anxiety and life transitions.",
      tags: ["EATA registered", "ITAA member", "EMDR", "Transactional Analysis"]
    },
    {
      name: "Tim Felton",
      role: "Online therapist",
      availability: "Online sessions only",
      image: "/assets/images/team/tim-felton.jpeg",
      alt: "Tim Felton, online therapist with Pathfinder Therapy",
      summary:
        "Tim supports Pathfinder clients online, offering a steady therapeutic space for people navigating stress, change and the impact of difficult life experiences.",
      detail:
        "His background brings together clinical training, lived experience and a calm, practical approach to helping clients make sense of what they are carrying.",
      tags: ["Therapist", "Veteran", "Online therapy"]
    },
    {
      name: "Sophie Gidley",
      role: "Online couples therapist",
      availability: "Online couples therapy",
      image: "/assets/images/team/sophie-gidley.webp",
      alt: "Sophie Gidley, online couples therapist with Pathfinder Therapy",
      summary:
        "Sophie is a psychotherapeutic counsellor who works with couples and individuals, with a particular focus on relationship patterns, communication and repair.",
      detail:
        "Her practice is grounded in Transactional Analysis and a down-to-earth, non-judgemental therapeutic style. Through Pathfinder Therapy, Sophie offers online couples sessions only.",
      tags: ["BACP member", "UKATA member", "TA diploma", "Couples counselling"]
    }
  ];

  const teamCards = therapists
    .map(
      (therapist) => `<article class="pfTherapistCard" id="${therapist.name.toLowerCase().replaceAll(" ", "-")}">
  <img src="${therapist.image}" width="320" height="400" alt="${therapist.alt}" loading="lazy" decoding="async" />
  <div class="pfTherapistCopy">
    <p class="pfTherapistAvailability">${therapist.availability}</p>
    <h3>${therapist.name}</h3>
    <p class="pfTherapistRole">${therapist.role}</p>
    <p>${therapist.summary}</p>
    <p>${therapist.detail}</p>
    <ul class="pfTherapistTags" aria-label="${therapist.name} credentials">${therapist.tags
      .map((tag) => `<li>${tag}</li>`)
      .join("")}</ul>
  </div>
</article>`
    )
    .join("");

  const mainInner = `<article class="pfAboutPage">
<section class="pfAboutHero" aria-labelledby="about-title">
  <div class="pfAboutHeroInner">
    <p class="pfKicker">About Pathfinder Therapy</p>
    <h1 class="pfSectionTitle" id="about-title">A Lisbon clinic, with a carefully held online team.</h1>
    <p class="pfSectionLead">Brent Kelly is an English-speaking therapist offering trauma-informed psychotherapy, EMDR and Transactional Analysis in Lisbon and online across Portugal. He leads Pathfinder Therapy and holds face-to-face therapy at the Lisbon clinic. Trusted therapists Tim Felton and Sophie Gidley also support online provision.</p>
    <p class="pfAboutNote">For people looking for therapy in Lisbon, Brent remains the local point of contact and the therapist available for face-to-face work. Tim and Sophie extend Pathfinder's online provision only.</p>
  </div>
</section>
<section class="pfTeamSection" aria-labelledby="team-title">
  <div class="pfTeamInner">
    <div class="pfTeamIntro">
      <p class="pfKicker">The team</p>
      <h2 id="team-title">Who you may work with</h2>
      <p>The team is deliberately small. Brent holds the Lisbon clinic and online work, Tim supports online therapy, and Sophie brings a specialist online couples therapy route.</p>
    </div>
    <div class="pfTeamGrid">${teamCards}</div>
  </div>
</section>
<section class="pfAboutBoundary" aria-labelledby="clinic-boundary-title">
  <div class="pfAboutBoundaryInner">
    <div>
      <p class="pfKicker">Lisbon and online</p>
      <h2 class="pfSectionTitle" id="clinic-boundary-title">Clear routes into care.</h2>
    </div>
    <p>If you are looking for therapy in Lisbon, Brent is the therapist you will meet face to face at the clinic. If online therapy is a better fit, Brent can help identify whether Tim or Sophie is the appropriate route, including Sophie for online couples work.</p>
  </div>
</section>
<section class="lpEndCta" aria-labelledby="about-next-step">
  <div class="lpEndCtaInner">
    <p class="pfKicker">Next step</p>
    <h2 class="pfSectionTitle" id="about-next-step">Meet the right therapist.</h2>
    <p class="pfSectionLead">Book an initial consultation or send an enquiry if you want to ask which route fits best: Brent in Lisbon, or online therapy through Pathfinder.</p>
    <div class="lpHeroActions">
      <a class="lpPrimaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
      <a class="lpSecondaryCta" href="${ENQUIRY_PATH}">${ENQUIRY_LABEL}</a>
    </div>
  </div>
</section>
</article>`;

  const schema = `${ABOUT_PAGE_CSS}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"AboutPage","name":"About Pathfinder Therapy","url":"https://www.pathfindertherapy.com/about/","about":{"@type":"MedicalBusiness","name":"Pathfinder Therapy","address":{"@type":"PostalAddress","addressLocality":"Lisboa","addressCountry":"PT"}}}
</script>`;

  return buildInteriorPageV2(shellHtml, {
    title: "Brent Kelly & the Team | Trauma Therapy in Lisbon & Online",
    description:
      "Meet Brent Kelly, an English-speaking trauma therapist in Lisbon offering psychotherapy and EMDR, and Pathfinder's online therapy team.",
    canonical: "https://www.pathfindertherapy.com/about/",
    mainInner,
    schema
  });
}

function buildFaqPage(shellHtml) {
  const mainInner = `<article class="approachPage">
<section class="approachHero" aria-labelledby="faq-title">
  <div class="approachHeroCopy">
    <p class="sectionKicker">Questions</p>
    <h1 class="approachHeroTitle" id="faq-title">Frequently asked questions</h1>
    <p class="approachHeroText">Clear answers about therapy with Pathfinder Therapy in Lisbon and online — so you can decide your next step with less uncertainty.</p>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-booking">
  <div class="approachEssayInner">
    <p class="sectionKicker">Booking</p>
    <h2 class="approachSectionTitle" id="faq-booking">How do I arrange an initial consultation?</h2>
    <div class="approachBody">
      <p>You can <a href="${BOOKING_PATH}">arrange an initial consultation directly</a> or <a href="${ENQUIRY_PATH}">send an enquiry first</a> if you would prefer to ask a question. Initial consultations take place securely by Zoom. Brent replies to non-urgent messages within one working day.</p>
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
      <p>Brent leads the Lisbon clinic and face-to-face work. Tim Felton and Sophie Gidley support online therapy through Pathfinder, with Sophie offering online couples therapy.</p>
      <p>You do not need a diagnosis to begin. Many people start with a feeling, a pattern, or a sense that something needs attention.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-location">
  <div class="approachEssayInner">
    <p class="sectionKicker">Location</p>
    <h2 class="approachSectionTitle" id="faq-location">Can I see you in person or online?</h2>
    <div class="approachBody">
      <p>Yes. Brent offers sessions at the Pathfinder Therapy clinic in Lisbon (R. Rodrigues Sampaio 76) and secure online therapy across Portugal and internationally where appropriate. Tim and Sophie work online only through Pathfinder.</p>
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
      <p>Yes. Brent is an EMDR Practitioner and offers trauma-informed psychotherapy, EMDR where clinically appropriate, Transactional Analysis and relational work.</p>
      <p><a href="/knowledge-library/what-is-trauma-therapy/">What is trauma therapy?</a> · <a href="/knowledge-library/how-does-emdr-work/">How does EMDR work?</a></p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-fees">
  <div class="approachEssayInner">
    <p class="sectionKicker">Fees</p>
    <h2 class="approachSectionTitle" id="faq-fees">How much do sessions cost?</h2>
    <div class="approachBody">
      <p>Individual sessions are from €75 for 50 minutes. Couples sessions may differ depending on format and therapist — see the <a href="/fees/">fees page</a> or ask when you enquire.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="faq-confidential">
  <div class="approachEssayInner">
    <p class="sectionKicker">Confidentiality</p>
    <h2 class="approachSectionTitle" id="faq-confidential">Is therapy confidential?</h2>
    <div class="approachBody">
      <p>Yes. Sessions are confidential within ethical and legal limits. Brent is registered with EATA and a member of ITAA, holds professional indemnity insurance, and receives clinical supervision.</p>
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
{"@type":"Question","name":"How do I arrange an initial consultation?","acceptedAnswer":{"@type":"Answer","text":"You can arrange an initial consultation at pathfindertherapy.com/book or send an enquiry at pathfindertherapy.com/start. Brent replies within one working day."}},
{"@type":"Question","name":"Can I see Brent in person or online?","acceptedAnswer":{"@type":"Answer","text":"Yes. Brent offers sessions at the Lisbon clinic and securely online across Portugal. Tim Felton and Sophie Gidley support online-only therapy through Pathfinder."}},
{"@type":"Question","name":"How much do sessions cost?","acceptedAnswer":{"@type":"Answer","text":"Individual sessions are from EUR 75 for 50 minutes."}},
{"@type":"Question","name":"Do you offer EMDR and trauma therapy?","acceptedAnswer":{"@type":"Answer","text":"Yes. Brent is an EMDR Practitioner and offers trauma-informed psychotherapy and EMDR where clinically appropriate."}}
]}
</script>`;

  return buildInteriorPageWithBookingPanel(shellHtml, {
    title: "FAQ | Therapist Lisbon | Pathfinder Therapy",
    description:
      "Answers about booking, fees, online therapy, EMDR, trauma therapy, and first sessions with Pathfinder Therapy in Lisbon and online.",
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
    <h2 class="approachSectionTitle" id="fees-individual">Individual therapy</h2>
    <div class="approachBody">
      <p><strong>€75</strong> for a 50-minute session.</p>
      <p>Trauma-informed psychotherapy for adults — in person at our Lisbon clinic or securely online.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-emdr">
  <div class="approachEssayInner">
    <h2 class="approachSectionTitle" id="fees-emdr">EMDR</h2>
    <div class="approachBody">
      <p><strong>€95</strong> for a 60-minute session.</p>
      <p>Eye Movement Desensitisation and Reprocessing within broader trauma-informed psychotherapy, where clinically appropriate.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-couples">
  <div class="approachEssayInner">
    <h2 class="approachSectionTitle" id="fees-couples">Couples therapy</h2>
    <div class="approachBody">
      <p><strong>€120</strong> for a 90-minute session.</p>
      <p>Relational therapy for couples navigating conflict, disconnection, and repeating patterns. Online couples therapy is offered through Sophie Gidley; Lisbon face-to-face enquiries are discussed separately with Brent.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-consultation">
  <div class="approachEssayInner">
    <h2 class="approachSectionTitle" id="fees-consultation">Initial consultation</h2>
    <div class="approachBody">
      <p>You can <a href="${BOOKING_PATH}">arrange an initial consultation directly</a> or <a href="${ENQUIRY_PATH}">send an enquiry first</a>. Brent will reply within one working day to confirm fees, format, therapist and next steps.</p>
    </div>
  </div>
</section>
<section class="approachEssay" aria-labelledby="fees-payment">
  <div class="approachEssayInner">
    <h2 class="approachSectionTitle" id="fees-payment">Payment and cancellation</h2>
    <div class="approachBody">
      <p>Payment arrangements are agreed before sessions begin. Cancellation terms are shared at booking so expectations are clear for both parties.</p>
      <p>Pathfinder Therapy is a private practice. Sessions are not typically covered by public health insurance in Portugal.</p>
    </div>
  </div>
</section>
</article>`;

  const schema = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"MedicalBusiness","name":"Pathfinder Therapy","url":"https://www.pathfindertherapy.com/fees/","priceRange":"EUR75","makesOffer":[
{"@type":"Offer","price":"75","priceCurrency":"EUR","description":"Individual psychotherapy session (50 minutes)"},
{"@type":"Offer","price":"95","priceCurrency":"EUR","description":"EMDR session (60 minutes)"},
{"@type":"Offer","price":"120","priceCurrency":"EUR","description":"Couples therapy session (90 minutes)"}
]}
</script>`;

  return buildInteriorPageWithBookingPanel(shellHtml, {
    title: "Fees | Therapist Lisbon | Pathfinder Therapy",
    description:
      "Session fees: individual therapy €75 (50 min), EMDR €95 (60 min), couples therapy from €120 (90 min). Lisbon with Brent Kelly and online through Pathfinder.",
    canonical: "https://www.pathfindertherapy.com/fees/",
    mainInner,
    schema,
    slimBookingPanel: true
  });
}

function patchSitemap(sitemapXml) {
  let next = sitemapXml;
  const today = new Date().toISOString().slice(0, 10);
  const additions = [
    { loc: "https://www.pathfindertherapy.com/about/", priority: "0.8" },
    { loc: "https://www.pathfindertherapy.com/faq/", priority: "0.75" },
    { loc: "https://www.pathfindertherapy.com/fees/", priority: "0.75" },
    { loc: "https://www.pathfindertherapy.com/crisis-support/", priority: "0.55" },
    { loc: "https://www.pathfindertherapy.com/therapy/individual/", priority: "0.9" },
    { loc: "https://www.pathfindertherapy.com/therapy/couples/", priority: "0.9" },
    { loc: "https://www.pathfindertherapy.com/therapy/emdr/", priority: "0.9" },
    { loc: "https://www.pathfindertherapy.com/therapy/online/", priority: "0.9" },
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
  const parts = extractPageParts(contactHtml);
  const mainInner = `<section class="lpHero" style="max-width:42rem">
    <p class="lpKicker">Enquiry received</p>
    <h1 class="lpTitle">Thank you — Brent will be in touch soon.</h1>
    <p class="lpLead">Your enquiry was sent securely. Brent responds to non-urgent messages within one working day, usually sooner.</p>
    <ul class="lpSteps">
      <li><span class="lpStepNum" aria-hidden="true">✓</span><span>Your message has been received confidentially.</span></li>
      <li><span class="lpStepNum" aria-hidden="true">2</span><span>Brent will reply by email to arrange an initial conversation.</span></li>
      <li><span class="lpStepNum" aria-hidden="true">3</span><span>If you both agree it feels right, your first session can be booked in Lisbon or online.</span></li>
    </ul>
    <div class="lpHeroActions">
      <a class="lpSecondaryCta" href="/">Return to homepage</a>
      <a class="lpSecondaryCta" href="${BOOKING_PATH}">${BOOKING_LABEL}</a>
    </div>
    <p class="lpReassurance">If you are in crisis or immediate danger, contact local emergency services. This service is for non-urgent enquiries only.</p>
  </section>`;
  let html = wrapInShellV2({
    ...parts,
    route: "/thank-you/",
    mainInner,
    interior: false
  });
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

  const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const staticAssets = [
    ["public/assets/images/about-brent-pathfinder-logo.webp", "assets/images/about-brent-pathfinder-logo.webp"],
    ["public/assets/images/pathfinder-path-icon.png", "assets/images/pathfinder-path-icon.png"],
    ["public/assets/images/pathfinder-path-icon-hq.png", "assets/images/pathfinder-path-icon-hq.png"],
    ["public/assets/images/eata-logo.svg", "assets/images/eata-logo.svg"],
    ["public/assets/images/itaa-member-badge.svg", "assets/images/itaa-member-badge.svg"],
    ["public/images/team/brent-kelly.jpeg", "assets/images/team/brent-kelly.jpeg"],
    ["public/images/team/tim-felton.jpeg", "assets/images/team/tim-felton.jpeg"],
    ["public/images/team/sophie-gidley.webp", "assets/images/team/sophie-gidley.webp"],
    [
      "public/assets/images/locallista-lis-signature-default.svg",
      "assets/images/locallista-lis-signature-default.svg"
    ],
    [
      "public/assets/images/accreditations/ncps-recognised-counselling-service.png",
      "assets/images/accreditations/ncps-recognised-counselling-service.png"
    ]
  ];
  for (const [sourceRel, targetRel] of staticAssets) {
    const source = path.join(repoRoot, sourceRel);
    const target = path.join(OUT_DIR, targetRel);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target);
  }

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
    "/about/",
    "/",
    ...getServicePageRoutes(),
    UK_EMDR_ROUTE,
    ...getLocalLandingRoutes(),
    ...getKnowledgeLibraryBuiltRoutes()
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
      title: "English-Speaking Therapist Lisbon | Brent Kelly | Pathfinder",
      description:
        "English-speaking psychotherapy and trauma therapy with Brent Kelly in Lisbon or online. Individual sessions from €75. Book a free 30-minute initial Zoom call.",
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

  const contactPageV2 = stripHydrationScripts(injectLocationStyles(buildContactPageV2(contactHtml)));
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
  console.log(`Native booking: ${DEFAULT_BOOKING_URL.replace(/^https?:\/\//, "")}`);
  logGoogleAdsBuildConfig();

  const shellHtml = await fetchText(`${PREVIEW_ORIGIN}/approach/`);
  const aboutHtml = stripHydrationScripts(buildAboutPage(shellHtml));
  const faqHtml = stripHydrationScripts(buildFaqPage(shellHtml));
  const feesHtml = stripHydrationScripts(buildFeesPage(shellHtml));
  for (const asset of extractAssetPaths(aboutHtml)) assetPaths.add(asset);
  for (const asset of extractAssetPaths(faqHtml)) assetPaths.add(asset);
  for (const asset of extractAssetPaths(feesHtml)) assetPaths.add(asset);
  await writeRoute(PREVIEW_ORIGIN, "/about/", aboutHtml);
  await writeRoute(PREVIEW_ORIGIN, "/faq/", faqHtml);
  await writeRoute(PREVIEW_ORIGIN, "/fees/", feesHtml);
  console.log("Added /about/, /faq/ and /fees/");

  for (const page of buildAllServicePages(shellHtml)) {
    let serviceHtml = stripHydrationScripts(
      patchHtml(page.html, {
        title: page.meta.title,
        description: page.meta.description,
        canonical: page.meta.canonical
      })
    );
    for (const asset of extractAssetPaths(serviceHtml)) assetPaths.add(asset);
    await writeRoute(PREVIEW_ORIGIN, page.route, serviceHtml);
    console.log(`Added ${page.route} (service page)`);
  }

  const crisisHtml = stripHydrationScripts(buildCrisisPage(shellHtml, buildInteriorPageV2));
  await writeRoute(PREVIEW_ORIGIN, "/crisis-support/", crisisHtml);
  console.log("Added /crisis-support/");

  for (const page of LOCAL_LANDING_PAGES) {
    const landingHtml = stripHydrationScripts(
      injectLocationStyles(buildLocalLandingPage(shellHtml, page, buildInteriorPageWithBookingPanel))
    );
    await writeRoute(PREVIEW_ORIGIN, page.route, landingHtml);
    console.log(`Added ${page.route} (local landing)`);
  }

  const knowledgeArticles = await loadKnowledgeArticles();

  let libraryIndexHtml = buildKnowledgeLibraryIndexPage(shellHtml, knowledgeArticles, buildInteriorPageV2);
  libraryIndexHtml = applySprint3Transforms(libraryIndexHtml, "/knowledge-library/");
  libraryIndexHtml = stripHydrationScripts(libraryIndexHtml);
  for (const asset of extractAssetPaths(libraryIndexHtml)) assetPaths.add(asset);
  await writeRoute(PREVIEW_ORIGIN, "/knowledge-library/", libraryIndexHtml);
  console.log("Added /knowledge-library/ (knowledge library index)");

  for (const article of knowledgeArticles) {
    let articleHtml = buildKnowledgeArticlePage(shellHtml, article, buildInteriorPageV2);
    articleHtml = applySprint3Transforms(articleHtml, article.route);
    articleHtml = stripHydrationScripts(articleHtml);
    for (const asset of extractAssetPaths(articleHtml)) assetPaths.add(asset);
    await writeRoute(PREVIEW_ORIGIN, article.route, articleHtml);
    console.log(`Added ${article.route} (knowledge article)`);
  }

  await writeFile(path.join(OUT_DIR, "llms.txt"), applyCredentialCopy(buildLlmsTxt()), "utf8");
  await writeFile(path.join(OUT_DIR, "ai-summary.json"), applyCredentialCopy(buildAiSummaryJson()), "utf8");
  console.log("Added llms.txt and ai-summary.json");

  const bundledAssetPaths = new Set(staticAssets.map(([, target]) => `/${target}`));
  for (const assetPath of assetPaths) {
    if (!bundledAssetPaths.has(assetPath)) await downloadAsset(assetPath);
  }

  // CSS can reference fonts that are absent from the HTML asset list.
  const stylesheetDependencies = new Set();
  for (const assetPath of assetPaths) {
    if (!assetPath.endsWith(".css")) continue;
    const css = await readFile(path.join(OUT_DIR, assetPath), "utf8");
    for (const match of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
      const dependency = new URL(match[1], `${PREVIEW_ORIGIN}${assetPath}`);
      if (dependency.origin === new URL(PREVIEW_ORIGIN).origin) stylesheetDependencies.add(dependency.pathname);
    }
  }
  const dependencyPaths = [...stylesheetDependencies];
  for (let offset = 0; offset < dependencyPaths.length; offset += 8) {
    await Promise.all(dependencyPaths.slice(offset, offset + 8).map(downloadAsset));
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

  await embedBuildProvenance();
  await cp(path.join(repoRoot, "public", "robots.txt"), path.join(OUT_DIR, "robots.txt"));
  await applyLisbonRedesign(OUT_DIR);
  await applyUkEmdrLanding(OUT_DIR);
  await optimiseStaticSite(OUT_DIR);

  console.log(`Production build written to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
