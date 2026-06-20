# Phase 2: UI Redesign + AI Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the week view (remove run windows, fix tooltip → persistent panel, remove duration slider), add Supabase auth to the header, and wire up the AI recommendation/feedback panel.

**Architecture:** Three sequential layers — (1) UI simplification with no auth dependency, (2) auth store + header UI, (3) AI section wired to the Cloudflare Worker. Each layer is independently shippable. All Svelte 5 runes (`$state`, `$derived`, `$props`). No new routing — single-page app throughout.

**Tech Stack:** Svelte 5, TypeScript strict, Tailwind CSS v4, `@supabase/supabase-js` v2 (added to main app), Vite env vars (`VITE_*`), Cloudflare Worker at `https://run-weather-api.gustavtsc.workers.dev`.

---

## Prerequisites

Before starting, add Supabase env vars to `.env.local` (create if it doesn't exist):

```
VITE_SUPABASE_URL=https://ezumistlrqestgbopecq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_s5y8AcrKmCBg-rXfxIcUJQ_vKa0eaUs
```

Also in Supabase dashboard → **Authentication → Providers → Email**: disable "Confirm email" (we're not building a sign-up flow — users added manually).

---

## Layer 1: UI Simplification

---

### Task 1: Remove `durationHours` and run windows from types + stores

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/stores/preferences.svelte.ts`
- Modify: `src/lib/stores/weather.svelte.ts`

**Step 1: Remove `durationHours` from `Preferences` and `windows` from `DayData` in `src/lib/types.ts`**

Remove the `durationHours` field from `Preferences` and the `windows` field from `DayData`. Also remove the `RunWindow` interface (no longer needed):

```typescript
export interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

export interface HourData {
  time: string;
  date: string;
  hour: number;
  temperature: number;
  feelsLike: number;
  precipProbability: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  weatherCode: number;
  snowDepth: number;
  isDay: boolean;
  dewPoint: number;
}

export interface ScoredHour extends HourData {
  score: number;
}

export interface DayData {
  date: string;
  dayIndex: number;
  hours: ScoredHour[];
  scores: number[];
  bestScore: number;
}

export interface Preferences {
  rainTolerance: number;
  tempMin: number;
  tempMax: number;
}

export interface WeatherInfo {
  label: string;
  penalty: number;
}
```

**Step 2: Remove `durationHours` from `src/lib/stores/preferences.svelte.ts`**

```typescript
import type { Preferences } from '../types';

const STORAGE_KEY = 'run-weather-prefs';

const defaults: Preferences = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
};

function loadFromStorage(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return { ...defaults };
}

let prefs = $state<Preferences>(loadFromStorage());

export function getPreferences(): Preferences {
  return prefs;
}

export function updatePreferences(updates: Partial<Preferences>): void {
  Object.assign(prefs, updates);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}
```

**Step 3: Remove `findRunWindows` from `src/lib/stores/weather.svelte.ts`**

```typescript
import type { HourData, DayData } from '../types';
import { fetchForecast } from '../api/forecast';
import { scoreHour } from '../scoring/engine';
import { getPreferences } from './preferences.svelte';

let rawHours = $state<HourData[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export function getWeatherState(): { days: DayData[]; loading: boolean; error: string | null } {
  const prefs = getPreferences();

  const scored = rawHours.map((h) => ({
    ...h,
    score: scoreHour(h, prefs),
  }));

  const dayMap = new Map<string, typeof scored>();
  for (const h of scored) {
    if (!dayMap.has(h.date)) dayMap.set(h.date, []);
    dayMap.get(h.date)!.push(h);
  }

  const now = new Date();
  const days: DayData[] = [...dayMap.entries()].map(([date, hours], dayIndex) => {
    const scores = hours.map((h) => h.score);
    const futureScores = hours.map((h, i) => (new Date(h.time) >= now ? scores[i] : -1));
    const bestScore = Math.max(...futureScores, 0);
    return { date, dayIndex, hours, scores, bestScore };
  });

  return { days, loading, error };
}

export async function loadForecast(latitude: number, longitude: number): Promise<void> {
  loading = true;
  error = null;
  try {
    rawHours = await fetchForecast(latitude, longitude);
  } catch (e) {
    error = (e as Error).message;
    rawHours = [];
  } finally {
    loading = false;
  }
}
```

**Step 4: Run type-check**

```bash
npm run check
```

Expected: errors about `windows` and `durationHours` still used in components — that's fine, we fix those next.

**Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/stores/preferences.svelte.ts src/lib/stores/weather.svelte.ts
git commit -m "feat: remove durationHours pref and run windows from types/stores"
```

---

### Task 2: Delete DayDetail, RunWindow, HourTooltip; remove duration from Settings

**Files:**
- Delete: `src/components/DayDetail.svelte`
- Delete: `src/components/RunWindow.svelte`
- Delete: `src/components/HourTooltip.svelte`
- Delete: `src/lib/scoring/windows.ts`
- Modify: `src/components/Settings.svelte`

**Step 1: Delete the four files**

```bash
rm src/components/DayDetail.svelte
rm src/components/RunWindow.svelte
rm src/components/HourTooltip.svelte
rm src/lib/scoring/windows.ts
```

**Step 2: Remove duration slider from `src/components/Settings.svelte`**

Replace the entire file with:

```svelte
<script lang="ts">
  import { getPreferences, updatePreferences } from '../lib/stores/preferences.svelte';

  let open = $state(false);
  const prefs = $derived(getPreferences());
</script>

<div class="relative">
  <button
    onclick={() => (open = !open)}
    class="p-2 rounded-xl hover:bg-run-border/50 transition-colors cursor-pointer"
    title="Settings"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5 text-run-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full mt-2 w-80 bg-run-card rounded-xl shadow-lg border border-run-border p-5 z-10"
    >
      <h3 class="font-semibold text-sm mb-4">Preferences</h3>

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
                  class="w-full px-2.5 py-2 border border-run-border rounded-lg text-sm bg-run-card text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                />
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none">°C</span>
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
                  class="w-full px-2.5 py-2 border border-run-border rounded-lg text-sm bg-run-card text-run-text focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
                />
                <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-run-muted pointer-events-none">°C</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
```

**Step 3: Run type-check**

```bash
npm run check
```

Expected: errors about deleted files still imported in WeekView and DayStrip — fix those next.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove DayDetail, RunWindow, HourTooltip, windows scorer, duration slider"
```

---

### Task 3: Rewrite DayStrip — remove expand/collapse, add click selection

**Files:**
- Modify: `src/components/DayStrip.svelte`

DayStrip now owns which hour is selected within the day. It receives an `onHourSelect` callback and an `selectedHourTime` prop (the currently selected hour's `time` string, set by WeekView). If the selected hour belongs to this day, the panel shows; otherwise it's hidden.

```svelte
<script lang="ts">
  import type { DayData, ScoredHour } from '../lib/types';
  import { formatDayLabel, scoreColorHex } from '../lib/utils/format';

  let {
    day,
    selectedHourTime = null,
    onHourSelect,
  }: {
    day: DayData;
    selectedHourTime?: string | null;
    onHourSelect: (hour: ScoredHour | null) => void;
  } = $props();

  function isPast(hourData: ScoredHour): boolean {
    return new Date(hourData.time) < new Date();
  }

  function handleSegmentClick(hour: ScoredHour) {
    if (selectedHourTime === hour.time) {
      onHourSelect(null);
    } else {
      onHourSelect(hour);
    }
  }

  const selectedHour = $derived(
    selectedHourTime ? day.hours.find((h) => h.time === selectedHourTime) ?? null : null,
  );

  const confidence = $derived(day.dayIndex <= 1 ? null : day.dayIndex <= 4 ? 'moderate' : 'low');
</script>

<div class="rounded-xl bg-run-card border border-run-border p-4">
  <div class="flex items-center justify-between mb-2.5">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{formatDayLabel(day.date)}</span>
      {#if confidence}
        <span
          class="text-[10px] px-1.5 py-0.5 rounded {confidence === 'low'
            ? 'bg-run-amber/10 text-run-amber'
            : 'bg-run-border/50 text-run-muted'}"
        >
          {confidence === 'low' ? 'Less reliable' : 'Approx.'}
        </span>
      {/if}
    </div>
    <span
      class="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
      style="background-color: {scoreColorHex(day.bestScore)}"
    >
      Best: {day.bestScore}
    </span>
  </div>

  <div class="flex gap-px h-7 rounded-lg overflow-hidden {confidence === 'low' ? 'opacity-70' : ''}">
    {#each day.hours as hour, i (hour.time)}
      {@const past = isPast(hour)}
      {@const selected = selectedHourTime === hour.time}
      <button
        class="flex-1 transition-opacity focus:outline-none {past ? 'opacity-40' : 'hover:opacity-80'} {selected ? 'ring-1 ring-white ring-inset' : ''}"
        style="background-color: {past ? '#d1d5db' : scoreColorHex(day.scores[i])}"
        onclick={() => handleSegmentClick(hour)}
        title="{String(hour.hour).padStart(2, '0')}:00"
        aria-label="{String(hour.hour).padStart(2, '0')}:00"
      ></button>
    {/each}
  </div>

  <div class="flex justify-between mt-1.5 text-[10px] text-run-muted">
    <span>00:00</span>
    <span>06:00</span>
    <span>12:00</span>
    <span>18:00</span>
    <span>23:00</span>
  </div>

  {#if selectedHour}
    <slot name="panel" hour={selectedHour} score={day.scores[day.hours.indexOf(selectedHour)]} />
  {/if}
</div>
```

**Step 2: Run type-check**

```bash
npm run check
```

**Step 3: Commit**

```bash
git add src/components/DayStrip.svelte
git commit -m "feat: DayStrip — remove expand/collapse, add click selection + panel slot"
```

---

### Task 4: Create HourPanel component

**Files:**
- Create: `src/components/HourPanel.svelte`

This renders the weather details for a selected hour. The AI section is a slot (filled in Task 9). For now it just shows weather data + a close button.

```svelte
<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';

  let {
    hour,
    score,
    onClose,
  }: {
    hour: ScoredHour;
    score: number;
    onClose: () => void;
  } = $props();

  const weather = $derived(getWeatherInfo(hour.weatherCode));
  const timeLabel = $derived(`${String(hour.hour).padStart(2, '0')}:00`);
</script>

<div class="mt-3 pt-3 border-t border-run-border">
  <div class="flex items-start justify-between mb-2">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{timeLabel}</span>
      <span
        class="inline-block w-2 h-2 rounded-full shrink-0"
        style="background-color: {scoreColorHex(score)}"
      ></span>
      <span class="text-xs text-run-muted">Score: {score}</span>
    </div>
    <button
      onclick={onClose}
      class="text-run-muted hover:text-run-text transition-colors p-0.5 -mr-0.5"
      aria-label="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="flex flex-col gap-0.5 text-xs text-run-muted">
    <span>{weather.label}</span>
    <span>{formatTemp(hour.temperature)}, feels like {formatTemp(hour.feelsLike)}</span>
    <span>Wind: {formatWind(hour.windSpeed)}</span>
    <span>Rain: {hour.precipProbability}%</span>
    {#if hour.snowDepth > 0}
      <span>Snow on ground: {Math.round(hour.snowDepth * 100)} cm</span>
    {/if}
    {#if !hour.isDay}
      <span>Dark</span>
    {/if}
  </div>

  <slot />
</div>
```

**Step 2: Run type-check**

```bash
npm run check
```

**Step 3: Commit**

```bash
git add src/components/HourPanel.svelte
git commit -m "feat: HourPanel component — persistent weather detail panel"
```

---

### Task 5: Wire HourPanel into WeekView

**Files:**
- Modify: `src/components/WeekView.svelte`

WeekView lifts the selected hour state. Only one panel open at a time across all days.

```svelte
<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { getWeatherState } from '../lib/stores/weather.svelte';
  import DayStrip from './DayStrip.svelte';
  import HourPanel from './HourPanel.svelte';

  let selectedHourTime = $state<string | null>(null);

  const weather = $derived(getWeatherState());

  function handleHourSelect(hour: ScoredHour | null) {
    selectedHourTime = hour ? hour.time : null;
  }
</script>

{#if weather.loading}
  <div class="flex flex-col items-center justify-center py-12 gap-3">
    <svg class="w-6 h-6 animate-spin text-run-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
    <p class="text-run-muted text-sm">Loading forecast...</p>
  </div>
{:else if weather.error}
  <div class="text-center py-12">
    <p class="text-run-red text-sm">{weather.error}</p>
  </div>
{:else if weather.days.length === 0}
  <div class="flex flex-col items-center justify-center py-16 gap-2 text-run-muted">
    <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
    <p class="text-sm">Search for a location to see your running forecast</p>
  </div>
{:else}
  <div class="flex flex-col gap-2">
    {#each weather.days as day (day.date)}
      {@const selectedInThisDay = selectedHourTime && day.hours.some((h) => h.time === selectedHourTime)
        ? selectedHourTime
        : null}
      {@const selectedHour = selectedInThisDay
        ? day.hours.find((h) => h.time === selectedInThisDay) ?? null
        : null}
      <DayStrip
        {day}
        selectedHourTime={selectedInThisDay}
        onHourSelect={handleHourSelect}
      >
        {#snippet panel({ hour, score }: { hour: ScoredHour; score: number })}
          <HourPanel {hour} {score} onClose={() => (selectedHourTime = null)} />
        {/snippet}
      </DayStrip>
    {/each}
  </div>
{/if}
```

**Step 2: Run type-check**

```bash
npm run check
```

Expected: 0 errors.

**Step 3: Run dev server and verify manually**

```bash
npm run dev
```

Open http://localhost:5173. Search for a location. Verify:
- 7 day strips always visible, no expand/collapse
- Clicking a segment opens the panel below that day's bar
- Clicking another segment (same or different day) moves the panel
- Clicking the × closes the panel
- Selected segment has white ring
- Panel shows: time, score, weather label, temp, wind, rain

**Step 4: Commit**

```bash
git add src/components/WeekView.svelte
git commit -m "feat: WeekView — wire HourPanel, one panel across all days"
```

---

## Layer 2: Auth

---

### Task 6: Add `@supabase/supabase-js` and create auth store

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/lib/stores/auth.svelte.ts`

**Step 1: Install Supabase client**

```bash
npm install @supabase/supabase-js
```

**Step 2: Create `src/lib/stores/auth.svelte.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

export { supabase };

interface AuthState {
  user: { id: string; email: string } | null;
  loading: boolean;
  error: string | null;
}

let state = $state<AuthState>({ user: null, loading: true, error: null });

// Initialise from existing session on page load
supabase.auth.getSession().then(({ data }) => {
  const u = data.session?.user;
  state.user = u ? { id: u.id, email: u.email ?? '' } : null;
  state.loading = false;
});

// Keep in sync with auth state changes (sign in / sign out)
supabase.auth.onAuthStateChange((_event, session) => {
  const u = session?.user;
  state.user = u ? { id: u.id, email: u.email ?? '' } : null;
});

export function getAuthState(): AuthState {
  return state;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  state.error = null;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    state.error = error.message;
    return error.message;
  }
  return null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function fetchNotes(): Promise<string> {
  const { data } = await supabase.from('user_memory').select('content').maybeSingle();
  return data?.content ?? '';
}

export async function saveNotes(content: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('user_memory')
    .upsert({ user_id: user.id, content, updated_at: new Date().toISOString() });
}
```

**Step 3: Run type-check**

```bash
npm run check
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/lib/stores/auth.svelte.ts package.json package-lock.json
git commit -m "feat: auth store — Supabase session, signIn/signOut, notes fetch/save"
```

---

### Task 7: AuthModal component

**Files:**
- Create: `src/components/AuthModal.svelte`

Standard centered modal, email + password, no sign-up.

```svelte
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

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  onclick={handleBackdropClick}
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
        <p class="text-xs text-run-red">{error}</p>
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
```

**Step 2: Run type-check**

```bash
npm run check
```

**Step 3: Commit**

```bash
git add src/components/AuthModal.svelte
git commit -m "feat: AuthModal — email/password sign-in form"
```

---

### Task 8: UserButton component + wire into App.svelte

**Files:**
- Create: `src/components/UserButton.svelte`
- Modify: `src/App.svelte`

**Step 1: Create `src/components/UserButton.svelte`**

Person icon when logged out (opens AuthModal). Initials circle when logged in (opens notes dropdown).

```svelte
<script lang="ts">
  import { getAuthState, signOut, fetchNotes, saveNotes } from '../lib/stores/auth.svelte';
  import AuthModal from './AuthModal.svelte';

  const auth = $derived(getAuthState());

  let showModal = $state(false);
  let showDropdown = $state(false);
  let notes = $state('');
  let saving = $state(false);
  let saved = $state(false);

  const initials = $derived(
    auth.user?.email
      ? auth.user.email.slice(0, 2).toUpperCase()
      : '',
  );

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
      class="w-9 h-9 rounded-full bg-run-green text-white text-xs font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
    >
      {initials}
    </button>

    {#if showDropdown}
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <div
        class="fixed inset-0 z-10"
        onclick={() => (showDropdown = false)}
      ></div>
      <div class="absolute right-0 top-full mt-2 w-72 bg-run-card rounded-xl shadow-lg border border-run-border p-4 z-20">
        <p class="text-xs font-medium mb-2">My running notes</p>
        <textarea
          bind:value={notes}
          rows="5"
          placeholder="Notes about your clothing preferences will appear here after you submit run feedback."
          class="w-full px-3 py-2 border border-run-border rounded-lg text-xs bg-run-bg text-run-text resize-none focus:outline-none focus:ring-2 focus:ring-run-green/30 focus:border-run-green transition-shadow"
        ></textarea>
        <div class="flex items-center justify-between mt-2">
          <button
            onclick={handleSignOut}
            class="text-xs text-run-muted hover:text-run-text transition-colors"
          >
            Sign out
          </button>
          <button
            onclick={handleSave}
            disabled={saving}
            class="text-xs px-3 py-1.5 bg-run-green text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save'}
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
```

**Step 2: Add UserButton to `src/App.svelte`**

```svelte
<script>
  import LocationInput from './components/LocationInput.svelte';
  import WeekView from './components/WeekView.svelte';
  import Settings from './components/Settings.svelte';
  import DarkModeToggle from './components/DarkModeToggle.svelte';
  import UserButton from './components/UserButton.svelte';
</script>

<div class="min-h-screen bg-run-bg text-run-text">
  <header
    class="bg-run-card border-b border-run-border"
    style="padding-top: env(safe-area-inset-top)"
  >
    <div class="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 bg-run-green rounded-xl flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-semibold tracking-tight">Run Weather</h1>
          <p class="text-run-muted text-xs">Find the best time to run</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <DarkModeToggle />
        <Settings />
        <UserButton />
      </div>
    </div>
  </header>

  <main class="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">
    <LocationInput />
    <WeekView />
  </main>

  <footer class="text-center text-[11px] text-run-muted py-6 border-t border-run-border">
    Weather data by <a
      href="https://open-meteo.com/"
      class="underline hover:text-run-text transition-colors"
      target="_blank"
      rel="noreferrer">Open-Meteo.com</a
    >
  </footer>
</div>
```

**Step 3: Run type-check**

```bash
npm run check
```

Expected: 0 errors.

**Step 4: Run dev server and verify manually**

```bash
npm run dev
```

Verify:
- Header shows "Sign in" button when logged out
- Clicking "Sign in" opens the modal
- Entering credentials and submitting signs in (initials circle appears)
- Initials circle opens notes dropdown (empty at first)
- Sign out works
- Page reload re-hydrates the session (no sign-in prompt)

**Step 5: Commit**

```bash
git add src/components/UserButton.svelte src/App.svelte
git commit -m "feat: UserButton — sign in modal, initials + notes dropdown"
```

---

## Layer 3: AI Features

---

### Task 9: WeatherInput helper

**Files:**
- Create: `src/lib/utils/weatherInput.ts`

Converts `HourData` (from the weather store) to `WeatherInput` (the Worker's API shape).

```typescript
import type { HourData } from '../types';
import { getWeatherInfo } from '../scoring/weatherCodes';

export interface WeatherInput {
  hour: number;
  isDay: boolean;
  temperature: number;
  feelsLike: number;
  conditions: string;
  windSpeed: number;
  windGusts: number;
  precipProbability: number;
  precipitation: number;
  dewPoint: number;
}

export function toWeatherInput(h: HourData): WeatherInput {
  return {
    hour: h.hour,
    isDay: h.isDay,
    temperature: h.temperature,
    feelsLike: h.feelsLike,
    conditions: getWeatherInfo(h.weatherCode).label,
    windSpeed: h.windSpeed,
    windGusts: h.windGusts,
    precipProbability: h.precipProbability,
    precipitation: h.precipitation,
    dewPoint: h.dewPoint,
  };
}
```

**Step 2: Run type-check**

```bash
npm run check
```

**Step 3: Commit**

```bash
git add src/lib/utils/weatherInput.ts
git commit -m "feat: toWeatherInput helper — HourData → Worker API shape"
```

---

### Task 10: AI section in HourPanel

**Files:**
- Modify: `src/components/HourPanel.svelte`

Add the AI section below the weather details. Determine hour type (upcoming vs past-today vs past-day) and render accordingly. Only shown when logged in.

```svelte
<script lang="ts">
  import type { ScoredHour } from '../lib/types';
  import { formatTemp, formatWind, scoreColorHex } from '../lib/utils/format';
  import { getWeatherInfo } from '../lib/scoring/weatherCodes';
  import { getAuthState, supabase } from '../lib/stores/auth.svelte';
  import { toWeatherInput } from '../lib/utils/weatherInput';

  const WORKER_URL = 'https://run-weather-api.gustavtsc.workers.dev';

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
  const todayDate = now.toISOString().slice(0, 10);

  // upcoming = future hour on any day; pastToday = past hour on today; pastDay = past hour on another day
  const hourTime = $derived(new Date(hour.time));
  const isUpcoming = $derived(hourTime >= now);
  const isPastToday = $derived(hourTime < now && hour.date === todayDate);

  // Recommend state
  let runDescription = $state('');
  let recommending = $state(false);
  let recommendation = $state<string | null>(null);
  let recommendError = $state<string | null>(null);

  // Feedback state
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
      const res = await fetch(`${WORKER_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          weather: toWeatherInput(hour),
          run_description: runDescription || undefined,
        }),
      });
      const json = await res.json() as { recommendation?: string; error?: string };
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
      const res = await fetch(`${WORKER_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          weather: toWeatherInput(hour),
          original_suggestion: recommendation ?? undefined,
          feedback: feedbackText,
        }),
      });
      const json = await res.json() as { memory?: string; error?: string };
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
  <div class="flex items-start justify-between mb-2">
    <div class="flex items-center gap-2">
      <span class="font-medium text-sm">{timeLabel}</span>
      <span
        class="inline-block w-2 h-2 rounded-full shrink-0"
        style="background-color: {scoreColorHex(score)}"
      ></span>
      <span class="text-xs text-run-muted">Score: {score}</span>
    </div>
    <button
      onclick={onClose}
      class="text-run-muted hover:text-run-text transition-colors p-0.5 -mr-0.5"
      aria-label="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="flex flex-col gap-0.5 text-xs text-run-muted">
    <span>{weather.label}</span>
    <span>{formatTemp(hour.temperature)}, feels like {formatTemp(hour.feelsLike)}</span>
    <span>Wind: {formatWind(hour.windSpeed)}</span>
    <span>Rain: {hour.precipProbability}%</span>
    {#if hour.snowDepth > 0}
      <span>Snow on ground: {Math.round(hour.snowDepth * 100)} cm</span>
    {/if}
    {#if !hour.isDay}
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
            class="w-full py-2 bg-run-green text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {recommending ? 'Thinking…' : 'What should I wear?'}
          </button>
          {#if recommendError}
            <p class="text-xs text-run-red">{recommendError}</p>
          {/if}
          {#if recommendation}
            <p class="text-xs text-run-text leading-relaxed">{recommendation}</p>
          {/if}
        </div>
      {:else if isPastToday}
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
              class="w-full py-2 bg-run-green text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submittingFeedback ? 'Saving…' : 'Submit feedback'}
            </button>
            {#if feedbackError}
              <p class="text-xs text-run-red">{feedbackError}</p>
            {/if}
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
```

**Step 2: Run type-check**

```bash
npm run check
```

Expected: 0 errors.

**Step 3: Run dev server and verify manually**

```bash
npm run dev
```

Verify when **logged out:**
- Click any hour segment → panel shows weather details only, no AI section

Verify when **logged in:**
- Click a future hour → weather details + "What's the plan?" input + "What should I wear?" button
- Submit → recommendation appears
- Click a past hour on today → weather details + feedback textarea + "Submit feedback"
- Submit feedback → "Memory updated ✓" appears
- Click a past hour on a past day → weather details only, no AI section

**Step 4: Run final checks**

```bash
npm run check && npm run lint
```

**Step 5: Commit**

```bash
git add src/components/HourPanel.svelte
git commit -m "feat: AI section in HourPanel — recommend (upcoming) + feedback (past today)"
```

---

## Done

All three layers complete. Run `npm run build` to verify the production build is clean before shipping.

---

## Phase 2b: Follow-up (next branch)

### Task 11: Sign-up flow

Allow new users to register from within the app rather than needing manual Supabase dashboard creation.

**Files:**
- Modify: `src/components/AuthModal.svelte` — add email/password sign-up tab alongside sign-in
- Supabase dashboard: disable "Confirm email" so sign-up is instant (already done for sign-in)

**Design:**
- Two tabs in the modal: **Sign in** / **Sign up**
- Sign-up: email + password + confirm password fields
- On success: user is automatically signed in (Supabase returns a session immediately when email confirmation is off)
- No email verification flow needed

### Task 11b: Password reset / forgot password

**Files:**
- Modify: `src/components/AuthModal.svelte` — add "Forgot password?" link on sign-in tab
- Supabase: `supabase.auth.resetPasswordForEmail(email, { redirectTo })` sends a reset link
- Add a `?type=recovery` URL handler in `src/App.svelte` — Supabase redirects back with a token in the URL fragment; detect it and show a "Set new password" form
- The "Set new password" form calls `supabase.auth.updateUser({ password })`

**Flow:**
1. User clicks "Forgot password?" → enters email → receives reset link via email
2. Clicks link → redirected back to app with recovery token → prompted for new password
3. On submit → signed in automatically with new password

### Task 12: Merged settings + account panel

Replace the separate settings gear dropdown and the notes-in-UserButton dropdown with a single unified panel accessible from both. When logged out it shows preferences only; when logged in it also shows running notes.

**Files:**
- Modify: `src/components/Settings.svelte` — expand into a modal/slide-over instead of a small dropdown; add notes section when `auth.user` is set
- Modify: `src/components/UserButton.svelte` — when logged in, clicking initials opens the same settings/account modal instead of the mini notes dropdown; remove the standalone notes dropdown

**Design:**
- Trigger: gear icon (always) or initials (when logged in) — both open the same panel
- Panel sections:
  - **Preferences** — rain tolerance, temp range (existing)
  - **Running notes** — textarea + save (only when logged in)
  - **Account** — signed in as `email@...` + sign-out button (only when logged in)
- Wider modal (~400px) to give notes room to breathe
