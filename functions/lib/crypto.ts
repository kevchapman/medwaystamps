// Password hashing + random tokens via the Web Crypto API (crypto.subtle),
// which is natively available in the Workers runtime — no dependency, no
// nodejs_compat polyfill needed.

const PBKDF2_ITERATIONS = 100_000;

function toB64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromB64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

// Stored format is self-describing ("pbkdf2-sha256$<iterations>$<salt>$<hash>")
// so PBKDF2_ITERATIONS can change later without invalidating existing hashes
// or needing a migration.
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const [, iterationsStr, saltB64, hashB64] = parts;
  const iterations = Number(iterationsStr);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const actual = await deriveBits(password, fromB64(saltB64), iterations);
  return timingSafeEqual(actual, fromB64(hashB64));
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// High-entropy random session token, base64url-encoded so it's cookie-safe.
export function randomToken(bytes = 32): string {
  const raw = toB64(crypto.getRandomValues(new Uint8Array(bytes)));
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
