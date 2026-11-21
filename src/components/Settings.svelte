<script lang="ts">
  import { preferences, updatePreferences, TEMP_LIMITS } from '../lib/stores/preferences.svelte';
  import { lightDismiss } from '../lib/utils/lightDismiss';

  let dialog: HTMLDialogElement;

  const inputClass =
    'w-full px-2.5 py-2 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow';

  function updateTemp(key: 'tempMin' | 'tempMax', e: Event) {
    const value = (e.currentTarget as HTMLInputElement).valueAsNumber;
    if (!Number.isNaN(value)) updatePreferences({ [key]: value });
    // Reflect any clamping back into the field.
    (e.currentTarget as HTMLInputElement).valueAsNumber = preferences[key];
  }
</script>

<button
  type="button"
  onclick={() => dialog.showModal()}
  class="p-1 rounded-lg hover:bg-run-border/50 transition-colors cursor-pointer"
  title="Settings"
  aria-label="Settings"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5 text-run-muted"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
</button>

<dialog
  bind:this={dialog}
  {@attach lightDismiss}
  closedby="any"
  aria-labelledby="settings-title"
  class="m-auto bg-run-card text-run-text rounded-2xl border border-run-border shadow-xl w-[calc(100%-2rem)] max-w-md max-h-[90dvh] p-6"
>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h2 id="settings-title" class="font-semibold text-base">Settings</h2>
      <form method="dialog">
        <button class="text-run-muted hover:text-run-text transition-colors" aria-label="Close">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </form>
    </div>

    <div class="flex flex-col gap-5">
      <label class="flex flex-col gap-1.5">
        <span class="flex justify-between items-baseline">
          <span class="text-xs font-medium text-run-text">Rain tolerance</span>
          <span class="text-xs text-run-muted">{Math.round(preferences.rainTolerance * 100)}%</span>
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={preferences.rainTolerance}
          oninput={(e) => updatePreferences({ rainTolerance: e.currentTarget.valueAsNumber })}
          class="w-full"
        />
        <span class="flex justify-between text-[10px] text-run-muted">
          <span>Hate rain</span>
          <span>Don't mind rain</span>
        </span>
      </label>

      <fieldset>
        <legend class="text-xs font-medium text-run-text">Comfortable temperature range</legend>
        <p class="text-[10px] text-run-muted mt-0.5 mb-2">Hours outside this range score lower</p>
        <div class="flex gap-3">
          <label class="flex-1 flex flex-col gap-1">
            <span class="text-[10px] text-run-muted">Too cold below</span>
            <span class="relative">
              <input
                type="number"
                min={TEMP_LIMITS.min}
                max={preferences.tempMax}
                value={preferences.tempMin}
                onchange={(e) => updateTemp('tempMin', e)}
                class={inputClass}
              />
              <span
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none"
              >
                °C
              </span>
            </span>
          </label>
          <label class="flex-1 flex flex-col gap-1">
            <span class="text-[10px] text-run-muted">Too hot above</span>
            <span class="relative">
              <input
                type="number"
                min={preferences.tempMin}
                max={TEMP_LIMITS.max}
                value={preferences.tempMax}
                onchange={(e) => updateTemp('tempMax', e)}
                class={inputClass}
              />
              <span
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none"
              >
                °C
              </span>
            </span>
          </label>
        </div>
      </fieldset>
    </div>
  </div>
</dialog>
