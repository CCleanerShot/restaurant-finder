import type { z } from "astro:schema";
import type { coordinateSchema, customLocationSchema, googleLocationSchema } from "./schemas.types";

export type Coordinate = z.infer<typeof coordinateSchema>;
export type CustomLocation = z.infer<typeof customLocationSchema>;
export type GoogleLocation = z.infer<typeof googleLocationSchema>;
export type ToggleableGoogleLocation = GoogleLocation & { exported: boolean };
export type OpeningHours = {
    close: number;
    open: number;
};
