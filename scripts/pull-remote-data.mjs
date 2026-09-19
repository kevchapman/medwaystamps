#!/usr/bin/env node
// On-demand: pull production's stamp catalog + images down into local D1/R2.
// Run whenever you want local dev to mirror the live data, or as a backup.
// See scripts/lib/sync.mjs for what this does and does not touch.
import { fileURLToPath } from "node:url";
import { runFullSync } from "./lib/sync.mjs";

const cacheDir = fileURLToPath(new URL("../.data/pulled-images/", import.meta.url));

const result = await runFullSync({
  dbName: "medway-stamps-db",
  bucketName: "medway-stamps-images",
  cacheDir,
});

console.log(
  `Done — pulled ${result.stamps} stamps / ${result.images} images / ${result.tags} tags ` +
    `from production into local D1 + R2. Local backup copy of images: ${cacheDir}`,
);
