# Pathfinder EMDR Tools

Clinician-controlled bilateral stimulation (BLS) for trained EMDR therapists. In-person and remote sessions in the browser. **No client accounts. No clinical content storage** (no names, notes, SUD/VOC, diagnoses, or targets).

Original Pathfinder branding — not affiliated with third-party EMDR kit products.

## Stack

- React + TypeScript + Vite
- Cloudflare Vite plugin + Workers
- Durable Objects (SQLite) + WebSocket Hibernation for remote rooms
- Web Audio API + `requestAnimationFrame` stimulus engine
- Vitest

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/tools` | Therapist console |
| `/join/:roomId` | Client remote stage |
| `/about` | Privacy & positioning |

## Local development

```bash
cd emdr-tools
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### Other commands

```bash
npm run typecheck   # tsc project references
npm run test        # Vitest
npm run build       # production build (client + worker)
npm run preview     # preview production build in Workers runtime
```

## Deploy (Cloudflare Workers + assets)

Requires Wrangler auth (`npx wrangler login`) and Durable Objects enabled on the account.

```bash
cd emdr-tools
npm run deploy
```

This runs `npm run build` then `wrangler deploy` using `wrangler.toml` (`pathfinder-emdr-tools`).

## Remote sessions

1. In `/tools`, choose **Remote** — creates a room + therapist secret.
2. **Invite client** copies `https://<host>/join/<ROOM_ID>`.
3. Therapist controls sync over WebSocket (settings & run state only — not per-frame coordinates).
4. Rooms expire after 4 hours.

**In-person mode does not depend on the remote backend** and keeps working if room APIs fail.

## Privacy

- Presets: `localStorage` only
- Remote DO storage: control snapshot + secret + expiry
- Security headers set on asset responses (CSP, `X-Frame-Options`, etc.)

## Keyboard (therapist console)

- `Space` — start / pause / resume  
- `Esc` — stop  
- `F` — fullscreen  

## Design notes

Layout/IA references for clinician tools are intentional. Branding, colours, copy, and code are original to Pathfinder.
