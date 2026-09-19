# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Medway Stamps — an ecommerce site for rare/collectible British postage stamps.
See [SPEC.md](./SPEC.md) for the full spec (data model, API surface, and what's
deliberately deferred — live payments). See [README.md](./README.md) for first-time
setup and day-to-day dev commands.

Stack: React + React Router v7 (SSR, framework mode, Vite) · Hono, mounted in the same
Cloudflare Worker · Cloudflare D1 (SQLite via Drizzle ORM) · Cloudflare R2 ·
Cloudflare KV · Stripe Checkout.

## Commands

```sh
npm install
npm run dev                 # full local dev: Worker (API + SSR) + D1/R2/KV, at localhost:5173
npm run typecheck           # regenerates Worker/route types, then tsc -b (one program now)
npm run build                # react-router build — client + server bundles into build/
npm run deploy               # build, then wrangler deploy — what CI runs on merge to main
npm run cf-typegen           # regenerate worker-configuration.d.ts after wrangler.toml binding changes
npm run db:generate         # generate a Drizzle migration after editing db/schema.ts
npm run db:migrate:local    # apply migrations to local D1
npm run db:migrate:remote   # apply migrations to production D1
npm run db:seed:local       # load db/seed.sql into local D1
npm run db:seed:remote      # load db/seed.sql into production D1
```

Requires **Node 22** (see `.nvmrc`) — the Cloudflare/React Router tooling here needs it.
There is no test suite yet.

## Deploy flow

**All changes land via PR; merging into `main` is what deploys.**
`.github/workflows/deploy.yml`: every push/PR runs typecheck + build; a push to `main`
specifically also runs `wrangler d1 migrations apply --remote` and `wrangler deploy`.
There is no manual deploy step in normal use — branch, PR, merge, done. (Manual deploy
commands exist in the README for debugging the pipeline itself.) Seed data is never
applied automatically — `db:seed:remote` has to be run by hand after a migration that
needs new/changed seed rows.

## Architecture

**One Cloudflare Worker (`workers/app.ts`) does everything** — a small Hono dispatcher
that mounts the API app at `/` (see below) and falls through to React Router's SSR
request handler for every other path. There's no separate Pages/Functions split
anymore; API and page rendering both run in the same Worker, same request, no network
hop between them.

**The API is one file**: `functions/api/app.ts` — a Hono app (unchanged in spirit from
before this became a Worker) handling every route: the public `GET /stamps`,
`GET /stamps/:id`, `GET /images/*`, `POST /checkout`, `POST /webhooks/stripe`, plus the
admin routes under `/admin/*` (`POST /admin/login`, `POST /admin/logout`,
`GET /admin/me`, `POST /admin/stamps`, `PUT /admin/stamps/:id`,
`POST /admin/stamps/:id/images`, `DELETE /admin/images/:imageId`). Shared helpers live
in `functions/lib/` (`db.ts`, `stripe.ts`, `serialize.ts`, `types.ts`, plus
`crypto.ts`/`session.ts` for password hashing and session tokens and
`requireAdmin.ts`, the Hono middleware gating every `/admin/*` route) — new routes are
added as more `app.get/post(...)` calls in that one file, same as always.

**Pages are React Router v7 in framework mode** — `app/routes.ts` is the route table
(config-based, not filename convention), `app/root.tsx` is the document shell +
persistent nav/footer chrome + the `CartProvider`/`AdminAuthProvider` wrapping (this
replaced the old `App.tsx` + `main.tsx` + `index.html` trio). **As of this migration,
no route has a `loader` yet** — every page still fetches its own data client-side via
`useEffect` + `app/lib/api.ts`, exactly as before; this was a deliberate first phase
(prove the platform migration works, unchanged behavior) before adding SSR data
loading, a Cloudflare KV regenerate-on-write cache for `Home`/`StampDetail`, and
sitemap/robots/meta — check SPEC.md or recent git history for whether those later
phases have landed since this was written.

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

**`Logo`** (`app/components/Logo.tsx`) is an illustrated SVG placeholder — a
perforated-edge "specimen plate" motif. **`StampPlate`** (`app/components/StampPlate.tsx`)
is the same motif used as the fallback for a stamp with no uploaded photo yet
(`StampCard`/`StampDetail` render a real photo when `stamp.images[0]` exists, and
`StampPlate` otherwise). `StampPlate` varies by era: queen vs. king silhouette, a royal
cypher in the corner (VR/ER/GR/GVIR/EIIR) instead of a country code, and a decorative
frame that's present for the older eras but dropped for Elizabeth II (matching the
real minimal look of Machin-era definitives).

**Styling has no framework** — `app/index.css` defines CSS custom-property design
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
  correct both in local `npm run dev` (plain http) and production (https).
- `npm install`/`npm ci` need `--legacy-peer-deps` (set via `.npmrc`, so this is
  automatic) — `wrangler@4.135`'s optional peer wants
  `@cloudflare/workers-types@^5.x`, but `@react-router/cloudflare@7.18.4`'s required
  peer wants `^4.x`. It's a types-only mismatch (no runtime effect either way), safe
  to ignore; don't "fix" it by bumping `@cloudflare/workers-types` to 5.x, that just
  breaks the other side.
- React Router v7's own ecosystem moves fast — future-flag names and APIs have
  shifted release-to-release (e.g. `react-router.config.ts`'s
  `future.unstable_viteEnvironmentApi` was stabilized to `future.v8_viteEnvironmentApi`
  partway through the 7.x line). If a Cloudflare/React-Router example online doesn't
  match what's installed here, trust `node_modules`/the error message over the
  example — check the installed version's own docs/changelog before assuming a typo.
- Stripe webhook secrets differ between local (`stripe listen`, regenerated each
  session) and production (a permanently registered webhook endpoint) — see the
  README's Deploying section.
- `.dev.vars` holds local-only secrets (gitignored); production secrets are set via
  `wrangler secret put`, separately from the deploy workflow.
