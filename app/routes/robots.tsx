import type { Route } from "./+types/robots";

// Resource route (no default export) — React Router returns the loader's
// Response directly as the HTTP response. Gated by ALLOW_INDEXING so the
// site stays unindexed until launch is deliberately flipped on in
// wrangler.toml. See workers/app.ts for the companion X-Robots-Tag header.
export function loader({ request, context }: Route.LoaderArgs) {
  const allow = context.cloudflare.env.ALLOW_INDEXING === "true";
  const origin = new URL(request.url).origin;

  const body = allow
    ? `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`
    : `User-agent: *\nDisallow: /\n`;

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
