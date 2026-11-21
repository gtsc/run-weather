<script lang="ts">
  import type { DayData, ScoredHour } from '../lib/types';
  import { formatDayLabel, formatHour, formatShortDayLabel } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';
  import { BAND_BG, BAND_LABEL, bandOf } from '../lib/utils/chart';

  let {
    day,
    activeTime = null,
    pinnedTime = null,
    onHover,
    onPin,
    nowMinutes,
  }: {
    day: DayData;
    /** Hour currently shown in the readout (hovered or pinned). */
    activeTime?: string | null;
    pinnedTime?: string | null;
    onHover: (_hour: ScoredHour | null) => void;
    onPin: (_hour: ScoredHour | null) => void;
    /** Minutes since local midnight at the location, for today's "now" marker. */
    nowMinutes?: number;
  } = $props();

  let dragged = false;

  const label = $derived(formatDayLabel(day.date, day.dayIndex));
  const certainty = $derived(day.dayIndex > 4 ? 'uncertain' : day.dayIndex > 1 ? 'approx.' : null);
  const active = $derived(day.hours.findIndex((h) => h.time === activeTime));
  const pinned = $derived(day.hours.findIndex((h) => h.time === pinnedTime));
  const sliderValue = $derived(pinned >= 0 ? pinned : (day.best?.start ?? 12));
  const summary = $derived(
    `${label}: ` +
      (['great', 'ok', 'poor'] as const)
        .map((b) => `${day.scores.filter((s) => bandOf(s) === b).length} ${BAND_LABEL[b]} hours`)
        .join(', ') +
      (day.best
        ? `; best ${formatHour(day.best.start)} to ${formatHour(day.best.end % 24)}, score ${day.best.score}`
        : ''),
  );

  function describe(i: number): string {
    const h = day.hours[i];
    return `${formatHour(h.hour)}, ${BAND_LABEL[bandOf(h.score)]}, score ${h.score}, ${getWeatherInfo(h.weatherCode).label}, ${Math.round(h.temperature)}°`;
  }

  function hourAt(e: PointerEvent | MouseEvent): ScoredHour {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const i = Math.floor(((e.clientX - rect.left) / rect.width) * 24);
    return day.hours[Math.min(23, Math.max(0, i))];
  }

  // Mouse: hover shows the hour in the readout, click pins it (click again to unpin).
  // Touch/pen: drag along the day and the readout follows your finger; lifting keeps it.
  function onpointermove(e: PointerEvent) {
    if (e.pointerType === 'mouse') onHover(hourAt(e));
    else if (e.buttons) {
      dragged = true;
      onPin(hourAt(e));
    }
  }
  function onclick(e: MouseEvent) {
    if (dragged) return;
    const hour = hourAt(e);
    onPin(hour.time === pinnedTime ? null : hour);
  }
</script>

<span id="day-{day.date}" class="scroll-mt-40 flex flex-col leading-tight">
  <span class="text-[13px] whitespace-nowrap {active >= 0 ? 'font-semibold' : 'text-run-muted'}">
    {formatShortDayLabel(day.date, day.dayIndex)}
  </span>
  {#if certainty}
    <span class="text-[10px] text-run-muted/80 whitespace-nowrap">{certainty}</span>
  {/if}
</span>

<figure class="m-0 min-w-0">
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events (keyboard uses the range input below) -->
  <div
    class="bars relative h-10 cursor-crosshair touch-pan-y select-none"
    role="img"
    aria-label={summary}
    {onpointermove}
    onpointerdown={() => (dragged = false)}
    onpointerleave={() => onHover(null)}
    {onclick}
  >
    {#if active >= 0}
      <span
        class="absolute -inset-y-1.5 rounded bg-run-text/20 ring-1 ring-run-text/30 pointer-events-none"
        style:left="{(active / 24) * 100}%"
        style:width="{100 / 24}%"
      ></span>
    {/if}
    <div class="absolute inset-0 flex items-end gap-px pointer-events-none">
      {#each day.scores as score, i (i)}
        <span
          class="flex-1 rounded-t-[2px] {BAND_BG[bandOf(score)]}"
          style:height="{Math.max(score, 6)}%"
        ></span>
      {/each}
    </div>
    {#if nowMinutes !== undefined}
      <span
        class="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 rounded-full bg-run-text pointer-events-none"
        style:left="{(nowMinutes / 1440) * 100}%"
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
      oninput={(e) => onPin(day.hours[e.currentTarget.valueAsNumber])}
    />
  </label>
</figure>

<span class="text-right text-xs tabular-nums whitespace-nowrap">
  {#if active >= 0}
    <span class="font-medium">{formatHour(active)}</span>
    <span class="font-semibold ml-1">{day.scores[active]}</span>
  {:else if day.best}
    <span class="text-run-muted">{day.best.start}–{day.best.end}</span>
    <span class="font-semibold ml-1">{day.best.score}</span>
  {:else}
    <span class="text-run-muted">–</span>
  {/if}
</span>

<style>
  /* Keyboard focus lands on the visually hidden range input; show it on the bars. */
  figure:has(input:focus-visible) .bars {
    outline: 2px solid var(--color-run-accent);
    outline-offset: 4px;
    border-radius: 2px;
  }
</style>
