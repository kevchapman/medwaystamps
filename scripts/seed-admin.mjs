#!/usr/bin/env node
// One-off: create (or replace) the admin account. Never run automatically —
// there's no npm/CI step that calls this, matching how db:seed:remote
// already isn't automatic either.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' node scripts/seed-admin.mjs --local
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' node scripts/seed-admin.mjs --remote
//
// Only the PBKDF2 hash of the password is ever written to D1 — the plaintext
// password only exists in your shell's env for the duration of this command.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./lib/password.mjs";

const target = process.argv.includes("--remote") ? "--remote" : "--local";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD env vars first.");
  console.error("Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-admin.mjs [--local|--remote]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

const passwordHash = await hashPassword(password);
const sql = `DELETE FROM admins WHERE email = '${sqlEscape(email)}';
INSERT INTO admins (id, email, password_hash, created_at)
VALUES ('${randomUUID()}', '${sqlEscape(email)}', '${sqlEscape(passwordHash)}', ${Date.now()});
`;

const dir = mkdtempSync(join(tmpdir(), "medway-seed-admin-"));
const file = join(dir, "seed-admin.sql");
writeFileSync(file, sql);
try {
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "medway-stamps-db", target, `--file=${file}`],
    { stdio: "inherit" },
  );
  console.log(`Admin account ready for ${email} (${target}).`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
