import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  // Required by @cloudflare/vite-plugin's viteEnvironment integration (see
  // vite.config.ts). Cloudflare's reference template still calls this
  // `unstable_viteEnvironmentApi`, but at the @react-router/dev version
  // actually installed here that flag has been stabilized under this name.
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
