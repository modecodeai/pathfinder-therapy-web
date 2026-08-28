#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOGIN = "https://my.pathfindertherapy.org.uk/my/login";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "cic-site");

function collectHtml(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, files);
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

const issues = [];
const files = collectHtml(ROOT);
if (files.length < 20) issues.push(`expected CIC HTML pages, found ${files.length}`);

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const html = fs.readFileSync(file, "utf8");
  const hrefs = [...html.matchAll(/href="([^"]*my\.pathfindertherapy[^"]*)"/g)].map((m) => m[1]);
  if (hrefs.length < 2) issues.push(`${rel}: expected header and footer Client Login links`);
  for (const href of hrefs) {
    if (href !== LOGIN) issues.push(`${rel}: unexpected login href "${href}"`);
  }
  if (!html.includes('class="nav-link nav-client-login"')) {
    issues.push(`${rel}: missing header Client Login class`);
  }
  if (html.includes('class="header-cta"') && /class="header-cta"[^>]*>Client Login/.test(html)) {
    issues.push(`${rel}: Client Login must not use the Get Support CTA style`);
  }
  if (/calendly/i.test(html.match(/nav-client-login[\s\S]{0,200}/)?.[0] ?? "")) {
    issues.push(`${rel}: Client Login must not depend on Calendly`);
  }
  if (/type="password"/.test(html)) {
    issues.push(`${rel}: CIC pages must not collect passwords`);
  }
  if (/alpha\.pathfindertherapy\.com/.test(html) && hrefs.some((href) => href.includes("alpha."))) {
    issues.push(`${rel}: Client Login must not route through alpha`);
  }
}

const getSupport = fs.readFileSync(path.join(ROOT, "get-support.html"), "utf8");
if (!getSupport.includes("Already a Client?")) {
  issues.push("get-support.html missing contextual My Pathfinder login copy");
}

if (issues.length) {
  console.error("CIC Client Login verification failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`CIC Client Login verification passed (${files.length} HTML pages)`);
