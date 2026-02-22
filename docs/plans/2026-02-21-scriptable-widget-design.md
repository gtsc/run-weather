# Scriptable Widget Design

**Date:** 2026-02-21
**Status:** Approved

## Summary

A home screen widget (iOS Scriptable app, medium size) showing today and tomorrow's run weather scores as coloured hour bands, with the best run window time for each day.

## Approach

- Scoring logic stays in `src/lib/` (single source of truth, no duplication)
- A new `src/scriptable/widget.ts` imports from the existing pure-TS lib modules
- `npm run build:widget` (esbuild) bundles everything into `scriptable/widget.js`
- User pastes `scriptable/widget.js` into a new Scriptable script on their iPhone

## New Files

```
src/scriptable/
  widget.ts          ← widget entry point (TypeScript source)
scriptable/
  widget.js          ← build artifact committed for easy access
```

## Changes to Existing Files

**`src/lib/api/forecast.ts`** — make timezone a parameter with `Europe/London` as default:

```ts
export async function fetchForecast(
  latitude: number,
  longitude: number,
  timezone = 'Europe/London',
): Promise<HourData[]>;
```

**`package.json`** — add esbuild dev dep and build script:

```json
"build:widget": "esbuild src/scriptable/widget.ts --bundle --platform=browser --format=iife --outfile=scriptable/widget.js"
```

## Widget Flow

1. Get device location via `Location.current()` (Scriptable built-in, GPS)
2. Detect timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
3. Call `fetchForecast(lat, lng, timezone)`
4. Group hours by date, take today + tomorrow
5. For each day: call `scoreHour(hour, DEFAULT_PREFS)` for each hour, compute `findRunWindows()`
6. Render medium widget (two rows)

## Default Preferences (mirrors webapp defaults)

```ts
const DEFAULT_PREFS = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
  durationHours: 1,
};
```

## Widget Layout (medium)

```
┌──────────────────────────────────┐
│ Today         Best: 07–08        │
│ [■■■■■■■■■■■■■■■■■■■■■■■■] (24h) │
│ Tomorrow      Best: 14–15        │
│ [■■■■■■■■■■■■■■■■■■■■■■■■] (24h) │
└──────────────────────────────────┘
```

Each coloured segment = 1 hour, colour from `scoreColorHex()` (red → orange → yellow → lime → green).
Best window label shows `–` if no valid window found (all hours below 20).

## Reused lib modules (no duplication)

| Module                            | Used for                          |
| --------------------------------- | --------------------------------- |
| `src/lib/scoring/engine.ts`       | `scoreHour()`                     |
| `src/lib/scoring/weatherCodes.ts` | `getWeatherInfo()` (via engine)   |
| `src/lib/scoring/windows.ts`      | `findRunWindows()`                |
| `src/lib/utils/format.ts`         | `scoreColorHex()`, `formatHour()` |
| `src/lib/api/forecast.ts`         | `fetchForecast()`                 |
| `src/lib/types.ts`                | Type interfaces                   |

## Out of Scope

- Syncing webapp preferences to widget (uses hardcoded defaults)
- Scriptable widget parameter configuration
- Widget sizes other than medium
- Offline / cached data
