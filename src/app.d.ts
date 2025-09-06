// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SupabaseClient } from "@supabase/supabase-js";

declare global {
    export type SvelteClickEvent = MouseEvent & { currentTarget: EventTarget & HTMLButtonElement };
    export type SvelteInputEvent = Event & { currentTarget: EventTarget & HTMLInputElement };

    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
        interface SessionData {
            supabaseClient: SupabaseClient;
        }
    }
}

export {};
