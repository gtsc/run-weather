<script lang="ts">
  import { tick } from 'svelte';
  import { weather } from '../lib/stores/weather.svelte';
  import { minutesOfDay } from '../lib/utils/dates';
  import { nextBestRun } from '../lib/scoring/days';
  import { GOOD_SCORE, GREAT_SCORE } from '../lib/utils/chart';
  import BestRun from './BestRun.svelte';
  import DayRow from './DayRow.svelte';
  import HourPanel from './HourPanel.svelte';

  let selectedHourTime = $state<string | null>(null);
  const next = $derived(nextBestRun(weather.days));

  async function showBest() {
    if (!next) return;
    selectedHourTime = next.day.hours[next.window.start].time;
    await tick();
    document.getElementById(`day-${next.day.date}`)?.scrollIntoView({ block: 'nearest' });
  }
</script>

{#if weather.loading}
  <div class="flex flex-col items-center justify-center py-12 gap-3">
    <svg
      class="w-6 h-6 animate-spin text-run-accent"
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
    <p class="text-run-red text-sm" role="alert">{weather.error}</p>
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
    {#if next}
      <BestRun day={next.day} window={next.window} onShow={showBest} />
    {/if}
    <section
      aria-label="Week overview"
      class="rounded-xl bg-run-card border border-run-border p-3 grid grid-cols-[3.25rem_minmax(0,1fr)_4.25rem] gap-x-3 gap-y-3 items-center"
    >
      <span></span>
      <div class="flex justify-between text-[10px] text-run-muted tabular-nums" aria-hidden="true">
        <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
      </div>
      <span class="text-right text-[10px] text-run-muted">Best</span>
      {#each weather.days as day (day.date)}
        <DayRow
          {day}
          {selectedHourTime}
          onHourSelect={(hour) => (selectedHourTime = hour?.time ?? null)}
          nowMinutes={day.dayIndex === 0 ? minutesOfDay(weather.now) : undefined}
        >
          {#snippet panel(hour, score)}
            <HourPanel {hour} {score} onClose={() => (selectedHourTime = null)} />
          {/snippet}
        </DayRow>
      {/each}
    </section>
    <p class="text-xs text-run-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
      <span class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-sm bg-run-great"></span>{GREAT_SCORE}+
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-sm bg-run-good"></span>{GOOD_SCORE}+
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="w-3 h-[3px] rounded-full bg-run-accent"></span>best window
      </span>
      <span>Line: score through the day. Later days are less certain.</span>
    </p>
  </div>
{/if}
