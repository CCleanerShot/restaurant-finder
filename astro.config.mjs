// @ts-check
import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
    env: {
        schema: {
            PUBLIC_GOOGLE_MAPS_PLATFORM_API_KEY: envField.string({ access: "public", context: "client" }),
            PUBLIC_SUPABASE_ID: envField.string({ access: "public", context: "client" }),
            PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({ access: "public", context: "client" }),
            PUBLIC_SUPABASE_URL: envField.string({ access: "public", context: "client" }),
            GOOGLE_API_KEY: envField.string({ access: "secret", context: "server" }),
            GOOGLE_SHEETS_SPREADSHEET_ID: envField.string({ access: "secret", context: "server" }),
            SUPABASE_SECRET_KEY: envField.string({ access: "secret", context: "server" }),
        },
    },

    integrations: [svelte()],
    adapter: cloudflare({
        platformProxy: import.meta.env.DEV
            ? undefined
            : {
                  environment: "production",
                  enabled: true,
                  configPath: "wrangler.jsonc",
                  persist: {
                      path: "./.cache/wrangler/v3",
                  },
              },
    }),
});
