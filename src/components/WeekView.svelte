<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { weather } from '../lib/stores/weather.svelte';
  import { minutesOfDay } from '../lib/utils/dates';
  import { nextBestRun } from '../lib/scoring/days';
  import { formatDayLabel, formatHour } from '../lib/utils/format';
  import { BAND_BG, BAND_LABEL, GREAT_SCORE, POOR_BELOW } from '../lib/utils/chart';
  import Readout from './Readout.svelte';
  import DayRow from './DayRow.svelte';

  let hovered = $state<ScoredHour | null>(null);
  let pinned = $state<ScoredHour | null>(null);

  const next = $derived(nextBestRun(weather.days));
  const shown = $derived(hovered ?? pinned);
  const dayOf = (hour: ScoredHour) => weather.days.find((d) => d.date === hour.date);

  // Forget a pinned hour that's no longer in the forecast (new location, refresh).
  $effect(() => {
    if (pinned && !weather.days.some((d) => d.hours.some((h) => h.time === pinned!.time))) {
      pinned = null;
    }
  });
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
    {#if weather.cachedAt}
      <p role="status" class="text-xs text-run-muted rounded-lg border border-run-border px-3 py-2">
        You're offline. Showing the forecast from
        {new Date(weather.cachedAt).toLocaleString('en-GB', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}.
      </p>
    {/if}
    {#if shown}
      {@const day = dayOf(shown)}
      <Readout
        kicker={hovered ? 'Hour' : 'Pinned hour'}
        title="{day ? formatDayLabel(day.date, day.dayIndex) : ''}, {formatHour(shown.hour)}"
        hour={shown}
        score={shown.score}
        onClear={pinned ? () => (pinned = null) : undefined}
      />
    {:else if next}
      <Readout
        kicker="Best time to run"
        title="{formatDayLabel(next.day.date, next.day.dayIndex)}, {formatHour(
          next.window.start,
        )}–{formatHour(next.window.end % 24)}"
        hour={next.day.hours[next.window.start]}
        score={next.window.score}
      />
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
          activeTime={shown?.time ?? null}
          pinnedTime={pinned?.time ?? null}
          onHover={(hour) => (hovered = hour)}
          onPin={(hour) => {
            pinned = hour;
            hovered = null;
          }}
          nowMinutes={day.dayIndex === 0 ? minutesOfDay(weather.now) : undefined}
        />
      {/each}
    </section>

    <div class="text-xs text-run-muted flex flex-col gap-1.5 mt-1">
      <p class="flex flex-wrap items-center gap-x-4 gap-y-1">
        {#each [['great', `${GREAT_SCORE}+`], ['ok', `${POOR_BELOW}–${GREAT_SCORE - 1}`], ['poor', `below ${POOR_BELOW}`]] as const as [band, range] (band)}
          <span class="inline-flex items-center gap-1.5">
            <span class="size-2.5 rounded-sm {BAND_BG[band]}"></span>
            <span><span class="text-run-text font-medium">{BAND_LABEL[band]}</span> {range}</span>
          </span>
        {/each}
      </p>
      <p>
        Taller bars are better hours. Hover, or drag along a day, to see that hour above; tap to
        keep it there.
      </p>
    </div>
  </div>
{/if}
