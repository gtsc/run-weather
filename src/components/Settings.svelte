<script lang="ts">
  import { getPreferences, updatePreferences } from '../lib/stores/preferences.svelte';

  let open = $state(false);
  const prefs = $derived(getPreferences());

  const durationOptions = [
    { label: '30 min', value: 0.5 },
    { label: '45 min', value: 0.75 },
    { label: '1 hour', value: 1 },
    { label: '1.5 hours', value: 1.5 },
    { label: '2 hours', value: 2 },
  ];
</script>

<div class="relative">
  <button
    onclick={() => open = !open}
    class="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
    title="Settings"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-run-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </button>

  {#if open}
    <div class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
      <h3 class="font-medium text-sm mb-3">Preferences</h3>

      <div class="flex flex-col gap-4">
        <label class="flex flex-col gap-1">
          <span class="text-xs text-run-muted">Rain tolerance: {Math.round(prefs.rainTolerance * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={prefs.rainTolerance}
            oninput={(e) => updatePreferences({ rainTolerance: parseFloat((e.target as HTMLInputElement).value) })}
            class="w-full accent-run-green"
          />
          <div class="flex justify-between text-[10px] text-run-muted">
            <span>Hate rain</span>
            <span>Don't mind rain</span>
          </div>
        </label>

        <div>
          <span class="text-xs text-run-muted">Comfortable temperature range</span>
          <p class="text-[10px] text-run-muted mb-1.5">Hours outside this range score lower</p>
          <div class="flex gap-3">
            <label class="flex-1 flex flex-col gap-1">
              <span class="text-[10px] text-run-muted">Too cold below (°C)</span>
              <input
                type="number"
                min="-30"
                max="50"
                value={prefs.tempMin}
                onchange={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (!isNaN(val)) updatePreferences({ tempMin: val });
                }}
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white text-run-text"
              />
            </label>
            <label class="flex-1 flex flex-col gap-1">
              <span class="text-[10px] text-run-muted">Too hot above (°C)</span>
              <input
                type="number"
                min="-30"
                max="50"
                value={prefs.tempMax}
                onchange={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  if (!isNaN(val)) updatePreferences({ tempMax: val });
                }}
                class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white text-run-text"
              />
            </label>
          </div>
        </div>

        <label class="flex flex-col gap-1">
          <span class="text-xs text-run-muted">How long do you run for?</span>
          <p class="text-[10px] text-run-muted mb-0.5">Finds the best consecutive window of this length</p>
          <select
            value={prefs.durationHours}
            onchange={(e) => updatePreferences({ durationHours: parseFloat((e.target as HTMLSelectElement).value) })}
            class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white text-run-text"
          >
            {#each durationOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
      </div>
    </div>
  {/if}
</div>
