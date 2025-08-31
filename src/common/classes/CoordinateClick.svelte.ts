import type { Coordinate, GoogleLocation, ToggleableGoogleLocation } from "../types";

export class CoordinateClick {
    coord: Coordinate;
    radius: number;
    locations: ToggleableGoogleLocation[] = $state([]);
    exported: boolean = $state(true);

    constructor(coord: Coordinate, radius: number, locations: GoogleLocation[]) {
        this.coord = coord;
        this.radius = radius;
        this.locations = locations.map((e) => ({ exported: this.exported, ...e }));
    }
}
