# Widget Polish v2 + PWA Icon — Design

## Goal

Fix bar/time alignment, show current weather conditions in the title row, display the best slot score next to the time, and replace the placeholder PWA icon with a runner silhouette + "RW" monogram.

## Changes

### 1 — Bar alignment fix

The 24-segment bar image is drawn at a fixed `BAR_W = 288pt` `DrawContext`, but the header row uses `addSpacer()` to push the best-time text to the widget's full inner width (~310pt on most iPhones). This causes the time text to visually overhang the right edge of the bar.

**Fix:** wrap `widget.addImage()` in a `widget.addStack()` with `layoutHorizontally()`. Scriptable horizontal stacks fill the available width, so the image stretches to match the header row's right boundary.

### 2 — Current conditions in title row

Right-align the current hour's condition label and temperature in the title bar:

```
[🏃] Run Weather       Partly cloudy · 12°
```

Implementation: after fetching the forecast, find the current hour (`h.date === today && h.hour === new Date().getHours()`), call `getWeatherInfo(h.weatherCode).label` and `Math.round(h.temperature)`, then add a spacer + text to `titleRow` (which stays in scope across the try block). Falls back gracefully — nothing shown if the current hour isn't in the forecast.

The existing `widget.addSpacer(6)` between the title row and day rows moves inside the try/catch blocks so it renders after conditions are appended.

### 3 — Best slot score next to time

Append the window score to the best-time label:

```
16:00–17:00 · 87
```

One-line change to the template string in `renderDay`.

### 4 — PWA icon

Replace the green-square-with-"R" placeholder with a green rounded-square icon containing:
- A white stroke-based running figure (thick rounded strokes, recognisable silhouette)
- `"RW"` in bold white text below

Update `scripts/generate-icons.mjs` in-place; regenerate `public/icons/icon-192.png` and `public/icons/icon-512.png` with `sharp`.

## Files touched

- `src/scriptable/widget.ts` — tasks 1, 2, 3
- `scriptable/widget.js` — rebuilt by `npm run build:widget`
- `scripts/generate-icons.mjs` — task 4
- `public/icons/icon-192.png`, `public/icons/icon-512.png` — regenerated
