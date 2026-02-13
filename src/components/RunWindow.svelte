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

<div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
  <div
    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
    style="background-color: {scoreColorHex(window.score)}"
  >
    {window.score}
  </div>
  <div class="flex-1 min-w-0">
    <div class="font-medium text-sm">
      #{rank} {formatHourRange(window.startHour, window.endHour)}
    </div>
    <div class="text-xs text-run-muted flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
      <span>{formatTemp(avgTemp)}, feels like {formatTemp(avgFeelsLike)}</span>
      <span>💨 {formatWind(maxWind)}</span>
      <span>🌧 {maxPrecipProb}%</span>
      <span>{getWeatherInfo(worstWeather.weatherCode).label}</span>
    </div>
  </div>
</div>
