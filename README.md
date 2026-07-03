# Pathfinder Therapy Web

Production site for **pathfindertherapy.com** (private practice) and supporting tooling.

## Production deployment (.com)

The production build mirrors the approved preview deployment and adds the paid-ads lead funnel:

- **Preview source:** `https://9aa49f15.pathfinder-therapy-web.pages.dev/`
- **Build command:** `pnpm run build` (runs `scripts/build-production-site.mjs`)
- **Output:** `out/` + `functions/api/contact.js`

This ships the full preview site (therapy, knowledge library, contact form, schema, GTM) plus:

- `/start/` — ad landing page (noindex)
- `/thank-you/` — conversion confirmation (noindex)
- UTM/gclid attribution + Google Ads conversion tracking

### Deploy via GitHub Actions

Add repository secrets:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

Then run **Actions → Deploy production site → Run workflow**, or push to `main`.

### Deploy locally

```bash
pnpm install
pnpm run build
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
  npx wrangler pages deploy out --project-name=pathfinder-therapy-web --branch=production
```

### Promote existing preview (without funnel)

```bash
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
  ./scripts/promote-preview-deployment.sh 9aa49f15
```

After deploy, purge Cloudflare cache for `pathfindertherapy.com` and `www.pathfindertherapy.com`.

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
