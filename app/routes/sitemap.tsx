import { ne } from "drizzle-orm";
import { getDb } from "../../functions/lib/db";
import { stamps } from "../../db/schema";
import type { Route } from "./+types/sitemap";

// Resource route (no default export) — React Router returns the loader's
// Response directly as the HTTP response.
export async function loader({ request, context }: Route.LoaderArgs) {
  const db = getDb(context.cloudflare.env);
  // Sold stamps are excluded — a judgment call, not a technical necessity;
  // revisit if long-tail organic traffic to sold listings turns out to
  // matter. Available AND reserved both stay in, since a reservation can
  // still expire back to available.
  const rows = await db
    .select({ id: stamps.id })
    .from(stamps)
    .where(ne(stamps.status, "sold"));

  const origin = new URL(request.url).origin;
  const urls = [`${origin}/`, `${origin}/catalog`, ...rows.map((s) => `${origin}/stamps/${s.id}`)];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`;

  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
