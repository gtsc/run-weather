<script lang="ts">
  import { getAuthState, signOut, fetchNotes, saveNotes } from '../lib/stores/auth.svelte';
  import AuthModal from './AuthModal.svelte';

  const auth = $derived(getAuthState());

  let showModal = $state(false);
  let showDropdown = $state(false);
  let notes = $state('');
  let saving = $state(false);
  let saved = $state(false);

  const initials = $derived(auth.user?.email?.slice(0, 2).toUpperCase() ?? '');

  async function openDropdown() {
    showDropdown = true;
    notes = await fetchNotes();
  }

  async function handleSave() {
    saving = true;
    await saveNotes(notes);
    saving = false;
    saved = true;
    setTimeout(() => (saved = false), 2000);
  }

  function handleSignOut() {
    showDropdown = false;
    signOut();
  }
</script>

{#if auth.loading}
  <div class="w-9 h-9"></div>
{:else if auth.user}
  <div class="relative">
    <button
      onclick={openDropdown}
      class="w-8 h-8 rounded-full border border-run-border text-xs font-medium text-run-muted flex items-center justify-center hover:bg-run-border/50 transition-colors"
    >
      {initials}
    </button>

    {#if showDropdown}
      <div
        class="fixed inset-0 z-10"
        role="presentation"
        onclick={() => (showDropdown = false)}
        onkeydown={(e) => e.key === 'Escape' && (showDropdown = false)}
      ></div>
      <div
        class="absolute right-0 top-full mt-2 w-72 bg-run-card rounded-xl shadow-lg border border-run-border p-4 z-20"
      >
        <p class="text-xs font-medium mb-2">My running notes</p>
        <textarea
          bind:value={notes}
          rows="5"
          placeholder="Notes about your preferences will appear here after submitting run feedback."
          class="w-full px-3 py-2 border border-run-border rounded-lg text-xs bg-run-bg text-run-text resize-none focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
        ></textarea>
        <div class="flex items-center justify-between mt-2">
          <button
            onclick={handleSave}
            disabled={saving}
            class="text-xs px-3 py-1.5 bg-run-green text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save notes'}
          </button>
          <button
            onclick={handleSignOut}
            class="text-xs px-3 py-1.5 border border-run-border text-run-muted rounded-lg hover:border-red-400 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <button
    onclick={() => (showModal = true)}
    class="flex items-center gap-1.5 text-xs text-run-muted hover:text-run-text transition-colors px-2 py-1.5 rounded-lg hover:bg-run-border/50"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    Sign in
  </button>

  {#if showModal}
    <AuthModal onClose={() => (showModal = false)} />
  {/if}
{/if}
