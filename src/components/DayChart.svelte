<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { DayData, ScoredHour } from '../lib/types';
  import { formatDayLabel, formatHour } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';
  import {
    VIEW_W,
    VIEW_H,
    GOOD_SCORE,
    areaPath,
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

  const id = $props.id();
  let hovered = $state<number | null>(null);
  let dragged = false;

  const label = $derived(formatDayLabel(day.date, day.dayIndex));
  const confidence = $derived(day.dayIndex <= 1 ? null : day.dayIndex <= 4 ? 'moderate' : 'low');
  const selected = $derived(day.hours.findIndex((h) => h.time === selectedHourTime));
  const active = $derived(hovered ?? (selected >= 0 ? selected : null));
  const nights = $derived(runs(day.hours.map((h) => !h.isDay)));
  const bestRange = $derived(
    day.best ? `${formatHour(day.best.start)}–${formatHour(day.best.end % 24)}` : null,
  );
  const summary = $derived(
    `${label}: score through the day` +
      (day.best ? `, best ${bestRange} at ${day.best.score}` : ', no hours left'),
  );

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

  // Mouse: hover previews, click pins/unpins. Touch/pen: drag along the curve to scan.
  function onpointermove(e: PointerEvent) {
    if (e.pointerType === 'mouse') hovered = hourAt(e);
    else if (e.buttons) {
      dragged = true;
      select(hourAt(e));
    }
  }
  function onpointerdown() {
    dragged = false;
  }
  function onclick(e: MouseEvent) {
    if (dragged) return;
    const i = hourAt(e);
    if (i === selected) onHourSelect(null);
    else select(i);
  }
</script>

<section
  id="day-{day.date}"
  class="rounded-xl bg-run-card border border-run-border p-4 scroll-mt-4"
  aria-labelledby="{id}-day"
>
  <div class="flex items-baseline justify-between gap-3 mb-2">
    <div class="flex items-center gap-2">
      <h2 id="{id}-day" class="font-medium text-sm">{label}</h2>
      {#if confidence}
        <span
          class="text-[10px] px-1.5 py-0.5 rounded {confidence === 'low'
            ? 'bg-run-amber/10 text-run-amber'
            : 'bg-run-border/50 text-run-muted'}"
        >
          {confidence === 'low' ? 'Less reliable' : 'Approx.'}
        </span>
      {/if}
    </div>
    <p class="text-xs text-run-muted tabular-nums text-right">
      {#if hovered !== null}
        <span class="text-run-text font-medium">{formatHour(hovered)}</span>
        score <span class="text-run-text font-semibold">{day.scores[hovered]}</span>
      {:else if day.best}
        Best <span class="text-run-text font-medium">{bestRange}</span>
        <span class="text-run-text font-semibold ml-1">{day.best.score}</span>
      {:else}
        No hours left
      {/if}
    </p>
  </div>

  <figure class="m-0">
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events (keyboard uses the range input below) -->
    <div
      class="chart relative h-16 rounded-md cursor-crosshair touch-pan-y select-none {confidence ===
      'low'
        ? 'opacity-70'
        : ''}"
      {onpointermove}
      {onpointerdown}
      onpointerleave={() => (hovered = null)}
      {onclick}
    >
      <svg
        viewBox="0 0 {VIEW_W} {VIEW_H}"
        preserveAspectRatio="none"
        class="absolute inset-0 w-full h-full overflow-visible"
        role="img"
        aria-label={summary}
      >
        {#each nights as [start, end] (start)}
          <rect
            x={(start / 24) * VIEW_W}
            width={((end - start) / 24) * VIEW_W}
            y="0"
            height={VIEW_H}
            class="fill-run-night"
          />
        {/each}
        <line
          x1="0"
          x2={VIEW_W}
          y1={yOf(GOOD_SCORE)}
          y2={yOf(GOOD_SCORE)}
          class="stroke-run-muted/40"
          stroke-dasharray="3 3"
          vector-effect="non-scaling-stroke"
        />
        {#if day.best}
          <rect
            x={(day.best.start / 24) * VIEW_W}
            width={((day.best.end - day.best.start) / 24) * VIEW_W}
            y="0"
            height={VIEW_H}
            class="fill-run-green/15"
          />
        {/if}
        <path d={areaPath(day.scores)} class="fill-run-green/12" />
        <path
          d={linePath(day.scores)}
          class="fill-none stroke-run-green"
          stroke-width="2"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      {#if nowMinutes !== undefined}
        <span
          class="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-run-text/50 pointer-events-none"
          style:left="{(nowMinutes / 1440) * 100}%"
        ></span>
      {/if}
      {#if active !== null}
        <span
          class="absolute size-3 -translate-1/2 rounded-full pointer-events-none ring-2 ring-run-card {active ===
          selected
            ? 'bg-run-green'
            : 'bg-run-card border-2 border-run-green'}"
          style:left="{(xOf(active) / VIEW_W) * 100}%"
          style:top="{(yOf(day.scores[active]) / VIEW_H) * 100}%"
        ></span>
      {/if}
    </div>

    <div class="flex justify-between mt-1.5 text-[10px] text-run-muted" aria-hidden="true">
      <span>00:00</span>
      <span>06:00</span>
      <span>12:00</span>
      <span>18:00</span>
      <span>23:00</span>
    </div>

    <label class="sr-only">
      {label}, choose an hour
      <input
        type="range"
        min="0"
        max="23"
        step="1"
        value={selected >= 0 ? selected : (day.best?.start ?? 12)}
        aria-valuetext={describe(selected >= 0 ? selected : (day.best?.start ?? 12))}
        oninput={(e) => select(e.currentTarget.valueAsNumber)}
      />
    </label>
  </figure>

  {#if selected >= 0 && panel}
    {@render panel(day.hours[selected], day.scores[selected])}
  {/if}
</section>

<style>
  /* Keyboard focus lands on the visually hidden range input; show it on the chart. */
  figure:has(input:focus-visible) .chart {
    outline: 2px solid var(--color-run-green);
    outline-offset: 4px;
  }
</style>
