<script lang="ts">
  import { signIn, signUp, resetPassword } from '../lib/stores/auth.svelte';

  let { onClose }: { onClose: () => void } = $props();

  type Tab = 'signin' | 'signup';
  let tab = $state<Tab>('signin');

  // Sign-in state
  let siEmail = $state('');
  let siPassword = $state('');
  let siLoading = $state(false);
  let siError = $state<string | null>(null);

  // Sign-up state
  let suEmail = $state('');
  let suPassword = $state('');
  let suConfirm = $state('');
  let suLoading = $state(false);
  let suError = $state<string | null>(null);

  // Forgot password state
  let showForgot = $state(false);
  let forgotEmail = $state('');
  let forgotLoading = $state(false);
  let forgotError = $state<string | null>(null);
  let forgotSent = $state(false);

  async function handleSignIn(e: SubmitEvent) {
    e.preventDefault();
    siLoading = true;
    siError = null;
    const err = await signIn(siEmail, siPassword);
    siLoading = false;
    if (err) siError = err;
    else onClose();
  }

  async function handleSignUp(e: SubmitEvent) {
    e.preventDefault();
    if (suPassword !== suConfirm) {
      suError = 'Passwords do not match';
      return;
    }
    suLoading = true;
    suError = null;
    const err = await signUp(suEmail, suPassword);
    suLoading = false;
    if (err) suError = err;
    else onClose();
  }

  async function handleForgot(e: SubmitEvent) {
    e.preventDefault();
    forgotLoading = true;
    forgotError = null;
    const err = await resetPassword(forgotEmail);
    forgotLoading = false;
    if (err) forgotError = err;
    else forgotSent = true;
  }

  function switchTab(t: Tab) {
    tab = t;
    showForgot = false;
    siError = null;
    suError = null;
    forgotError = null;
    forgotSent = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const inputClass =
    'px-3 py-2.5 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow';
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  role="presentation"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
>
  <div class="bg-run-card rounded-2xl border border-run-border shadow-xl w-full max-w-sm p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      {#if showForgot}
        <button
          onclick={() => (showForgot = false)}
          class="text-run-muted hover:text-run-text transition-colors"
          aria-label="Back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 class="font-semibold text-base">Reset password</h2>
      {:else}
        <!-- Tabs -->
        <div class="flex gap-1 p-1 bg-run-bg rounded-lg border border-run-border">
          <button
            onclick={() => switchTab('signin')}
            class="px-3 py-1 text-sm rounded-md transition-colors {tab === 'signin'
              ? 'bg-run-card font-medium text-run-text shadow-sm'
              : 'text-run-muted hover:text-run-text'}">Sign in</button
          >
          <button
            onclick={() => switchTab('signup')}
            class="px-3 py-1 text-sm rounded-md transition-colors {tab === 'signup'
              ? 'bg-run-card font-medium text-run-text shadow-sm'
              : 'text-run-muted hover:text-run-text'}">Sign up</button
          >
        </div>
      {/if}
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

    <!-- Forgot password -->
    {#if showForgot}
      {#if forgotSent}
        <p class="text-sm text-run-muted leading-relaxed">
          Check your email — we've sent a password reset link to <strong class="text-run-text"
            >{forgotEmail}</strong
          >.
        </p>
      {:else}
        <form onsubmit={handleForgot} class="flex flex-col gap-4">
          <p class="text-xs text-run-muted">Enter your email and we'll send you a reset link.</p>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium">Email</span>
            <input
              type="email"
              bind:value={forgotEmail}
              required
              autocomplete="email"
              class={inputClass}
            />
          </label>
          {#if forgotError}
            <p class="text-xs text-red-500">{forgotError}</p>
          {/if}
          <button
            type="submit"
            disabled={forgotLoading}
            class="w-full py-2.5 bg-run-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {forgotLoading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      {/if}

      <!-- Sign in -->
    {:else if tab === 'signin'}
      <form onsubmit={handleSignIn} class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium">Email</span>
          <input
            type="email"
            bind:value={siEmail}
            required
            autocomplete="email"
            class={inputClass}
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-medium">Password</span>
            <button
              type="button"
              onclick={() => {
                showForgot = true;
                forgotEmail = siEmail;
              }}
              class="text-[11px] text-run-muted hover:text-run-text transition-colors"
              >Forgot password?</button
            >
          </div>
          <input
            type="password"
            bind:value={siPassword}
            required
            autocomplete="current-password"
            class={inputClass}
          />
        </label>
        {#if siError}
          <p class="text-xs text-red-500">{siError}</p>
        {/if}
        <button
          type="submit"
          disabled={siLoading}
          class="w-full py-2.5 bg-run-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {siLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <!-- Sign up -->
    {:else}
      <form onsubmit={handleSignUp} class="flex flex-col gap-4">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium">Email</span>
          <input
            type="email"
            bind:value={suEmail}
            required
            autocomplete="email"
            class={inputClass}
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium">Password</span>
          <input
            type="password"
            bind:value={suPassword}
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
            bind:value={suConfirm}
            required
            autocomplete="new-password"
            class={inputClass}
          />
        </label>
        {#if suError}
          <p class="text-xs text-red-500">{suError}</p>
        {/if}
        <button
          type="submit"
          disabled={suLoading}
          class="w-full py-2.5 bg-run-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {suLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    {/if}
  </div>
</div>
