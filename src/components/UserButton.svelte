<script lang="ts">
  import { getAuthState } from '../lib/stores/auth.svelte';
  import AuthModal from './AuthModal.svelte';
  import AccountPanel from './AccountPanel.svelte';

  const auth = $derived(getAuthState());

  let showModal = $state(false);
  let showPanel = $state(false);

  const initials = $derived(auth.user?.email?.slice(0, 2).toUpperCase() ?? '');
</script>

{#if auth.loading}
  <div class="w-9 h-9"></div>
{:else if auth.user}
  <button
    onclick={() => (showPanel = true)}
    class="w-8 h-8 rounded-full border border-run-border text-xs font-medium text-run-muted flex items-center justify-center hover:bg-run-border/50 transition-colors"
  >
    {initials}
  </button>

  {#if showPanel}
    <AccountPanel onClose={() => (showPanel = false)} />
  {/if}
{:else}
  <button
    onclick={() => (showModal = true)}
    class="flex items-center gap-1.5 text-xs text-run-muted hover:text-run-text transition-colors px-2 py-1.5 rounded-lg hover:bg-run-border/50"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
    Sign in
  </button>

  {#if showModal}
    <AuthModal onClose={() => (showModal = false)} />
  {/if}
{/if}
