import { requestHandler } from "../../workers/requestHandler.server";
import type { Env } from "../../functions/lib/types";
import type { ApiExecutionContext } from "./apiFetch.server";

// Regenerate-on-write cache: stores pre-rendered HTML strings, not data to
// re-render from — a cache hit must cost one KV read and zero React render/
// D1 query, or the whole point (staying comfortably on the Workers free
// plan's CPU budget) is defeated.
//
// Only ever touches Home and StampDetail — Catalog is deliberately excluded
// (see app/routes/Catalog.tsx). Correctness for stamp `status` doesn't rely
// on remembering to invalidate on every place it can change (admin edits
// AND Stripe checkout/webhook transitions) — it relies on `status` never
// being in the cached HTML in the first place. See
// app/components/AddToCartControl.tsx.

interface CachedPage {
  html: string;
  renderedAt: number;
}

export const stampCacheKey = (id: string) => `page:stamp:${id}`;
export const homeCacheKey = () => "page:home";

export async function getCachedPage(env: Env, key: string): Promise<CachedPage | null> {
  return env.PAGE_CACHE.get<CachedPage>(key, "json");
}

export async function putCachedPage(env: Env, key: string, html: string): Promise<void> {
  const payload: CachedPage = { html, renderedAt: Date.now() };
  await env.PAGE_CACHE.put(key, JSON.stringify(payload));
}

export async function invalidateCachedPage(env: Env, key: string): Promise<void> {
  await env.PAGE_CACHE.delete(key);
}

async function renderPage(path: string, env: Env, ctx: ApiExecutionContext): Promise<Response> {
  return requestHandler(new Request(`https://internal.invalid${path}`), { cloudflare: { env, ctx } });
}

// Called from admin write routes (functions/api/app.ts) after a stamp is
// created/edited/gets an image added or removed — eager, not lazy, so a
// real visitor never has to hit the slow (uncached) render path just from
// browsing shortly after an edit.
export async function rebuildStampCache(env: Env, ctx: ApiExecutionContext, stampId: string): Promise<void> {
  const res = await renderPage(`/stamps/${stampId}`, env, ctx);
  if (res.status === 200) {
    await putCachedPage(env, stampCacheKey(stampId), await res.text());
  } else {
    // Stamp was deleted, or render failed — never cache an error page.
    await invalidateCachedPage(env, stampCacheKey(stampId));
  }
}

export async function rebuildHomeCache(env: Env, ctx: ApiExecutionContext): Promise<void> {
  const res = await renderPage("/", env, ctx);
  if (res.status === 200) {
    await putCachedPage(env, homeCacheKey(), await res.text());
  }
}
