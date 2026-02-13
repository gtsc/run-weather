<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { formatHour, formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';

  let { hour, score }: { hour: ScoredHour; score: number } = $props();

  const weather = $derived(getWeatherInfo(hour.weatherCode));
</script>

<div class="-translate-x-1/2 whitespace-nowrap">
  <div class="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
    <div class="font-semibold mb-1 flex items-center gap-2">
      <span>{formatHour(hour.hour)}</span>
      <span
        class="inline-block w-2 h-2 rounded-full"
        style="background-color: {scoreColorHex(score)}"
      ></span>
      <span>Score: {score}</span>
    </div>
    <div class="flex flex-col gap-0.5 text-gray-300">
      <span>{weather.label}</span>
      <span>{formatTemp(hour.temperature)}, feels like {formatTemp(hour.feelsLike)}</span>
      <span>Wind: {formatWind(hour.windSpeed)}</span>
      <span>Rain: {hour.precipProbability}% chance</span>
      {#if !hour.isDay}
        <span>Dark</span>
      {/if}
    </div>
    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
  </div>
</div>
