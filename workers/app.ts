import { Hono } from "hono";
import apiApp from "../functions/api/app";
import { requestHandler } from "./requestHandler.server";
import { getCachedPage, homeCacheKey, putCachedPage, stampCacheKey } from "../app/lib/pageCache.server";
import type { Env } from "../functions/lib/types";

// Single Worker dispatcher: the existing Hono app owns /api/* (unchanged,
// still scoped via its own .basePath("/api")); everything else falls
// through to React Router's SSR request handler. See CLAUDE.md.
const app = new Hono<{ Bindings: Env }>();

app.route("/", apiApp);

// Home ("/") and stamp detail pages are the two cached routes — a hit here
// is just a KV read + returning the stored HTML, no render, no D1 query.
// Catalog and everything else always goes through the full SSR render
// below. See app/lib/pageCache.server.ts for why only these two, and why
// stamp `status` is safe to cache despite changing outside admin edits.
function cacheKeyForPath(pathname: string): string | null {
  if (pathname === "/") return homeCacheKey();
  const stampMatch = pathname.match(/^\/stamps\/([^/]+)$/);
  if (stampMatch) return stampCacheKey(stampMatch[1]);
  return null;
}

app.get("*", async (c) => {
  const url = new URL(c.req.url);
  const cacheKey = cacheKeyForPath(url.pathname);

  if (cacheKey) {
    const cached = await getCachedPage(c.env, cacheKey);
    if (cached) {
      return c.html(cached.html, 200, { "x-page-cache": "hit" });
    }
  }

  const response = await requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });

  // Opportunistic self-heal: a miss (brand-new page, evicted key, or a race
  // with an in-flight eager rebuild) still gets served correctly right now
  // via the live render above; this just backfills the cache for next time,
  // off the response's critical path.
  if (cacheKey && response.status === 200) {
    const html = await response.clone().text();
    c.executionCtx.waitUntil(putCachedPage(c.env, cacheKey, html));
  }

  return response;
});

export default app;
