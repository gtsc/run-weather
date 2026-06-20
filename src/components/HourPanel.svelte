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
  <div class="flex items-start justify-between mb-2">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{timeLabel}</span>
      <span
        class="inline-block w-2 h-2 rounded-full shrink-0"
        style="background-color: {scoreColorHex(score)}"
      ></span>
      <span class="text-xs text-run-muted">Score: {score}</span>
    </div>
    <button
      onclick={onClose}
      class="text-run-muted hover:text-run-text transition-colors p-0.5 -mr-0.5"
      aria-label="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="flex flex-col gap-0.5 text-xs text-run-muted">
    <span>{weather.label}</span>
    <span>{formatTemp(hour.temperature)}, feels like {formatTemp(hour.feelsLike)}</span>
    <span>Wind: {formatWind(hour.windSpeed)}</span>
    <span>Rain: {hour.precipProbability}%</span>
    {#if hour.snowDepth > 0}
      <span>Snow on ground: {Math.round(hour.snowDepth * 100)} cm</span>
    {/if}
    {#if !hour.isDay}
      <span>Dark</span>
    {/if}
  </div>
</div>
