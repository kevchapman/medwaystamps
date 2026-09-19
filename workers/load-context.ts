import type { Env } from "../functions/lib/types";
import type { ApiExecutionContext } from "../app/lib/apiFetch.server";

// Augments React Router's AppLoadContext so `context.cloudflare.env`/`.ctx`
// are typed in every loader — matches the shape workers/app.ts actually
// passes to createRequestHandler(). @react-router/cloudflare's own
// createRequestHandler/GetLoadContextFunction are for a different
// (Pages-Functions-oriented) integration and aren't used here — the
// official Cloudflare Workers template imports createRequestHandler
// straight from "react-router" instead, which is what we do too.
//
// `ctx`'s type is imported from apiFetch.server.ts (derived structurally
// from Hono's own fetch signature) rather than named as the ambient global
// `ExecutionContext` here, because that name is declared by both
// @cloudflare/workers-types and the generated worker-configuration.d.ts
// with slightly different member sets depending on their exact installed
// versions — see the comment there for the full reasoning.
declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ApiExecutionContext;
    };
  }
}

export {};
