# Scriptable Widget Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Scriptable iOS home screen widget (medium size) showing today and tomorrow's run weather scores as coloured hour bands, using the existing shared scoring logic.

**Architecture:** New `src/scriptable/widget.ts` imports pure-TS lib modules. esbuild bundles it into `scriptable/widget.js` (committed to repo). One change to existing code: `forecast.ts` gets a `timezone` parameter so the widget uses the device's real timezone. Widget uses GPS location and app-default preferences.

**Tech Stack:** TypeScript, vitest, esbuild (new dev dep), Scriptable iOS app.

---

### Task 1: Parameterize forecast.ts timezone

This is the only change to existing shared code. It makes the widget use the device's real timezone rather than hardcoded London.

**Files:**
- Modify: `src/lib/api/forecast.ts`
- Create: `src/lib/api/forecast.test.ts`

**Step 1: Write failing tests**

Create `src/lib/api/forecast.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchForecast } from './forecast';

const emptyHourly = {
  time: [],
  temperature_2m: [],
  apparent_temperature: [],
  precipitation_probability: [],
  precipitation: [],
  wind_speed_10m: [],
  wind_gusts_10m: [],
  weather_code: [],
  snow_depth: [],
  is_day: [],
};

function mockFetch() {
  const mock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ hourly: emptyHourly }),
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchForecast', () => {
  it('uses Europe/London as the default timezone', async () => {
    const mock = mockFetch();
    await fetchForecast(51.5, -0.1);
    const url: string = mock.mock.calls[0][0];
    expect(url).toContain('timezone=Europe%2FLondon');
  });

  it('uses the provided timezone when supplied', async () => {
    const mock = mockFetch();
    await fetchForecast(48.1, 11.6, 'Europe/Berlin');
    const url: string = mock.mock.calls[0][0];
    expect(url).toContain('timezone=Europe%2FBerlin');
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
npm test -- forecast.test.ts
```

Expected: FAIL — `fetchForecast` doesn't accept a third argument yet. The second test should fail because the URL still contains `Europe%2FLondon`.

**Step 3: Update forecast.ts**

In `src/lib/api/forecast.ts`, change the `fetchForecast` function signature and URL construction. The only lines that change are the function signature and the `url` constant:

```ts
export async function fetchForecast(
  latitude: number,
  longitude: number,
  timezone = 'Europe/London'
): Promise<HourData[]> {
  const tz = encodeURIComponent(timezone);
  const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=${HOURLY_PARAMS}&forecast_days=8&timezone=${tz}`;
```

Everything else in the function stays exactly the same.

**Step 4: Run tests to confirm they pass**

```bash
npm test -- forecast.test.ts
```

Expected: PASS (2 tests).

**Step 5: Run full type check to confirm nothing broke**

```bash
npm run check
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/lib/api/forecast.ts src/lib/api/forecast.test.ts
git commit -m "feat: make fetchForecast timezone a parameter (default: Europe/London)"
```

---

### Task 2: Add esbuild and build:widget script

**Files:**
- Modify: `package.json`

**Step 1: Install esbuild as a dev dependency**

```bash
npm install --save-dev esbuild
```

Expected: `esbuild` appears in `package.json` devDependencies.

**Step 2: Add build:widget script**

In `package.json`, add to `"scripts"`:

```json
"build:widget": "esbuild src/scriptable/widget.ts --bundle --platform=browser --format=iife --outfile=scriptable/widget.js"
```

Note: output goes to `scriptable/widget.js` (not `dist/`) so it isn't caught by the `dist` entry in `.gitignore`. This file is committed to the repo so users can grab it without running the build themselves.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add esbuild dev dep and build:widget npm script"
```

---

### Task 3: Write the Scriptable widget entry point

**Files:**
- Create: `src/scriptable/widget.ts`

**Background — Scriptable's runtime environment:**

Scriptable is an iOS JavaScript automation app. It provides implicit global objects — they are NOT importable, they just exist at runtime. The widget runs in a sandboxed JS context. Key globals used here:

- `Script.setWidget(widget)` — registers the widget for display
- `new ListWidget()` — the root widget container
- `new Color('#rrggbb')` — colour value (takes hex string, not `rgb()`)
- `Font.systemFont(size)` / `Font.boldSystemFont(size)` — fonts
- `Location.current()` — async, returns `{ latitude, longitude }`
- `config.runsInWidget` — `true` when running as a widget (vs. in-app preview)
- Stack objects have `.layoutHorizontally()`, `.addStack()`, `.addText(str)`, `.addSpacer()`, `.backgroundColor`, `.cornerRadius`
- Text objects have `.font`, `.textColor`

Because esbuild strips TypeScript types without checking them, and `npm run check` (svelte-check) will check this file, we need to declare these globals with `any` types so TypeScript doesn't reject them.

**Step 1: Create src/scriptable/widget.ts**

```ts
import { fetchForecast } from '../lib/api/forecast';
import { scoreHour } from '../lib/scoring/engine';
import { findRunWindows } from '../lib/scoring/windows';
import { scoreColorHex, formatHour } from '../lib/utils/format';
import type { HourData, Preferences, ScoredHour } from '../lib/types';

// ── Scriptable global declarations ──────────────────────────────────────────
// These objects are injected by the Scriptable runtime; they are not imports.
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const Script: { setWidget(w: any): void };
declare const ListWidget: { new (): any };
declare const Color: { new (hex: string, alpha?: number): any };
declare const Font: {
  systemFont(size: number): any;
  boldSystemFont(size: number): any;
};
declare const Location: {
  current(): Promise<{ latitude: number; longitude: number }>;
};
declare const config: { runsInWidget: boolean };
/* eslint-enable @typescript-eslint/no-explicit-any */
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: Preferences = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
  durationHours: 1,
};

/** Convert "rgb(r, g, b)" from scoreColorHex() to a Scriptable Color object. */
function toColor(rgb: string): InstanceType<typeof Color> {
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return new Color('#888888');
  const h = (n: string) => parseInt(n).toString(16).padStart(2, '0');
  return new Color(`#${h(m[1])}${h(m[2])}${h(m[3])}`);
}

function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return dateStr;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderDay(widget: any, date: string, dayHours: HourData[]): void {
  const scored: ScoredHour[] = dayHours.map(h => ({
    ...h,
    score: scoreHour(h, DEFAULT_PREFS),
  }));
  const scores = scored.map(h => h.score);
  const windows = findRunWindows(scored, scores, DEFAULT_PREFS.durationHours);
  const best = windows[0];

  // Row 1: day label + best window time
  const header = widget.addStack();
  header.layoutHorizontally();

  const label = header.addText(dayLabel(date));
  label.font = Font.boldSystemFont(13);
  label.textColor = new Color('#ffffff');

  header.addSpacer();

  const bestLabel = best
    ? `${formatHour(best.startHour)}–${formatHour(best.endHour)}`
    : '–';
  const bestText = header.addText(bestLabel);
  bestText.font = Font.systemFont(12);
  bestText.textColor = new Color('#8e8e93');

  widget.addSpacer(4);

  // Row 2: 24 coloured hour segments
  const bar = widget.addStack();
  bar.layoutHorizontally();
  bar.cornerRadius = 3;

  for (const hour of scored) {
    const cell = bar.addStack();
    cell.backgroundColor = toColor(scoreColorHex(hour.score));
    cell.cornerRadius = 2;
    cell.addSpacer(); // flexible spacer → equal-width cells
  }
}

async function run(): Promise<void> {
  const widget = new ListWidget();
  widget.backgroundColor = new Color('#1c1c1e');
  widget.setPadding(12, 14, 12, 14);

  try {
    const loc = await Location.current();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hours = await fetchForecast(loc.latitude, loc.longitude, timezone);

    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    for (const [i, date] of [today, tomorrow].entries()) {
      if (i > 0) widget.addSpacer(8);
      const dayHours = hours.filter((h: HourData) => h.date === date);
      renderDay(widget, date, dayHours);
    }
  } catch {
    const errStack = widget.addStack();
    const errText = errStack.addText('Failed to load weather');
    errText.textColor = new Color('#8e8e93');
    errText.font = Font.systemFont(12);
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }
}

run();
```

**Step 2: Build the widget**

```bash
npm run build:widget
```

Expected: `scriptable/widget.js` created, no errors printed by esbuild.

**Step 3: Spot-check the output**

```bash
node -e "
const fs = require('fs');
const code = fs.readFileSync('scriptable/widget.js', 'utf8');
console.log('size:', Math.round(code.length / 1024) + ' KB');
console.log('has scoreHour logic:', code.includes('badFactors'));
console.log('has open-meteo URL:', code.includes('api.open-meteo.com'));
console.log('has Color usage:', code.includes('Color'));
"
```

Expected: size 10–60 KB, all three checks print `true`.

**Step 4: Run full type check**

```bash
npm run check
```

Expected: 0 errors. If TypeScript complains about the Scriptable `declare` statements, adjust the types — the goal is 0 errors.

**Step 5: Commit**

```bash
git add src/scriptable/widget.ts scriptable/widget.js
git commit -m "feat: add Scriptable widget with shared scoring logic"
```

---

### Task 4: Final verification

**Step 1: Run all tests**

```bash
npm test
```

Expected: all tests pass, including the new `forecast.test.ts`.

**Step 2: Run lint**

```bash
npm run lint
```

Expected: no errors. If there are formatting issues, run `npm run format` first, then re-run lint.

**Step 3: Run production build**

```bash
npm run build
```

Expected: no errors. Confirm `dist/` contains the built web app (not affected by the widget changes).

**Step 4: Commit if lint required formatting fixes**

```bash
git add -A
git commit -m "chore: formatting fixes"
```

---

## How to use the widget (post-implementation)

1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) from the App Store (free)
2. Copy the contents of `scriptable/widget.js` from this repo
3. In Scriptable, tap `+` → paste the code → name it "Run Weather"
4. Long-press the home screen → `+` → search "Scriptable" → choose **Medium** size
5. Tap the widget → select the "Run Weather" script
6. Grant location permission when prompted
