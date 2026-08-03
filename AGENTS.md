# AGENTS.md — Pathfinder Therapy CIC SEO / Google Search Console

## Scope

This agent works on **Site A: Pathfinder Therapy CIC** at:

**https://pathfindertherapy.org.uk**

### Production deployment

| Setting | Value |
|---------|-------|
| Cloudflare Pages project | `pathfinder-therapy-cic-v10` |
| Branch | `main` |
| Preview URL | https://d151320e.pathfinder-therapy-cic-v10.pages.dev |
| Build header | `x-pathfinder-build: pathfinder-v53-seo-navigation` |
| Source in workspace | `cic-site/` (mirrored from production preview) |

Deploy by copying `cic-site/` contents to the CIC Pages project root (or merge into the private `pathfinder-therapy-cic-v10` repo when connected).

This is a **static HTML site** (flat `.html` URLs) for a veteran-founded Community Interest Company. It is **not** the same as:

| Repo | Site | Domain |
|------|------|--------|
| `modecodeai/pathfinder-therapy-web` | Next.js “Arrival” / Lisbon clinic (Site B) | `pathfindertherapy.com` / preview |
| `modecodeai/pathfinder-therapy-private` | Next.js private practice | `pathfindertherapy.com` |
| **CIC static HTML (this agent)** | CIC / veterans / community | `pathfindertherapy.org.uk` |

**Before editing:** confirm you are in the **CIC static HTML source**, not a Next.js repo. Expected files include `about.html`, `veterans.html`, `llms.txt`, `ai-summary.json`, `sitemap.xml`, `robots.txt`.

The CIC static site source is in **`cic-site/`**. Edit files there, not the Next.js app at repo root.

---

## Primary objective

Fix crawl/indexing problems reported in Google Search Console:

1. Remove unwanted indexed URLs and duplicate signals
2. Rebuild `sitemap.xml` and `robots.txt` for consistency
3. Ensure every important public page is indexable with correct canonicals
4. Fix `/cdn-cgi/l/email-protection` 404 noise
5. Improve thin pages flagged as “Crawled – currently not indexed”

---

## Google Search Console issues (baseline)

### Duplicate / alternate page with proper canonical (not indexed)

Likely cause: incorrect canonical tags (e.g. all pages canonicalising to `/`) or `http` vs `https` / `www` vs apex duplicates.

Affected URLs:

- `/partner-organisations.html`
- `/support-us.html`
- `/privacy.html`
- `/pathfinder-project.html`
- `/edi.html`
- `/team.html`
- `/impact.html`
- `/armed-forces-covenant.html`
- `/impact-reports.html`
- `/terms.html`
- `/about.html`
- `/our-journey.html`
- `/contact.html`
- `http://pathfindertherapy.org.uk/`
- `/veterans.html`

### Not found (404)

- `/cdn-cgi/l/email-protection` — Cloudflare email obfuscation artefact; remove from internal links and disallow in `robots.txt`

### Crawled – currently not indexed

Review and strengthen content + internal links:

- `/services.html`
- `/crisis-safeguarding.html`
- `/resources.html`
- `/get-support.html`

### Discovered – currently not indexed

- `/ai-summary.json`
- `/llms.txt` — keep accessible for AI crawlers; exclude from sitemap unless intentional

---

## Preferred canonical domain

| URL | Behaviour |
|-----|-----------|
| `https://pathfindertherapy.org.uk` | **Primary** — serve content |
| `https://www.pathfindertherapy.org.uk` | 301 → apex |
| `http://pathfindertherapy.org.uk` | 301 → `https://pathfindertherapy.org.uk/` |
| `http://www.pathfindertherapy.org.uk` | 301 → `https://pathfindertherapy.org.uk/` |

Do **not** redirect `.org.uk` to `pathfindertherapy.com` — they are separate organisations.

---

## Task checklist

### 1. Full SEO crawl audit

- [ ] Crawl every internal link on every HTML page
- [ ] Fix broken links, redirect chains, `http://` links
- [ ] Replace `http://pathfindertherapy.org.uk` with `https://pathfindertherapy.org.uk`
- [ ] Ensure internal links use preferred HTTPS canonical URLs exactly
- [ ] List orphaned pages and pages missing from navigation

### 2. Fix `/cdn-cgi/l/email-protection`

- [ ] Search codebase for `cdn-cgi/l/email-protection` and `__cf_email__`
- [ ] Replace obfuscated email anchors with `mailto:hello@pathfindertherapy.org.uk` or plain text
- [ ] Add to `robots.txt`: `Disallow: /cdn-cgi/`
- [ ] Confirm sitemap and internal links never reference `/cdn-cgi/`

### 3. Canonical URL audit

Every HTML page must have:

```html
<link rel="canonical" href="https://pathfindertherapy.org.uk/page-name.html" />
```

- [ ] Self-referencing canonical on every page
- [ ] HTTPS only
- [ ] Exact match to live URL (including `.html` suffix)
- [ ] No page canonicalised to homepage unless it is a true duplicate

### 4. Sitemap rebuild

Publish at: `https://pathfindertherapy.org.uk/sitemap.xml`

**Include:**

- `/` (or `/index.html` — pick one canonical; redirect the other)
- `/about.html`
- `/team.html`
- `/services.html`
- `/get-support.html`
- `/veterans.html`
- `/pathfinder-project.html`
- `/partner-organisations.html`
- `/armed-forces-covenant.html`
- `/impact.html`
- `/impact-reports.html`
- `/resources.html`
- `/crisis-safeguarding.html`
- `/support-us.html`
- `/contact.html`
- `/privacy.html`
- `/terms.html`
- `/edi.html`
- `/our-journey.html`

**Exclude:**

- `/cdn-cgi/`
- `/ai-summary.json` (unless deliberately for crawlers)
- `/llms.txt` (unless deliberately for crawlers)
- Assets, build files, test pages, redirects

Use accurate `lastmod` dates (ISO 8601).

### 5. robots.txt

Target content:

```txt
User-agent: *
Allow: /

Disallow: /cdn-cgi/

Sitemap: https://pathfindertherapy.org.uk/sitemap.xml
```

Keep existing AI crawler allowances if present (`GPTBot`, `Google-Extended`, etc.). Do not block CSS, JS, images, or public HTML.

### 6. Meta robots audit

- [ ] No accidental `noindex` on public pages
- [ ] Policy pages (privacy, terms, EDI, safeguarding) remain indexable unless intentionally excluded

### 7. Thin / low-value pages

For `/services.html`, `/crisis-safeguarding.html`, `/resources.html`, `/get-support.html`:

- [ ] Unique `<title>` and `<h1>`
- [ ] Unique meta description (150–160 chars, accurate)
- [ ] Sufficient original body copy (not duplicated from other pages)
- [ ] Internal links from homepage and relevant sections
- [ ] Schema markup where appropriate

### 8. Homepage redirect audit

- [ ] Single 301: `http://` → `https://pathfindertherapy.org.uk/`
- [ ] Single 301: `www` → apex
- [ ] No redirect loops
- [ ] No mixed canonical signals

### 9. Structured data (JSON-LD)

Add or verify on relevant pages:

- `Organization` / `NGO` (CIC — do not claim `MedicalBusiness` unless clinically accurate)
- `WebSite` with `url`: `https://pathfindertherapy.org.uk`
- `BreadcrumbList` on inner pages
- `ContactPoint` on contact page

Do not add misleading medical claims.

### 10. AI crawler files

- [ ] `/llms.txt` — keep accessible; exclude from sitemap
- [ ] `/ai-summary.json` — keep accessible; exclude from sitemap; no `noindex` if intended for AI discovery

### 11. Accessibility / semantic HTML

- [ ] Valid heading hierarchy (one `h1` per page)
- [ ] Images have meaningful `alt` text
- [ ] Consistent footer navigation (no hidden duplicate nav)

### 12. Validation after changes

- [ ] Local build / static serve passes
- [ ] All public routes return 200
- [ ] Removed URLs return 404 and are not internally linked
- [ ] Validate `robots.txt` and `sitemap.xml` (XML well-formed)
- [ ] Spot-check canonical tags on all pages
- [ ] Confirm no accidental `noindex`
- [ ] Run link checker across site

### 13. Post-deploy report

Deliver:

- Summary of issues found and fixed
- Files changed
- Pages added/removed from sitemap
- Redirect/canonical changes
- Pages needing manual Search Console validation

**Google Search Console actions for Brent:**

1. Resubmit `https://pathfindertherapy.org.uk/sitemap.xml`
2. URL Inspection on: `/`, `/services.html`, `/get-support.html`, `/veterans.html`, `/contact.html`
3. Request indexing for priority pages after deploy
4. Click **Validate fix** for: Duplicate canonical, 404 (`/cdn-cgi/`), Crawled not indexed

---

## Cloudflare prerequisites

The live site currently returns **403 challenges** on HTML pages (Bot Fight Mode). This blocks crawlers and manual audit.

**Before SEO validation:**

1. Cloudflare → `pathfindertherapy.org.uk` zone → Security
2. Temporarily lower Bot Fight Mode / Security Level
3. Ensure Googlebot is not challenged (or add WAF skip for verified bots)
4. Re-test with `curl -sI https://pathfindertherapy.org.uk/about.html`

**www → apex redirect** (zone level, required — Pages `_redirects` cannot do domain redirects):

- Bulk Redirect: `www.pathfindertherapy.org.uk` → `https://pathfindertherapy.org.uk` (301, subpath matching, preserve query string)
- Or Redirect Rule: `(http.host eq "www.pathfindertherapy.org.uk")` → dynamic `concat("https://pathfindertherapy.org.uk", http.request.uri.path)`

---

## Constraints

- Do **not** delete important public content
- Do **not** block legitimate public pages from Google
- Do **not** make speculative SEO changes that could harm trust or compliance
- Content must remain clinically appropriate, accurate, and professional for a therapy/CIC/veteran-support organisation
- Email: `hello@pathfindertherapy.org.uk`
- Company: Pathfinder Therapy CIC, 17248842

---

## Reference templates

Starter files in `seo-templates/` mirror the fixed files in `cic-site/`:

- `seo-templates/robots.txt` — includes `Disallow: /cdn-cgi/`
- `seo-templates/sitemap.xml` — all 24 public HTML pages; excludes `llms.txt` and `ai-summary.json`
- `cic-site/functions/_middleware.js` — www → apex 301 redirect

Update `lastmod` dates before deploy.

---

## Commands (when source is located)

```bash
# Serve static site locally
npx serve .

# Validate sitemap (if xmllint available)
xmllint --noout sitemap.xml

# Check canonicals across HTML files
rg -n 'rel="canonical"' *.html

# Find email obfuscation
rg -n 'cdn-cgi/l/email-protection|__cf_email__' .

# Find http links
rg -n 'http://pathfindertherapy.org.uk' .
```

---

## Cursor Cloud specific instructions

This repository actually contains **two** products; be sure you are editing the right one (see the Scope table above):

1. **Next.js app (repo root)** — the "Arrival" / `pathfindertherapy.com` site. Node/pnpm project (`package.json`, `next.config.ts`). This is the app you develop with `pnpm dev`.
2. **CIC static HTML site (`cic-site/`)** — flat `.html` files served as-is on Cloudflare Pages. No build step; edit the HTML directly. This is the main SEO target described above.

### Setup / dependencies

- Tooling in the VM: Node 22, pnpm 10 (already installed). The startup update script runs `pnpm install --frozen-lockfile`, so dependencies are ready when a session begins.
- `pnpm install` reports `Ignored build scripts: sharp, unrs-resolver`. This is expected and harmless — lint, typecheck, build, and `pnpm dev` all work without those native builds (Next image optimization is disabled via `images.unoptimized`).

### Next.js app (repo root)

Standard commands are in `package.json` `scripts` and `README.md`. Non-obvious notes:

- `pnpm dev` serves the app at `http://localhost:3000` (Turbopack).
- `pnpm run build` runs the custom `scripts/build-production-site.mjs` (NOT `next build`). It mirrors content from a remote preview origin and writes to `out/`. Offline it prints `Skipping missing asset https://...pages.dev/...` warnings for a handful of remote-only assets — these are expected and the build still succeeds. `pnpm run verify:built` validates the `out/` output.
- `pnpm run build:next` is the raw `next build --webpack` if you need it.
- `pnpm run lint` currently reports **7 warnings, 0 errors** (unused vars in build scripts) — this is the clean baseline, not a regression.
- The contact form posts to `/api/contact`, a Cloudflare Pages Function (`functions/api/contact.js`). That function does **not** run under `next dev`, so submitting the form locally will fail — this is expected. Client-side page navigation and form input still work in dev.

### CIC static site (`cic-site/`)

- Serve locally with `npx serve cic-site` (e.g. `-l 4000`). Note `serve` applies clean-URL redirects by default: `/about.html` 301→ `/about`. Production (Cloudflare Pages) serves the flat `.html` URLs directly, so to mirror production URLs use `npx serve cic-site --no-clean-urls`.
- `cic-site/functions/_middleware.js` handles the www→apex 301 (only runs on Cloudflare Pages, not in `serve`).
