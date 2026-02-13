# Run Weather App - Implementation Plan

## Context

A personal webapp for a UK-based runner to find the best time to go for a run based on weather forecasts. The UK's unpredictable rain makes it hard to decide when to head out — this app shows a colour-coded week view of hourly "runnability" scores and surfaces the best run windows per day.

**Key decisions:** Pure frontend (no backend), Open-Meteo API only (free, no key, CORS-friendly), Svelte 5 + Vite + Tailwind + TypeScript (strict), localStorage for preferences.

---

## Project Structure

```
run-weather/
  src/
    main.ts
    app.css                     # Tailwind + theme tokens
    App.svelte                  # Root layout
    lib/
      api/
        geocoding.ts            # Postcode/GPS → lat/lng via Open-Meteo
        forecast.ts             # Fetch + reshape 7-day hourly forecast
      scoring/
        engine.ts               # Score each hour 0-100
        windows.ts              # Find best consecutive-hour run windows
        weatherCodes.ts         # WMO code → label + penalty mapping
      stores/
        preferences.svelte.ts   # User prefs, synced to localStorage
        weather.svelte.ts       # Forecast data + derived scores
        location.svelte.ts      # Current lat/lng/name
      utils/
        format.ts               # Time/temp formatting helpers
    components/
      LocationInput.svelte      # Postcode field + GPS button
      WeekView.svelte           # 7-day stack of DayStrips
      DayStrip.svelte           # Single day: 24 coloured hour segments
      DayDetail.svelte          # Expanded: top 3 ranked run windows
      RunWindow.svelte          # Single window card with conditions
      Settings.svelte           # Rain tolerance, temp range, duration
      Attribution.svelte        # "Weather data by Open-Meteo.com"
```

---

## Implementation Steps

### Phase 1: Foundation

#### Step 1 — Project scaffold
- `npm create vite@latest run-weather -- --template svelte`
- Install: `tailwindcss @tailwindcss/vite`
- Configure `vite.config.ts` with tailwindcss plugin (before svelte plugin)
- Set up `src/app.css` with `@import "tailwindcss"` and theme colours (green/amber/red)
- Verify dev server runs

#### Step 2 — API modules
- **`geocoding.ts`**: Call `geocoding-api.open-meteo.com/v1/search?name={postcode}&countryCode=GB`. Fallback strategy: try full postcode → outward code → area letters
- **`forecast.ts`**: Call `api.open-meteo.com/v1/forecast` with hourly params: `temperature_2m, apparent_temperature, precipitation_probability, precipitation, wind_speed_10m, wind_gusts_10m, weather_code, is_day`, 7 days, timezone `Europe/London`. Reshape parallel arrays into array of hour objects

#### Step 3 — Scoring engine
- **`weatherCodes.ts`**: Map all WMO codes to `{ label, penalty }` (penalty 0-95)
- **`engine.ts`**: `scoreHour(hour, prefs) → 0-100` with weights:
  - Precip probability: up to 50 pts penalty (scaled by rain tolerance)
  - Precip amount: up to 15 pts
  - Temperature outside feels-like comfort range: up to 20 pts (2 per degree)
  - Wind over 15 km/h: up to 15 pts
  - Weather code severity: up to 10 pts
  - Darkness: 5 pts
- **`windows.ts`**: `findRunWindows(dayHours, scores, durationHours)` — slide a window of N hours, compute avg score, filter out windows containing any hour < 20, return top 3 sorted by score

#### Step 4 — Stores
- **`location.svelte.ts`**: Holds `{ latitude, longitude, name }`
- **`preferences.svelte.ts`**: `rainTolerance` (0-1, default 0.3), `tempMin` (default 8), `tempMax` (default 15), `durationHours` (default 1). Load/save localStorage
- **`weather.svelte.ts`**: On location change, fetch forecast. Derive scores from raw data + preferences (auto-recompute when prefs change)

### Phase 2: Core UI

#### Step 5 — LocationInput
- Postcode text input + search button + "Use my location" GPS button
- Resolves to lat/lng, updates location store
- Shows resolved place name, loading state, error if not found

#### Step 6 — DayStrip
- Day label (Mon, Tue...) + date
- Horizontal bar of 24 segments coloured by score (green ≥70, amber ≥40, red <40)
- Past hours greyed out
- Best-score badge
- Clickable to expand

#### Step 7 — WeekView
- Stack 7 DayStrips vertically
- Track which day is expanded (toggle on click)

### Phase 3: Detail & Polish

#### Step 8 — Run windows detail
- **DayDetail**: Shown below selected DayStrip, renders top 3 RunWindow cards (or "No good windows" message)
- **RunWindow**: Card showing time range, score badge, feels-like temp, wind, max precip chance, weather description

#### Step 9 — Settings
- Expandable panel (gear icon in header)
- Rain tolerance slider (0-1), temp range inputs, duration selector (30m/45m/1h/1.5h/2h)
- Changes auto-save and trigger score recomputation

#### Step 10 — Polish
- Grey out past hours, Svelte transitions for day expand/collapse
- Mobile-first responsive layout (full-width bars, stacked vertical)
- Loading spinner during forecast fetch, error states with retry
- Hover/focus tooltips on hour segments (time + score + conditions)
- Session-storage caching of forecast data (30-min TTL, keyed by location)
- Attribution footer

---

## Data Flow

```
Postcode → geocoding API → location store → forecast API → weather store (raw hours)
                                                              ↓
                                              preferences store + scoring engine
                                                              ↓
                                                    weather store (scored hours)
                                                              ↓
                                              WeekView → DayStrip → DayDetail
```

Scoring is derived state — raw data fetched once per location, scores recompute reactively on preference changes.

---

## Verification

1. Run dev server (`npm run dev`), enter a UK postcode (e.g. "SW1A"), verify forecast loads
2. Check colour-coded bars reflect weather — rainy hours should be red/amber
3. Click a day, verify run window cards appear with sensible recommendations
4. Change preferences (e.g. increase rain tolerance), verify scores update without re-fetching
5. Refresh page, verify preferences persist from localStorage
6. Test GPS button (requires HTTPS or localhost)
7. Test on mobile viewport — should be usable without horizontal scrolling
