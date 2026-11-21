<script lang="ts">
  import type { Location } from '../lib/types';
  import { geocodeLocation, geocodeGPS } from '../lib/api/geocoding';
  import { location, setLocation } from '../lib/stores/location.svelte';
  import { weather } from '../lib/stores/weather.svelte';

  let query = $state('');
  let searching = $state(false);
  let errorMsg = $state('');

  async function run(resolve: () => Promise<Location>): Promise<void> {
    searching = true;
    errorMsg = '';
    try {
      const loc = await resolve();
      setLocation(loc);
      await weather.load(loc);
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      searching = false;
    }
  }

  // Reload the forecast for the remembered location on startup.
  if (location.current) weather.load(location.current);

  function handleSubmit(e: SubmitEvent): void {
    e.preventDefault();
    if (query.trim()) run(() => geocodeLocation(query));
  }
</script>

<div class="flex flex-col gap-2">
  <form class="flex gap-2" role="search" onsubmit={handleSubmit}>
    <div class="relative flex-1">
      <svg
        aria-hidden="true"
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
        type="search"
        bind:value={query}
        aria-label="Location"
        autocomplete="off"
        enterkeyhint="search"
        placeholder="Search a place"
        class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-run-border text-sm pointer-coarse:text-base focus:outline-none focus:ring-2 focus:ring-run-accent/30 focus:border-run-accent bg-run-card text-run-text transition-shadow"
        disabled={searching}
      />
    </div>
    <button
      type="submit"
      disabled={searching || !query.trim()}
      class="px-5 py-2.5 bg-run-accent text-run-on-accent rounded-xl text-sm font-medium hover:bg-run-accent/90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
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
      type="button"
      onclick={() => run(geocodeGPS)}
      disabled={searching}
      class="px-3 py-2.5 bg-run-card border border-run-border rounded-xl text-sm hover:bg-run-border/30 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
      title="Use my location"
      aria-label="Use my location"
    >
      <svg
        aria-hidden="true"
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
  </form>

  {#if errorMsg}
    <p class="text-run-red text-sm" role="alert">{errorMsg}</p>
  {/if}

  {#if location.current}
    <div class="flex items-center gap-1.5 text-run-muted text-sm">
      <svg
        aria-hidden="true"
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
      <span>{location.current.name}</span>
    </div>
  {/if}
</div>
