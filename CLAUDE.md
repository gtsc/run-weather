# Run Weather

A webapp to find the best time to run based on weather forecasts.

## Tech Stack

- **Framework**: Svelte 5 + Vite 8
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom theme tokens
- **API**: Open-Meteo (free, no key required)
- **State**: Svelte 5 runes (`$state`, `$derived`) with localStorage persistence
- **Hosting**: Cloudflare Workers static assets (no server code)
- **Linting**: ESLint 10 + `eslint-plugin-svelte` + `@typescript-eslint/parser` + Prettier

## Commands

- `npm run dev` -- Start Vite dev server (http://localhost:5173)
- `npm run build` -- Production build
- `npm run deploy` -- Build + deploy static assets via wrangler
- `npm run check` -- TypeScript + Svelte type checking (svelte-check)
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
2. `npm run lint` passes (or run `npm run format` first)
3. `npm test` passes
4. `npm run build` succeeds

## Project Structure

```
src/
  main.ts                          # App entry point
  app.css                          # Tailwind + theme tokens + dark mode overrides
  App.svelte                       # Root layout
  lib/
    types.ts                       # Shared TypeScript interfaces
    api/
      geocoding.ts                 # Free-text location search → lat/lng + reverse geocode GPS
      forecast.ts                  # 8-day hourly forecast from Open-Meteo
    scoring/
      engine.ts                    # Score each hour 0-100 with misery multiplier
      days.ts                      # Group scored hours into days (location-local "now")
      windows.ts                   # Find best consecutive-hour run windows (used by widget)
      weatherCodes.ts              # WMO code → label + penalty
    stores/
      preferences.svelte.ts        # User prefs (localStorage-backed)
      preferences.ts               # Defaults + sanitizePreferences (unit-tested)
      weather.svelte.ts            # Forecast data + derived scores
      location.svelte.ts           # Current location (remembered in localStorage)
      colorScheme.svelte.ts        # Light/dark override (system by default, localStorage-backed)
      colorScheme.ts               # Pure toggle logic (unit-tested)
    utils/
      format.ts                    # Time/temp/colour formatting helpers
      dates.ts                     # Wall-clock helpers in the forecast location's time zone
      lightDismiss.ts              # <dialog closedby="any"> fallback for Safari
  components/
    LocationInput.svelte           # Location search field + GPS button
    WeekView.svelte                # 8-day stack of DayStrips
    DayStrip.svelte                # Single day: 24 coloured hour segments + hover tooltip + click panel
    HourPanel.svelte               # Persistent click panel: weather detail for one hour
    Settings.svelte                # Settings button + native <dialog>: rain tolerance, temp range
    DarkModeToggle.svelte          # Light/dark mode toggle
  scriptable/
    widget.ts                      # iOS Scriptable widget source (npm run build:widget)
public/
  _headers                         # Security headers (CSP etc.) + asset caching for Cloudflare
```

## Conventions

- All `.svelte` files use `<script lang="ts">`
- Store files use `.svelte.ts` extension for Svelte 5 rune support
- Imports use extensionless paths (Vite resolves them)
- Theme colours defined in `app.css` under `@theme` (run-green, run-bg, run-card, etc.)
- Dark mode: `color-scheme` + `light-dark()` tokens in `app.css`; a manual override is written to `<meta name="color-scheme">` (inline script in `index.html` applies it before first paint). Don't reintroduce a `.dark` class.
- Stores export reactive objects/class instances (`weather`, `preferences`, `location`, `colorScheme`) — read fields directly
- Use native platform features (`<dialog>`, `URLSearchParams`, `AbortSignal`) before custom code; `src/lib/api/forecast.ts` is shared with the Scriptable widget, so keep it free of browser-only APIs
- All components use `run-*` theme tokens (not hardcoded `bg-white` / `bg-gray-*`)
- Forecast times are wall-clock strings in the **location's** time zone (`timezone=auto`); compare them with `weather.now`, never with `new Date()` / `toISOString()`
- Pure logic lives in plain `.ts` files next to the `.svelte.ts` store (Vitest runs without the Svelte compiler)
- CSP lives in `public/_headers`. Inline scripts are allowed by hash only; `src/security.test.ts` fails if `index.html` and the hash drift. New API origins must be added to `connect-src`
- See FUTURE.md for planned improvements
