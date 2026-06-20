<script lang="ts">
  import { updatePassword } from '../lib/stores/auth.svelte';

  let { onClose }: { onClose: () => void } = $props();

  let password = $state('');
  let confirm = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let done = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (password !== confirm) {
      error = 'Passwords do not match';
      return;
    }
    loading = true;
    error = null;
    const err = await updatePassword(password);
    loading = false;
    if (err) error = err;
    else done = true;
  }

  const inputClass =
    'px-3 py-2.5 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow';
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  role="presentation"
>
  <div class="bg-run-card rounded-2xl border border-run-border shadow-xl w-full max-w-sm p-6">
    <h2 class="font-semibold text-base mb-5">Set new password</h2>

    {#if done}
      <p class="text-sm text-run-muted mb-4">
        Your password has been updated. You're now signed in.
      </p>
      <button
        onclick={onClose}
        class="w-full py-2.5 bg-run-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >Continue</button
      >
    {:else}
      <form onsubmit={handleSubmit} class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium">New password</span>
          <input
            type="password"
            bind:value={password}
            required
            autocomplete="new-password"
            minlength={6}
            class={inputClass}
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium">Confirm password</span>
          <input
            type="password"
            bind:value={confirm}
            required
            autocomplete="new-password"
            class={inputClass}
          />
        </label>
        {#if error}
          <p class="text-xs text-red-500">{error}</p>
        {/if}
        <button
          type="submit"
          disabled={loading}
          class="w-full py-2.5 bg-run-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Set password'}
        </button>
      </form>
    {/if}
  </div>
</div>
