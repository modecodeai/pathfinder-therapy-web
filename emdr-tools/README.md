# Pathfinder EMDR Tools (Beta)

Browser-based bilateral stimulation for trained EMDR practitioners.  
Production target: **https://emdr.pathfindertherapy.com**

In-person and therapist-controlled remote sessions. No accounts. No clinical records.

## Stack

React · TypeScript · Vite · Cloudflare Workers · Durable Objects · WebSockets (Hibernation) · Web Audio · rAF · Vitest

## Local

```bash
cd emdr-tools
npm install
npm run dev
```

Other scripts:

```bash
npm run test
npm run typecheck
npm run build
npm run preview
npm run deploy
```

## Deploy

```bash
cd emdr-tools
npm run deploy
```

`wrangler.toml` maps custom domain `emdr.pathfindertherapy.com`.  
You still need Cloudflare DNS/zone permission so the custom domain can attach to this Worker. Do **not** change `pathfindertherapy.com` / `www` site routing beyond that Worker domain record.

## Routes

| Path | Role |
|------|------|
| `/` | Landing (+ manual room code join) |
| `/tools` | Therapist console |
| `/join/:roomId` | Client remote stage |
| `/about` | Privacy / positioning |

## Privacy

Stores only temporary operational room state for remote BLS. No names, notes, SUD/VOC, diagnoses, or targets.
