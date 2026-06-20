# Run Weather

A webapp to find the best time to run based on weather forecasts.

## Tech Stack

- **Framework**: Svelte 5 + Vite 7
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom theme tokens
- **API**: Open-Meteo (free, no key required)
- **State**: Svelte 5 runes (`$state`, `$derived`) with localStorage persistence
- **Backend**: Cloudflare Worker (`src/server/`) — AI proxy + Supabase auth
- **Linting**: ESLint 9 + `eslint-plugin-svelte` + `@typescript-eslint/parser` + Prettier

## Commands

- `npm run dev` -- Start Vite dev server (http://localhost:5173)
- `npm run dev:worker` -- Start Wrangler worker locally (http://localhost:8787, proxied from Vite)
- `npm run build` -- Production build
- `npm run deploy` -- Build frontend + deploy everything via wrangler
- `npm run check` -- TypeScript + Svelte type checking (svelte-check)
- `npm run check:server` -- TypeScript type check for src/server/
- `npm run lint` -- ESLint + Prettier checks
- `npm run format` -- Auto-format all files with Prettier

## Git Workflow

- **Never commit directly to `main`** — always create a feature branch first
- Branch naming: `feat/description`, `fix/description`, `chore/description`
- Open a PR when the feature is complete; `main` stays stable and deployable
- Example: `git checkout -b feat/auth-panel`

## Quality Gates

Before committing, ensure:

1. `npm run check` passes with 0 errors
2. `npm run check:server` passes with 0 errors
3. `npm run lint` passes (or run `npm run format` first)
4. `npm run build` succeeds

## Project Structure

```
src/
  main.ts                          # App entry point
  app.css                          # Tailwind + theme tokens + dark mode overrides
  App.svelte                       # Root layout
  server/                          # Cloudflare Worker (backend)
    index.ts                       # Worker entry point + routing
    recommend.ts                   # /recommend handler (Claude API)
    feedback.ts                    # /feedback handler (memory update)
    supabase.ts                    # Supabase client factory
    prompts.ts                     # System prompts
    weather.ts                     # Weather formatting for prompts
    types.ts                       # Env + request/response types
    tsconfig.json                  # Separate tsconfig (workers-types, not vite/client)
  lib/
    types.ts                       # Shared TypeScript interfaces
    api/
      geocoding.ts                 # Free-text location search → lat/lng
      forecast.ts                  # 8-day hourly forecast from Open-Meteo
    scoring/
      engine.ts                    # Score each hour 0-100 with misery multiplier
      windows.ts                   # Find best consecutive-hour run windows
      weatherCodes.ts              # WMO code → label + penalty
    stores/
      preferences.svelte.ts        # User prefs (localStorage-backed)
      weather.svelte.ts            # Forecast data + derived scores
      location.svelte.ts           # Current lat/lng/name
      darkMode.svelte.ts           # Dark mode toggle (localStorage-backed)
      auth.svelte.ts               # Supabase auth state
    utils/
      format.ts                    # Time/temp/colour formatting helpers
  components/
    LocationInput.svelte           # Location search field + GPS button
    WeekView.svelte                # 8-day stack of DayStrips
    DayStrip.svelte                # Single day: 24 coloured hour segments + hover tooltip + click panel
    HourPanel.svelte               # Persistent click panel: weather detail + AI clothing recommendation
    Settings.svelte                # Rain tolerance, temp range
    DarkModeToggle.svelte          # Light/dark mode toggle
    AccountPanel.svelte            # User account + running notes
    AuthModal.svelte               # Sign in / sign up modal
    UserButton.svelte              # Header user button
```

## Conventions

- All `.svelte` files use `<script lang="ts">`
- Store files use `.svelte.ts` extension for Svelte 5 rune support
- Imports use extensionless paths (Vite resolves them)
- Theme colours defined in `app.css` under `@theme` (run-green, run-bg, run-card, etc.)
- Dark mode uses CSS custom property overrides via `.dark` class on `<html>`
- All components use `run-*` theme tokens (not hardcoded `bg-white` / `bg-gray-*`)
- `src/server/` uses its own `tsconfig.json` with `@cloudflare/workers-types` (excluded from root tsconfig)
- See FUTURE.md for planned improvements
