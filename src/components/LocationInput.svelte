<script lang="ts">
  import { geocodePostcode, geocodeGPS } from '../lib/api/geocoding';
  import { getLocation, setLocation } from '../lib/stores/location.svelte';
  import { loadForecast } from '../lib/stores/weather.svelte';

  let postcode = $state('');
  let searching = $state(false);
  let errorMsg = $state('');

  const location = $derived(getLocation());

  async function handleSearch(): Promise<void> {
    if (!postcode.trim()) return;
    searching = true;
    errorMsg = '';
    try {
      const loc = await geocodePostcode(postcode);
      setLocation(loc);
      await loadForecast(loc.latitude, loc.longitude);
    } catch (e) {
      errorMsg = (e as Error).message;
    } finally {
      searching = false;
    }
  }

  async function handleGPS(): Promise<void> {
    searching = true;
    errorMsg = '';
    try {
      const loc = await geocodeGPS();
      setLocation(loc);
      await loadForecast(loc.latitude, loc.longitude);
    } catch (e) {
      errorMsg = (e as Error).message;
    } finally {
      searching = false;
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') handleSearch();
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex gap-2">
    <input
      type="text"
      bind:value={postcode}
      onkeydown={handleKeydown}
      placeholder="UK postcode (e.g. SW1A)"
      class="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-run-green bg-white text-run-text"
      disabled={searching}
    />
    <button
      onclick={handleSearch}
      disabled={searching || !postcode.trim()}
      class="px-4 py-2 bg-run-green text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
    >
      {searching ? '...' : 'Search'}
    </button>
    <button
      onclick={handleGPS}
      disabled={searching}
      class="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      title="Use my location"
    >
      📍
    </button>
  </div>

  {#if errorMsg}
    <p class="text-run-red text-sm">{errorMsg}</p>
  {/if}

  {#if location}
    <p class="text-run-muted text-sm">📍 {location.name}</p>
  {/if}
</div>
