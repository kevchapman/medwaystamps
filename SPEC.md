# Medway Stamps — Prototype Spec

Status: **Prototype / internal demo**. Not yet handling real payments or public traffic.
Last updated: 2026-08-21

## 1. Goal

A working prototype of an ecommerce site selling rare/collectible British stamps, used to
validate UX and architecture before committing to a final build. Success = someone can
browse/search the catalog, view a stamp's detail, add it to a cart, and complete a
Stripe test-mode checkout, end to end.

## 2. Scope for this phase

**In scope**
- Public catalog: browse, search, filter, stamp detail pages
- Cart + Stripe Checkout (test mode)
- Data seeded directly into the database (script/SQL), not via a UI

**Explicitly out of scope for now** (see §8 Future phases)
- Admin UI for adding/editing stamps
- Any authentication (no customer accounts, no admin login)
- Live payments
- SEO/SSR — a client-rendered SPA is fine for an internal demo

## 3. Assumptions

- Each listing is normally a **unique physical item** (`quantity = 1`); occasionally a
  small stock of a common item may share a listing.
- Cataloguing follows standard philatelic conventions: **Stanley Gibbons (SG) number**,
  monarch/era, issue year, condition (mint / mounted mint / used / fine used, etc.).
- All prices in **GBP**, stored as integer pence to avoid float rounding issues.
- Traffic is low (demo-only), so a serverless/edge stack sized for near-zero cost is
  appropriate — see §7.

## 4. Data model

### `stamps`
| field | type | notes |
|---|---|---|
| id | text (uuid) | PK |
| title | text | |
| description | text | |
| country | text | default `"Great Britain"` |
| era | text | e.g. `Victoria`, `Edward VII`, `George V`, `George VI`, `Elizabeth II` |
| issue_year | integer | nullable |
| issue_year_end | integer | nullable — for issues spanning a range |
| sg_number | text | Stanley Gibbons catalog reference |
| condition | text | enum: `mint`, `mounted_mint`, `used`, `fine_used` |
| grade | text | nullable, free text e.g. "fine", "very fine" |
| price_pence | integer | price in minor currency unit |
| quantity | integer | default `1` |
| status | text | enum: `available`, `reserved`, `sold` |
| created_at | integer (unix ts) | |
| updated_at | integer (unix ts) | |

### `stamp_images`
| field | type | notes |
|---|---|---|
| id | text (uuid) | PK |
| stamp_id | text | FK → stamps.id |
| r2_key | text | object key in R2 bucket |
| alt_text | text | |
| sort_order | integer | |

### `stamp_tags` (optional, simple join table)
| field | type | notes |
|---|---|---|
| stamp_id | text | FK → stamps.id |
| tag | text | e.g. "penny black", "definitive", "error" |

### `orders`
| field | type | notes |
|---|---|---|
| id | text (uuid) | PK |
| stripe_session_id | text | |
| status | text | enum: `pending`, `paid`, `cancelled` |
| customer_email | text | |
| created_at | integer (unix ts) | |

### `order_items`
| field | type | notes |
|---|---|---|
| id | text (uuid) | PK |
| order_id | text | FK → orders.id |
| stamp_id | text | FK → stamps.id |
| price_pence | integer | price at time of purchase |
| quantity | integer | |

A dedicated **FTS5 virtual table** over `stamps(title, description, sg_number)` powers
free-text search; facet filters (era, condition, country, price range) are plain
`WHERE` clauses against the base table.

> **Known limitation to design around:** since most stamps are unique (qty=1), two
> customers could try to buy the same item at once. For the prototype, mark a stamp
> `reserved` when a Stripe Checkout session is created for it and `sold` on webhook
> confirmation; release back to `available` if the session expires/cancels. Good enough
> for a demo — a production build needs this hardened further.

## 5. API

All under `/api`, implemented as Hono handlers on Cloudflare Workers/Pages Functions.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/stamps` | List/search/filter. Query params: `q`, `era`, `condition`, `country`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |
| GET | `/api/stamps/:id` | Stamp detail |
| POST | `/api/checkout` | Create a Stripe Checkout session for the given cart items; marks stamps `reserved`; returns the session URL |
| POST | `/api/webhooks/stripe` | Stripe webhook — on `checkout.session.completed`, create the `order`/`order_items` and mark stamps `sold`; on expiry/cancellation, release stamps back to `available` |

Phase 2 will add authenticated `POST/PUT/DELETE /api/stamps` routes for admin.

## 6. Frontend

React + TypeScript + Vite SPA, React Router. Routes:

| Route | Purpose |
|---|---|
| `/` | Landing — featured/recent stamps |
| `/catalog` | Browse grid with search box + facet filters (era, condition, country, price range) |
| `/stamps/:id` | Detail page — full images (zoom), description, SG number, add-to-cart |
| `/cart` | Cart contents, quantities, proceed to checkout |
| `/checkout/success` | Stripe redirect on success |
| `/checkout/cancel` | Stripe redirect on cancel |

## 7. Tech stack & hosting

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite → **Cloudflare Pages** |
| Backend | **Hono** (TypeScript) on **Cloudflare Pages Functions / Workers** |
| Database | **Cloudflare D1** (SQLite) via **Drizzle ORM** |
| Images | **Cloudflare R2** (zero egress fees) |
| Payments | **Stripe**, test mode for this phase |
| Auth/Admin | None yet — deferred to Phase 2 |

**Why this stack:** single vendor (Cloudflare) for hosting, compute, DB, and storage,
deployed from the GitHub repo already linked to the account. Free tier is usable for
commercial projects (unlike some competitors' free tiers), so there's no forced
migration when this goes from prototype to soft-launch. Free tier ceilings (Workers
100k req/day, D1 5GB storage / 5M reads-day / 100k writes-day, R2 10GB storage) are
well above what a demo — or an early soft-launch — will use. If ever outgrown, the
escape hatch is Cloudflare Hyperdrive + an external Postgres, without changing the
frontend or hosting.

## 8. Future phases (not in this prototype)

- Admin UI: add/edit/delete stamps, image upload, bulk CSV import
- Auth: admin login (Cloudflare Access or custom), later customer accounts
- Live Stripe mode + real order fulfillment workflow
- Reconsider SSR (e.g. Next.js) if organic search for SG numbers/collector terms matters
- Harden the reservation/concurrency logic in §4
- Customer order history / email confirmations

## 9. Open items to revisit before soft-launch

- Confirm Cloudflare Pages' commercial-use terms haven't changed since this was written
- Decide on a paid Workers plan if traffic grows past the free tier
- Decide on real image storage budget (R2 free tier is 10GB — high-res scan photos add up)
