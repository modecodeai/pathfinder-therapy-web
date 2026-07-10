#!/usr/bin/env node
/**
 * Visual QA screenshots for service-page refinement.
 * Usage: node scripts/capture-visual-qa.mjs [baseUrl] [outputDir]
 */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const baseUrl = process.argv[2] || process.env.PATHFINDER_QA_BASE_URL || "http://127.0.0.1:3456";
const outputDir =
  process.argv[3] ||
  process.env.PATHFINDER_VISUAL_QA_DIR ||
  path.join(process.cwd(), "artifacts", "visual-qa");

const shots = [
  { name: "individual-therapy-desktop", url: "/therapy/individual/", viewport: { width: 1440, height: 900 } },
  { name: "individual-therapy-mobile", url: "/therapy/individual/", device: "iPhone 13" },
  { name: "couples-therapy-desktop", url: "/therapy/couples/", viewport: { width: 1440, height: 900 } },
  { name: "emdr-desktop", url: "/therapy/emdr/", viewport: { width: 1440, height: 900 } },
  { name: "online-therapy-desktop", url: "/therapy/online/", viewport: { width: 1440, height: 900 } },
  { name: "homepage-desktop", url: "/", viewport: { width: 1440, height: 900 } }
];

async function capture(browser, shot) {
  const context = shot.device
    ? await browser.newContext({ ...devices[shot.device] })
    : await browser.newContext({ viewport: shot.viewport });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${shot.url}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, `${shot.name}.png`), fullPage: true });
  await context.close();
  console.log(`Captured ${shot.name}.png`);
}

async function captureSections(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/therapy/individual/`, { waitUntil: "networkidle" });

  const explore = page.locator(".pfExploreMore").first();
  if (await explore.count()) {
    await explore.screenshot({ path: path.join(outputDir, "related-services-section.png") });
    console.log("Captured related-services-section.png");
  }

  const footer = page.locator(".pfFooter").first();
  if (await footer.count()) {
    await footer.screenshot({ path: path.join(outputDir, "footer.png") });
    console.log("Captured footer.png");
  }

  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(400);
  const floatActive = page.locator(".pfFloatCta.isVisible").first();
  if (await floatActive.count()) {
    await floatActive.screenshot({ path: path.join(outputDir, "floating-cta-active.png") });
    console.log("Captured floating-cta-active.png");
  } else {
    console.warn("Floating CTA not visible in active state — scroll may need adjustment");
  }

  await page.evaluate(() => {
    const footer = document.querySelector(".pfFooter");
    if (footer) footer.scrollIntoView({ block: "end" });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outputDir, "floating-cta-near-footer.png"), fullPage: false });
  console.log("Captured floating-cta-near-footer.png");

  await page.goto(`${baseUrl}/therapy/individual/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outputDir, "accessibility-focus-states.png"), fullPage: false });
  console.log("Captured accessibility-focus-states.png");

  await context.close();
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const shot of shots) {
      await capture(browser, shot);
    }
    await captureSections(browser);
    console.log(`Visual QA screenshots written to ${outputDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
