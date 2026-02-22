<script lang="ts">
  import { geocodeLocation, geocodeGPS } from '../lib/api/geocoding';
  import { getLocation, setLocation } from '../lib/stores/location.svelte';
  import { loadForecast } from '../lib/stores/weather.svelte';

  let query = $state('');
  let searching = $state(false);
  let errorMsg = $state('');

  const location = $derived(getLocation());

  async function handleSearch(): Promise<void> {
    if (!query.trim()) return;
    searching = true;
    errorMsg = '';
    try {
      const loc = await geocodeLocation(query);
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
    <div class="relative flex-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-run-muted pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        bind:value={query}
        onkeydown={handleKeydown}
        placeholder="City, postcode, or place name"
        class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-run-border text-sm focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green bg-run-card text-run-text transition-shadow"
        disabled={searching}
      />
    </div>
    <button
      onclick={handleSearch}
      disabled={searching || !query.trim()}
      class="px-5 py-2.5 bg-run-green text-white rounded-xl text-sm font-medium hover:bg-run-green/90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
    >
      {#if searching}
        <svg
          class="w-4 h-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
      {:else}
        Search
      {/if}
    </button>
    <button
      onclick={handleGPS}
      disabled={searching}
      class="px-3 py-2.5 bg-run-card border border-run-border rounded-xl text-sm hover:bg-run-border/30 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
      title="Use my location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 text-run-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  </div>

  {#if errorMsg}
    <p class="text-run-red text-sm">{errorMsg}</p>
  {/if}

  {#if location}
    <div class="flex items-center gap-1.5 text-run-muted text-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span>{location.name}</span>
    </div>
  {/if}
</div>
