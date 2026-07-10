#!/usr/bin/env node
import process from "node:process";

const sha = process.env.PATHFINDER_BUILD_SHA || "";
const baseUrl = process.env.PATHFINDER_VERIFY_BASE_URL || "https://www.pathfindertherapy.com";
const routes = ["/", "/start/", "/book/", "/fees/", "/about/", "/approach/", "/therapy/", "/contact/", "/faq/"];

if (!sha) {
  console.error("PATHFINDER_BUILD_SHA is required");
  process.exit(1);
}

const contentChecks = [
  {
    route: "/",
    test: (html) =>
      html.includes("Trauma-informed psychotherapy in Lisbon and online") &&
      !html.includes("Choose the route that suits you") &&
      html.includes("Not sure where to begin?") &&
      html.includes('href="/book/"') &&
      html.includes('href="/start/#enquiry"')
  },
  {
    route: "/start/",
    test: (html) =>
      html.includes("lpStartPathways") &&
      html.includes("Arrange a consultation directly") &&
      html.includes('id="enquiry"')
  },
  {
    route: "/book/",
    test: (html) =>
      html.includes("initial consultation") &&
      html.includes("calendly-inline-widget") &&
      !html.includes("Choose the route")
  },
  {
    route: "/therapy/",
    test: (html) =>
      html.includes("Take the next step") &&
      html.includes("Choose a consultation time") &&
      !html.includes("Begin with a conversation")
  },
  {
    route: "/fees/",
    test: (html) => html.includes("€95") && html.includes("€120") && !html.includes("may differ")
  },
  {
    route: "/about/",
    test: (html) => html.includes("Every path is different. ") && !html.includes("Every path is different.But")
  },
  {
    route: "/approach/",
    test: (html) => html.includes("for a reason.") && !html.includes("reason.Therapy")
  }
];

async function fetchHtml(route) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
  });
  if (!response.ok) {
    throw new Error(`${baseUrl}${route} returned ${response.status}`);
  }
  return response.text();
}

async function verifyOnce() {
  for (const route of routes) {
    const html = await fetchHtml(route);
    const marker = `x-pathfinder-build-sha" content="${sha}"`;
    if (!html.includes(marker)) {
      throw new Error(`Missing build SHA marker on ${baseUrl}${route}`);
    }
  }

  for (const check of contentChecks) {
    const html = await fetchHtml(check.route);
    if (!check.test(html)) {
      throw new Error(`Content check failed on ${baseUrl}${check.route}`);
    }
  }
}

async function main() {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      console.log(`Verification attempt ${attempt}...`);
      await verifyOnce();
      console.log(`Production HTML verification passed for commit ${sha}`);
      return;
    } catch (error) {
      console.warn(error.message);
      if (attempt === 8) throw error;
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
