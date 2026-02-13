<script lang="ts">
  import type { DayData } from '../lib/types';
  import RunWindow from './RunWindow.svelte';

  let { day }: { day: DayData } = $props();
</script>

<div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
  {#if day.windows.length === 0}
    <p class="text-run-muted text-sm text-center py-2">No good run windows today</p>
  {:else}
    <p class="text-xs text-run-muted mb-2 font-medium">Best run windows:</p>
    <div class="flex flex-col gap-2">
      {#each day.windows as window, i}
        <RunWindow {window} rank={i + 1} />
      {/each}
    </div>
  {/if}
</div>
