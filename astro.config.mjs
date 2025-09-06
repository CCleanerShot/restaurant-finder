// @ts-check
import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
    env: {
        schema: {
            CLOUDFLARE_ACCESS_KEY_ID: envField.string({ access: "secret", context: "server" }),
            CLOUDFLARE_ACCOUNT_ID: envField.string({ access: "secret", context: "server" }),
            CLOUDFLARE_API_KEY: envField.string({ access: "secret", context: "server" }),
            CLOUDFLARE_BUCKET_NAME: envField.string({ access: "secret", context: "server" }),
            CLOUDFLARE_SECRET_ACCESS_KEY: envField.string({ access: "secret", context: "server" }),
            GOOGLE_API_KEY: envField.string({ access: "secret", context: "server" }),
            GOOGLE_SHEETS_SPREADSHEET_ID: envField.string({ access: "secret", context: "server" }),
            PUBLIC_GOOGLE_MAPS_PLATFORM_API_KEY: envField.string({ access: "public", context: "client" }),
            PUBLIC_SUPABASE_ID: envField.string({ access: "public", context: "client" }),
            PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({ access: "public", context: "client" }),
            PUBLIC_SUPABASE_URL: envField.string({ access: "public", context: "client" }),
            SUPABASE_SECRET_KEY: envField.string({ access: "secret", context: "server" }),
        },
    },
    integrations: [svelte()],
    adapter: cloudflare({
        imageService: "cloudflare",
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
