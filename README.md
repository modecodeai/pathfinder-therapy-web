# Pathfinder Arrival V1

Locked homepage build for Pathfinder Therapy. Static Next.js export for Cloudflare Pages.

## Cloudflare Pages settings

- Framework preset: Next.js
- Root directory: blank
- Build command: `pnpm install --no-frozen-lockfile && pnpm run build`
- Build output directory: `out`
- Node version: 20+

## Custom domains and www redirect

Both domains should be attached to the same Cloudflare Pages project:

1. **Apex (primary):** `pathfindertherapy.org.uk`
2. **www (redirect source):** `www.pathfindertherapy.org.uk`

The repo includes `public/_redirects` with:

```
https://www.pathfindertherapy.org.uk/* https://pathfindertherapy.org.uk/:splat 301
```

If the www redirect does not take effect after deploy, add a Cloudflare **Redirect Rule**:

- **When:** Hostname equals `www.pathfindertherapy.org.uk`
- **Then:** Dynamic redirect to `https://pathfindertherapy.org.uk/${uri.path}` with status 301

### DNS checklist

| Record | Type | Target |
|--------|------|--------|
| `pathfindertherapy.org.uk` | CNAME (proxied) | `<your-pages-project>.pages.dev` |
| `www` | CNAME (proxied) | `<your-pages-project>.pages.dev` |

Ensure there are no conflicting A/CNAME records for the same hostnames.

## Local development

```bash
pnpm install
pnpm dev
pnpm run typecheck
pnpm run lint
pnpm run build
```
