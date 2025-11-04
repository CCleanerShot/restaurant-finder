<script lang="ts">
    import { googleState } from "~/client/svelte/states/googleState.svelte";
    
    let mapType = $state<'roadmap' | 'satellite'>('roadmap');
    
    $effect(() => {
        if (googleState.Map) {
            // Sync with current map type
            const currentMapType = googleState.Map.getMapTypeId();
            if (currentMapType === google.maps.MapTypeId.SATELLITE || currentMapType === google.maps.MapTypeId.HYBRID) {
                mapType = 'satellite';
            } else {
                mapType = 'roadmap';
            }
        }
    });
    
    const toggleMapType = () => {
        if (!googleState.Map) return;
        mapType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
        googleState.Map.setMapTypeId(mapType === 'roadmap' ? google.maps.MapTypeId.ROADMAP : google.maps.MapTypeId.SATELLITE);
    };
</script>

<div class="map-type-switcher">
    <div class="slider-track" class:satellite={mapType === 'satellite'}>
        <div class="slider-pill"></div>
    </div>
    <button 
        class="switcher-button" 
        class:active={mapType === 'roadmap'}
        onclick={toggleMapType}
        aria-label="Show street map"
        type="button"
    >
        Map
    </button>
    <button 
        class="switcher-button" 
        class:active={mapType === 'satellite'}
        onclick={toggleMapType}
        aria-label="Show satellite imagery"
        type="button"
    >
        Satellite
    </button>
</div>

<style>
    .map-type-switcher {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        background: #f0f0f3;
        border-radius: 16px;
        padding: 5px;
        box-shadow: 
            6px 6px 12px rgba(0, 0, 0, 0.06),
            -6px -6px 12px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        z-index: 1000;
        overflow: hidden;
        box-sizing: border-box;
        width: 100%;
        max-width: 100%;
    }
    
    .slider-track {
        position: absolute;
        top: 5px;
        left: 5px;
        width: calc(50% - 5px);
        height: calc(100% - 10px);
        border-radius: 12px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(0);
        pointer-events: none;
    }
    
    .slider-track.satellite {
        transform: translateX(calc(100% + 5px));
    }
    
    .slider-pill {
        width: 100%;
        height: 100%;
        background: linear-gradient(145deg, #e8e8eb, #f8f8fb);
        border-radius: 12px;
        box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.08),
            -4px -4px 8px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    }
    
    .switcher-button {
        background: transparent;
        border: none;
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #5a6c7d;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1;
        outline: none;
        text-transform: none;
        appearance: none;
        user-select: none;
        flex: 1 1 0;
        min-width: 0;
        max-width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        box-sizing: border-box;
        letter-spacing: 0.01em;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    
    .switcher-button:hover {
        color: #2c3e50;
    }
    
    .switcher-button.active {
        color: #2c3e50;
    }
</style>

