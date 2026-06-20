<script lang="ts">
  import { signIn } from '../lib/stores/auth.svelte';

  let { onClose }: { onClose: () => void } = $props();

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = null;
    const err = await signIn(email, password);
    loading = false;
    if (err) {
      error = err;
    } else {
      onClose();
    }
  }

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
  <div class="bg-run-card rounded-2xl border border-run-border shadow-xl w-full max-w-sm p-6">
    <div class="flex items-center justify-between mb-5">
      <h2 class="font-semibold text-base">Sign in</h2>
      <button
        onclick={onClose}
        class="text-run-muted hover:text-run-text transition-colors"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <form onsubmit={handleSubmit} class="flex flex-col gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium">Email</span>
        <input
          type="email"
          bind:value={email}
          required
          autocomplete="email"
          class="px-3 py-2.5 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
        />
      </label>

      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-medium">Password</span>
        <input
          type="password"
          bind:value={password}
          required
          autocomplete="current-password"
          class="px-3 py-2.5 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
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
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  </div>
</div>
