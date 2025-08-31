import { writable } from "svelte/store";
import type { CoordinateClick } from "~/common/classes/CoordinateClick.svelte";

export const selectedStore = writable(undefined as CoordinateClick | undefined);
