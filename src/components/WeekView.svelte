<script lang="ts">
  import { getWeatherState } from '../lib/stores/weather.svelte';
  import DayStrip from './DayStrip.svelte';
  import DayDetail from './DayDetail.svelte';

  let expandedDay = $state<string | null>(null);

  const weather = $derived(getWeatherState());

  function toggleDay(date: string): void {
    expandedDay = expandedDay === date ? null : date;
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
    {#each weather.days as day (day.date)}
      <DayStrip {day} expanded={expandedDay === day.date} onToggle={() => toggleDay(day.date)} />
      {#if expandedDay === day.date}
        <DayDetail {day} />
      {/if}
    {/each}
  </div>
{/if}
