<script lang="ts">
  import { getPreferences, updatePreferences } from '../lib/stores/preferences.svelte';
  import {
    getAuthState,
    signOut,
    fetchNotes,
    saveNotes,
    supabase,
  } from '../lib/stores/auth.svelte';
  import { fetchHistory } from '../lib/api/recommendations';
  import type { Recommendation } from '../lib/types';
  import { formatDayLabel, formatTemp } from '../lib/utils/format';

  let { onClose }: { onClose: () => void } = $props();

  const prefs = $derived(getPreferences());
  const auth = $derived(getAuthState());

  let notes = $state('');
  let savingNotes = $state(false);
  let notesSaved = $state(false);
  let notesLoaded = $state(false);

  let history = $state<Recommendation[]>([]);
  let historyLoaded = $state(false);
  let feedbackInputs = $state<Record<string, string>>({});
  let feedbackSubmitting = $state<Record<string, boolean>>({});
  let feedbackDone = $state<Record<string, boolean>>({});

  $effect(() => {
    if (auth.user && !notesLoaded) {
      notesLoaded = true;
      fetchNotes().then((n) => (notes = n));
      fetchHistory().then((recs) => {
        history = recs;
        historyLoaded = true;
      });
    }
  });

  function formatSlotLabel(rec: Recommendation): string {
    const dateLabel = formatDayLabel(rec.slot_datetime.slice(0, 10));
    const hour = rec.slot_datetime.slice(11, 16);
    return `${dateLabel}, ${hour}`;
  }

  function truncate(text: string, max = 80): string {
    return text.length <= max ? text : text.slice(0, max).trimEnd() + '…';
  }

  function locationLabel(rec: Recommendation): string {
    if (rec.location_name === 'Current location') {
      const lat = `${Math.abs(rec.latitude).toFixed(1)}°${rec.latitude >= 0 ? 'N' : 'S'}`;
      const lng = `${Math.abs(rec.longitude).toFixed(1)}°${rec.longitude >= 0 ? 'E' : 'W'}`;
      return `${lat}, ${lng}`;
    }
    return rec.location_name;
  }

  function metaLine(rec: Recommendation): string {
    return [rec.run_description, locationLabel(rec), weatherSummary(rec)]
      .filter((x): x is string => x != null && x !== '')
      .join(' · ');
  }

  async function submitFeedback(rec: Recommendation) {
    const text = feedbackInputs[rec.id]?.trim();
    if (!text) return;
    feedbackSubmitting[rec.id] = true;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recommendation_id: rec.id, feedback: text }),
      });
      if (res.ok) {
        feedbackDone[rec.id] = true;
        history = history.map((r) => (r.id === rec.id ? { ...r, feedback: text } : r));
        fetchNotes().then((n) => (notes = n));
      }
    } finally {
      feedbackSubmitting[rec.id] = false;
    }
  }

  function weatherSummary(rec: Recommendation): string {
    const w = rec.weather_snapshot;
    const parts = [`${formatTemp(w.temperature)}`, w.conditions];
    if (w.precipProbability > 0) parts.push(`Rain: ${w.precipProbability}%`);
    return parts.join(' · ');
  }

  async function handleSaveNotes() {
    savingNotes = true;
    await saveNotes(notes);
    savingNotes = false;
    notesSaved = true;
    setTimeout(() => (notesSaved = false), 2000);
  }

  function handleSignOut() {
    signOut();
    onClose();
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
  <div
    class="bg-run-card rounded-2xl border border-run-border shadow-xl w-full max-w-md p-6 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-base">Settings</h2>
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

    <!-- Preferences -->
    <div>
      <h3 class="text-xs font-semibold text-run-muted uppercase tracking-wide mb-3">Preferences</h3>
      <div class="flex flex-col gap-5">
        <label class="flex flex-col gap-1.5">
          <div class="flex justify-between items-baseline">
            <span class="text-xs font-medium text-run-text">Rain tolerance</span>
            <span class="text-xs text-run-muted">{Math.round(prefs.rainTolerance * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={prefs.rainTolerance}
            oninput={(e) =>
              updatePreferences({
                rainTolerance: parseFloat((e.target as HTMLInputElement).value),
              })}
            class="w-full accent-run-green"
          />
          <div class="flex justify-between text-[10px] text-run-muted">
            <span>Hate rain</span>
            <span>Don't mind rain</span>
          </div>
        </label>

        <div>
          <span class="text-xs font-medium text-run-text">Comfortable temperature range</span>
          <p class="text-[10px] text-run-muted mt-0.5 mb-2">Hours outside this range score lower</p>
          <div class="flex gap-3">
            <label class="flex-1 flex flex-col gap-1">
              <span class="text-[10px] text-run-muted">Too cold below</span>
              <div class="relative">
                <input
                  type="number"
                  min="-30"
                  max="50"
                  value={prefs.tempMin}
                  onchange={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val)) updatePreferences({ tempMin: val });
                  }}
                  class="w-full px-2.5 py-2 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                />
                <span
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none"
                  >°C</span
                >
              </div>
            </label>
            <label class="flex-1 flex flex-col gap-1">
              <span class="text-[10px] text-run-muted">Too hot above</span>
              <div class="relative">
                <input
                  type="number"
                  min="-30"
                  max="50"
                  value={prefs.tempMax}
                  onchange={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val)) updatePreferences({ tempMax: val });
                  }}
                  class="w-full px-2.5 py-2 border border-run-border rounded-lg text-sm bg-run-bg text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                />
                <span
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none"
                  >°C</span
                >
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    {#if auth.user}
      <!-- Recommendation history -->
      <div>
        <h3 class="text-xs font-semibold text-run-muted uppercase tracking-wide mb-3">
          Recent recommendations
        </h3>
        {#if !historyLoaded}
          <p class="text-xs text-run-muted">Loading…</p>
        {:else if history.length === 0}
          <p class="text-xs text-run-muted">
            No recommendations yet. Click a future hour slot to get started.
          </p>
        {:else}
          <div class="flex flex-col gap-2">
            {#each history as rec (rec.id)}
              <div class="border border-run-border rounded-lg p-3 flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-run-text">{formatSlotLabel(rec)}</span>
                  {#if rec.feedback || feedbackDone[rec.id]}
                    <span class="text-[10px] text-run-green">Feedback ✓</span>
                  {/if}
                </div>
                <span class="text-[10px] text-run-muted">{metaLine(rec)}</span>
                <p class="text-xs text-run-text leading-relaxed mt-0.5">
                  {truncate(rec.recommendation)}
                </p>
                {#if new Date(rec.slot_datetime) < new Date()}
                  {#if rec.feedback || feedbackDone[rec.id]}
                    <p class="text-[10px] text-run-muted mt-1 italic">
                      "{rec.feedback ?? feedbackInputs[rec.id]}"
                    </p>
                  {:else}
                    <div class="mt-2 flex gap-1.5">
                      <input
                        type="text"
                        placeholder="How did it go?"
                        value={feedbackInputs[rec.id] ?? ''}
                        oninput={(e) =>
                          (feedbackInputs[rec.id] = (e.target as HTMLInputElement).value)}
                        class="flex-1 min-w-0 px-2.5 py-1.5 border border-run-border rounded-lg text-xs bg-run-bg text-run-text placeholder:text-run-muted focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                      />
                      <button
                        onclick={() => submitFeedback(rec)}
                        disabled={feedbackSubmitting[rec.id] || !feedbackInputs[rec.id]?.trim()}
                        class="px-2.5 py-1.5 border border-run-border text-run-muted rounded-lg text-xs font-medium hover:border-run-green hover:text-run-green transition-colors disabled:opacity-50 shrink-0"
                      >
                        {feedbackSubmitting[rec.id] ? 'Saving…' : '✨  Submit'}
                      </button>
                    </div>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Running notes -->
      <div>
        <h3 class="text-xs font-semibold text-run-muted uppercase tracking-wide mb-3">
          Running notes
        </h3>
        <p class="text-[11px] text-run-muted mb-2">
          Personal context for AI clothing recommendations. Updated automatically when you submit
          run feedback.
        </p>
        <textarea
          bind:value={notes}
          rows="8"
          placeholder="e.g. I run cold, hate arm warmers, tend to overheat on tempo efforts…"
          class="w-full px-3 py-2 border border-run-border rounded-lg text-xs bg-run-bg text-run-text resize-none focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
        ></textarea>
        <div class="flex justify-end mt-2">
          <button
            onclick={handleSaveNotes}
            disabled={savingNotes}
            class="text-xs px-3 py-1.5 bg-run-green text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[82px] text-center"
          >
            {notesSaved ? 'Saved ✓' : savingNotes ? 'Saving…' : 'Save notes'}
          </button>
        </div>
      </div>

      <!-- Account -->
      <div>
        <h3 class="text-xs font-semibold text-run-muted uppercase tracking-wide mb-3">Account</h3>
        <div class="flex items-center justify-between">
          <p class="text-xs text-run-muted">
            Signed in as <span class="text-run-text font-medium">{auth.user.email}</span>
          </p>
          <button
            onclick={handleSignOut}
            class="text-xs px-3 py-1.5 border border-run-border text-run-muted rounded-lg hover:border-red-400 hover:text-red-400 transition-colors"
            >Sign out</button
          >
        </div>
      </div>
    {/if}
  </div>
</div>
