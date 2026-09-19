// Pull-only sync: production D1 + R2 -> local D1 + R2. Used for seeding
// local dev with the real catalog and as an on-disk backup. NEVER pushes
// local -> remote, and NEVER touches `admins`/`sessions` — see the hardcoded
// allowlist below. Production stays the sole source of truth; admin edits
// happen directly against whichever environment is running (local D1 during
// dev, production once deployed).
//
// Written as small composable functions rather than an inline shell script
// so this same logic is reusable later from something other than a raw CLI
// invocation (a scheduled job, or an admin-UI "sync now" button) — see the
// note at the bottom of this file about what that would actually require.

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// Hardcoded on purpose: this is a safety allowlist, not just a convenience
// list. Never derive this from "every table" — admins/sessions must never
// leave production via this tool.
const SYNCED_TABLES = ["stamps", "stamp_images", "stamp_tags"];

function run(args) {
  return execFileSync("npx", args, { encoding: "utf8" });
}

export async function fetchRemoteTable(dbName, table) {
  const out = run([
    "wrangler",
    "d1",
    "execute",
    dbName,
    "--remote",
    "--json",
    "--command",
    `SELECT * FROM ${table}`,
  ]);
  const parsed = JSON.parse(out);
  // `wrangler d1 execute --json` returns an array of one result set per
  // statement; a single SELECT is the first (and only) entry.
  return parsed[0]?.results ?? [];
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertStatements(table, rows) {
  return rows.map((row) => {
    const columns = Object.keys(row);
    const values = columns.map((col) => sqlLiteral(row[col]));
    return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`;
  });
}

// Replaces the local catalog tables wholesale with the given rows (deleting
// in FK-safe child-first order, then re-inserting parent-first).
export async function reloadLocalCatalog(dbName, { stampRows, imageRows, tagRows }) {
  const sql = [
    "DELETE FROM stamp_tags;",
    "DELETE FROM stamp_images;",
    "DELETE FROM stamps;",
    ...insertStatements("stamps", stampRows),
    ...insertStatements("stamp_images", imageRows),
    ...insertStatements("stamp_tags", tagRows),
  ].join("\n");

  const dir = mkdtempSync(join(tmpdir(), "medway-pull-"));
  const file = join(dir, "reload.sql");
  writeFileSync(file, sql);
  try {
    run(["wrangler", "d1", "execute", dbName, "--local", `--file=${file}`]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// `wrangler r2 object get/put` default to the remote bucket when `--local`
// is omitted (there's no separate `--remote` flag for R2 subcommands).
export async function downloadRemoteImage(bucketName, key, destPath) {
  mkdirSync(dirname(destPath), { recursive: true });
  run(["wrangler", "r2", "object", "get", `${bucketName}/${key}`, `--file=${destPath}`]);
}

export async function uploadLocalImage(bucketName, key, srcPath) {
  run(["wrangler", "r2", "object", "put", `${bucketName}/${key}`, "--local", `--file=${srcPath}`]);
}

export async function runFullSync({ dbName, bucketName, cacheDir }) {
  console.log(`Pulling ${SYNCED_TABLES.join(", ")} from remote D1...`);
  const [stampRows, imageRows, tagRows] = await Promise.all([
    fetchRemoteTable(dbName, "stamps"),
    fetchRemoteTable(dbName, "stamp_images"),
    fetchRemoteTable(dbName, "stamp_tags"),
  ]);

  await reloadLocalCatalog(dbName, { stampRows, imageRows, tagRows });
  console.log(`Loaded ${stampRows.length} stamps, ${imageRows.length} images, ${tagRows.length} tags locally.`);

  for (const [i, img] of imageRows.entries()) {
    const dest = join(cacheDir, img.r2_key);
    process.stdout.write(`  [${i + 1}/${imageRows.length}] ${img.r2_key}\r`);
    await downloadRemoteImage(bucketName, img.r2_key, dest);
    await uploadLocalImage(bucketName, img.r2_key, dest);
  }
  if (imageRows.length) console.log(); // finish the \r progress line

  return { stamps: stampRows.length, images: imageRows.length, tags: tagRows.length };
}

// Reusability note: these functions shell out to `wrangler`, which needs a
// real terminal-authenticated Cloudflare session (or CI credentials) to run
// — the same auth `db:migrate:remote` already relies on. That works fine
// from a developer machine or a CI job, but NOT from inside the Cloudflare
// Worker itself (Workers can't spawn subprocesses). A later "sync now"
// button in the admin UI would need this reimplemented against the
// Cloudflare REST API (D1 HTTP API + R2 API) with an API token instead of
// shelling out — same function signatures, same SYNCED_TABLES allowlist,
// just a different transport. Not built now.
