<script lang="ts">
    import { optionsState } from "~/client/svelte/states/optionsState.svelte";

    const onclickExport = async (e: SvelteClickEvent) => {
        const response = await fetch("/api/googlesheet");
        console.log(response);
    };

    const onclickToggle = (e: SvelteClickEvent) => {
        optionsState.toggled = !optionsState.toggled;
    };

    const oninputRadius = (e: SvelteInputEvent) => {
        optionsState.radius = Math.max(e.currentTarget.valueAsNumber, 0); // TODO: way to ignore emitted "The specified value "NaN" cannot be parsed, or is out of range." error on client
    };
</script>

<div id="buttons">
    <button id="data-export" onclick={onclickExport}>Export to Google Sheets (WIP)</button>
    <button id="data-toggle" onclick={onclickToggle} class={[optionsState.toggled ? "active" : ""]}>
        {#if optionsState.toggled}
            Deactivate
        {:else}
            Activate
        {/if}
        Search
    </button>
    <div>
        <label for="data-search">Search Radius (m)</label>
        <input defaultValue={optionsState.radius} id="data-search" min="5" oninput={oninputRadius} type="number" />
    </div>
</div>

<style>
    #buttons {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: center;
        padding-bottom: 1rem;
        padding-top: 1rem;
        width: 100%;
    }

    #buttons > * {
        font-size: medium;
        font-weight: bold;
    }

    #data-toggle.active {
        background-color: black;
        color: white;
    }
</style>
