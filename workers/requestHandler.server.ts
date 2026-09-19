import { createRequestHandler } from "react-router";

// Extracted into its own module (rather than living inline in workers/app.ts)
// so app/lib/pageCache.server.ts can reuse the exact same render pipeline to
// rebuild a cached page — both workers/app.ts and pageCache.server.ts import
// this, avoiding a circular import between the two.
export const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);
