<script>
  import { formatDayLabel, formatHour, scoreColorHex } from '../lib/utils/format.js';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes.js';

  let { day, expanded = false, onToggle } = $props();

  function isPast(hourData) {
    return new Date(hourData.time) < new Date();
  }
</script>

<button
  class="w-full text-left p-3 rounded-lg bg-run-card border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
  onclick={onToggle}
>
  <div class="flex items-center justify-between mb-2">
    <span class="font-medium text-sm">{formatDayLabel(day.date)}</span>
    <span
      class="text-xs font-bold px-2 py-0.5 rounded-full text-white"
      style="background-color: {scoreColorHex(day.bestScore)}"
    >
      Best: {day.bestScore}
    </span>
  </div>

  <div class="flex gap-px h-6 rounded overflow-hidden">
    {#each day.hours as hour, i}
      {@const past = isPast(hour)}
      {@const weather = getWeatherInfo(hour.weatherCode)}
      <div
        class="flex-1 relative group"
        style="background-color: {past ? '#d1d5db' : scoreColorHex(day.scores[i])}"
        title="{formatHour(hour.hour)} — Score: {day.scores[i]} — {weather.label} — {Math.round(hour.feelsLike)}°C"
      ></div>
    {/each}
  </div>

  <div class="flex justify-between mt-1 text-[10px] text-run-muted">
    <span>00:00</span>
    <span>06:00</span>
    <span>12:00</span>
    <span>18:00</span>
    <span>23:00</span>
  </div>
</button>
