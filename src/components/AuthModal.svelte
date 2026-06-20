<script lang="ts">
  import { signIn, signUp, resetPassword, friendlyAuthError } from '../lib/stores/auth.svelte';

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
  let suNeedsConfirmation = $state(false);

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
    if (err) siError = friendlyAuthError(err);
    else onClose();
  }

  async function handleSignUp(e: SubmitEvent) {
    e.preventDefault();
    if (suPassword !== suConfirm) {
      suError = 'Passwords do not match.';
      return;
    }
    suLoading = true;
    suError = null;
    const result = await signUp(suEmail, suPassword);
    suLoading = false;
    if (result.error) suError = friendlyAuthError(result.error);
    else if (result.needsConfirmation) suNeedsConfirmation = true;
    else onClose();
  }

  async function handleForgot(e: SubmitEvent) {
    e.preventDefault();
    forgotLoading = true;
    forgotError = null;
    const err = await resetPassword(forgotEmail);
    forgotLoading = false;
    if (err) forgotError = friendlyAuthError(err);
    else forgotSent = true;
  }

  function switchTab(t: Tab) {
    tab = t;
    showForgot = false;
    siError = null;
    suError = null;
    suNeedsConfirmation = false;
    forgotError = null;
    forgotSent = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const inputClass =
    'px-3 py-2.5 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green user-invalid:border-run-red [&:user-invalid:focus]:border-run-red [&:user-invalid:focus]:ring-run-red/20 transition-shadow';
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
              <span>{forgotError}</span>
            </div>
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
            <span>{siError}</span>
          </div>
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
    {:else if suNeedsConfirmation}
      <div class="flex flex-col gap-3 text-sm">
        <p class="text-run-text">Check your inbox.</p>
        <p class="text-xs text-run-muted leading-relaxed">
          We've sent a confirmation link to <strong class="text-run-text">{suEmail}</strong>. Click
          it to activate your account and sign in.
        </p>
        <button
          onclick={onClose}
          class="mt-1 w-full py-2.5 bg-run-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >Done</button
        >
      </div>
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
            <span>{suError}</span>
          </div>
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
