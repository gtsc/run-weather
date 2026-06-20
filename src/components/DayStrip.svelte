<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { DayData, ScoredHour } from '../lib/types';
  import { formatDayLabel, formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';

  let {
    day,
    selectedHourTime = null,
    onHourSelect,
    panel,
  }: {
    day: DayData;
    selectedHourTime?: string | null;
    onHourSelect: (hour: ScoredHour | null) => void;
    panel?: Snippet<[ScoredHour, number]>;
  } = $props();

  let hoveredIndex = $state<number | null>(null);

  function isPast(hourData: ScoredHour): boolean {
    return new Date(hourData.time) < new Date();
  }

  function handleSegmentClick(hour: ScoredHour) {
    if (selectedHourTime === hour.time) {
      onHourSelect(null);
    } else {
      onHourSelect(hour);
    }
  }

  const selectedHour = $derived(
    selectedHourTime ? (day.hours.find((h) => h.time === selectedHourTime) ?? null) : null,
  );

  const confidence = $derived(day.dayIndex <= 1 ? null : day.dayIndex <= 4 ? 'moderate' : 'low');

  const hoveredHour = $derived(hoveredIndex !== null ? day.hours[hoveredIndex] : null);
  const hoveredScore = $derived(hoveredIndex !== null ? day.scores[hoveredIndex] : 0);
  const tooltipLeft = $derived(
    hoveredIndex !== null ? `${((hoveredIndex + 0.5) / 24) * 100}%` : '50%',
  );
</script>

<div class="rounded-xl bg-run-card border border-run-border p-4">
  <div class="flex items-center justify-between mb-2.5">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{formatDayLabel(day.date)}</span>
      {#if confidence}
        <span
          class="text-[10px] px-1.5 py-0.5 rounded {confidence === 'low'
            ? 'bg-run-amber/10 text-run-amber'
            : 'bg-run-border/50 text-run-muted'}"
        >
          {confidence === 'low' ? 'Less reliable' : 'Approx.'}
        </span>
      {/if}
    </div>
    <span
      class="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
      style="background-color: {scoreColorHex(day.bestScore)}"
    >
      Best: {day.bestScore}
    </span>
  </div>

  <!-- bar wrapper is relative so tooltip can be positioned above it -->
  <div class="relative">
    <div
      class="flex gap-px h-7 rounded-lg overflow-hidden {confidence === 'low' ? 'opacity-70' : ''}"
    >
      {#each day.hours as hour, i (hour.time)}
        {@const past = isPast(hour)}
        {@const selected = selectedHourTime === hour.time}
        <button
          class="flex-1 focus:outline-none {past ? 'opacity-40' : 'hover:opacity-80'} {selected
            ? 'ring-2 ring-black/40 ring-inset'
            : ''}"
          style="background-color: {past ? '#d1d5db' : scoreColorHex(day.scores[i])}"
          onclick={() => handleSegmentClick(hour)}
          onmouseenter={() => (hoveredIndex = i)}
          onmouseleave={() => (hoveredIndex = null)}
          aria-label="{String(hour.hour).padStart(2, '0')}:00"
        ></button>
      {/each}
    </div>

    {#if hoveredHour !== null && hoveredIndex !== null}
      {@const weather = getWeatherInfo(hoveredHour.weatherCode)}
      <div
        class="absolute bottom-full mb-1.5 pointer-events-none z-20 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-2 whitespace-nowrap shadow-lg -translate-x-1/2"
        style="left: {tooltipLeft}"
      >
        <div class="flex items-center gap-1.5 mb-1">
          <span class="font-medium">{String(hoveredHour.hour).padStart(2, '0')}:00</span>
          <span
            class="inline-block w-1.5 h-1.5 rounded-full"
            style="background-color: {scoreColorHex(hoveredScore)}"
          ></span>
          <span class="text-gray-300">{hoveredScore}</span>
        </div>
        <div class="text-gray-300 flex flex-col gap-0.5">
          <span>{weather.label}</span>
          <span>{formatTemp(hoveredHour.temperature)}, feels like {formatTemp(hoveredHour.feelsLike)}</span>
          <span>Wind: {formatWind(hoveredHour.windSpeed)}</span>
          <span>Rain: {hoveredHour.precipProbability}%</span>
          {#if hoveredHour.snowDepth > 0}
            <span>Snow: {Math.round(hoveredHour.snowDepth * 100)} cm</span>
          {/if}
          {#if !hoveredHour.isDay}
            <span>Dark</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="flex justify-between mt-1.5 text-[10px] text-run-muted">
    <span>00:00</span>
    <span>06:00</span>
    <span>12:00</span>
    <span>18:00</span>
    <span>23:00</span>
  </div>

  {#if selectedHour && panel}
    {@render panel(selectedHour, day.scores[day.hours.indexOf(selectedHour)])}
  {/if}
</div>
