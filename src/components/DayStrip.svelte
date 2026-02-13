<script lang="ts">
  import type { DayData, ScoredHour } from '../lib/types';
  import { formatDayLabel, scoreColorHex } from '../lib/utils/format';
  import HourTooltip from './HourTooltip.svelte';

  let { day, expanded = false, onToggle }: { day: DayData; expanded?: boolean; onToggle: () => void } = $props();

  let hoveredIndex = $state<number | null>(null);

  function isPast(hourData: ScoredHour): boolean {
    return new Date(hourData.time) < new Date();
  }

  const confidence = $derived(
    day.dayIndex <= 1 ? null : day.dayIndex <= 4 ? 'moderate' : 'low'
  );
</script>

<button
  class="w-full text-left p-4 rounded-xl bg-white border border-run-border hover:border-gray-300 transition-all cursor-pointer {expanded ? 'ring-2 ring-run-green/20 border-run-green/40' : ''}"
  onclick={onToggle}
>
  <div class="flex items-center justify-between mb-2.5">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{formatDayLabel(day.date)}</span>
      {#if confidence}
        <span class="text-[10px] px-1.5 py-0.5 rounded {confidence === 'low' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-run-muted'}">
          {confidence === 'low' ? 'Less reliable' : 'Approx.'}
        </span>
      {/if}
      {#if expanded}
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-run-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-run-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      {/if}
    </div>
    <span
      class="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
      style="background-color: {scoreColorHex(day.bestScore)}"
    >
      Best: {day.bestScore}
    </span>
  </div>

  <div class="relative">
    <div class="flex gap-px h-7 rounded-lg overflow-hidden {confidence === 'low' ? 'opacity-70' : ''}">
      {#each day.hours as hour, i}
        {@const past = isPast(hour)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="flex-1 transition-opacity {past ? 'opacity-40' : 'hover:opacity-80'}"
          style="background-color: {past ? '#d1d5db' : scoreColorHex(day.scores[i])}"
          onmouseenter={() => hoveredIndex = i}
          onmouseleave={() => hoveredIndex = null}
        ></div>
      {/each}
    </div>

    {#if hoveredIndex !== null}
      {@const hour = day.hours[hoveredIndex]}
      {@const score = day.scores[hoveredIndex]}
      <div
        class="absolute bottom-full mb-2 z-20 pointer-events-none"
        style="left: {(hoveredIndex / day.hours.length) * 100}%"
      >
        <HourTooltip {hour} {score} />
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
</button>
