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
  <div class="text-center py-8">
    <p class="text-run-muted">Loading forecast...</p>
  </div>
{:else if weather.error}
  <div class="text-center py-8">
    <p class="text-run-red">{weather.error}</p>
  </div>
{:else if weather.days.length === 0}
  <div class="text-center py-8 text-run-muted">
    <p>Enter a UK postcode to see your running forecast</p>
  </div>
{:else}
  <div class="flex flex-col gap-2">
    {#each weather.days as day}
      <DayStrip
        {day}
        expanded={expandedDay === day.date}
        onToggle={() => toggleDay(day.date)}
      />
      {#if expandedDay === day.date}
        <DayDetail {day} />
      {/if}
    {/each}
  </div>
{/if}
