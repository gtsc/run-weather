# AI Clothing Recommendations Design

## Overview

Extend run weather with AI-powered clothing recommendations and a personal memory system that learns from run feedback. A runner clicks an upcoming hour, optionally describes their planned run, and gets a "what to wear" suggestion from Claude. They click a past hour to give freeform feedback. Claude updates a personal memory blob after each feedback, so future recommendations reflect what has actually worked.

## Stack additions

- **Supabase** — email/password auth + Postgres database for user memory
- **Cloudflare Worker** — Claude proxy (keeps API key server-side); rate limiting per user
- **Claude Sonnet** — recommendation and memory-update calls (Haiku evaluated and rejected: 9/19 eval pass rate vs Sonnet's 17/19)
- **`lab/` directory** — standalone TypeScript scripts for prompt iteration and evals (no app wiring)

No LangChain, no orchestration framework. Two prompts, called at the right moments.

## Two core AI operations

**Recommend:** `system_prompt + user_memory + weather_data + run_description → freeform prose (2–4 sentences)`

**Update memory:** `current_memory + weather_data + run_description + original_suggestion + user_feedback → updated_memory`

The system prompt is fixed and written once — it makes recommendations sensible even when memory is blank. The memory blob is the only thing that evolves. Including weather data, run description, and the original suggestion in memory updates lets Claude contrast "what I would have said" against "what actually happened" to extract sharper lessons.

## Memory model

One freeform text blob per user, stored in Supabase. Starts empty. Updated by Claude after each feedback submission. Editable by hand at any time. Personal context ("I run cold, I hate arm warmers") and learned feedback ("tends to overheat above 14°C in direct sun on tempo runs") live together in the same blob — no structural distinction.

## Run description

An optional text field shown in the hour panel before requesting a recommendation — labelled *"What's the plan?"* with placeholder *"e.g. tempo 10k, easy long run 15k"*. Effort and distance meaningfully change clothing needs (a tempo run generates far more heat than a slow long run at the same temperature). If left blank, Claude treats it as a moderate-effort run. The description is included in both the recommendation and the memory update so feedback like "wore shorts for a tempo 10k, legs got cold" is stored with full context.

## Phases

### Phase 0: Prompt lab + evals

`lab/` directory at project root. Plain TypeScript, run with `npx tsx`. No app changes.

- **`lab/recommend.ts`** — hardcoded weather + memory + run description → call Claude → print recommendation. Iterate on system prompt here.
- **`lab/update-memory.ts`** — hardcoded weather + run description + original suggestion + feedback + memory → call Claude → print updated memory. Iterate until updates feel clean and cumulative.
- **`lab/eval/cases.ts`** — test cases, each a tuple of `(weather, run_description, feedback, memory_before, expected_lesson)`.
- **`lab/eval/run.ts`** — runs all cases through both prompts in sequence, then calls Claude as judge to grade whether recommendations improved after memory updates. Prints pass/fail report.

Goal: nail the AI behaviour in isolation before building any UI or backend around it.

### Phase 1: Backend

**Supabase schema** — one table:

```
user_memory
  user_id    uuid  FK → auth.users
  content    text
  updated_at timestamp
```

Row Level Security ensures users read/write only their own row.

**Cloudflare Worker** — two authenticated endpoints (Bearer token = Supabase JWT):

- `POST /recommend` — receives `{ weather: HourData, run_description?: string }`, fetches user memory, calls Claude, returns recommendation prose.
- `POST /feedback` — receives `{ weather: HourData, run_description?: string, original_suggestion?: string, feedback: string }`, fetches memory, calls Claude to update it, writes back to Supabase, returns new memory.

Rate limiting: per user ID via Cloudflare's built-in rate limiting.

### Phase 2: UI changes

**Past hours:** Today's past hours already exist in the store. Make them clickable (keep greyed styling). No data retention work needed.

**`HourPanel` component:** Clicking any hour opens a persistent panel below the day strip showing the weather snapshot. Two modes:

- *Upcoming hour* — optional *"What's the plan?"* text input, then "What should I wear?" button → loading state → recommendation prose. Suggestion stored in component state.
- *Past hour* — freeform text input ("What did you wear, and how did it feel?") + submit button → feedback endpoint → brief confirmation ("Memory updated"). `original_suggestion` passed if available in state, otherwise `null`.

Panel appears in the day strip / `DayDetail` view. Not a modal.

### Phase 3: Settings and memory page

Extend the existing settings panel with a new section:

- **My running notes** — labelled textarea showing the memory blob. Editable. "Save" button writes to Supabase. Helper text: *"These notes personalise your clothing recommendations. Edit freely — they update automatically when you submit run feedback."*

Existing preference settings (temperature comfort, rain tolerance, duration) stay where they are or move here — TBD when building the UI.

Only visible when logged in. Logged-out users see the app as today, with no AI features surfaced.

## Future: feedback as scoring calibration

The run feedback signal is richer than clothing alone. "Felt awful despite a high score" indicates the scoring engine misfired — the same pattern that prompted the humidity/dew point fix. Over time, consistent feedback mismatches could drive personal scoring weight calibration, not just clothing memory. Not in scope now, but the feedback data collected here is the right foundation for it.
