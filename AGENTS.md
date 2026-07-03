# AGENTS.md — Pathfinder Therapy CIC SEO / Google Search Console

## Scope

This agent works on **Site A: Pathfinder Therapy CIC** at:

**https://pathfindertherapy.org.uk**

This is a **static HTML site** (flat `.html` URLs) for a veteran-founded Community Interest Company. It is **not** the same as:

| Repo | Site | Domain |
|------|------|--------|
| `modecodeai/pathfinder-therapy-web` | Next.js “Arrival” / Lisbon clinic (Site B) | `pathfindertherapy.com` / preview |
| `modecodeai/pathfinder-therapy-private` | Next.js private practice | `pathfindertherapy.com` |
| **CIC static HTML (this agent)** | CIC / veterans / community | `pathfindertherapy.org.uk` |

**Before editing:** confirm you are in the **CIC static HTML source**, not a Next.js repo. Expected files include `about.html`, `veterans.html`, `llms.txt`, `ai-summary.json`, `sitemap.xml`, `robots.txt`.

If the CIC source is not in the workspace, locate it first (Cloudflare Pages deploy files, local static export, or private repo) before making changes.

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

Starter files in `seo-templates/` (copy into CIC site root when source is located):

- `seo-templates/robots.txt` — includes `Disallow: /cdn-cgi/`
- `seo-templates/sitemap.xml` — all 18 public HTML pages; excludes `llms.txt` and `ai-summary.json`

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
