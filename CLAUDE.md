# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Medway Stamps — a prototype ecommerce site for rare/collectible British postage stamps.
See [SPEC.md](./SPEC.md) for the full spec (data model, API surface, and what's
deliberately deferred — live payments, SEO). See [README.md](./README.md) for
first-time setup and day-to-day dev commands.

Stack: React + TypeScript (Vite) · Hono on Cloudflare Pages Functions · Cloudflare D1
(SQLite via Drizzle ORM) · Cloudflare R2 · Stripe Checkout.

## Commands

```sh
npm install
npm run pages:dev          # full local dev: frontend + API + D1, at localhost:8788
npm run typecheck          # frontend (src/)
npm run typecheck:functions # API (functions/) — separate tsconfig, Workers types
npm run build               # typecheck + vite build
npm run db:generate         # generate a Drizzle migration after editing db/schema.ts
npm run db:migrate:local    # apply migrations to local D1
npm run db:migrate:remote   # apply migrations to production D1
npm run db:seed:local       # load db/seed.sql into local D1
npm run db:seed:remote      # load db/seed.sql into production D1
```

There is no test suite yet. `npm run dev` alone only starts the Vite dev server with no
API/D1 behind it — use `pages:dev` for anything that touches `/api/*`.

## Deploy flow

**All changes land via PR; merging into `main` is what deploys.**
`.github/workflows/deploy.yml`: every push/PR runs typecheck + build; a push to `main`
specifically also runs `wrangler d1 migrations apply --remote` and
`wrangler pages deploy`. There is no manual deploy step in normal use — branch, PR,
merge, done. (Manual deploy commands exist in the README for debugging the pipeline
itself.) Seed data is never applied automatically — `db:seed:remote` has to be run
by hand after a migration that needs new/changed seed rows.

## Architecture

**The entire backend is one file**: `functions/api/[[route]].ts` — a single Hono app
handling every route: the public `GET /stamps`, `GET /stamps/:id`, `GET /images/*`,
`POST /checkout`, `POST /webhooks/stripe`, plus the admin routes under `/admin/*`
(`POST /admin/login`, `POST /admin/logout`, `GET /admin/me`, `POST /admin/stamps`,
`PUT /admin/stamps/:id`, `POST /admin/stamps/:id/images`, `DELETE
/admin/images/:imageId`). Shared helpers live in `functions/lib/` (`db.ts`,
`stripe.ts`, `serialize.ts`, `types.ts`, plus `crypto.ts`/`session.ts` for password
hashing and session tokens and `requireAdmin.ts`, the Hono middleware gating every
`/admin/*` route). This is a Cloudflare Pages Functions catch-all, not a traditional
Express-style router — new routes are added as more `app.get/post(...)` calls in that
one file.

**Admin auth** is a custom email+password login with server-side sessions (`admins`/
`sessions` tables in D1) — not Cloudflare Access, not JWTs. A session is a random
token in an httpOnly cookie; only its SHA-256 hash is stored, so a DB read alone can't
be replayed as a session. Only one admin account exists today, seeded via
`npm run db:seed:admin:local`/`:remote` (see README) rather than `db/seed.sql` — the
`admins` table is ordinary, so adding more admins later is just another row, not a
schema change.

**Stamps are unique one-off items** (`quantity` is almost always 1), not restockable
SKUs. Checkout marks a stamp `reserved` when a Stripe Checkout session is created and
`sold` on webhook confirmation (`checkout.session.completed`); an expired/cancelled
session releases it back to `available`. This reservation logic is best-effort, not
fully atomic — see SPEC.md §4 for the known limitation.

**No real stamp photography exists yet.** `StampPlate` (`src/components/StampPlate.tsx`)
and `Logo` (`src/components/Logo.tsx`) are illustrated SVG placeholders — a
perforated-edge "specimen plate" motif shared between individual stamp cards and the
site's logo mark (same corner-anchored perforation geometry in both, so they read as
one visual system). `StampPlate` varies by era: queen vs. king silhouette, a royal
cypher in the corner (VR/ER/GR/GVIR/EIIR) instead of a country code, and a decorative
frame that's present for the older eras but dropped for Elizabeth II (matching the
real minimal look of Machin-era definitives).

**Styling has no framework** — `src/index.css` defines CSS custom-property design
tokens (`--paper`, `--ink`, `--oxblood`, `--font-serif`, etc.) plus a handful of
utility classes (`.btn`, `.tag`, `.stamp-card`, `.eyebrow`, …); components mix those
classes with inline styles for one-off layout. The token values are the source of
truth for the site's visual identity and should match `design/*.dc.html`.

**`design/*.dc.html` + `design/canvas.json`** are the design source of record — Claude
Design canvas mockups (Home/Catalog/Detail screens, logo exploration), kept in the
repo purely as documentation and not part of the build. `design/*-direction.html` is
the generated/seeded preview payload and is gitignored — regenerate via the `design`
skill rather than hand-editing it.

## Known sharp edges

- `sgNumber` in the DB already includes the `"SG "` prefix (e.g. `"SG 2"`) — don't
  prepend `"SG"` again when displaying it.
- Local D1 and production D1 are entirely separate; there's no automatic sync between
  them. `npm run db:pull:remote` does a one-way, on-demand pull of catalog data
  (`stamps`/`stamp_images`/`stamp_tags`) + R2 images from production down to local —
  useful for seeding local dev with the real catalog or as a backup. It never touches
  `admins`/`sessions`, and there's no push in the other direction; admin edits are
  made directly against whichever environment you're logged into.
- Admin session cookies compute their `Secure` attribute from the request's own
  protocol (`https` vs `http`) rather than hardcoding it, so the same login code is
  correct both in local `wrangler pages dev` (plain http) and production (https).
- wrangler is pinned to 3.x (not 4). `wrangler pages dev [dir] -- <command>`
  proxy-command mode conflicts with `pages_build_output_dir` in `wrangler.toml`
  ("Specify either a directory OR a proxy command, not both") — that's why local dev
  runs `vite build --watch` and `wrangler pages dev dist --live-reload` concurrently
  instead of using wrangler's proxy mode.
- Stripe webhook secrets differ between local (`stripe listen`, regenerated each
  session) and production (a permanently registered webhook endpoint) — see the
  README's Deploying section.
- `.dev.vars` holds local-only secrets (gitignored); production secrets are set via
  `wrangler pages secret put`, separately from the deploy workflow.
