import { CoordinateClick } from "~/common/classes/CoordinateClick.svelte";

export const mapsState = $state({
    clicks: [] as CoordinateClick[],
    markers: [] as { marker: google.maps.marker.AdvancedMarkerElement; pin: google.maps.marker.PinElement }[],
    selected: undefined as CoordinateClick | undefined,
});
