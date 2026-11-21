<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { formatTemp, formatWind } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';
  import { BAND_BG, BAND_LABEL, bandOf } from '../lib/utils/chart';

  /**
   * The one detail surface: shows the best upcoming run by default, or the hour being
   * hovered, dragged over, or pinned. Sticky so it stays in view while scanning the week.
   */
  let {
    kicker,
    title,
    hour,
    score,
    onClear,
  }: {
    kicker: string;
    title: string;
    hour: ScoredHour;
    score: number;
    /** Present when an hour is pinned: returns to the best time. */
    onClear?: () => void;
  } = $props();

  const band = $derived(bandOf(score));
  const conditions = $derived(
    [
      getWeatherInfo(hour.weatherCode).label,
      `${formatTemp(hour.temperature)} (feels ${formatTemp(hour.feelsLike)})`,
      `wind ${formatWind(hour.windSpeed)}`,
      `rain ${hour.precipProbability}%`,
      hour.snowDepth > 0 ? `snow ${Math.round(hour.snowDepth * 100)} cm` : null,
      hour.isDay ? null : 'dark',
    ]
      .filter(Boolean)
      .join(', '),
  );
</script>

<section
  aria-label="Hour details"
  class="sticky top-[calc(env(safe-area-inset-top)+0.5rem)] z-10 rounded-xl bg-run-card border border-run-border p-4 shadow-sm"
>
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <p class="text-xs text-run-muted">{kicker}</p>
      <p class="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">{title}</p>
    </div>
    <div class="text-right shrink-0">
      <p class="text-2xl font-bold leading-none tabular-nums">{score}</p>
      <p class="mt-1 inline-flex items-center gap-1.5 text-xs text-run-muted">
        <span class="size-2.5 rounded-sm {BAND_BG[band]}"></span>{BAND_LABEL[band]}
      </p>
    </div>
  </div>
  <div class="mt-1.5 flex items-end justify-between gap-3">
    <p class="text-sm text-run-muted min-h-10">{conditions}</p>
    {#if onClear}
      <button
        type="button"
        onclick={onClear}
        class="shrink-0 text-xs font-medium text-run-accent hover:underline cursor-pointer"
      >
        Show best time
      </button>
    {/if}
  </div>
</section>
