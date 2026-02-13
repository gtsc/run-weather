<script lang="ts">
  import type { RunWindow as RunWindowType } from '../lib/types';
  import { formatHourRange, formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';

  let { window, rank }: { window: RunWindowType; rank: number } = $props();

  const avgTemp = $derived(
    Math.round(window.hours.reduce((s, h) => s + h.temperature, 0) / window.hours.length)
  );
  const avgFeelsLike = $derived(
    Math.round(window.hours.reduce((s, h) => s + h.feelsLike, 0) / window.hours.length)
  );
  const maxPrecipProb = $derived(
    Math.max(...window.hours.map(h => h.precipProbability))
  );
  const maxWind = $derived(
    Math.max(...window.hours.map(h => h.windSpeed))
  );
  const worstWeather = $derived(
    window.hours.reduce((worst, h) =>
      getWeatherInfo(h.weatherCode).penalty > getWeatherInfo(worst.weatherCode).penalty ? h : worst
    )
  );
</script>

<div class="flex items-center gap-3 p-3 bg-run-card rounded-xl border border-run-border hover:border-run-muted/40 transition-colors">
  <div
    class="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
    style="background-color: {scoreColorHex(window.score)}"
  >
    {window.score}
  </div>
  <div class="flex-1 min-w-0">
    <div class="font-medium text-sm">
      {formatHourRange(window.startHour, window.endHour)}
    </div>
    <div class="text-xs text-run-muted flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
      <span>{formatTemp(avgTemp)}, feels like {formatTemp(avgFeelsLike)}</span>
      <span class="flex items-center gap-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        {formatWind(maxWind)}
      </span>
      <span class="flex items-center gap-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        {maxPrecipProb}%
      </span>
      <span>{getWeatherInfo(worstWeather.weatherCode).label}</span>
    </div>
  </div>
</div>
