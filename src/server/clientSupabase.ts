import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL } from "astro:env/client";
import { SUPABASE_SECRET_KEY } from "astro:env/server";
import type { Database } from "~/common/database.types";

export const clientSupabase = createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);
