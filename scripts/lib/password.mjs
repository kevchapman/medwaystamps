// Standalone duplicate of the PBKDF2 scheme in functions/lib/crypto.ts, used
// only by scripts/seed-admin.mjs. Kept as a separate copy (not a shared
// import) because functions/* is typed against @cloudflare/workers-types and
// plain Node scripts aren't part of that TS project — but both run on
// nothing but Web Crypto (crypto.subtle), available in Node >= 19 as well as
// Workers, so the algorithm itself is identical. Keep the two in sync by hand
// if this ever changes.

const PBKDF2_ITERATIONS = 100_000;

function toB64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return Buffer.from(binary, "binary").toString("base64");
}

async function deriveBits(password, salt, iterations) {
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

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}
