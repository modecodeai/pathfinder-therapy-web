import { mkdir, readFile, writeFile, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    if (href.indexOf("/contact") === 0 || href.indexOf("/start") === 0) {
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
            track("generate_lead", bodySource());
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

    document.querySelectorAll("form.contactForm").forEach(function (form) {
      var started = false;
      form.addEventListener("focusin", function () {
        if (started) return;
        started = true;
        track("form_start", bodySource());
      });
    });
  });
})();
</script>`;

const THANK_YOU_SCRIPT = `<script id="pathfinder-thank-you-conversion">
(function () {
  var KEY = "pathfinder_lead_converted";
  if (sessionStorage.getItem(KEY)) return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "generate_lead", { event_category: "contact", event_label: "thank_you_page" });
  sessionStorage.setItem(KEY, "1");
})();
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
  await writeFile(filePath, html, "utf8");
}

function injectBeforeBodyClose(html, snippet) {
  if (html.includes(snippet)) return html;
  return html.replace("</body>", `${snippet}\n</body>`);
}

function patchHtml(html, { robots = null, title = null, canonical = null } = {}) {
  let next = html;

  if (robots) {
    next = next.replace(/<meta name="robots" content="[^"]*"\/>/g, "");
    next = next.replace("</head>", `<meta name="robots" content="${robots}"/>\n</head>`);
  }

  if (title) {
    next = next.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  }

  if (canonical) {
    next = next.replace(/<link rel="canonical" href="[^"]*"\/>/g, "");
    next = next.replace("</head>", `<link rel="canonical" href="${canonical}"/>\n</head>`);
  }

  next = injectBeforeBodyClose(next, ATTRIBUTION_SCRIPT);
  next = injectBeforeBodyClose(next, FORM_ENHANCEMENT_SCRIPT);
  return next;
}

function buildStartPage(contactHtml) {
  const mainMatch = contactHtml.match(/<main[\s\S]*?<\/main>/);
  const sidebarMatch = contactHtml.match(/<aside class="sidebar"[\s\S]*?<\/aside>/);
  const mobileMatch = contactHtml.match(/<div class="mobileSidebar[\s\S]*?<\/div>\s*<\/div>/);

  const shellStart = contactHtml.slice(0, contactHtml.indexOf("<main"));
  const shellEnd = contactHtml.slice(contactHtml.indexOf("</main>") + 7);

  const startMain = `<main class="approachPage" id="main-content">
  <section class="approachHero">
    <div class="approachHeroCopy">
      <p class="sectionKicker">Private practice · Lisbon &amp; online</p>
      <h1 class="approachHeroTitle" id="start-title">Begin your enquiry.</h1>
      <div class="approachHeroText">
        <p>Tell us what you are looking for and Brent will respond to non-urgent enquiries, usually within one working day.</p>
        <p>Trauma-informed psychotherapy in Lisbon and online. Individual, couples, EMDR, and online sessions.</p>
      </div>
    </div>
  </section>
  <section class="approachEssay">
    <div class="approachEssayInner">
      <p class="sectionKicker">Secure enquiry form</p>
      ${contactHtml.match(/<form class="contactForm"[\s\S]*?<\/form>/)?.[0] ?? ""}
      <div class="relatedPages" style="margin-top:2rem">
        <p class="sectionKicker">Why Pathfinder</p>
        <ul class="approachHeroText">
          <li>Trauma-informed psychotherapy with Brent Kelly</li>
          <li>Lisbon clinic and secure online therapy</li>
          <li>Experienced with veterans, attachment, and complex trauma</li>
        </ul>
      </div>
    </div>
  </section>
</main>`;

  let html = `${shellStart}${sidebarMatch?.[0] ?? ""}${mobileMatch?.[0] ?? ""}${startMain}${shellEnd}`;
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Begin Therapy | Pathfinder Therapy Lisbon",
    canonical: "https://www.pathfindertherapy.com/start/"
  });
  return html;
}

function buildThankYouPage(contactHtml) {
  const shellStart = contactHtml.slice(0, contactHtml.indexOf("<main"));
  const shellEnd = contactHtml.slice(contactHtml.indexOf("</main>") + 7);
  const sidebarMatch = contactHtml.match(/<aside class="sidebar"[\s\S]*?<\/aside>/);
  const mobileMatch = contactHtml.match(/<div class="mobileSidebar[\s\S]*?<\/div>\s*<\/div>/);

  const thankYouMain = `<main class="approachPage" id="main-content">
  <section class="approachHero">
    <div class="approachHeroCopy">
      <p class="sectionKicker">Enquiry received</p>
      <h1 class="approachHeroTitle">Thank you.</h1>
      <div class="approachHeroText">
        <p>Brent will respond to non-urgent enquiries as soon as possible, usually within one working day.</p>
        <p>If you need to reach us directly, email <a href="mailto:hi@pathfindertherapy.com">hi@pathfindertherapy.com</a> or WhatsApp <a href="https://wa.me/351914775365">+351 914 775 365</a>.</p>
        <p><a class="button approachCtaAction" href="/">Return to homepage</a></p>
      </div>
    </div>
  </section>
</main>`;

  let html = `${shellStart}${sidebarMatch?.[0] ?? ""}${mobileMatch?.[0] ?? ""}${thankYouMain}${shellEnd}`;
  html = patchHtml(html, {
    robots: "noindex, nofollow",
    title: "Thank You | Pathfinder Therapy",
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

  const assetPaths = new Set(["/robots.txt", "/rss.xml", "/sitemap.xml", "/favicon.ico", "/favicon.svg"]);
  let contactHtml = "";

  for (const route of routes) {
    const previewUrl = `${PREVIEW_ORIGIN}${route}`;
    const html = await fetchText(previewUrl);
    if (route === "/contact/") contactHtml = html;
    for (const asset of extractAssetPaths(html)) assetPaths.add(asset);
    const patched = patchHtml(html);
    await writeRoute(PREVIEW_ORIGIN, route, patched);
    console.log(`Mirrored ${route}`);
  }

  if (!contactHtml) {
    contactHtml = await fetchText(`${PREVIEW_ORIGIN}/contact/`);
  }

  const startHtml = buildStartPage(contactHtml);
  const thankYouHtml = buildThankYouPage(contactHtml);
  for (const asset of extractAssetPaths(startHtml)) assetPaths.add(asset);
  for (const asset of extractAssetPaths(thankYouHtml)) assetPaths.add(asset);
  await writeRoute(PREVIEW_ORIGIN, "/start/", startHtml);
  await writeRoute(PREVIEW_ORIGIN, "/thank-you/", thankYouHtml);
  console.log("Added /start/ and /thank-you/");

  for (const assetPath of assetPaths) {
    await downloadAsset(assetPath);
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
