<script lang="ts">
  import { updatePassword, friendlyAuthError } from '../lib/stores/auth.svelte';

  let { onClose }: { onClose: () => void } = $props();

  let password = $state('');
  let confirm = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let done = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (password !== confirm) {
      error = 'Passwords do not match.';
      return;
    }
    loading = true;
    error = null;
    const err = await updatePassword(password);
    loading = false;
    if (err) error = friendlyAuthError(err);
    else done = true;
  }

  const inputClass =
    'px-3 py-2.5 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green user-invalid:border-run-red [&:user-invalid:focus]:border-run-red [&:user-invalid:focus]:ring-run-red/20 transition-shadow';
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
          <div
            class="flex items-start gap-2 rounded-lg border border-run-red/25 bg-run-red/5 px-3 py-2 text-xs text-run-red"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mt-px h-3.5 w-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              /></svg
            >
            <span>{error}</span>
          </div>
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
