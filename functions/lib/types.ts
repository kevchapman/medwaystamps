export interface Env {
  DB: D1Database;
  STAMPS_BUCKET: R2Bucket;
  PAGE_CACHE: KVNamespace;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}
