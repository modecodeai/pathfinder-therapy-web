#!/usr/bin/env node
/**
 * Browser QA for CRO refinement — requires Playwright Chromium.
 * Usage: node scripts/browser-qa.mjs [baseUrl]
 */
import { chromium, devices } from "playwright";
import process from "node:process";

const baseUrl = process.argv[2] || process.env.PATHFINDER_QA_BASE_URL || "http://127.0.0.1:3456";
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const results = [];
const errors = [];

function pass(name, detail = "") {
  results.push({ status: "pass", name, detail });
  console.log(`PASS ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  errors.push({ name, detail });
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

async function checkOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  if (overflow) fail(`${label} horizontal overflow`, `${page.viewportSize()?.width}px`);
  else pass(`${label} no horizontal overflow`, `${page.viewportSize()?.width}px`);
}

async function checkInteriorTextInset(page, route, selector, minInset = 12) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  const inset = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? Math.round(el.getBoundingClientRect().left) : null;
  }, selector);
  if (inset == null) fail(`${route} interior inset`, `missing ${selector}`);
  else if (inset < minInset) fail(`${route} interior inset`, `${inset}px < ${minInset}px (${selector})`);
  else pass(`${route} interior inset`, `${inset}px (${selector})`);
}

async function runDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Failed to load resource.*404/.test(text)) return;
    consoleErrors.push(text);
  });

  await page.goto(`${baseUrl}/book/`, { waitUntil: "domcontentloaded" });
  const meta = await page.textContent(".lpConsultMeta");
  if (meta?.includes("30-minute initial consultation · Free · Zoom")) {
    pass("/book/ consultation meta", meta);
  } else {
    fail("/book/ consultation meta", meta || "missing");
  }

  const loading = page.locator(".lpCalendlyLoading");
  await loading.waitFor({ state: "attached", timeout: 5000 }).catch(() => {});
  const calendlyFrame = page.locator(".calendly-inline-widget iframe, .calendly-inline-widget [data-testid]");
  try {
    await Promise.race([
      calendlyFrame.first().waitFor({ state: "attached", timeout: 20000 }),
      page.locator(".lpCalendlyPanel.isError").waitFor({ state: "attached", timeout: 20000 })
    ]);
    const hasError = await page.locator(".lpCalendlyPanel.isError").count();
    if (hasError) fail("/book/ Calendly widget load", "error fallback visible");
    else pass("/book/ Calendly widget load", "widget attached without manual click");
  } catch {
    fail("/book/ Calendly widget load", "timed out waiting for widget");
  }

  const panelHeight = await page.locator(".lpCalendlyPanel").evaluate((el) => el.getBoundingClientRect().height);
  if (panelHeight >= 600) pass("/book/ Calendly reserved height", `${Math.round(panelHeight)}px`);
  else fail("/book/ Calendly reserved height", `${Math.round(panelHeight)}px`);

  await page.goto(`${baseUrl}/start/#enquiry`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const enquiryOpen = await page.locator("#enquiry.isOpen").count();
  if (enquiryOpen) pass("/start/#enquiry opens panel");
  else fail("/start/#enquiry opens panel");

  const focused = await page.evaluate(() => {
    const active = document.activeElement;
    return active ? `${active.tagName.toLowerCase()}#${active.id || active.name || ""}` : "none";
  });
  if (focused.includes("input") || focused.includes("textarea") || focused.includes("select")) {
    pass("/start/#enquiry focus", focused);
  } else {
    fail("/start/#enquiry focus", focused);
  }

  await page.goto(`${baseUrl}/start/`, { waitUntil: "domcontentloaded" });
  await page.click('[data-open-enquiry]');
  await page.waitForTimeout(300);
  if (await page.locator("#enquiry.isOpen").count()) pass("/start/ enquiry button opens panel");
  else fail("/start/ enquiry button opens panel");

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  const resourcesBtn = page.locator('[data-resources-nav] .lpMoreBtn');
  await resourcesBtn.click();
  await page.waitForTimeout(100);
  const menuVisible = await page.locator("#lpResourcesMenu").evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== "none";
  });
  if (menuVisible) pass("Resources dropdown opens on click");
  else fail("Resources dropdown opens on click");

  await resourcesBtn.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  const menuFocused = await page.evaluate(() => document.activeElement?.closest("#lpResourcesMenu") != null);
  if (menuFocused) pass("Resources keyboard navigation");
  else fail("Resources keyboard navigation");

  await page.keyboard.press("Escape");
  const closed = await page.locator('[data-resources-nav].isOpen').count() === 0;
  if (closed) pass("Resources Escape closes menu");
  else fail("Resources Escape closes menu");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  const menuBtn = page.locator(".lpMenuBtn");
  await menuBtn.click();
  const bodyLocked = await page.evaluate(() => document.body.classList.contains("lpMenuOpen"));
  if (bodyLocked) pass("Mobile menu locks background scroll");
  else fail("Mobile menu locks background scroll");

  const firstLink = page.locator(".lpMobileNav a").first();
  const box = await firstLink.boundingBox();
  if (box && box.height >= 44) pass("Mobile nav touch target", `${Math.round(box.height)}px`);
  else fail("Mobile nav touch target", box ? `${Math.round(box.height)}px` : "no box");

  await page.goto(`${baseUrl}/therapy/`, { waitUntil: "domcontentloaded" });
  const finalCtas = await page.locator('.lpEndCta:has-text("Take the next step")').count();
  if (finalCtas === 1) pass("/therapy/ single final CTA");
  else fail("/therapy/ single final CTA", `count=${finalCtas}`);

  const whatsappButtons = await page.locator('a[href*="wa.me"].lpPrimaryCta, a[href*="wa.me"].lpSecondaryCta').count();
  if (whatsappButtons === 0) pass("/therapy/ WhatsApp tertiary only");
  else fail("/therapy/ WhatsApp tertiary only", `button-like links=${whatsappButtons}`);

  if (consoleErrors.length) fail("Console errors on tested pages", consoleErrors.slice(0, 3).join(" | "));
  else pass("No console errors on tested pages");

  await context.close();
}

async function runResponsive(browser) {
  for (const width of widths) {
    const context = await browser.newContext({
      ...devices["iPhone 13"],
      viewport: { width, height: 800 }
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await checkOverflow(page, `homepage ${width}px`);
    await page.goto(`${baseUrl}/book/`, { waitUntil: "domcontentloaded" });
    await checkOverflow(page, `/book/ ${width}px`);
    await context.close();
  }
}

async function runLegacyMigrationChecks(browser) {
  const routes = [
    { route: "/therapy/", selector: ".lpLocationSection h2" },
    { route: "/about/", selector: ".aboutHeroTitle" },
    { route: "/approach/", selector: ".approachEssayInner h2" }
  ];

  const mobile = await browser.newContext({ viewport: { width: 320, height: 800 } });
  const mobilePage = await mobile.newPage();
  for (const { route, selector } of routes) {
    await checkInteriorTextInset(mobilePage, route, selector);
  }
  await mobile.close();

  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await desktop.newPage();

  for (const route of ["/therapy/", "/about/", "/approach/"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    const html = await page.content();

    if (html.includes("More ▾")) fail(`${route} legacy More navigation`);
    else pass(`${route} no legacy More navigation`);

    if (/<p class="sectionKicker">Begin<\/p>/.test(html)) fail(`${route} legacy Begin label`);
    else pass(`${route} no Begin label`);

    if (html.includes("Every path is different.But")) fail(`${route} missing hero punctuation space`);
    else pass(`${route} hero punctuation ok`);

    if (html.includes("Send a brief secure enquiry")) fail(`${route} enquiry-first process copy`);
    else pass(`${route} no enquiry-first sidebar steps`);

    if (/<ol class="lpSteps"/.test(html)) fail(`${route} ordered list combined with manual step numbers`);
    else pass(`${route} no ol.lpSteps markup`);

    const endCtas = await page.locator(".lpEndCta").count();
    if (endCtas === 1) pass(`${route} single closing CTA`, `${endCtas}`);
    else fail(`${route} single closing CTA`, `count=${endCtas}`);

    const stepNums = await page.locator("#therapy-process .lpStepNum, .lpSteps .lpStepNum").count();
    if (route === "/therapy/" && stepNums === 3) pass("/therapy/ three process steps", `${stepNums}`);
    else if (route === "/therapy/") fail("/therapy/ three process steps", `count=${stepNums}`);

    if (route === "/therapy/") {
      const note = await page.textContent(".lpTherapyEnquiryNote");
      if (note?.includes("first .")) fail("/therapy/ enquiry note spacing", note);
      else pass("/therapy/ enquiry note spacing");
    }
  }

  await desktop.close();
}

async function main() {
  console.log(`Browser QA base URL: ${baseUrl}`);
  const browser = await chromium.launch({ headless: true });
  try {
    await runDesktop(browser);
    await runResponsive(browser);
    await runLegacyMigrationChecks(browser);
  } finally {
    await browser.close();
  }

  console.log(`\nSummary: ${results.length} passed, ${errors.length} failed`);
  if (errors.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
