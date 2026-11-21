<script lang="ts">
  import { getPreferences, updatePreferences } from '../lib/stores/preferences.svelte';

  let { onClose }: { onClose: () => void } = $props();

  const prefs = $derived(getPreferences());
  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  role="presentation"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div
    class="bg-run-card rounded-2xl border border-run-border shadow-xl w-full max-w-md p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-base">Settings</h2>
      <button
        onclick={onClose}
        class="text-run-muted hover:text-run-text transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div>
      <div class="flex flex-col gap-5">
        <label class="flex flex-col gap-1.5">
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-medium text-run-text">Rain tolerance</span>
            <span class="text-xs text-run-muted">{Math.round(prefs.rainTolerance * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={prefs.rainTolerance}
            oninput={(e) =>
              updatePreferences({
                rainTolerance: parseFloat((e.target as HTMLInputElement).value),
              })}
            class="w-full accent-run-green"
          />
          <div class="flex justify-between text-[10px] text-run-muted">
            <span>Hate rain</span>
            <span>Don't mind rain</span>
          </div>
        </label>

        <div>
          <span class="text-xs font-medium text-run-text">Comfortable temperature range</span>
          <p class="text-[10px] text-run-muted mt-0.5 mb-2">Hours outside this range score lower</p>
          <div class="flex gap-3">
            <label class="flex-1 flex flex-col gap-1">
              <span class="text-[10px] text-run-muted">Too cold below</span>
              <div class="relative">
                <input
                  type="number"
                  min="-30"
                  max="50"
                  value={prefs.tempMin}
                  onchange={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val)) updatePreferences({ tempMin: val });
                  }}
                  class="w-full px-2.5 py-2 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                />
                <span
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none"
                  >°C</span
                >
              </div>
            </label>
            <label class="flex-1 flex flex-col gap-1">
              <span class="text-[10px] text-run-muted">Too hot above</span>
              <div class="relative">
                <input
                  type="number"
                  min="-30"
                  max="50"
                  value={prefs.tempMax}
                  onchange={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val)) updatePreferences({ tempMax: val });
                  }}
                  class="w-full px-2.5 py-2 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                />
                <span
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none"
                  >°C</span
                >
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
