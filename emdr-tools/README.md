# Pathfinder EMDR Tools (Clinical v2)

Clinical EMDR tools for trained therapists.  
Production: **https://emdr.pathfindertherapy.com**

## What’s included

- **BLS Studio** (`/tools`) — visual/auditory BLS, trajectories including Infinity ∞, remote rooms
- **EMDR Session Companion** (`/session`) — phase-aware workspace (1–8 + Future Template)
- **Free therapist accounts** (`/account`) — DO-backed auth, `therapist-free` tier
- Pass counting: **one full back-and-forth = 1 pass**
- Phase presets as *suggested starting points* (therapist override always available)
- Infinity / de-arousal mode (slow, ~10–20s, midline direction)
- Processing check-in + passive no-change reminder (non-directive)
- SUD 0–10 / VOC 1–7 tools (anonymous session references supported)

## Local

```bash
cd emdr-tools
npm install
npm run dev
npm run test
npm run typecheck
npm run build
npm run deploy
```

## Architecture notes

- React + Vite + Cloudflare Workers
- Durable Objects: `EmdrRoom` (remote BLS), `AccountDirectory` (accounts/sessions)
- Animation via `requestAnimationFrame` (not React per-frame state)
- No proprietary training scripts copied into the UI

## Privacy

BLS Studio works without identifiable client data. Saved sessions use therapist-chosen reference labels. Core BLS is not paywalled.
