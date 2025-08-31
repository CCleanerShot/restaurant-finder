export type Coordinate = { x: number; y: number };
export type GoogleLocation = {
    address: string;
    coord: Coordinate;
    id: string;
    hours: google.maps.places.OpeningHours;
    name: string;
    phone: string;
    website: string;
};

export type ToggleableGoogleLocation = GoogleLocation & { exported: boolean };
