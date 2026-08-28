#!/usr/bin/env node
/**
 * Insert Client Login into CIC headers and footers.
 * Destination is the existing My Pathfinder login only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOGIN = "https://my.pathfindertherapy.org.uk/my/login";
const HEADER_LINK = `<a class="nav-link nav-client-login" href="${LOGIN}">Client Login</a>`;
const FOOTER_LINK = `<a href="${LOGIN}">Client Login</a>`;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "cic-site");

function collectHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function patch(html, basename) {
  let next = html;
  if (!/class="nav-link nav-client-login"/.test(next)) {
    const header = next.replace(
      /(<a href="(?:\.\.\/)?contact\.html" class="nav-link(?: active)?">Contact<\/a>)/,
      `$1\n      ${HEADER_LINK}`,
    );
    if (header === next) {
      throw new Error(`${basename}: Header Contact link not found`);
    }
    next = header;
  }

  if (!next.includes(`aria-label="Legal and support links"`) || !next.includes(FOOTER_LINK)) {
    const footer = next.replace(
      /(<nav aria-label="Legal and support links">)([\s\S]*?)(<a href="(?:\.\.\/)?contact\.html">Contact<\/a>)/,
      (match, nav, mid, contact) => {
        if (mid.includes(LOGIN)) return match;
        return `${nav}${mid}${FOOTER_LINK}\n      ${contact}`;
      },
    );
    if (footer === next && !next.includes(FOOTER_LINK)) {
      throw new Error(`${basename}: Footer legal nav Contact link not found`);
    }
    next = footer;
  }

  if (basename === "get-support.html" && !next.includes("Already a Client?")) {
    const withNote = next.replace(
      /(<div class="hero-actions">[\s\S]*?<\/div>)/,
      `$1\n      <p class="client-login-note">Already a Client? <a href="${LOGIN}">Log in to My Pathfinder</a></p>`,
    );
    if (withNote === next) {
      throw new Error("get-support.html hero actions not found for contextual login copy");
    }
    next = withNote;
  }

  return next;
}

let changed = 0;
for (const file of collectHtml(ROOT)) {
  const original = fs.readFileSync(file, "utf8");
  const next = patch(original, path.basename(file));
  if (next !== original) {
    fs.writeFileSync(file, next);
    changed += 1;
    console.log(`updated ${path.relative(ROOT, file)}`);
  }
}
console.log(`Client Login inserted in ${changed} CIC HTML files`);
