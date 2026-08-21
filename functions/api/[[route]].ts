import { Hono } from "hono";
import { handle } from "hono/cloudflare-pages";
import { and, asc, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { getDb } from "../lib/db";
import { getStripe } from "../lib/stripe";
import { toStampDTO } from "../lib/serialize";
import { orderItems, orders, stampImages, stampTags, stamps } from "../../db/schema";
import type { Env } from "../lib/types";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

// ---- GET /api/stamps ----------------------------------------------------
app.get("/stamps", async (c) => {
  const db = getDb(c.env);
  const url = new URL(c.req.url);
  const q = url.searchParams.get("q");
  const era = url.searchParams.get("era");
  const condition = url.searchParams.get("condition");
  const country = url.searchParams.get("country");
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const sort = url.searchParams.get("sort") ?? "newest";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));

  // TODO(SPEC.md §4): swap this LIKE-based search for the FTS5 virtual
  // table once that migration is written — fine for prototype-scale data.
  const conditions = [
    q
      ? or(
          like(stamps.title, `%${q}%`),
          like(stamps.description, `%${q}%`),
          like(stamps.sgNumber, `%${q}%`),
        )
      : undefined,
    era ? eq(stamps.era, era) : undefined,
    condition ? eq(stamps.condition, condition) : undefined,
    country ? eq(stamps.country, country) : undefined,
    minPrice ? gte(stamps.pricePence, Number(minPrice)) : undefined,
    maxPrice ? lte(stamps.pricePence, Number(maxPrice)) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c !== undefined);

  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sort === "price_asc"
      ? asc(stamps.pricePence)
      : sort === "price_desc"
        ? desc(stamps.pricePence)
        : desc(stamps.createdAt);

  const rows = await db
    .select()
    .from(stamps)
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  const allMatching = await db.select({ id: stamps.id }).from(stamps).where(where);
  const ids = rows.map((r) => r.id);

  const [images, tags] = ids.length
    ? await Promise.all([
        db.select().from(stampImages).where(inArray(stampImages.stampId, ids)),
        db.select().from(stampTags).where(inArray(stampTags.stampId, ids)),
      ])
    : [[], []];

  const items = rows.map((stamp) =>
    toStampDTO(
      stamp,
      images.filter((i) => i.stampId === stamp.id),
      tags.filter((t) => t.stampId === stamp.id),
    ),
  );

  return c.json({ items, total: allMatching.length, page, limit });
});

// ---- GET /api/stamps/:id -------------------------------------------------
app.get("/stamps/:id", async (c) => {
  const db = getDb(c.env);
  const id = c.req.param("id");

  const [stamp] = await db.select().from(stamps).where(eq(stamps.id, id));
  if (!stamp) return c.json({ error: "Stamp not found" }, 404);

  const [images, tags] = await Promise.all([
    db.select().from(stampImages).where(eq(stampImages.stampId, id)),
    db.select().from(stampTags).where(eq(stampTags.stampId, id)),
  ]);

  return c.json(toStampDTO(stamp, images, tags));
});

// ---- GET /api/images/* ----------------------------------------------------
app.get("/images/*", async (c) => {
  const key = c.req.path.replace(/^\/api\/images\//, "");
  const object = await c.env.STAMPS_BUCKET.get(key);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
});

// ---- POST /api/checkout ---------------------------------------------------
app.post("/checkout", async (c) => {
  const db = getDb(c.env);
  const body = await c.req.json<{ lines: { stampId: string; quantity: number }[] }>();

  if (!body.lines?.length) return c.json({ error: "Cart is empty" }, 400);

  const ids = body.lines.map((l) => l.stampId);
  const rows = await db.select().from(stamps).where(inArray(stamps.id, ids));

  const unavailable = rows.filter((s) => s.status !== "available");
  if (unavailable.length) {
    return c.json(
      { error: "Some items are no longer available", stampIds: unavailable.map((s) => s.id) },
      409,
    );
  }

  const stripe = getStripe(c.env);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: body.lines.map((line) => {
      const stamp = rows.find((s) => s.id === line.stampId)!;
      return {
        quantity: line.quantity,
        price_data: {
          currency: "gbp",
          unit_amount: stamp.pricePence,
          product_data: { name: stamp.title },
        },
      };
    }),
    success_url: `${c.env.SITE_URL}/checkout/success`,
    cancel_url: `${c.env.SITE_URL}/checkout/cancel`,
  });

  // Reserve the items so a second buyer can't also check them out.
  // NOTE (SPEC.md §4): best-effort for the prototype, not a fully atomic
  // reservation — worth hardening before a real launch.
  await Promise.all(
    ids.map((id) => db.update(stamps).set({ status: "reserved" }).where(eq(stamps.id, id))),
  );

  const orderId = crypto.randomUUID();
  await db.insert(orders).values({
    id: orderId,
    stripeSessionId: session.id,
    status: "pending",
    customerEmail: null,
    createdAt: Date.now(),
  });
  await db.insert(orderItems).values(
    body.lines.map((line) => ({
      id: crypto.randomUUID(),
      orderId,
      stampId: line.stampId,
      pricePence: rows.find((s) => s.id === line.stampId)!.pricePence,
      quantity: line.quantity,
    })),
  );

  return c.json({ url: session.url });
});

// ---- POST /api/webhooks/stripe --------------------------------------------
app.post("/webhooks/stripe", async (c) => {
  const stripe = getStripe(c.env);
  const signature = c.req.header("stripe-signature");
  const payload = await c.req.text();

  if (!signature) return c.json({ error: "Missing signature" }, 400);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return c.json({ error: `Invalid signature: ${String(err)}` }, 400);
  }

  const db = getDb(c.env);

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.expired") {
    const session = event.data.object as { id: string; customer_details?: { email?: string | null } };
    const [order] = await db.select().from(orders).where(eq(orders.stripeSessionId, session.id));
    if (!order) return c.json({ received: true });

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const stampIds = items.map((i) => i.stampId);

    if (event.type === "checkout.session.completed") {
      await db
        .update(orders)
        .set({ status: "paid", customerEmail: session.customer_details?.email ?? null })
        .where(eq(orders.id, order.id));
      await Promise.all(
        stampIds.map((id) => db.update(stamps).set({ status: "sold" }).where(eq(stamps.id, id))),
      );
    } else {
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, order.id));
      await Promise.all(
        stampIds.map((id) =>
          db.update(stamps).set({ status: "available" }).where(eq(stamps.id, id)),
        ),
      );
    }
  }

  return c.json({ received: true });
});

export const onRequest = handle(app);
