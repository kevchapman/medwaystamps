import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { and, asc, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { getDb } from "../lib/db";
import { getStripe } from "../lib/stripe";
import { toStampDTO } from "../lib/serialize";
import { verifyPassword } from "../lib/crypto";
import { createSession, deleteSessionByToken, SESSION_COOKIE } from "../lib/session";
import { requireAdmin } from "../lib/requireAdmin";
import { rebuildHomeCache, rebuildStampCache } from "../../app/lib/pageCache.server";
import { admins, orderItems, orders, stampImages, stampTags, stamps } from "../../db/schema";
import type { Env } from "../lib/types";

const app = new Hono<{ Bindings: Env; Variables: { adminId: string } }>().basePath("/api");

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

  // Derived from the incoming request rather than a configured var, so this
  // is correct both in local dev and once deployed without extra setup.
  const origin = new URL(c.req.url).origin;

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
    success_url: `${origin}/checkout/success`,
    cancel_url: `${origin}/checkout/cancel`,
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

// ---- Admin: auth --------------------------------------------------------

// Cookie is Secure whenever the request itself arrived over https — true in
// production, false under local `npm run dev` (plain http) — so the
// same code is correct in both without special-casing "localhost".
function isHttps(c: { req: { url: string } }): boolean {
  return new URL(c.req.url).protocol === "https:";
}

app.post("/admin/login", async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>().catch(() => null);
  if (!body?.email || !body?.password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  const db = getDb(c.env);
  const [admin] = await db.select().from(admins).where(eq(admins.email, body.email.toLowerCase()));
  const ok = admin ? await verifyPassword(body.password, admin.passwordHash) : false;
  if (!admin || !ok) return c.json({ error: "Invalid email or password" }, 401);

  const { token, expiresAt } = await createSession(db, admin.id);
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return c.json({ id: admin.id, email: admin.email });
});

app.post("/admin/logout", async (c) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await deleteSessionByToken(getDb(c.env), token);
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

app.get("/admin/me", requireAdmin, async (c) => {
  const [admin] = await getDb(c.env).select().from(admins).where(eq(admins.id, c.get("adminId")));
  if (!admin) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ id: admin.id, email: admin.email });
});

// ---- Admin: stamp CRUD ---------------------------------------------------

const STAMP_CONDITIONS = ["mint", "mounted_mint", "used", "fine_used"] as const;
const STAMP_STATUSES = ["available", "reserved", "sold"] as const;

type StampInputBody = Record<string, unknown>;

// Manual validation, matching this file's existing style elsewhere (no zod).
function validateStampInput(body: unknown, opts: { partial?: boolean } = {}): string | null {
  if (!body || typeof body !== "object") return "Invalid request body";
  const b = body as StampInputBody;

  if (!opts.partial) {
    const required = ["title", "description", "era", "sgNumber", "condition", "pricePence"];
    for (const field of required) {
      if (b[field] === undefined || b[field] === null || b[field] === "") {
        return `${field} is required`;
      }
    }
  }
  if (b.condition !== undefined && !STAMP_CONDITIONS.includes(b.condition as never)) {
    return "Invalid condition";
  }
  if (b.status !== undefined && !STAMP_STATUSES.includes(b.status as never)) {
    return "Invalid status";
  }
  if (b.pricePence !== undefined && (typeof b.pricePence !== "number" || b.pricePence < 0)) {
    return "pricePence must be a non-negative number";
  }
  if (b.quantity !== undefined && (typeof b.quantity !== "number" || b.quantity < 0)) {
    return "quantity must be a non-negative number";
  }
  if (b.tags !== undefined && (!Array.isArray(b.tags) || b.tags.some((t) => typeof t !== "string"))) {
    return "tags must be an array of strings";
  }
  return null;
}

// Only copies fields that were actually present in the body, so PUT can send
// a partial update without clobbering untouched columns.
function normalizeStampInput(body: StampInputBody) {
  const out: Record<string, unknown> = {};
  for (const field of ["title", "description", "country", "era", "sgNumber", "condition", "status"]) {
    if (body[field] !== undefined) out[field] = body[field];
  }
  if (body.grade !== undefined) out.grade = body.grade === "" ? null : body.grade;
  for (const field of ["issueYear", "issueYearEnd", "pricePence", "quantity"]) {
    if (body[field] !== undefined) out[field] = body[field] === null ? null : Number(body[field]);
  }
  return out;
}

app.post("/admin/stamps", requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => null);
  const validationError = validateStampInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const db = getDb(c.env);
  const id = crypto.randomUUID();
  const now = Date.now();
  const fields = normalizeStampInput(body as StampInputBody);

  await db.insert(stamps).values({
    id,
    title: "",
    description: "",
    era: "",
    sgNumber: "",
    condition: "mint",
    pricePence: 0,
    ...fields,
    createdAt: now,
    updatedAt: now,
  } as typeof stamps.$inferInsert);

  const tags = Array.isArray((body as StampInputBody).tags) ? ((body as StampInputBody).tags as string[]) : [];
  if (tags.length) {
    await db.insert(stampTags).values(tags.map((tag) => ({ stampId: id, tag })));
  }

  const [stamp] = await db.select().from(stamps).where(eq(stamps.id, id));

  // A new stamp could enter Home's "recent" top-6 — its own detail page
  // doesn't need rebuilding yet, the cache's read-side self-heal covers
  // the first visit (see app/lib/pageCache.server.ts).
  c.executionCtx.waitUntil(rebuildHomeCache(c.env, c.executionCtx));

  return c.json(
    toStampDTO(stamp, [], tags.map((tag) => ({ stampId: id, tag }))),
    201,
  );
});

app.put("/admin/stamps/:id", requireAdmin, async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const validationError = validateStampInput(body, { partial: true });
  if (validationError) return c.json({ error: validationError }, 400);

  const db = getDb(c.env);
  const [existing] = await db.select().from(stamps).where(eq(stamps.id, id));
  if (!existing) return c.json({ error: "Stamp not found" }, 404);

  const fields = normalizeStampInput(body as StampInputBody);
  await db
    .update(stamps)
    .set({ ...fields, updatedAt: Date.now() })
    .where(eq(stamps.id, id));

  const tags = (body as StampInputBody).tags;
  if (Array.isArray(tags)) {
    await db.delete(stampTags).where(eq(stampTags.stampId, id));
    if (tags.length) await db.insert(stampTags).values((tags as string[]).map((tag) => ({ stampId: id, tag })));
  }

  const [stamp] = await db.select().from(stamps).where(eq(stamps.id, id));
  const [images, stampTagRows] = await Promise.all([
    db.select().from(stampImages).where(eq(stampImages.stampId, id)),
    db.select().from(stampTags).where(eq(stampTags.stampId, id)),
  ]);

  c.executionCtx.waitUntil(rebuildStampCache(c.env, c.executionCtx, id));
  c.executionCtx.waitUntil(rebuildHomeCache(c.env, c.executionCtx));

  return c.json(toStampDTO(stamp, images, stampTagRows));
});

// ---- Admin: image upload --------------------------------------------------

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

app.post("/admin/stamps/:id/images", requireAdmin, async (c) => {
  const stampId = c.req.param("id");
  const db = getDb(c.env);
  const [stamp] = await db.select().from(stamps).where(eq(stamps.id, stampId));
  if (!stamp) return c.json({ error: "Stamp not found" }, 404);

  const body = await c.req.parseBody();
  const file = body["image"];
  if (!(file instanceof File)) return c.json({ error: "image file is required" }, 400);

  const ext = EXT_BY_MIME[file.type];
  if (!ext) return c.json({ error: "Unsupported image type (jpeg/png/webp only)" }, 400);
  if (file.size > MAX_IMAGE_BYTES) return c.json({ error: "Image too large (8MB max)" }, 400);

  const existing = await db.select().from(stampImages).where(eq(stampImages.stampId, stampId));
  const r2Key = `stamps/${stampId}/${crypto.randomUUID()}.${ext}`;
  await c.env.STAMPS_BUCKET.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const imageId = crypto.randomUUID();
  const altTextRaw = body["altText"];
  const altText = typeof altTextRaw === "string" && altTextRaw !== "" ? altTextRaw : null;
  const sortOrder = existing.length;
  await db.insert(stampImages).values({ id: imageId, stampId, r2Key, altText, sortOrder });

  c.executionCtx.waitUntil(rebuildStampCache(c.env, c.executionCtx, stampId));

  return c.json({ id: imageId, url: `/api/images/${r2Key}`, altText, sortOrder }, 201);
});

app.delete("/admin/images/:imageId", requireAdmin, async (c) => {
  const db = getDb(c.env);
  const [image] = await db.select().from(stampImages).where(eq(stampImages.id, c.req.param("imageId")));
  if (!image) return c.json({ error: "Image not found" }, 404);

  await c.env.STAMPS_BUCKET.delete(image.r2Key);
  await db.delete(stampImages).where(eq(stampImages.id, image.id));

  c.executionCtx.waitUntil(rebuildStampCache(c.env, c.executionCtx, image.stampId));

  return c.json({ ok: true });
});

export default app;
