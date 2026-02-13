# Run Weather

A personal webapp for UK runners to find the best time to run based on weather forecasts.

## Tech Stack

- **Framework**: Svelte 5 + Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **API**: Open-Meteo (free, no key required)
- **State**: Svelte 5 runes (`$state`, `$derived`) with localStorage persistence

## Commands

- `npm run dev` — Start dev server (http://localhost:5173)
- `npm run build` — Production build
- `npm run check` — TypeScript + Svelte type checking (svelte-check)
- `npm run lint` — ESLint + Prettier checks
- `npm run format` — Auto-format all files with Prettier

## Quality Gates

Before committing, ensure:
1. `npm run check` passes with 0 errors
2. `npm run lint` passes (or run `npm run format` first)
3. `npm run build` succeeds

## Project Structure

```
src/
  main.ts                          # App entry point
  app.css                          # Tailwind + theme tokens
  App.svelte                       # Root layout
  lib/
    types.ts                       # Shared TypeScript interfaces
    api/
      geocoding.ts                 # Postcode/GPS → lat/lng
      forecast.ts                  # 7-day hourly forecast from Open-Meteo
    scoring/
      engine.ts                    # Score each hour 0-100
      windows.ts                   # Find best consecutive-hour run windows
      weatherCodes.ts              # WMO code → label + penalty
    stores/
      preferences.svelte.ts        # User prefs (localStorage-backed)
      weather.svelte.ts            # Forecast data + derived scores
      location.svelte.ts           # Current lat/lng/name
    utils/
      format.ts                    # Time/temp formatting helpers
  components/
    LocationInput.svelte           # Postcode field + GPS button
    WeekView.svelte                # 7-day stack of DayStrips
    DayStrip.svelte                # Single day: 24 coloured hour segments
    DayDetail.svelte               # Expanded: top 3 ranked run windows
    RunWindow.svelte               # Single window card with conditions
    Settings.svelte                # Rain tolerance, temp range, duration
```

## Conventions

- All `.svelte` files use `<script lang="ts">`
- Store files use `.svelte.ts` extension for Svelte 5 rune support
- Imports use extensionless paths (Vite resolves them)
- Theme colours defined in `app.css` under `@theme` (run-green, run-amber, run-red)
