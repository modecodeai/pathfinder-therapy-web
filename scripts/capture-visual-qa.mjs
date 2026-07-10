#!/usr/bin/env node
/**
 * Visual QA screenshots for final refinement pass.
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

async function capturePage(browser, { name, url, viewport, device, fullPage = true }) {
  const context = device
    ? await browser.newContext({ ...devices[device] })
    : await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${url}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage });
  await context.close();
  console.log(`Captured ${name}.png`);
}

async function captureBookLoading(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route("**/assets.calendly.com/assets/external/widget.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 60000));
    await route.continue();
  });
  await page.goto(`${baseUrl}/book/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.locator(".lpCalendlyPanel").screenshot({
    path: path.join(outputDir, "book-page-loading.png")
  });
  await context.close();
  console.log("Captured book-page-loading.png");
}

async function captureBookError(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route("**/assets.calendly.com/**", (route) => route.abort());
  await page.goto(`${baseUrl}/book/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".lpCalendlyPanel.isError", { timeout: 8000 });
  await page.locator(".lpCalendlyPanel").screenshot({
    path: path.join(outputDir, "book-page-error.png")
  });
  await context.close();
  console.log("Captured book-page-error.png");
}

async function captureFooterHiddenFloat(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const footer = document.querySelector(".pfFooter");
    if (footer) footer.scrollIntoView({ block: "end" });
  });
  await page.waitForTimeout(500);
  const floatVisible = await page.locator(".pfFloatCta.isVisible").count();
  if (floatVisible) {
    console.warn("Floating CTA still visible near footer");
  }
  await page.locator(".pfFooter").screenshot({ path: path.join(outputDir, "footer-floating-hidden.png") });
  await context.close();
  console.log("Captured footer-floating-hidden.png");
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    await capturePage(browser, {
      name: "homepage-desktop",
      url: "/",
      viewport: { width: 1440, height: 900 }
    });
    await capturePage(browser, {
      name: "homepage-mobile",
      url: "/",
      device: "iPhone 13"
    });
    await capturePage(browser, {
      name: "individual-therapy-desktop",
      url: "/therapy/individual/",
      viewport: { width: 1440, height: 900 }
    });
    await capturePage(browser, {
      name: "contact-page",
      url: "/contact/",
      viewport: { width: 1440, height: 900 }
    });
    await capturePage(browser, {
      name: "therapy-mobile",
      url: "/therapy/",
      device: "iPhone 13"
    });
    await capturePage(browser, {
      name: "about-desktop",
      url: "/about/",
      viewport: { width: 1440, height: 900 }
    });
    await capturePage(browser, {
      name: "about-mobile",
      url: "/about/",
      device: "iPhone 13"
    });
    await capturePage(browser, {
      name: "approach-desktop",
      url: "/approach/",
      viewport: { width: 1440, height: 900 }
    });
    await capturePage(browser, {
      name: "approach-mobile",
      url: "/approach/",
      device: "iPhone 13"
    });
    await captureBookLoading(browser);
    await captureBookError(browser);
    await captureFooterHiddenFloat(browser);
    console.log(`Visual QA screenshots written to ${outputDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
