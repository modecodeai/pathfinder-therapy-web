# .com search and usability review — 20 September 2026

Scope: www.pathfindertherapy.com, based on the deployed website branch plus the corrected homepage portrait. No CIC .org.uk, Alpha clinical application, booking-provider, advertising, security or clinical-content changes.

## Findings and changes

- Knowledge Library topic links previously reloaded the same unfiltered page. They now navigate to six actual topic sections containing all ten existing articles, with article counts and a semantic heading hierarchy.
- Article structured data previously repeated the description as the answer to every question, although no matching answer pairs were visible. Removed that unsupported FAQ markup; retained Article and BreadcrumbList data, aligned URLs to canonical trailing slashes, and displayed the already attributed author with a profile link.
- AI reference files omitted the published UK EMDR service and conflated ITAA membership with registration. Added service URLs and the existing GBP80/60-minute online-only UK offering, kept separate from Lisbon individual pricing, and corrected membership terminology.
- Added a UK EMDR footer link and preserved contextual UK links on EMDR/online service pages.
- Organisation sameAs listed directory homepages rather than practice profiles. Removed those incorrect identity assertions while preserving recognition copy and real profile links.
- Clinic structured coordinates differed from the existing directions link. Aligned coordinates to that map destination and updated the Person image to the corrected portrait.
- Builds previously read an old preview sitemap and introduced build-day lastmod dates. Preserve the current published sitemap, avoid inventing dates for additions, and explicitly date the homepage, fee comparison and article/navigation changes. Stop resetting service dates to 13 September.
- Mobile-menu focus could scroll the header away. Prevent that focus scroll and constrain the menu to a scrollable viewport. Use disclosure semantics for the Resources navigation rather than an incomplete ARIA menu.
- Added an accessible compact fee comparison showing the existing published fees, free initial conversation and UK/Portugal distinction. Kept the detailed information below it.

## Validation

- Production static build succeeded: 38 HTML pages.
- 38-page verification passes: canonicals, headings, IDs, metadata, JSON-LD parsing, local links and anchors. Extended verification checks sitemap parity with all indexable pages, canonical Article URLs and absence of unsupported article FAQ answers.
- Existing built-HTML checks passed for 13 key routes and site-wide calls to action.
- All 34 public sitemap URLs returned HTTP 200 with self-referencing canonicals and no accidental noindex in a standard HTTP crawl. The initial Python HTTP client received 403 responses; the normal curl client and browser succeeded. This does not establish access for every crawler.
- Browser checks covered the homepage portrait, mobile topic jump, menu visibility, desktop layout and fee comparison. No real enquiries or bookings submitted.
- ESLint on the changed JavaScript files: zero errors; five existing unused-definition warnings in the production builder.

## Limits and references

This review does not establish Google indexing/rankings, Search Console status, AI citations, Googlebot access, field Core Web Vitals or a formal accessibility conformance result. Those require their corresponding reports or further measurement. Existing search/AI crawler permissions and security settings are unchanged.

Google's current guidance supports ordinary search fundamentals and accurate visible content; no AI visibility or ranking outcome is promised. The existing llms.txt/JSON files are supplementary references, not a Google ranking mechanism.

- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/updates (FAQ rich results removed; llms.txt clarification)
