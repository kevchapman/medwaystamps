export interface Env {
  DB: D1Database;
  STAMPS_BUCKET: R2Bucket;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  // Base URL the SPA is served from, used to build Stripe success/cancel URLs.
  SITE_URL: string;
}
