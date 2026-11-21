<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { formatHour, formatTemp, formatWind } from '../lib/utils/format';
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
  const timeLabel = $derived(`${formatHour(hour.hour)}`);
</script>

<div class="mt-3 pt-3 border-t border-run-border">
  <!-- Header row -->
  <div class="flex items-center justify-between mb-1">
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold">{timeLabel}</span>
      <span class="text-xs text-run-muted">
        Score <span class="text-run-text font-semibold">{score}</span>
      </span>
    </div>
    <button
      type="button"
      onclick={onClose}
      class="text-run-muted hover:text-run-text transition-colors p-0.5 -mr-0.5 shrink-0"
      aria-label="Close"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <p class="text-xs text-run-muted">
    {[
      weather.label,
      `${formatTemp(hour.temperature)} (feels ${formatTemp(hour.feelsLike)})`,
      `wind ${formatWind(hour.windSpeed)}`,
      `rain ${hour.precipProbability}%`,
      hour.snowDepth > 0 ? `snow ${Math.round(hour.snowDepth * 100)} cm` : null,
      hour.isDay ? null : 'dark',
    ]
      .filter(Boolean)
      .join(', ')}
  </p>
</div>
