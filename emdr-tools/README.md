# Pathfinder EMDR Tools (production Worker package)

Production Worker: `pathfinder-emdr-tools`  
Custom domain: https://emdr.pathfindertherapy.com

This directory holds a **deployable rebuild** of the live Worker + static assets.
Original app source is not in `pathfinder-therapy-web`; assets were taken from the
live deployment and patched for mobile therapist use.

## Mobile therapist fixes (2026-08-14)

Appended to `dist/assets/index-B1j6gGX9.css`:

- Horizontally scrollable phase nav with scroll-snap on narrow screens
- Compact header wrapping (no clipped chrome)
- Portrait: stage stacked above controls
- Landscape (short height): reduced chrome, denser two-column BLS + controls
- Larger touch targets for transport controls
- Active phase auto-scrolled into view (`dist/index.html` helper script)

## Deploy

```bash
cd emdr-tools
npx wrangler deploy --keep-vars
```
