<script lang="ts">
  import type { BestWindow, DayData } from '../lib/types';
  import { formatDayLabel, formatHour, formatTemp, formatWind } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';

  let {
    day,
    window: best,
    onShow,
  }: { day: DayData; window: BestWindow; onShow: () => void } = $props();

  const hour = $derived(day.hours[best.start]);
  const when = $derived(
    `${formatDayLabel(day.date, day.dayIndex)}, ${formatHour(best.start)}–${formatHour(best.end % 24)}`,
  );
</script>

<button
  type="button"
  onclick={onShow}
  class="w-full text-left rounded-xl bg-run-card border border-run-border p-4 hover:border-run-accent/50 transition-colors cursor-pointer"
>
  <span class="block text-xs text-run-muted">Best time to run</span>
  <span class="block mt-1 text-xl font-semibold tracking-tight tabular-nums">{when}</span>
  <span class="block mt-1 text-sm text-run-muted">
    {getWeatherInfo(hour.weatherCode).label}, {formatTemp(hour.temperature)} (feels
    {formatTemp(hour.feelsLike)}), wind {formatWind(hour.windSpeed)}, score
    <span class="text-run-text font-semibold">{best.score}</span>
  </span>
</button>
