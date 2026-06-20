# Phase 2: UI Redesign + AI Panel Design

## Goal

Simplify the UI by removing rarely-used features, fix the disappearing tooltip, and add auth + AI recommendation/feedback panels. The redesign comes first; AI features slot into the new structure.

## What changes

### Removed
- **Expand/collapse interaction** on day strips — days are always fully visible
- **DayDetail.svelte** and **RunWindow.svelte** — deleted; the coloured bar communicates best windows visually
- **Duration slider** in Settings — not useful in practice

### Fixed
- **Tooltip → persistent panel** — clicking a segment pins the hour detail panel inline; it stays until you click elsewhere or close it. Copy-paste works. Same data as the current tooltip.

### Added
- **Auth button in header** — person icon when logged out, initials circle when logged in
- **Sign-in modal** — standard email + password form
- **Notes dropdown** — initials circle opens a dropdown with editable "My running notes" textarea + sign out
- **AI section in hour panel** — recommendation (upcoming) or feedback (past today only)

---

## Week view

All 7 day strips always visible. Each strip has:
- **Header row:** date label (left) + best score badge (right) — non-interactive, just informational
- **Coloured bar:** 24 hour segments, clickable

No expand/collapse. No run window cards.

---

## Hour panel

Clicking any segment opens a persistent panel **inline below the clicked day's bar**, pushing the remaining day strips down. One panel open at a time — clicking a segment in a different day closes the current panel and opens a new one.

**Selected segment:** subtle white ring indicator.

**Close:** tap elsewhere, tap the segment again, or press ×.

**Panel content:**

```
[×]
7:00 AM  ● Score: 74
─────────────────────
Partly cloudy
9°C, feels like 6°C
Wind: 22 km/h
Rain: 10% chance
```

Same fields as the current tooltip. Snow depth and dark shown conditionally.

---

## AI section (below weather details in panel)

Shown only when logged in. Varies by hour type:

### Upcoming hour (today future + future days)

```
─────────────────────
What's the plan?
[                   ]   ← optional text input, always visible

[What should I wear?]   ← button

// After clicking:
Long-sleeve base layer and a wind jacket...   ← recommendation prose
```

### Past hour (today only)

```
─────────────────────
How did it go?
[                   ]
[                   ]   ← textarea

[Submit feedback    ]

// After clicking:
Memory updated ✓
```

### Past days

No AI section — weather details only.

### Logged out

No AI section — weather details only. Auth is accessed via the header, not from the panel.

---

## Auth (header)

Header right side: `[dark mode toggle]  [person icon / initials]`

**Logged out:** person icon renders as "Sign in" label or icon → clicking opens the sign-in modal.

**Logged in:** initials circle → clicking opens a small dropdown:
```
My running notes
┌─────────────────────────┐
│ Tends to run warm...    │
│                         │
└─────────────────────────┘
[Save]          [Sign out]
```
Notes are the user's memory blob (from Supabase), editable and saveable.

**Sign-in modal:** standard centred overlay, email + password fields, sign-in button. No sign-up flow for now (users created manually or via Supabase dashboard).

---

## New/modified components

| Component | Change |
|---|---|
| `DayStrip.svelte` | Remove expand/collapse; add click handler on segments; render HourPanel inline |
| `WeekView.svelte` | Remove DayDetail rendering; manage which panel is open |
| `HourTooltip.svelte` | Replaced by `HourPanel.svelte` |
| `HourPanel.svelte` | New — persistent panel with weather + AI section |
| `Settings.svelte` | Remove duration slider |
| `App.svelte` | Add auth button to header |
| `AuthModal.svelte` | New — email + password sign-in modal |
| `NotesDropdown.svelte` | New — initials + dropdown with memory textarea |
| `DayDetail.svelte` | Deleted |
| `RunWindow.svelte` | Deleted |
| `preferences.svelte.ts` | Remove `durationHours` field |
| `auth.svelte.ts` | New store — Supabase session, user, sign-in/out |

---

## Data flow for AI features

**Recommend:**
1. User types optional run description, clicks "What should I wear?"
2. Client calls `POST /recommend` with `{ weather: WeatherInput, run_description? }`
3. Worker fetches memory, calls Claude, returns prose
4. Prose renders in panel; stored in component state as `lastSuggestion`

**Feedback:**
1. User types feedback, clicks "Submit feedback"
2. Client calls `POST /feedback` with `{ weather, run_description?, original_suggestion?: lastSuggestion, feedback }`
3. Worker updates memory in Supabase, returns new memory
4. Panel shows "Memory updated ✓"

**Weather → WeatherInput conversion:**
Client converts `HourData` (from the weather store) to `WeatherInput` using `getWeatherInfo(weatherCode).label` for the `conditions` field. This happens in the component before calling the Worker.

---

## What's deferred

- Sign-up flow (email confirmation, password reset)
- "What's the plan?" toggle vs always-visible — build always-visible first, adjust if it feels cluttered
- Rate limiting on the Worker
- Past days feedback (low value)
