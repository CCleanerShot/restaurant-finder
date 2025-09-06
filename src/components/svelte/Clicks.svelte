<script lang="ts">
    import { onMount } from "svelte";
    import { utils } from "~/common/utils";
    import { utilsClient } from "~/client/utilsClient";
    import type { ToggleableGoogleLocation } from "~/common/types";
    import { mapsState } from "~/client/svelte/states/mapsState.svelte";
    import { googleState } from "~/client/svelte/states/googleState.svelte";
    import { selectedStore } from "~/client/svelte/stores/selectedStore.svelte";
    import type { CoordinateClick } from "~/common/classes/CoordinateClick.svelte";

    let isVisible: boolean = $state(true);

    const onclickCoord = (click: CoordinateClick) => {
        selectedStore.set(click);
    };

    const onclickExport = async (click: CoordinateClick) => {
        const { data, error } = await utilsClient.actions("exportToGoogleSheets", { locations: click.locations.filter((e) => e.exported) });
    };

    const onclickLocation = (location: ToggleableGoogleLocation) => {
        location.exported = !location.exported;
    };

    const onclickLocationToggle = (click: CoordinateClick) => {
        click.exported = !click.exported;

        for (const location of click.locations) {
            location.exported = click.exported;
        }
    };

    const onclickVisible = () => {
        isVisible = !isVisible;
    };

    $effect(() => {
        if (!$selectedStore) {
            return;
        }
    });

    onMount(() => {
        const unsub = selectedStore.subscribe(() => {
            for (const oldMarker of mapsState.markers) {
                oldMarker.pin.remove();
                oldMarker.marker.remove();
            }

            if (!$selectedStore) {
                return;
            }

            const newMarkers: typeof mapsState.markers = [];
            const { coord, exported, locations } = $selectedStore;
            const mainPosition = new googleState.CoreLibrary.LatLng(coord.y, coord.x);
            const mainPin = new googleState.MarkerLibrary.PinElement({ background: "#ff0000", borderColor: "#000000", glyphColor: "#ffffff", scale: 0.5 });
            const mainMarker = new googleState.MarkerLibrary.AdvancedMarkerElement({
                content: mainPin.element,
                map: googleState.Map,
                position: mainPosition,
                title: "Mouse Click",
            });

            newMarkers.push({ marker: mainMarker, pin: mainPin });

            for (const loc of $selectedStore.locations) {
                const position = new googleState.CoreLibrary.LatLng(loc.coord.y, loc.coord.x);
                const pin = new googleState.MarkerLibrary.PinElement({ background: "#000000", borderColor: "#000000", glyphColor: "#ffffff" });
                const marker = new googleState.MarkerLibrary.AdvancedMarkerElement({ content: pin.element, map: googleState.Map, position, title: loc.name });
                newMarkers.push({ marker, pin });
            }

            mapsState.markers = newMarkers;
        });

        return () => {
            unsub();
        };
    });
</script>

<div id="clicks">
    <div id="clicks-header">
        <h2>Clicks</h2>
        <button id="clicks-toggle" class={[isVisible ? "active" : ""]} onclick={onclickVisible}>Toggle Panel</button>
    </div>
    {#if isVisible}
        <div id="clicks-container">
            {#if mapsState.clicks.length}
                {#each mapsState.clicks as click}
                    <button class={["click", click === $selectedStore ? "active" : ""]} onclick={() => onclickCoord(click)}>
                        {utils.round(click.coord.x, 3)}, {utils.round(click.coord.y, 3)}
                    </button>
                {/each}
            {:else}
                <div>None so far...</div>
            {/if}
        </div>
        {#if $selectedStore !== undefined}
            <div id="selected-container">
                <div>
                    <span>X:</span>
                    <span>{$selectedStore.coord.x}</span>
                </div>
                <div>
                    <span>Y:</span>
                    <span>{$selectedStore.coord.y}</span>
                </div>
                <div>
                    <span>Radius:</span>
                    <span>{$selectedStore.radius}</span>
                </div>
                <div class="selected-buttons">
                    <button onclick={() => onclickLocationToggle($selectedStore)}>Toggle On/Off Exported</button>
                    <button onclick={() => onclickExport($selectedStore)}>Export to Google Sheets</button>
                </div>
                <div id="locations-container">
                    <span>Locations (click location to toggle):</span>
                    {#each $selectedStore.locations as location}
                        <div class={["location", location.exported ? "exported" : ""]}>
                            <button class="location-toggle" onclick={() => onclickLocation(location)}>
                                {#if location.exported}
                                    DISABLE
                                {:else}
                                    ENABLE
                                {/if}
                            </button>
                            <div class="location-container">
                                <div>
                                    <span>Name:</span>
                                    <span>{location.name}</span>
                                </div>
                                <div>
                                    <span>Address:</span>
                                    <span>{location.address}</span>
                                </div>
                                <div>
                                    {#if location.website}
                                        <a href={location.website} target="_blank">Website</a>
                                    {:else}
                                        <span>NO WEBSITE</span>
                                    {/if}
                                    <a href={utils.searchGoogleMaps(location.address)} target="_blank">Google Maps</a>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    #clicks {
        background-color: white;
        border: 2px solid green;
        display: flex;
        flex-direction: column;
        font-weight: bold;
        gap: 0.1rem;
        left: 50px;
        padding: 0.5rem;
        position: absolute;
        opacity: 80%;
        top: 100px;
        z-index: 1;
    }

    #clicks-container {
        display: flex;
        gap: 1px;
    }

    #clicks-header {
        align-items: center;
        display: flex;
        gap: 2rem;
    }

    #clicks-toggle.active {
        background-color: black;
        color: white;
    }

    #locations-container {
        display: flex;
        flex-direction: column;
        gap: 1px;
        max-height: 440px;
        overflow-y: scroll;
    }

    #selected-container {
        display: flex;
        gap: 0.2rem;
        flex-direction: column;
    }

    #selected-container > * > *:first-child {
        font-weight: bold;
    }

    #selected-container > * > *:not(:not(button):first-child) {
        font-weight: normal;
    }

    .click {
        background-color: white;
        color: black;
        font-size: small;
    }

    .click.active {
        background-color: black;
        color: white;
    }

    .location {
        align-items: center;
        background-color: white;
        border: 1px dotted lightblue;
        display: flex;
        gap: 10px;
        padding: 0.2rem;
    }

    .location:not(.exported) {
        background-color: gray;
        text-decoration: line-through;
    }

    .location-container {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
    }

    .location-toggle {
        width: 90px;
    }
</style>
