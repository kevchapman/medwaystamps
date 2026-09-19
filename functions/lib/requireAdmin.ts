import type { MiddlewareHandler } from "hono";
import { deleteCookie, getCookie } from "hono/cookie";
import { getDb } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";
import type { Env } from "./types";

// Gates the /admin/* API routes: requires a valid, unexpired session cookie,
// and makes the owning admin's id available to the handler via c.get("adminId").
export const requireAdmin: MiddlewareHandler<{
  Bindings: Env;
  Variables: { adminId: string };
}> = async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const session = await verifySession(getDb(c.env), token);
  if (!session) {
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("adminId", session.adminId);
  await next();
};
