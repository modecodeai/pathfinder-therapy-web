# Pathfinder Arrival V1

Locked homepage build for Pathfinder Therapy. Static Next.js export for Cloudflare Pages.

Cloudflare settings:
- Framework preset: Next.js
- Root directory: blank
- Build command: pnpm install --no-frozen-lockfile && pnpm run build
- Build output directory: out
- Node version: 20+

Custom domains (both required on the same Pages project):
- `pathfindertherapy.org.uk` (primary)
- `www.pathfindertherapy.org.uk` (redirects to apex via `functions/_middleware.js`)

If `www` still does not redirect after deploy, add a Cloudflare Bulk Redirect:
- Source: `www.pathfindertherapy.org.uk`
- Target: `https://pathfindertherapy.org.uk`
- Status: `301`
- Enable: Preserve query string, Subpath matching, Preserve path suffix
