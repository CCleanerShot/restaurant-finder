<script lang="ts">
    import { actions } from "astro:actions";
    import { mapsState } from "~/client/svelte/states/mapsState.svelte";
    import { optionsState } from "~/client/svelte/states/optionsState.svelte";
    import { selectedStore } from "~/client/svelte/stores/selectedStore.svelte";

    const onclickToggle = (e: SvelteClickEvent) => {
        optionsState.toggled = !optionsState.toggled;
    };

    const oninputRadius = (e: SvelteInputEvent) => {
        optionsState.radius = Math.max(e.currentTarget.valueAsNumber, 0); // TODO: way to ignore emitted "The specified value "NaN" cannot be parsed, or is out of range." error on client
    };
</script>

<nav class="neumorphic-nav">
    <div class="nav-content">
        <button 
            id="data-toggle" 
            onclick={onclickToggle} 
            class="toggle-button"
            class:active={optionsState.toggled}
        >
            {#if optionsState.toggled}
                Deactivate
            {:else}
                Activate
            {/if}
            Search
        </button>
        <div class="radius-input-group">
            <label for="data-search">Search Radius (m)</label>
            <input 
                defaultValue={optionsState.radius} 
                id="data-search" 
                min="5" 
                oninput={oninputRadius} 
                type="number" 
                class="neumorphic-input"
            />
        </div>
    </div>
</nav>

<style>
    .neumorphic-nav {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        width: 100vw;
        z-index: 1000;
        padding: 8px 20px;
        background: transparent;
        box-sizing: border-box;
    }
    
    .nav-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 12px 24px;
        background: #e0e0e0;
        border-radius: 50px;
        box-shadow: 
            8px 8px 16px rgba(163, 177, 198, 0.6),
            -8px -8px 16px rgba(255, 255, 255, 0.5);
        box-sizing: border-box;
        width: calc(100% - 40px);
        max-width: calc(1200px - 40px);
    }
    
    .toggle-button {
        padding: 12px 24px;
        border-radius: 50px;
        border: none;
        background: #e0e0e0;
        font-size: 14px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        text-transform: none;
        color: #666;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 
            4px 4px 8px rgba(163, 177, 198, 0.6),
            -4px -4px 8px rgba(255, 255, 255, 0.5);
        outline: none;
        appearance: none;
        user-select: none;
        white-space: nowrap;
        flex-shrink: 0;
    }
    
    .toggle-button:hover {
        box-shadow: 
            6px 6px 12px rgba(163, 177, 198, 0.6),
            -6px -6px 12px rgba(255, 255, 255, 0.5);
        color: #333;
    }
    
    .toggle-button:active {
        box-shadow: 
            inset 4px 4px 8px rgba(163, 177, 198, 0.6),
            inset -4px -4px 8px rgba(255, 255, 255, 0.5);
    }
    
    .toggle-button.active {
        background: linear-gradient(145deg, #d0d0d0, #f0f0f0);
        color: #333;
        box-shadow: 
            inset 4px 4px 8px rgba(163, 177, 198, 0.6),
            inset -4px -4px 8px rgba(255, 255, 255, 0.5);
    }
    
    .radius-input-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
    }
    
    .radius-input-group label {
        font-size: 14px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        text-transform: none;
        color: #666;
        white-space: nowrap;
    }
    
    .neumorphic-input {
        padding: 10px 16px;
        border-radius: 50px;
        border: none;
        background: #e0e0e0;
        font-size: 14px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #333;
        outline: none;
        box-shadow: 
            inset 4px 4px 8px rgba(163, 177, 198, 0.6),
            inset -4px -4px 8px rgba(255, 255, 255, 0.5);
        width: 100px;
        appearance: none;
    }
    
    .neumorphic-input:focus {
        box-shadow: 
            inset 6px 6px 12px rgba(163, 177, 198, 0.6),
            inset -6px -6px 12px rgba(255, 255, 255, 0.5);
    }
    
    .neumorphic-input::-webkit-inner-spin-button,
    .neumorphic-input::-webkit-outer-spin-button {
        appearance: none;
        margin: 0;
    }
</style>
