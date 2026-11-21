<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { DayData, ScoredHour } from '../lib/types';
  import { formatDayLabel, formatHour, formatShortDayLabel } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';
  import {
    VIEW_W,
    VIEW_H,
    GOOD_SCORE,
    GREAT_SCORE,
    linePath,
    runs,
    xOf,
    yOf,
  } from '../lib/utils/chart';

  let {
    day,
    selectedHourTime = null,
    onHourSelect,
    panel,
    nowMinutes,
  }: {
    day: DayData;
    selectedHourTime?: string | null;
    onHourSelect: (_hour: ScoredHour | null) => void;
    panel?: Snippet<[ScoredHour, number]>;
    /** Minutes since local midnight at the location, for today's "now" marker. */
    nowMinutes?: number;
  } = $props();

  let hovered = $state<number | null>(null);
  let dragged = false;

  const label = $derived(formatDayLabel(day.date, day.dayIndex));
  const shortLabel = $derived(formatShortDayLabel(day.date, day.dayIndex));
  const uncertain = $derived(day.dayIndex > 4);
  const selected = $derived(day.hours.findIndex((h) => h.time === selectedHourTime));
  const active = $derived(hovered ?? (selected >= 0 ? selected : null));
  // Full-height columns behind the curve: the at-a-glance "when is it good" layer.
  const good = $derived(runs(day.scores.map((s) => s >= GOOD_SCORE && s < GREAT_SCORE)));
  const great = $derived(runs(day.scores.map((s) => s >= GREAT_SCORE)));
  const summary = $derived(
    `${label}: score through the day` +
      (day.best
        ? `, best ${formatHour(day.best.start)} to ${formatHour(day.best.end % 24)} at ${day.best.score}`
        : ', no hours left'),
  );
  const sliderValue = $derived(selected >= 0 ? selected : (day.best?.start ?? 12));

  function describe(i: number): string {
    const h = day.hours[i];
    return `${formatHour(h.hour)}, score ${h.score}, ${getWeatherInfo(h.weatherCode).label}, ${Math.round(h.temperature)}°`;
  }

  function hourAt(e: PointerEvent | MouseEvent): number {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.min(23, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * 24)));
  }

  function select(i: number) {
    if (day.hours[i].time !== selectedHourTime) onHourSelect(day.hours[i]);
  }

  // Mouse: hover previews, click pins/unpins. Touch/pen: drag along the row to scan.
  function onpointermove(e: PointerEvent) {
    if (e.pointerType === 'mouse') hovered = hourAt(e);
    else if (e.buttons) {
      dragged = true;
      select(hourAt(e));
    }
  }
  function onclick(e: MouseEvent) {
    if (dragged) return;
    const i = hourAt(e);
    if (i === selected) onHourSelect(null);
    else select(i);
  }
</script>

<div id="day-{day.date}" class="contents">
  <span
    class="text-[13px] whitespace-nowrap {active !== null ? 'font-semibold' : 'text-run-muted'}"
  >
    {shortLabel}
  </span>

  <figure class="m-0 min-w-0">
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events (keyboard uses the range input below) -->
    <div
      class="chart relative h-9 rounded-sm bg-run-night cursor-crosshair touch-pan-y select-none {uncertain
        ? 'opacity-60'
        : ''}"
      {onpointermove}
      onpointerdown={() => (dragged = false)}
      onpointerleave={() => (hovered = null)}
      {onclick}
    >
      <svg
        viewBox="0 0 {VIEW_W} {VIEW_H}"
        preserveAspectRatio="none"
        class="absolute inset-0 w-full h-full overflow-visible rounded-sm"
        role="img"
        aria-label={summary}
      >
        {#each good as [start, end] (start)}
          <rect
            x={(start / 24) * VIEW_W}
            width={((end - start) / 24) * VIEW_W}
            y="0"
            height={VIEW_H}
            class="fill-run-good"
          />
        {/each}
        {#each great as [start, end] (start)}
          <rect
            x={(start / 24) * VIEW_W}
            width={((end - start) / 24) * VIEW_W}
            y="0"
            height={VIEW_H}
            class="fill-run-great"
          />
        {/each}
        <path
          d={linePath(day.scores)}
          class="fill-none stroke-run-green"
          stroke-width="2"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      {#if day.best}
        <span
          class="absolute -bottom-1 h-[3px] rounded-full bg-run-green pointer-events-none"
          style:left="{(day.best.start / 24) * 100}%"
          style:width="{((day.best.end - day.best.start) / 24) * 100}%"
        ></span>
      {/if}
      {#if nowMinutes !== undefined}
        <span
          class="absolute -inset-y-1 w-0.5 -translate-x-1/2 bg-run-text/60 pointer-events-none"
          style:left="{(nowMinutes / 1440) * 100}%"
        ></span>
      {/if}
      {#if active !== null}
        <span
          class="absolute size-2.5 -translate-1/2 rounded-full pointer-events-none ring-2 ring-run-card {active ===
          selected
            ? 'bg-run-green'
            : 'bg-run-card border-2 border-run-green'}"
          style:left="{(xOf(active) / VIEW_W) * 100}%"
          style:top="{(yOf(day.scores[active]) / VIEW_H) * 100}%"
        ></span>
      {/if}
    </div>

    <label class="sr-only">
      {label}, choose an hour
      <input
        type="range"
        min="0"
        max="23"
        step="1"
        value={sliderValue}
        aria-valuetext={describe(sliderValue)}
        oninput={(e) => select(e.currentTarget.valueAsNumber)}
      />
    </label>
  </figure>

  <span class="text-right text-xs tabular-nums whitespace-nowrap">
    {#if active !== null}
      <span class="font-medium">{formatHour(active)}</span>
      <span class="font-semibold ml-1">{day.scores[active]}</span>
    {:else if day.best}
      <span class="text-run-muted">{day.best.start}–{day.best.end}</span>
      <span class="font-semibold ml-1">{day.best.score}</span>
    {:else}
      <span class="text-run-muted">–</span>
    {/if}
  </span>

  {#if selected >= 0 && panel}
    <div class="col-span-3 -mt-1 mb-1">
      {@render panel(day.hours[selected], day.scores[selected])}
    </div>
  {/if}
</div>

<style>
  /* Keyboard focus lands on the visually hidden range input; show it on the chart. */
  figure:has(input:focus-visible) .chart {
    outline: 2px solid var(--color-run-green);
    outline-offset: 3px;
  }
</style>
