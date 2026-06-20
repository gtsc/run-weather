<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';

  let {
    hour,
    score,
    onClose,
  }: {
    hour: ScoredHour;
    score: number;
    onClose: () => void;
  } = $props();

  const weather = $derived(getWeatherInfo(hour.weatherCode));
  const timeLabel = $derived(`${String(hour.hour).padStart(2, '0')}:00`);
</script>

<div class="mt-3 pt-3 border-t border-run-border">
  <div class="flex items-center justify-between mb-1">
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold">{timeLabel}</span>
      <span
        class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style="background-color: {scoreColorHex(score)}"
      ></span>
      <span class="text-xs text-run-muted">Score: {score}</span>
    </div>
    <button
      onclick={onClose}
      class="text-run-muted hover:text-run-text transition-colors p-0.5 -mr-0.5 shrink-0"
      aria-label="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-run-muted">
    <span>{weather.label}</span>
    <span class="opacity-30">·</span>
    <span>{formatTemp(hour.temperature)} (feels {formatTemp(hour.feelsLike)})</span>
    <span class="opacity-30">·</span>
    <span>Wind: {formatWind(hour.windSpeed)}</span>
    <span class="opacity-30">·</span>
    <span>Rain: {hour.precipProbability}%</span>
    {#if hour.snowDepth > 0}
      <span class="opacity-30">·</span>
      <span>Snow: {Math.round(hour.snowDepth * 100)} cm</span>
    {/if}
    {#if !hour.isDay}
      <span class="opacity-30">·</span>
      <span>Dark</span>
    {/if}
  </div>
</div>
