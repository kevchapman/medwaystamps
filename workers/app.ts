import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import apiApp from "../functions/api/app";
import type { Env } from "../functions/lib/types";

// Single Worker dispatcher: the existing Hono app owns /api/* (unchanged,
// still scoped via its own .basePath("/api")); everything else falls
// through to React Router's SSR request handler. See CLAUDE.md.
const app = new Hono<{ Bindings: Env }>();

app.route("/", apiApp);

app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
