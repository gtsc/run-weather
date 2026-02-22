<script lang="ts">
  import type { DayData } from '../lib/types';
  import RunWindow from './RunWindow.svelte';

  let { day }: { day: DayData } = $props();
</script>

<div class="ml-2 pl-4 border-l-2 border-run-green/20">
  {#if day.windows.length === 0}
    <p class="text-run-muted text-sm py-3">No good run windows today</p>
  {:else}
    <p class="text-xs text-run-muted mb-2 font-medium">Best run windows</p>
    <div class="flex flex-col gap-2">
      {#each day.windows as window, i (window.startTime)}
        <RunWindow {window} rank={i + 1} />
      {/each}
    </div>
  {/if}
</div>
