<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { getWeatherState } from '../lib/stores/weather.svelte';
  import { getAuthState } from '../lib/stores/auth.svelte';
  import DayStrip from './DayStrip.svelte';
  import HourPanel from './HourPanel.svelte';

  let selectedHourTime = $state<string | null>(null);
  let showRecent = $state(false);

  const weather = $derived(getWeatherState());
  const auth = $derived(getAuthState());
  const pastDays = $derived(weather.days.filter((d) => d.dayIndex < 0));
  const forecastDays = $derived(weather.days.filter((d) => d.dayIndex >= 0));

  function handleHourSelect(hour: ScoredHour | null) {
    selectedHourTime = hour ? hour.time : null;
  }
</script>

{#if weather.loading}
  <div class="flex flex-col items-center justify-center py-12 gap-3">
    <svg
      class="w-6 h-6 animate-spin text-run-green"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
      ></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      ></path>
    </svg>
    <p class="text-run-muted text-sm">Loading forecast...</p>
  </div>
{:else if weather.error}
  <div class="text-center py-12">
    <p class="text-run-red text-sm">{weather.error}</p>
  </div>
{:else if weather.days.length === 0}
  <div class="flex flex-col items-center justify-center py-16 gap-2 text-run-muted">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-10 h-10 opacity-30"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
      />
    </svg>
    <p class="text-sm">Search for a location to see your running forecast</p>
  </div>
{:else}
  <div class="flex flex-col gap-2">
    {#if auth.user && pastDays.length > 0}
      <div>
        <button
          onclick={() => (showRecent = !showRecent)}
          class="flex items-center gap-1.5 text-xs text-run-muted hover:text-run-text transition-colors mb-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-3 h-3 transition-transform {showRecent ? 'rotate-90' : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {showRecent ? 'Hide recent days' : 'Show recent days'}
        </button>

        {#if showRecent}
          <div class="flex flex-col gap-2 mb-2">
            {#each pastDays as day (day.date)}
              {@const selectedInThisDay =
                selectedHourTime && day.hours.some((h) => h.time === selectedHourTime)
                  ? selectedHourTime
                  : null}
              <DayStrip {day} selectedHourTime={selectedInThisDay} onHourSelect={handleHourSelect}>
                {#snippet panel(hour: ScoredHour, score: number)}
                  <HourPanel {hour} {score} onClose={() => (selectedHourTime = null)} />
                {/snippet}
              </DayStrip>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#each forecastDays as day (day.date)}
      {@const selectedInThisDay =
        selectedHourTime && day.hours.some((h) => h.time === selectedHourTime)
          ? selectedHourTime
          : null}
      <DayStrip
        {day}
        selectedHourTime={selectedInThisDay}
        onHourSelect={handleHourSelect}
        isToday={day.dayIndex === 0}
      >
        {#snippet panel(hour: ScoredHour, score: number)}
          <HourPanel {hour} {score} onClose={() => (selectedHourTime = null)} />
        {/snippet}
      </DayStrip>
    {/each}
  </div>
{/if}
