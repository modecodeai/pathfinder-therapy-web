#!/usr/bin/env node
/**
 * PF-WEB-CLIENT-LOGIN-001A — no duplicate visible Client Login in the CIC header.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const LOGIN = "https://my.pathfindertherapy.org.uk/my/login";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "cic-site");
const WIDTHS = [375, 390, 768, 1024, 1440];
const DESKTOP_MIN = 1101;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\//, "");
      const file = path.normalize(path.join(ROOT, relative));
      if (!file.startsWith(ROOT)) {
        res.writeHead(403);
        res.end();
        return;
      }
      try {
        const body = await readFile(file);
        res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

async function visibleHeaderLogins(page) {
  return page.evaluate((login) => {
    const header = document.querySelector(".site-header");
    if (!header) return [];
    return [...header.querySelectorAll(`a[href="${login}"]`)]
      .filter((el) => {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((el) => ({
        className: el.className,
        text: (el.textContent || "").replace(/\s+/g, " ").trim()
      }));
  }, LOGIN);
}

async function dismissChrome(page) {
  await page.evaluate(() => {
    const banner = document.getElementById("cookieConsent");
    if (banner) banner.hidden = true;
    const toggle = document.getElementById("accessibilityToggle");
    if (toggle) toggle.style.display = "none";
    const panel = document.getElementById("accessibilityPanel");
    if (panel) panel.hidden = true;
  });
}

const { server, origin } = await startServer();
const browser = await chromium.launch();
const issues = [];

try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: width < 768,
      hasTouch: width < 1024
    });
    const page = await context.newPage();
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await dismissChrome(page);
    await page.locator(".site-header").waitFor();

    const closed = await visibleHeaderLogins(page);
    if (closed.length !== 1) {
      issues.push(`${width}px closed menu: expected 1 header Client Login, found ${closed.length} ${JSON.stringify(closed)}`);
    } else if (closed[0].text.toLowerCase() !== "client login") {
      issues.push(`${width}px closed menu: unexpected label ${JSON.stringify(closed[0])}`);
    } else if (width >= DESKTOP_MIN && !closed[0].className.includes("nav-client-login")) {
      issues.push(`${width}px desktop must use .nav-client-login, found ${closed[0].className}`);
    } else if (width < DESKTOP_MIN && !closed[0].className.includes("header-client-login")) {
      issues.push(`${width}px mobile must use .header-client-login, found ${closed[0].className}`);
    }

    if (width < DESKTOP_MIN) {
      await page.locator(".mobile-nav-toggle").click();
      await page.waitForTimeout(200);
      const open = await visibleHeaderLogins(page);
      if (open.length !== 1) {
        issues.push(`${width}px open menu: expected 1 header Client Login, found ${open.length} ${JSON.stringify(open)}`);
      }
    }

    const hrefs = await page.evaluate((login) => {
      return [...document.querySelectorAll(`a[href="${login}"]`)].map((el) => el.getAttribute("href"));
    }, LOGIN);
    if (hrefs.some((href) => href !== LOGIN)) {
      issues.push(`${width}px unexpected login href ${JSON.stringify(hrefs)}`);
    }

    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (issues.length) {
  console.error("CIC Client Login breakpoint verification failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`CIC Client Login breakpoint verification passed (${WIDTHS.join(", ")}px)`);
