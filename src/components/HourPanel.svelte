<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';
  import { getAuthState, supabase } from '../lib/stores/auth.svelte';
  import { toWeatherInput } from '../lib/utils/weatherInput';

  let {
    hour,
    score,
    onClose,
  }: {
    hour: ScoredHour;
    score: number;
    onClose: () => void;
  } = $props();

  const auth = $derived(getAuthState());
  const weather = $derived(getWeatherInfo(hour.weatherCode));
  const timeLabel = $derived(`${String(hour.hour).padStart(2, '0')}:00`);

  const now = new Date();
  const isUpcoming = $derived(new Date(hour.time) >= now);

  let runDescription = $state('');
  let recommending = $state(false);
  let recommendation = $state<string | null>(null);
  let recommendError = $state<string | null>(null);

  let feedbackText = $state('');
  let submittingFeedback = $state(false);
  let feedbackDone = $state(false);
  let feedbackError = $state<string | null>(null);

  async function getToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function handleRecommend() {
    const token = await getToken();
    if (!token) return;
    recommending = true;
    recommendError = null;
    try {
      const res = await fetch('/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          weather: toWeatherInput(hour),
          run_description: runDescription || undefined,
        }),
      });
      const json = (await res.json()) as { recommendation?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Unknown error');
      recommendation = json.recommendation ?? null;
    } catch (e) {
      recommendError = (e as Error).message;
    } finally {
      recommending = false;
    }
  }

  async function handleFeedback() {
    const token = await getToken();
    if (!token || !feedbackText.trim()) return;
    submittingFeedback = true;
    feedbackError = null;
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          weather: toWeatherInput(hour),
          original_suggestion: recommendation ?? undefined,
          feedback: feedbackText,
        }),
      });
      const json = (await res.json()) as { memory?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Unknown error');
      feedbackDone = true;
    } catch (e) {
      feedbackError = (e as Error).message;
    } finally {
      submittingFeedback = false;
    }
  }
</script>

<div class="mt-3 pt-3 border-t border-run-border">
  <div class="flex items-center justify-between mb-1">
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold">{timeLabel}</span>
      <span
        class="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style="background-color: {scoreColorHex(score)}"
      ></span>
      <span class="text-xs text-run-muted">Score: {score}</span>
    </div>
    <button
      onclick={onClose}
      class="text-run-muted hover:text-run-text transition-colors p-0.5 -mr-0.5 shrink-0"
      aria-label="Close"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-run-muted">
    <span>{weather.label}</span>
    <span class="opacity-30">·</span>
    <span>{formatTemp(hour.temperature)} (feels {formatTemp(hour.feelsLike)})</span>
    <span class="opacity-30">·</span>
    <span>Wind: {formatWind(hour.windSpeed)}</span>
    <span class="opacity-30">·</span>
    <span>Rain: {hour.precipProbability}%</span>
    {#if hour.snowDepth > 0}
      <span class="opacity-30">·</span>
      <span>Snow: {Math.round(hour.snowDepth * 100)} cm</span>
    {/if}
    {#if !hour.isDay}
      <span class="opacity-30">·</span>
      <span>Dark</span>
    {/if}
  </div>

  {#if auth.user}
    <div class="mt-3 pt-3 border-t border-run-border/50">
      {#if isUpcoming}
        <div class="flex flex-col gap-2">
          <input
            type="text"
            bind:value={runDescription}
            placeholder="What's the plan? (e.g. easy 8k, tempo 5k)"
            class="w-full px-3 py-2 border border-run-border rounded-lg text-xs bg-run-bg text-run-text placeholder:text-run-muted focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
          />
          <button
            onclick={handleRecommend}
            disabled={recommending}
            class="w-full py-2 border border-run-border text-run-muted rounded-lg text-xs font-medium hover:border-run-green hover:text-run-green transition-colors disabled:opacity-50"
          >
            {recommending ? 'Thinking…' : '✨  What should I wear?'}
          </button>
          {#if recommendError}
            <p class="text-xs text-red-500">{recommendError}</p>
          {/if}
          {#if recommendation}
            <p class="text-xs text-run-text leading-relaxed">{recommendation}</p>
          {/if}
        </div>
      {:else if !isUpcoming}
        <div class="flex flex-col gap-2">
          {#if feedbackDone}
            <p class="text-xs text-run-green">Memory updated ✓</p>
          {:else}
            <textarea
              bind:value={feedbackText}
              rows="3"
              placeholder="What did you wear, and how did it feel?"
              class="w-full px-3 py-2 border border-run-border rounded-lg text-xs bg-run-bg text-run-text placeholder:text-run-muted resize-none focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
            ></textarea>
            <button
              onclick={handleFeedback}
              disabled={submittingFeedback || !feedbackText.trim()}
              class="w-full py-2 border border-run-border text-run-muted rounded-lg text-xs font-medium hover:border-run-green hover:text-run-green transition-colors disabled:opacity-50"
            >
              {submittingFeedback ? 'Saving…' : '✨  Submit feedback'}
            </button>
            {#if feedbackError}
              <p class="text-xs text-red-500">{feedbackError}</p>
            {/if}
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
