// @ts-check
import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  env: {
      schema: {
          GOOGLE_API_KEY: envField.string({access: "secret", context: "server"}),
          PUBLIC_GOOGLE_MAPS_PLATFORM_API_KEY: envField.string({ access: "public", context: "client" }),
      },
	},

  integrations: [svelte()],
  adapter: cloudflare(),
});