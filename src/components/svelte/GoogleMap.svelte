<script lang="ts">
    import type { Coordinate, GoogleLocation } from "~/common/types";
    import { mapsState } from "~/client/svelte/states/mapsState.svelte";
    import { googleState } from "~/client/svelte/states/googleState.svelte";
    import { optionsState } from "~/client/svelte/states/optionsState.svelte";
    import { CoordinateClick } from "~/common/classes/CoordinateClick.svelte";
    import { selectedStore } from "~/client/svelte/stores/selectedStore.svelte";
    import { utilsClient } from "~/client/utilsClient";

    let initialized = $state(false);

    const onclick = async (e: google.maps.MapMouseEvent) => {
        if (!optionsState.toggled) {
            return;
        }

        const [lat, lng] = [e.latLng!.lat(), e.latLng!.lng()];
        const { data, error } = await utilsClient.actions("searchNearby", { lat: e.latLng!.lat(), lng: e.latLng!.lng(), radius: optionsState.radius });

        const coord: Coordinate = { x: lng, y: lat };
        const newClick = new CoordinateClick(coord, optionsState.radius, data!);
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
