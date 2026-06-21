<script lang="ts">
  import type { ScoredHour, Recommendation } from '../lib/types';
  import { formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';
  import { getAuthState, supabase } from '../lib/stores/auth.svelte';
  import { getLocation } from '../lib/stores/location.svelte';
  import { toWeatherInput } from '../lib/utils/weatherInput';
  import { fetchSlotRecommendations } from '../lib/api/recommendations';

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
  const location = $derived(getLocation());
  const weather = $derived(getWeatherInfo(hour.weatherCode));
  const timeLabel = $derived(`${String(hour.hour).padStart(2, '0')}:00`);
  const isUpcoming = $derived(new Date(hour.time) >= new Date());
  // Allow new recommendation only for the current hour (e.g. 3:30pm → 15:00 slot only)
  const canGetRecommendation = $derived(
    hour.time.slice(0, 10) === new Date().toISOString().slice(0, 10) &&
      hour.hour === new Date().getHours(),
  );

  // Conversations for this slot
  let conversations = $state<Recommendation[]>([]);
  let loadingConversations = $state(false);
  let activeTabIndex = $state<number>(0); // index into conversations; conversations.length = "+ new" tab

  $effect(() => {
    if (auth.user && location != null) {
      loadingConversations = true;
      fetchSlotRecommendations(hour.time, location.latitude, location.longitude)
        .then((recs) => {
          conversations = recs;
          // Default to newest conversation if any exist, otherwise "+ new"
          activeTabIndex = recs.length > 0 ? recs.length - 1 : recs.length;
        })
        .finally(() => {
          loadingConversations = false;
        });
    }
  });

  const activeConversation = $derived(
    activeTabIndex < conversations.length ? conversations[activeTabIndex] : null,
  );
  const isNewTab = $derived(activeTabIndex === conversations.length);

  // New recommendation form state
  let runDescription = $state('');
  let recommending = $state(false);
  let recommendError = $state<string | null>(null);

  // Feedback form state (per active conversation — reset when tab changes)
  let feedbackText = $state('');
  let submittingFeedback = $state(false);
  let feedbackDone = $state(false);
  let feedbackError = $state<string | null>(null);

  $effect(() => {
    // Reset feedback state when switching tabs
    activeTabIndex;
    feedbackText = '';
    feedbackDone = false;
    feedbackError = null;
  });

  function tabLabel(desc: string | null): string {
    const text = desc ?? 'No description';
    return text.length > 20 ? text.slice(0, 20).trimEnd() + '…' : text;
  }

  async function getToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function handleRecommend() {
    const token = await getToken();
    if (!token || location == null) return;
    recommending = true;
    recommendError = null;
    try {
      const res = await fetch('/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          weather: toWeatherInput(hour),
          run_description: runDescription || undefined,
          slot_datetime: hour.time,
          latitude: location.latitude,
          longitude: location.longitude,
          location_name: location.name,
        }),
      });
      const json = (await res.json()) as {
        id?: string;
        recommendation?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? 'Unknown error');
      const newRec: Recommendation = {
        id: json.id!,
        slot_datetime: hour.time,
        run_description: runDescription || null,
        weather_snapshot: toWeatherInput(hour),
        recommendation: json.recommendation!,
        feedback: null,
        latitude: Math.round(location.latitude * 100) / 100,
        longitude: Math.round(location.longitude * 100) / 100,
        location_name: location.name,
        created_at: new Date().toISOString(),
      };
      conversations = [...conversations, newRec];
      activeTabIndex = conversations.length - 1;
      runDescription = '';
    } catch (e) {
      recommendError = (e as Error).message;
    } finally {
      recommending = false;
    }
  }

  async function handleFeedback() {
    const token = await getToken();
    if (!token || !feedbackText.trim() || !activeConversation) return;
    submittingFeedback = true;
    feedbackError = null;
    try {
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recommendation_id: activeConversation.id,
          feedback: feedbackText,
        }),
      });
      const json = (await res.json()) as { memory?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Unknown error');
      feedbackDone = true;
      conversations = conversations.map((c, i) =>
        i === activeTabIndex ? { ...c, feedback: feedbackText } : c,
      );
    } catch (e) {
      feedbackError = (e as Error).message;
    } finally {
      submittingFeedback = false;
    }
  }
</script>

<div class="mt-3 pt-3 border-t border-run-border">
  <!-- Header row -->
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

  <!-- Weather summary -->
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

  {#if auth.user && (canGetRecommendation || conversations.length > 0 || loadingConversations)}
    <div class="mt-3 pt-3 border-t border-run-border/50">
      {#if loadingConversations}
        <p class="text-xs text-run-muted">Loading…</p>
      {:else}
        <!-- Tab bar -->
        <div class="flex gap-1 flex-wrap mb-3">
          {#each conversations as conv, i (conv.id)}
            <button
              onclick={() => (activeTabIndex = i)}
              class="px-2 py-1 rounded-md text-xs transition-colors {activeTabIndex === i
                ? 'bg-run-green/10 text-run-green border border-run-green/30'
                : 'border border-run-border text-run-muted hover:border-run-green/30 hover:text-run-text'}"
            >
              {tabLabel(conv.run_description)}
              {#if conv.feedback}
                <span class="ml-1 opacity-60">✓</span>
              {/if}
            </button>
          {/each}
          <!-- + new tab (today or future) -->
          {#if canGetRecommendation}
            <button
              onclick={() => (activeTabIndex = conversations.length)}
              class="px-2 py-1 rounded-md text-xs transition-colors {isNewTab
                ? 'bg-run-green/10 text-run-green border border-run-green/30'
                : 'border border-run-border text-run-muted hover:border-run-green/30 hover:text-run-text'}"
            >
              + new
            </button>
          {/if}
        </div>

        <!-- Active tab content -->
        {#if isNewTab && canGetRecommendation}
          <!-- New recommendation form -->
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
          </div>
        {:else if activeConversation}
          <!-- Existing conversation -->
          <div class="flex flex-col gap-2">
            <p class="text-xs text-run-text leading-relaxed">{activeConversation.recommendation}</p>

            {#if !isUpcoming}
              <!-- Feedback section -->
              <div class="pt-2 border-t border-run-border/50">
                {#if activeConversation.feedback || feedbackDone}
                  <p class="text-xs text-run-green">Feedback saved ✓</p>
                  {#if activeConversation.feedback}
                    <p class="text-xs text-run-muted mt-1 italic">
                      "{activeConversation.feedback}"
                    </p>
                  {/if}
                {:else}
                  <textarea
                    bind:value={feedbackText}
                    rows="2"
                    placeholder="How did it go?"
                    class="w-full px-3 py-2 border border-run-border rounded-lg text-xs bg-run-bg text-run-text placeholder:text-run-muted resize-none focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                  ></textarea>
                  <button
                    onclick={handleFeedback}
                    disabled={submittingFeedback || !feedbackText.trim()}
                    class="w-full mt-1 py-2 border border-run-border text-run-muted rounded-lg text-xs font-medium hover:border-run-green hover:text-run-green transition-colors disabled:opacity-50"
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
      {/if}
    </div>
  {/if}
</div>
