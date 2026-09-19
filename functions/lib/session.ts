import { eq } from "drizzle-orm";
import { sessions } from "../../db/schema";
import { randomToken, sha256Hex } from "./crypto";
import type { getDb } from "./db";

type Db = ReturnType<typeof getDb>;

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, fixed at creation (not sliding)

export async function createSession(
  db: Db,
  adminId: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = randomToken();
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    tokenHash: await sha256Hex(token),
    adminId,
    expiresAt,
    createdAt: now,
  });
  return { token, expiresAt };
}

// Returns the session row if `token` is a valid, unexpired session; null
// otherwise (and opportunistically deletes an expired row it finds).
export async function verifySession(db: Db, token: string) {
  const tokenHash = await sha256Hex(token);
  const [row] = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash));
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.id));
    return null;
  }
  return row;
}

export async function deleteSessionByToken(db: Db, token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, await sha256Hex(token)));
}
