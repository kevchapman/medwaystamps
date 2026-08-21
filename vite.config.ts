import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // When running `wrangler pages dev --proxy 5173 -- npm run dev`,
    // Wrangler serves /api/* from functions/ and proxies everything
    // else here. Keep this dev server on 5173 to match that.
    port: 5173,
  },
});
