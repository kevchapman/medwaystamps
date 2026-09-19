export interface Env {
  DB: D1Database;
  STAMPS_BUCKET: R2Bucket;
  PAGE_CACHE: KVNamespace;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  // Wrangler vars are always strings — compare with === "true", not truthy.
  // Defaults to "false" (block all crawling) until launch is deliberately
  // flipped on in wrangler.toml. See workers/app.ts and app/routes/robots.tsx.
  ALLOW_INDEXING?: string;
}
