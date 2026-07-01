# AGENTS.md

## Cursor Cloud specific instructions

Pathfinder Therapy web ("pathfinder-arrival-v1"): Next.js 16 (App Router) + TypeScript.

Standard commands (see `package.json`):

- Dev server: `pnpm dev` (port 3000 by default).
- Typecheck: `pnpm run typecheck` (`tsc --noEmit`). There is no lint script; use typecheck.
- Build: `pnpm build` (uses `next build --webpack`).

Non-obvious caveats:

- On first `next dev` run, Next.js rewrites `tsconfig.json` (adds `.next/dev/types/**/*.ts` to `include` and the `next` plugin). This is expected local churn; do not commit it.
