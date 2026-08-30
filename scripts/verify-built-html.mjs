#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = process.env.PATHFINDER_OUT_DIR || path.join(process.cwd(), "out");
const NATIVE_BOOKING_URL = "https://booking.pathfindertherapy.com/book";

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

const LEGACY_MARKERS = [
  "More ▾",
  "Every path is different.But",
  "Make an enquiry",
  "Book a session",
  "Send a brief secure enquiry"
];

const AUDIT_ROUTES = [
  "/about/",
  "/approach/",
  "/fees/",
  "/faq/",
  "/contact/",
  "/therapy/",
  "/psychotherapy-lisbon/",
  "/trauma-therapy-lisbon/",
  "/emdr-therapy-lisbon/",
  "/english-speaking-therapist-lisbon/",
  "/knowledge-library/",
  "/journal/",
  "/retreats/"
];

function auditLegacyMarkers() {
  const files = collectHtmlFiles(OUT_DIR);
  const issues = [];

  for (const file of files) {
    const rel = path.relative(OUT_DIR, file);
    const html = fs.readFileSync(file, "utf8");

    for (const marker of LEGACY_MARKERS) {
      if (html.includes(marker)) {
        issues.push(`${rel}: legacy marker "${marker}"`);
      }
    }

    if (/<p class="sectionKicker">Begin<\/p>/.test(html)) {
      issues.push(`${rel}: legacy Begin section kicker`);
    }

    if (/<ol class="lpSteps"/.test(html)) {
      issues.push(`${rel}: ol.lpSteps combines ordered-list numbering with manual step numbers`);
    }

    if (/enquiry first \./.test(html)) {
      issues.push(`${rel}: enquiry note has space before full stop`);
    }

    const duplicateKicker = html.match(
      /<p class="sectionKicker">([^<]+)<\/p>[\s\S]{0,800}?<h2 class="aboutSectionTitle"[^>]*>\1<\/h2>/i
    );
    if (duplicateKicker) {
      issues.push(`${rel}: duplicated eyebrow and H2 "${duplicateKicker[1]}"`);
    }
  }

  return issues;
}

function auditPriorityRoutes() {
  const issues = [];

  for (const route of AUDIT_ROUTES) {
    const file = path.join(OUT_DIR, routeToFile(route));
    if (!fs.existsSync(file)) {
      issues.push(`Missing audit route: ${route}`);
      continue;
    }

    const html = fs.readFileSync(file, "utf8");
    const rel = routeToFile(route);

    if (["/about/", "/approach/", "/therapy/"].includes(route)) {
      const endCtaCount = (html.match(/class="lpEndCta"/g) ?? []).length;
      if (endCtaCount !== 1) {
        issues.push(`${rel}: expected 1 closing CTA, found ${endCtaCount}`);
      }
    }

    if (route === "/about/") {
      if (!html.includes("Every path is different. <span>But")) {
        issues.push(`${rel}: about hero punctuation not corrected`);
      }
      if (html.includes('class="lpBookingPanel"')) {
        issues.push(`${rel}: about page still has booking sidebar`);
      }
    }

    if (route === "/approach/") {
      if (html.includes('class="approachFinalCta"')) {
        issues.push(`${rel}: approach page still has legacy final CTA section`);
      }
      if (html.includes('class="lpBookingPanel"')) {
        issues.push(`${rel}: approach page still has booking sidebar`);
      }
    }

    if (route === "/therapy/") {
      if (!html.includes("Choose a consultation time")) {
        issues.push(`${rel}: therapy page missing booking-first process copy`);
      }
      if (!html.includes('<ul class="lpSteps"')) {
        issues.push(`${rel}: therapy process steps should use ul.lpSteps`);
      }
    }

    if (route.startsWith("/knowledge-library/") && route !== "/knowledge-library/") {
      if (html.includes('class="lpEndCta"')) {
        issues.push(`${rel}: knowledge article should not include lpEndCta when booking panel is present`);
      }
      if (!html.includes('class="lpBookingPanel"')) {
        issues.push(`${rel}: knowledge article missing booking panel`);
      }
      if (html.includes('class="approachFinalCta"')) {
        issues.push(`${rel}: knowledge article still has legacy approachFinalCta`);
      }
    }
  }

  return issues;
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
      if (href !== NATIVE_BOOKING_URL) {
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

function auditMembershipBadges() {
  const issues = [];
  const homepage = readRouteHtml("/");
  if (!homepage.includes("itaa-member-badge.svg")) {
    issues.push("Homepage missing ITAA member badge image");
  }
  if (!homepage.includes("lpItaaBadge")) {
    issues.push("Homepage missing ITAA badge markup");
  }
  if (!homepage.includes("ITAA member")) {
    issues.push("Homepage missing ITAA membership copy");
  }
  if (!homepage.includes("registered with EATA and a member of ITAA")) {
    issues.push("Homepage missing combined EATA/ITAA membership note");
  }

  const about = readRouteHtml("/about/");
  if (!about.includes("ITAA member")) {
    issues.push("/about/ missing ITAA membership copy");
  }

  return issues;
}

function auditClientLogin() {
  const LOGIN = "https://my.pathfindertherapy.org.uk/my/login";
  const issues = [];
  const files = collectHtmlFiles(OUT_DIR);

  for (const file of files) {
    const rel = path.relative(OUT_DIR, file);
    const html = fs.readFileSync(file, "utf8");
    const hasShell = html.includes('class="lpHeader"');
    if (!hasShell) continue;

    const loginHrefs = [...html.matchAll(/href="([^"]*my\.pathfindertherapy[^"]*)"/g)].map((m) => m[1]);
    if (!loginHrefs.length) {
      issues.push(`${rel}: shell page missing Client Login href`);
      continue;
    }
    for (const href of loginHrefs) {
      if (href !== LOGIN) issues.push(`${rel}: Client Login href "${href}"`);
      if (href.includes("?") || href.includes("token") || href.includes("alpha.pathfindertherapy.com")) {
        issues.push(`${rel}: Client Login URL must be the exact My Pathfinder login with no tokens`);
      }
    }
    if (/class="[^"]*lpHeaderCta[^"]*"[^>]*>\s*Client Login/.test(html)) {
      issues.push(`${rel}: Client Login must not use the booking CTA style`);
    }
    if (!html.includes("class=\"lpHeaderLogin\"")) {
      issues.push(`${rel}: missing desktop Client Login link`);
    }
    if (!html.includes("class=\"lpMobileNavLogin\"")) {
      issues.push(`${rel}: missing mobile Client Login link`);
    }
    if (/<form[^>]*action="https:\/\/my\.pathfindertherapy/.test(html)) {
      issues.push(`${rel}: must not collect My Pathfinder credentials`);
    }
    if (/type="password"/.test(html) && html.includes(LOGIN)) {
      issues.push(`${rel}: must not embed a password field with the login destination`);
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
        'id="home-immersive"',
        'id="home-next"',
        "Independent feedback",
        'id="home-final-cta"',
        'id="home-lisbon"'
      ];
      if (!html.includes("Immersive EMDR Therapy")) {
        errors.push("Homepage missing Immersive EMDR Therapy announcement");
      }
      if (!html.includes("Pilot service launching soon")) {
        errors.push("Homepage missing immersive pilot badge");
      }
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
      if (!html.includes("30-minute initial consultation · Free · Secure Zoom")) {
        errors.push("/book/ missing exact consultation meta line");
      }
      if (!html.includes(NATIVE_BOOKING_URL)) {
        errors.push("/book/ missing native Pathfinder booking URL");
      }
      if (!html.includes("lpNativeBookingPanel")) {
        errors.push("/book/ missing native booking handoff panel");
      }
      if (html.includes("assets.calendly.com") || html.includes("calendly-inline-widget")) {
        errors.push("/book/ still loads Calendly");
      }
    }
    if (route === "/therapy/") {
      if (!html.includes("Take the next step")) errors.push("/therapy/ missing final CTA");
      if (!html.includes("Choose a consultation time")) errors.push("/therapy/ missing book-first process");
      if (!html.includes('id="therapy-immersive"')) errors.push("/therapy/ missing Immersive EMDR section");
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
      if (!html.includes("pfPanelCta")) errors.push(`${route} missing subdued panel CTA`);
    }
    if (route === "/contact/") {
      if (!html.includes("pfContactDetails")) errors.push("/contact/ missing refined contact hierarchy");
      if (!html.includes("Already a Client?")) errors.push("/contact/ missing Client Login contextual copy");
      if (!html.includes("https://my.pathfindertherapy.org.uk/my/login")) {
        errors.push("/contact/ missing My Pathfinder login URL");
      }
    }
    if (route === "/") {
      if (html.includes("lpFeedbackQuote")) errors.push("Homepage still uses unverified quoted feedback");
    }
  }

  errors.push(...auditCtas());
  errors.push(...auditLegacyMarkers());
  errors.push(...auditPriorityRoutes());
  errors.push(...auditMembershipBadges());
  errors.push(...auditClientLogin());

  if (errors.length) {
    console.error("Built HTML verification failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`Built HTML verification passed (${ROUTES.length} routes, CTA audit across site)`);
}

main();
