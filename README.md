# Medway Stamps

Prototype ecommerce site for rare/collectible British stamps. See [SPEC.md](./SPEC.md)
for the full design (data model, API, scope, and what's deliberately deferred).

Stack: React + TypeScript (Vite) · Hono on Cloudflare Pages Functions · Cloudflare D1
(SQLite via Drizzle ORM) · Cloudflare R2 · Stripe Checkout (test mode).

## First-time setup

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Create the Cloudflare resources** (needs a Cloudflare account; `wrangler` will
   prompt you to log in on first use)
   ```sh
   npx wrangler d1 create medway-stamps-db
   npx wrangler r2 bucket create medway-stamps-images
   ```
   Copy the `database_id` from the `d1 create` output into `wrangler.toml`.

3. **Run migrations and seed data** (local D1, not the remote/production one)
   ```sh
   npm run db:migrate:local
   npm run db:seed:local
   ```

4. **Stripe test-mode keys** — copy `.dev.vars.example` to `.dev.vars` and fill in a
   [test secret key](https://dashboard.stripe.com/test/apikeys). For webhook testing
   locally, run `stripe listen --forward-to localhost:8788/api/webhooks/stripe`
   ([Stripe CLI](https://stripe.com/docs/stripe-cli)) and put the printed signing
   secret in `.dev.vars` too.

5. **Seed the admin account** (local D1) — this is separate from `db:seed:local`
   since it needs a real password, not sample data:
   ```sh
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='pick something' npm run db:seed:admin:local
   ```
   Log in at `/admin/login` once `pages:dev` is running.

## Running locally

```sh
npm run pages:dev
```

This starts the Vite dev server (frontend, hot-reloading) and `wrangler pages dev`
(API routes under `functions/`, backed by local D1/R2) together, proxied on
`http://localhost:8788`.

## Other commands

| Command | Purpose |
|---|---|
| `npm run typecheck` | Type-check the frontend (`src/`) |
| `npm run typecheck:functions` | Type-check the API (`functions/`) |
| `npm run build` | Production build of the frontend into `dist/` |
| `npm run db:generate` | Generate a new Drizzle migration after editing `db/schema.ts` |
| `npm run db:migrate:remote` | Apply migrations to the real (remote) D1 database |
| `npm run db:seed:admin:local` / `:remote` | Create/replace the admin login (`ADMIN_EMAIL=... ADMIN_PASSWORD=...` env vars) |
| `npm run db:pull:remote` | Pull production's stamp catalog + images down into local D1/R2 (one-way; never touches admin accounts) |

## Deploying

Deploys are automatic: **merging a PR into `main` deploys to production** via
`.github/workflows/deploy.yml`. The workflow, on every push/PR, type-checks and
builds; on push to `main` specifically it also applies pending D1 migrations and runs
`wrangler pages deploy`. There's no manual deploy step in normal use — open a PR,
get it merged, and it ships.

One-time setup for the workflow to be able to deploy: create a Cloudflare API token
(dashboard → *My Profile → API Tokens → Create Token → Custom token*) scoped to
this account with **Account / Cloudflare Pages / Edit** and **Account / D1 / Edit**,
then add it as a GitHub Actions secret:
```sh
gh secret set CLOUDFLARE_API_TOKEN
```
(paste the token when prompted — this never needs to touch `.dev.vars` or git).

**Seeding the production admin account is a manual, one-time step** — like
`db:seed:remote`, it's never run automatically by the deploy workflow:
```sh
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='pick something' npm run db:seed:admin:remote
```

To deploy by hand instead (e.g. debugging the pipeline itself):
```sh
npm run build
npx wrangler pages deploy dist --project-name=medway-stamps --branch=main
npx wrangler d1 migrations apply medway-stamps-db --remote
```

Stripe keys are set as Pages secrets, not via the workflow:
```sh
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
```
The webhook endpoint (`https://<your-pages-url>/api/webhooks/stripe`) is registered
directly with Stripe, separately from deploys — see the Stripe dashboard's webhooks
page for the signing secret used above.
