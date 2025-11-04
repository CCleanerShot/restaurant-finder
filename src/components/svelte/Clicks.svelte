<script lang="ts">
    import { onMount } from "svelte";
    import { utils } from "~/common/utils";
    import { utilsClient } from "~/client/utilsClient";
    import type { ToggleableGoogleLocation } from "~/common/types";
    import { mapsState } from "~/client/svelte/states/mapsState.svelte";
    import { googleState } from "~/client/svelte/states/googleState.svelte";
    import { sessionState, type Message } from "~/client/svelte/states/sessionState.svelte";
    import { selectedStore } from "~/client/svelte/stores/selectedStore.svelte";
    import type { CoordinateClick } from "~/common/classes/CoordinateClick.svelte";
    import MapControls from "./MapControls.svelte";

    let isVisible: boolean = $state(true);
    let drawerPosition = $state<'left' | 'right'>('left');
    let isVertical = $state(false);
    let queryInput = $state("");
    let isLoading = $state(false);
    let locationScales: Record<string, number> = $state({});
    let showOnboarding = $state(true);
    let messagesContainer: HTMLDivElement;

    const checkOrientation = () => {
        isVertical = window.innerHeight > window.innerWidth;
    };

    $effect(() => {
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    });

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

    const onclickPositionToggle = () => {
        drawerPosition = drawerPosition === 'left' ? 'right' : 'left';
    };

    $effect(() => {
        if (!$selectedStore) {
            return;
        }
    });

    const handleClassify = async () => {
        if (!queryInput.trim() || isLoading) return;

        isLoading = true;
        const userMessage = queryInput.trim();
        queryInput = "";

        // Add user message to conversation
        sessionState.messages.push({ role: 'user', content: userMessage });

        // Scroll to bottom after adding user message
        setTimeout(() => {
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);

        if (!$selectedStore || !$selectedStore.locations || $selectedStore.locations.length === 0) {
            sessionState.messages.push({ role: 'assistant', content: "Please click on the map first to select locations, then ask me about them." });
            setTimeout(() => {
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 100);
            isLoading = false;
            return;
        }

        try {
            const { data, error } = await utilsClient.actions("classifyLocations", {
                sessionId: sessionState.sessionId,
                message: userMessage,
                locations: $selectedStore.locations,
            });

            if (data && !error) {
                // Add assistant response to conversation
                sessionState.messages.push({ role: 'assistant', content: data.response });
                
                // Scroll to bottom after adding message
                setTimeout(() => {
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }, 100);
                
                // Update location scales based on relevance scores
                const newScales: Record<string, number> = {};
                if (data.relevanceScores && Array.isArray(data.relevanceScores)) {
                    for (const score of data.relevanceScores) {
                        // Scale from 0.3 to 1.5 based on relevance (0.0 to 1.0)
                        newScales[score.locationId] = 0.3 + (score.score * 1.2);
                    }
                    locationScales = newScales;

                    // Update pin scales with animation
                    updatePinScales();
                }
            } else {
                const errorMsg = error?.message || "Sorry, I couldn't process that request. Please try again.";
                sessionState.messages.push({ role: 'assistant', content: errorMsg });
                setTimeout(() => {
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }, 100);
            }
        } catch (err: any) {
            console.error("Classification error:", err);
            const errorMsg = err?.message || "Sorry, there was an error processing your request. Please try again.";
            sessionState.messages.push({ role: 'assistant', content: errorMsg });
            setTimeout(() => {
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 100);
        } finally {
            isLoading = false;
        }
    };

    const updatePinScales = () => {
        if (!mapsState.markers || !googleState.MarkerLibrary) return;

        for (const { marker, pin } of mapsState.markers) {
            // Skip the main click marker (red pin)
            if (pin.scale === 0.5) continue;

            const locationId = marker.title || "";
            const targetScale = locationScales[locationId] || 1.0;

            // Animate scale change with CSS transition
            const pinElement = pin.element as HTMLElement;
            if (pinElement) {
                pinElement.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
                pin.scale = targetScale;
                // Force reflow to trigger animation
                pinElement.offsetHeight;
            }
        }
    };

    onMount(() => {
        const unsub = selectedStore.subscribe(() => {
            for (const oldMarker of mapsState.markers) {
                oldMarker.pin.remove();
                oldMarker.marker.remove();
            }

            if (!$selectedStore) {
                locationScales = {};
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
                const scale = locationScales[loc.id] || 1.0;
                const pin = new googleState.MarkerLibrary.PinElement({ 
                    background: "#000000", 
                    borderColor: "#000000", 
                    glyphColor: "#ffffff",
                    scale: scale
                });
                const marker = new googleState.MarkerLibrary.AdvancedMarkerElement({ 
                    content: pin.element, 
                    map: googleState.Map, 
                    position, 
                    title: loc.id 
                });
                newMarkers.push({ marker, pin });
            }

            mapsState.markers = newMarkers;
        });

        return () => {
            unsub();
        };
    });
</script>

<div class="clicks-panel" class:vertical={isVertical} class:left={drawerPosition === 'left'} class:right={drawerPosition === 'right'} class:visible={isVisible}>
    <div class="clicks-header">
        <button class="hide-button" onclick={onclickVisible}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                {#if drawerPosition === 'left'}
                    <path d="M15 18l-6-6 6-6"/>
                {:else}
                    <path d="M9 18l6-6-6-6"/>
                {/if}
            </svg>
        </button>
        <MapControls />
    </div>
    {#if isVisible}
        <div class="messages-container" bind:this={messagesContainer}>
            {#if showOnboarding && sessionState.messages.length === 0}
                <div class="message assistant onboarding">
                    Click around the map and ask me anything you want
                </div>
            {/if}
            {#each sessionState.messages as message}
                <div class="message" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
                    {message.content}
                </div>
            {/each}
            {#if isLoading}
                <div class="message assistant loading">
                    Thinking...
                </div>
            {/if}
        </div>
        <div class="query-section">
            <div class="query-input-group">
                <input 
                    type="text" 
                    bind:value={queryInput}
                    placeholder="Ask about locations..."
                    class="query-input"
                    onkeydown={(e) => e.key === 'Enter' && handleClassify()}
                    disabled={isLoading}
                />
                <button 
                    class="send-button" 
                    onclick={handleClassify}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    {/if}
</div>

{#if !isVisible}
    <button class="floating-toggle" class:left={drawerPosition === 'left'} class:right={drawerPosition === 'right'} class:vertical={isVertical} onclick={onclickVisible}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            {#if isVertical}
                <path d="M12 19V5M5 12l7-7 7 7"/>
            {:else if drawerPosition === 'left'}
                <path d="M9 18l6-6-6-6"/>
            {:else}
                <path d="M15 18l-6-6 6-6"/>
            {/if}
        </svg>
    </button>
{/if}

<style>
    .clicks-panel {
        position: fixed;
        top: 16px;
        bottom: 16px;
        width: 100%;
        max-width: 420px;
        background: #f0f0f3;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        padding: 24px;
        border-radius: 24px;
        box-shadow: 
            20px 20px 60px rgba(0, 0, 0, 0.08),
            -20px -20px 60px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        overflow-y: auto;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
        gap: 16px;
    }

    .clicks-panel.vertical {
        width: 100%;
        max-width: 100%;
        left: 16px;
        right: 16px;
        border-radius: 24px;
    }

    .clicks-panel.vertical.visible {
        transform: translateX(0);
    }

    .clicks-panel.vertical:not(.visible) {
        transform: translateY(-100%);
    }

    .clicks-panel.left {
        left: 16px;
        transform: translateX(calc(-100% - 32px));
    }

    .clicks-panel.left.visible {
        transform: translateX(0);
    }

    .clicks-panel.right {
        right: 16px;
        transform: translateX(calc(100% + 32px));
    }

    .clicks-panel.right.visible {
        transform: translateX(0);
    }

    .clicks-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 12px;
    }

    .hide-button {
        width: 36px;
        height: 36px;
        padding: 0;
        border-radius: 12px;
        border: none;
        background: #f0f0f3;
        font-size: 18px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #5a6c7d;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.06),
            -4px -4px 8px rgba(255, 255, 255, 0.9);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }

    .hide-button svg {
        width: 16px;
        height: 16px;
    }

    .hide-button:hover {
        box-shadow: 
            6px 6px 12px rgba(0, 0, 0, 0.08),
            -6px -6px 12px rgba(255, 255, 255, 0.9);
        color: #2c3e50;
        transform: translateY(-1px);
    }

    .hide-button:active {
        box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.08),
            inset -3px -3px 6px rgba(255, 255, 255, 0.9);
        transform: translateY(0);
    }

    .clicks-header :global(.map-type-switcher) {
        position: relative;
        top: 0;
        left: 0;
        transform: none;
        flex: 1;
        width: auto;
    }

    .query-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: auto;
        padding-top: 16px;
        flex-shrink: 0;
    }

    .messages-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        padding-bottom: 8px;
    }

    .messages-container::-webkit-scrollbar {
        width: 6px;
    }

    .messages-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.15);
    }

    .message {
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        max-width: 85%;
        word-wrap: break-word;
    }

    .message.user {
        align-self: flex-end;
        background: #000000;
        color: #ffffff;
        box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.15),
            -4px -4px 8px rgba(255, 255, 255, 0.1);
    }

    .message.assistant {
        align-self: flex-start;
        background: linear-gradient(145deg, #e8e8eb, #f8f8fb);
        color: #2c3e50;
        box-shadow: 
            8px 8px 16px rgba(163, 177, 198, 0.4),
            -8px -8px 16px rgba(255, 255, 255, 0.95),
            inset 1px 1px 2px rgba(255, 255, 255, 0.6),
            inset -1px -1px 2px rgba(163, 177, 198, 0.2);
    }

    .message.loading {
        opacity: 0.7;
        font-style: italic;
    }

    .message.assistant.onboarding {
        animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        background: linear-gradient(145deg, #e8e8eb, #f8f8fb);
        box-shadow: 
            10px 10px 20px rgba(163, 177, 198, 0.35),
            -10px -10px 20px rgba(255, 255, 255, 1),
            inset 2px 2px 4px rgba(255, 255, 255, 0.7),
            inset -2px -2px 4px rgba(163, 177, 198, 0.25);
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .query-input-group {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .query-input {
        flex: 1;
        padding: 12px 18px;
        border-radius: 16px;
        border: none;
        background: linear-gradient(145deg, #d8d8db, #e8e8eb);
        font-size: 13px;
        font-weight: 500;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #2c3e50;
        outline: none;
        box-shadow: 
            inset 6px 6px 12px rgba(163, 177, 198, 0.5),
            inset -6px -6px 12px rgba(255, 255, 255, 0.7),
            inset 1px 1px 2px rgba(163, 177, 198, 0.3),
            inset -1px -1px 2px rgba(255, 255, 255, 0.9);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .query-input:focus {
        background: linear-gradient(145deg, #d8d8db, #e8e8eb);
        box-shadow: 
            inset 7px 7px 14px rgba(163, 177, 198, 0.55),
            inset -7px -7px 14px rgba(255, 255, 255, 0.75),
            inset 1px 1px 2px rgba(163, 177, 198, 0.35),
            inset -1px -1px 2px rgba(255, 255, 255, 0.95);
    }

    .query-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .query-input::placeholder {
        color: #9ba5b0;
    }

    .query-input-group .send-button {
        width: 36px;
        height: 36px;
        padding: 0;
        border-radius: 12px;
        border: none;
        background-color: #000000 !important;
        background: #000000 !important;
        color: #ffffff !important;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.2),
            -4px -4px 8px rgba(255, 255, 255, 0.1);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }

    .query-input-group .send-button svg {
        width: 16px;
        height: 16px;
    }

    .query-input-group .send-button:hover {
        box-shadow: 
            6px 6px 12px rgba(0, 0, 0, 0.3),
            -6px -6px 12px rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
        background-color: #1a1a1a !important;
        background: #1a1a1a !important;
    }

    .query-input-group .send-button:active {
        box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.4),
            inset -3px -3px 6px rgba(255, 255, 255, 0.1);
        transform: translateY(0);
    }


    .clicks-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .click-button {
        padding: 14px 20px;
        border: none;
        background: transparent;
        font-size: 13px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #5a6c7d;
        text-align: center;
        letter-spacing: 0.01em;
    }

    .empty-state {
        padding: 20px;
        text-align: center;
        color: #9ba5b0;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-style: italic;
    }

    .selected-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .info-row {
        padding: 14px 20px;
        border-radius: 16px;
        background: #f0f0f3;
        box-shadow: 
            5px 5px 10px rgba(0, 0, 0, 0.06),
            -5px -5px 10px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #5a6c7d;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .label {
        font-weight: 700;
        color: #2c3e50;
        font-size: 12px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.7;
    }

    .selected-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .action-button {
        padding: 14px 20px;
        border-radius: 16px;
        border: none;
        background: #f0f0f3;
        font-size: 13px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #5a6c7d;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
            5px 5px 10px rgba(0, 0, 0, 0.06),
            -5px -5px 10px rgba(255, 255, 255, 0.9);
        letter-spacing: 0.02em;
    }

    .action-button:hover {
        box-shadow: 
            8px 8px 16px rgba(0, 0, 0, 0.08),
            -8px -8px 16px rgba(255, 255, 255, 0.9);
        color: #2c3e50;
        transform: translateY(-2px);
    }

    .action-button:active {
        box-shadow: 
            inset 4px 4px 8px rgba(0, 0, 0, 0.08),
            inset -4px -4px 8px rgba(255, 255, 255, 0.9);
        transform: translateY(0);
    }

    .locations-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-height: 400px;
        overflow-y: auto;
        padding-right: 4px;
    }

    .locations-container::-webkit-scrollbar {
        width: 6px;
    }

    .locations-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .locations-container::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
    }

    .locations-container::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.15);
    }

    .locations-title {
        font-size: 12px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #2c3e50;
        padding: 12px 18px;
        border-radius: 16px;
        background: #f0f0f3;
        box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.06),
            -4px -4px 8px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.8;
    }

    .location-card {
        border-radius: 20px;
        background: #f0f0f3;
        box-shadow: 
            6px 6px 12px rgba(0, 0, 0, 0.06),
            -6px -6px 12px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
    }

    .location-card:hover {
        box-shadow: 
            10px 10px 20px rgba(0, 0, 0, 0.08),
            -10px -10px 20px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        transform: translateY(-2px);
    }

    .location-card:not(.exported) {
        opacity: 0.65;
        filter: grayscale(0.4);
    }

    .location-image {
        width: 100%;
        height: 180px;
        overflow: hidden;
        background: linear-gradient(145deg, #e8e8eb, #f8f8fb);
        position: relative;
    }

    .location-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .location-content {
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .location-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
    }

    .location-name {
        font-size: 18px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #2c3e50;
        margin: 0;
        line-height: 1.3;
        flex: 1;
    }

    .location-rating {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        padding: 4px 8px;
        border-radius: 8px;
        background: linear-gradient(145deg, #e8e8eb, #f8f8fb);
        box-shadow: 
            inset 2px 2px 4px rgba(0, 0, 0, 0.06),
            inset -2px -2px 4px rgba(255, 255, 255, 0.9);
    }

    .star-icon {
        color: #ffa500;
        width: 14px;
        height: 14px;
    }

    .rating-value {
        font-size: 13px;
        font-weight: 700;
        color: #2c3e50;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .review-count {
        font-size: 11px;
        color: #7a8a9a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .location-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .tag {
        padding: 6px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        text-transform: capitalize;
        letter-spacing: 0.02em;
        box-shadow: 
            2px 2px 4px rgba(0, 0, 0, 0.06),
            -2px -2px 4px rgba(255, 255, 255, 0.9);
    }

    .category-tag {
        background: linear-gradient(145deg, #e8e8eb, #f8f8fb);
        color: #5a6c7d;
    }

    .price-tag {
        background: linear-gradient(145deg, #d0e8f0, #e8f5f8);
        color: #4a90e2;
    }

    .location-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #5a6c7d;
        line-height: 1.4;
    }

    .detail-icon {
        color: #7a8a9a;
        flex-shrink: 0;
        width: 14px;
        height: 14px;
    }

    .detail-item a {
        color: #4a90e2;
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .detail-item a:hover {
        color: #357abd;
        text-decoration: underline;
    }

    .location-actions {
        display: flex;
        gap: 10px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
    }

    .action-link {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 12px;
        background: linear-gradient(145deg, #e8e8eb, #f8f8fb);
        color: #4a90e2;
        text-decoration: none;
        font-size: 12px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
            2px 2px 4px rgba(0, 0, 0, 0.06),
            -2px -2px 4px rgba(255, 255, 255, 0.9);
    }

    .action-link:hover {
        box-shadow: 
            4px 4px 8px rgba(0, 0, 0, 0.08),
            -4px -4px 8px rgba(255, 255, 255, 0.9);
        transform: translateY(-1px);
        color: #357abd;
    }

    .action-link:active {
        box-shadow: 
            inset 2px 2px 4px rgba(0, 0, 0, 0.08),
            inset -2px -2px 4px rgba(255, 255, 255, 0.9);
        transform: translateY(0);
    }

    .action-link svg {
        width: 14px;
        height: 14px;
    }

    .floating-toggle {
        position: fixed;
        padding: 14px;
        border-radius: 16px;
        border: none;
        background: #f0f0f3;
        font-size: 13px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: #5a6c7d;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 
            8px 8px 16px rgba(0, 0, 0, 0.08),
            -8px -8px 16px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.02em;
    }

    .floating-toggle.left {
        top: 50%;
        left: 16px;
        transform: translateY(-50%);
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        width: 44px;
        height: 44px;
    }

    .floating-toggle.right {
        top: 50%;
        right: 16px;
        transform: translateY(-50%);
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        width: 44px;
        height: 44px;
    }

    .floating-toggle.vertical {
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 16px;
        width: 44px;
        height: 44px;
    }

    .floating-toggle.left:hover {
        box-shadow: 
            12px 12px 24px rgba(0, 0, 0, 0.1),
            -12px -12px 24px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        color: #2c3e50;
        transform: translateY(-50%) translateX(4px);
    }

    .floating-toggle.right:hover {
        box-shadow: 
            12px 12px 24px rgba(0, 0, 0, 0.1),
            -12px -12px 24px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        color: #2c3e50;
        transform: translateY(-50%) translateX(-4px);
    }

    .floating-toggle.vertical:hover {
        box-shadow: 
            12px 12px 24px rgba(0, 0, 0, 0.1),
            -12px -12px 24px rgba(255, 255, 255, 0.9),
            inset 0 0 0 1px rgba(255, 255, 255, 0.5);
        color: #2c3e50;
        transform: translateX(-50%) translateY(4px);
    }

    .floating-toggle.left:active {
        box-shadow: 
            inset 4px 4px 8px rgba(0, 0, 0, 0.08),
            inset -4px -4px 8px rgba(255, 255, 255, 0.9);
        transform: translateY(-50%);
    }

    .floating-toggle.right:active {
        box-shadow: 
            inset 4px 4px 8px rgba(0, 0, 0, 0.08),
            inset -4px -4px 8px rgba(255, 255, 255, 0.9);
        transform: translateY(-50%);
    }

    .floating-toggle.vertical:active {
        box-shadow: 
            inset 4px 4px 8px rgba(0, 0, 0, 0.08),
            inset -4px -4px 8px rgba(255, 255, 255, 0.9);
        transform: translateX(-50%);
    }

    .floating-toggle svg {
        flex-shrink: 0;
    }
</style>
