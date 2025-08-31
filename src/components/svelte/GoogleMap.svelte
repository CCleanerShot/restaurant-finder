<script lang="ts">
    import type { Coordinate, GoogleLocation } from "~/common/types";
    import { googleState } from "~/client/svelte/states/googleState.svelte";
    import { mapsState } from "~/client/svelte/states/mapsState.svelte";
    import { optionsState } from "~/client/svelte/states/optionsState.svelte";
    import { CoordinateClick } from "~/common/classes/CoordinateClick.svelte";
    import { selectedStore } from "~/client/svelte/stores/selectedStore.svelte";

    let initialized = $state(false);

    const onclick = async (e: google.maps.MapMouseEvent) => {
        if (!optionsState.toggled) {
            return;
        }

        const [lat, lng] = [e.latLng!.lat(), e.latLng!.lng()];
        const coord: Coordinate = { x: lng, y: lat };
        const position = new google.maps.LatLng(lat, lng);

        const query = await googleState.PlacesLibrary.Place.searchNearby({
            // required
            fields: ["businessStatus", "displayName", "editorialSummary", "id", "location", "formattedAddress", "websiteURI"],
            locationRestriction: {
                center: position,
                radius: optionsState.radius,
            },

            // optional
            includedPrimaryTypes: ["restaurant"],
            language: "en-US", // TODO: make it vary based on location
            region: "us",
        });

        const places: GoogleLocation[] = query.places.map((e) => ({
            address: e.formattedAddress!,
            coord: { x: e.location!.lng(), y: e.location!.lat() },
            hours: e.regularOpeningHours!,
            id: e.id!,
            name: e.displayName!,
            phone: e.nationalPhoneNumber!,
            website: e.websiteURI!,
        }));

        const newClick = new CoordinateClick(coord, optionsState.radius, places);
        mapsState.clicks.push(newClick);
        selectedStore.set(newClick);
    };

    $effect(() => {
        if (!googleState._finished) {
            return;
        }

        if (initialized) {
            return;
        }

        initialized = true;
        const position = new globalThis.google.maps.LatLng(29.7601, -95.3701);

        // Center of Houston, TX
        googleState.Map = new googleState.MapsLibrary.Map(document.getElementById("map")!, { center: position, mapId: "map-iframe", zoom: 12 });
        googleState.Map.addListener("click", onclick);
    });
</script>

<div id="map"></div>

<style>
    #map {
        height: 92vh;
        width: 100vw;
    }
</style>
