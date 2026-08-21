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

## Deploying

```sh
npm run build
npx wrangler pages deploy dist
```

Set the real Stripe keys as Pages secrets rather than relying on `.dev.vars`:
```sh
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
```
Then add a webhook endpoint in the Stripe dashboard pointing at
`https://<your-pages-url>/api/webhooks/stripe`, and use *that* endpoint's signing
secret (not the `stripe listen` one) for `STRIPE_WEBHOOK_SECRET` in production.
