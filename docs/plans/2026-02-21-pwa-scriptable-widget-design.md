# PWA Support + Scriptable Widget Design

**Date:** 2026-02-21
**Status:** Approved

## Summary

Two independent features to enable iPhone access to run-weather:

1. **PWA support** — "Add to Home Screen" in Safari for a full-screen app experience
2. **Scriptable widget** — home screen widget showing today + tomorrow's run scores with coloured hour bands

---

## Feature 1: PWA Support

### Approach

Minimal PWA: manifest + icons + meta tags. No service worker, no new npm dependencies.
A service worker adds no value here since the app requires live network data.

### Files to Add

- `public/manifest.json` — app name, theme colour, `display: standalone`, icon references (paths relative to `/run-weather/` base)
- `public/icons/icon-192.png` — 192×192 app icon
- `public/icons/icon-512.png` — 512×512 app icon

### Changes to Existing Files

**`index.html`** — add inside `<head>`:
```html
<link rel="manifest" href="/run-weather/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Run Weather" />
<link rel="apple-touch-icon" href="/run-weather/icons/icon-192.png" />
```

### manifest.json Shape

```json
{
  "name": "Run Weather",
  "short_name": "Run Weather",
  "start_url": "/run-weather/",
  "display": "standalone",
  "background_color": "#f9fafb",
  "theme_color": "#22c55e",
  "icons": [
    { "src": "/run-weather/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/run-weather/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Icon Design

Simple green circle (`#22c55e` = run-green) with a white running figure or "R". Generated programmatically via a small Node script or a Canvas snippet — no design tool needed.

---

## Feature 2: Scriptable Widget

### Approach

- Scoring logic stays in `src/lib/` (single source of truth)
- A new `src/scriptable/widget.ts` imports from the existing lib files
- `npm run build:widget` (esbuild) bundles everything into `dist/widget.js`
- User pastes `dist/widget.js` into a new Scriptable script

### New Files

```
src/scriptable/
  widget.ts          ← widget entry point
dist/
  widget.js          ← build artifact (gitignored or committed for convenience)
```

### Changes to Existing Files

**`src/lib/api/forecast.ts`** — make timezone a parameter with `Europe/London` as default:
```ts
export async function fetchForecast(
  latitude: number,
  longitude: number,
  timezone = 'Europe/London'
): Promise<HourData[]>
```

**`package.json`** — add build script and esbuild dev dependency:
```json
"build:widget": "esbuild src/scriptable/widget.ts --bundle --platform=browser --format=iife --outfile=dist/widget.js"
```

### Widget Flow (`src/scriptable/widget.ts`)

1. Get device location via `Location.current()` (Scriptable built-in)
2. Detect timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
3. Call `fetchForecast(lat, lng, timezone)`
4. Group hours by date, take today + tomorrow
5. For each day: call `scoreHour(hour, DEFAULT_PREFS)` for each hour, compute `findRunWindows()`
6. Render medium widget (two rows)

### Default Preferences (mirrors webapp defaults)

```ts
const DEFAULT_PREFS = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
  durationHours: 1,
};
```

### Widget Layout (medium)

```
┌──────────────────────────────────┐
│ Today         Best: 07–08        │
│ [■■■■■■■■■■■■■■■■■■■■■■■■] (24h) │
│ Tomorrow      Best: 14–15        │
│ [■■■■■■■■■■■■■■■■■■■■■■■■] (24h) │
└──────────────────────────────────┘
```

Each coloured segment = 1 hour, colour from `scoreColorHex()` (red → orange → yellow → lime → green).
Best window label shows `--:--` if no valid window found (all hours below 20).

### Reused lib modules (no duplication)

| Module | Used for |
|---|---|
| `src/lib/scoring/engine.ts` | `scoreHour()` |
| `src/lib/scoring/weatherCodes.ts` | `getWeatherInfo()` (via engine) |
| `src/lib/scoring/windows.ts` | `findRunWindows()` |
| `src/lib/utils/format.ts` | `scoreColorHex()`, `formatHour()` |
| `src/lib/api/forecast.ts` | `fetchForecast()` |
| `src/lib/types.ts` | Type interfaces |

---

## Out of Scope

- Service worker / offline support
- Syncing webapp preferences to widget
- Scriptable widget parameter configuration
- Widget sizes other than medium
