#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = process.env.PATHFINDER_OUT_DIR || path.join(process.cwd(), "out");

const ROUTES = [
  "/",
  "/therapy/",
  "/therapy/individual/",
  "/therapy/couples/",
  "/therapy/emdr/",
  "/therapy/online/",
  "/start/",
  "/book/",
  "/fees/",
  "/about/",
  "/approach/",
  "/faq/",
  "/contact/"
];

const LEGACY_LABELS = [
  "Book Zoom call",
  "Book an initial Zoom call",
  "Book initial Zoom call",
  "Book a consultation",
  "Make an enquiry",
  "Send a brief enquiry",
  "Begin with a conversation",
  "Choose the route that suits you",
  "Ready to begin?"
];

function routeToFile(route) {
  if (route === "/") return "index.html";
  return `${route.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
}

function readRouteHtml(route) {
  const file = path.join(OUT_DIR, routeToFile(route));
  if (!fs.existsSync(file)) {
    throw new Error(`Missing built file for ${route}: ${file}`);
  }
  return fs.readFileSync(file, "utf8");
}

function collectHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtmlFiles(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function auditCtas() {
  const files = collectHtmlFiles(OUT_DIR);
  const issues = [];

  for (const file of files) {
    const rel = path.relative(OUT_DIR, file);
    const html = fs.readFileSync(file, "utf8");
    const onStart = rel === "start/index.html";

    for (const label of LEGACY_LABELS) {
      if (html.includes(label)) {
        issues.push(`${rel}: legacy label "${label}"`);
      }
    }

    const primaryPattern =
      /<a\b(?=[^>]*\bclass="[^"]*\blpPrimaryCta\b)(?=[^>]*\bhref="([^"]+)")[^>]*>\s*Arrange an initial consultation|<a\b(?=[^>]*\bhref="([^"]+)")(?=[^>]*\bclass="[^"]*\blpPrimaryCta\b)[^>]*>\s*Arrange an initial consultation/gi;
    for (const match of html.matchAll(primaryPattern)) {
      const href = match[1] || match[2];
      if (href !== "/book/") {
        issues.push(`${rel}: primary CTA href "${href}"`);
      }
    }

    const secondaryPattern =
      /<a\b(?=[^>]*\bclass="[^"]*\blpSecondaryCta\b)(?=[^>]*\bhref="([^"]+)")[^>]*>\s*Send an enquiry|<a\b(?=[^>]*\bhref="([^"]+)")(?=[^>]*\bclass="[^"]*\blpSecondaryCta\b)[^>]*>\s*Send an enquiry/gi;
    for (const match of html.matchAll(secondaryPattern)) {
      const href = match[1] || match[2];
      if (onStart) {
        if (href !== "#enquiry" && href !== "/start/#enquiry") {
          issues.push(`${rel}: secondary CTA href "${href}"`);
        }
      } else if (href !== "/start/#enquiry") {
        issues.push(`${rel}: secondary CTA href "${href}"`);
      }
    }

    if (rel !== "therapy/index.html" && html.includes('class="lpTertiaryLink"')) {
      issues.push(`${rel}: tertiary link block outside therapy page`);
    }
    if (rel === "therapy/index.html") {
      const whatsappAsButton = /<a\b[^>]*class="[^"]*\blp(?:Primary|Secondary)Cta\b[^"]*"[^>]*href="https:\/\/wa\.me/gi.test(html);
      if (whatsappAsButton) {
        issues.push(`${rel}: WhatsApp styled as primary/secondary button`);
      }
    }
  }

  return issues;
}

function main() {
  const errors = [];

  for (const route of ROUTES) {
    const html = readRouteHtml(route);

    if (route === "/") {
      const order = [
        'id="home-title"',
        'id="home-who"',
        'id="home-approach"',
        'id="home-about"',
        'id="home-reassurance"',
        'id="home-services"',
        'id="home-next"',
        "Independent feedback",
        'id="home-final-cta"',
        'id="home-lisbon"'
      ];
      let last = -1;
      for (const marker of order) {
        const idx = html.indexOf(marker);
        if (idx === -1) errors.push(`Homepage missing marker: ${marker}`);
        else if (idx < last) errors.push(`Homepage section order wrong near: ${marker}`);
        last = idx;
      }
      if (html.includes('id="home-faq"')) errors.push("Homepage FAQ section still present");
    }
    if (route === "/book/") {
      if (!html.includes("30-minute initial consultation · Free · Zoom")) {
        errors.push("/book/ missing exact consultation meta line");
      }
      if (!html.includes("hi-pathfindertherapy/30min")) {
        errors.push("/book/ missing live Calendly event URL");
      }
      if (!html.includes("lpCalendlyLoading")) {
        errors.push("/book/ missing Calendly loading state");
      }
    }
    if (route === "/therapy/") {
      if (!html.includes("Take the next step")) errors.push("/therapy/ missing final CTA");
      if (!html.includes("Choose a consultation time")) errors.push("/therapy/ missing book-first process");
      if (html.includes('<aside class="lpBookingPanel"')) errors.push("/therapy/ still has sidebar booking panel");
      if (html.includes("Begin with a conversation")) errors.push("/therapy/ has duplicate CTA");
    }
    if (route === "/start/") {
      if (!html.includes("lpStartPathways")) errors.push("/start/ missing pathway cards");
      if (!html.includes('id="enquiry"')) errors.push("/start/ missing enquiry panel");
      if (!html.includes("pathfinder-start-enquiry")) errors.push("/start/ missing enquiry script");
    }
    if (route.startsWith("/therapy/") && route !== "/therapy/") {
      if (!html.includes("This may help with")) errors.push(`${route} missing help panel`);
      if (route === "/therapy/individual/") {
        if (!html.includes("regular, confidential space")) {
          errors.push(`${route} missing approved individual therapy wording`);
        }
        if (html.includes("confidential hour")) {
          errors.push(`${route} uses outdated session length wording`);
        }
      }
      if (html.includes("Book a session") || html.includes("Book now")) {
        errors.push(`${route} has disallowed booking label`);
      }
      if (!html.includes("Explore more")) errors.push(`${route} missing related services section`);
      if (!html.includes("pfServiceHero")) errors.push(`${route} missing image-led hero`);
    }
  }

  errors.push(...auditCtas());

  if (errors.length) {
    console.error("Built HTML verification failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Built HTML verification passed (${ROUTES.length} routes, CTA audit across site)`);
}

main();
