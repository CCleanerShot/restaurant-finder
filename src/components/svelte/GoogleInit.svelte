<script lang="ts">
    import { onMount } from "svelte";
    import { initGoogle } from "~/client/googleMaps";
    import { googleState } from "~/client/svelte/states/googleState.svelte";

    onMount(async () => {
        await initGoogle();
        googleState.CoreLibrary = (await google.maps.importLibrary("core")) as google.maps.CoreLibrary;
        googleState.MapsLibrary = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        googleState.MarkerLibrary = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
        googleState.PlacesLibrary = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
        googleState._finished = true;
    });
</script>
