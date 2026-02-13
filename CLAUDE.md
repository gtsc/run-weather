# Run Weather

A webapp to find the best time to run based on weather forecasts.

## Tech Stack

- **Framework**: Svelte 5 + Vite 7
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom theme tokens
- **API**: Open-Meteo (free, no key required)
- **State**: Svelte 5 runes (`$state`, `$derived`) with localStorage persistence

## Commands

- `npm run dev` -- Start dev server (http://localhost:5173)
- `npm run build` -- Production build
- `npm run check` -- TypeScript + Svelte type checking (svelte-check)
- `npm run lint` -- ESLint + Prettier checks
- `npm run format` -- Auto-format all files with Prettier

## Quality Gates

Before committing, ensure:
1. `npm run check` passes with 0 errors
2. `npm run lint` passes (or run `npm run format` first)
3. `npm run build` succeeds

## Project Structure

```
src/
  main.ts                          # App entry point
  app.css                          # Tailwind + theme tokens + dark mode overrides
  App.svelte                       # Root layout
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
    utils/
      format.ts                    # Time/temp/colour formatting helpers
  components/
    LocationInput.svelte           # Location search field + GPS button
    WeekView.svelte                # 8-day stack of DayStrips
    DayStrip.svelte                # Single day: 24 coloured hour segments + tooltip
    DayDetail.svelte               # Expanded: top 3 ranked run windows
    RunWindow.svelte               # Single window card with conditions
    HourTooltip.svelte             # Hover tooltip for individual hours
    Settings.svelte                # Rain tolerance, temp range, duration
    DarkModeToggle.svelte          # Light/dark mode toggle
```

## Conventions

- All `.svelte` files use `<script lang="ts">`
- Store files use `.svelte.ts` extension for Svelte 5 rune support
- Imports use extensionless paths (Vite resolves them)
- Theme colours defined in `app.css` under `@theme` (run-green, run-bg, run-card, etc.)
- Dark mode uses CSS custom property overrides via `.dark` class on `<html>`
- All components use `run-*` theme tokens (not hardcoded `bg-white` / `bg-gray-*`)
- See FUTURE.md for planned improvements
