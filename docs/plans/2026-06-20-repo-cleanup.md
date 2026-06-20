# Repo Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the repo — fix lint, apply formatting, delete stale docs, update READMEs, migrate wrangler config, and add a GitHub Actions workflow so the worker auto-deploys on merge to main.

**Architecture:** All changes happen in a single `chore/cleanup` branch. No new features, no structural moves that break paths. The worker stays in `worker/` but we add CI so both pieces deploy automatically.

**Tech Stack:** ESLint 9, Prettier, Wrangler 4, GitHub Actions (wrangler/action@v3)

---

### Task 1: Create branch

**Step 1: Branch off main**

```bash
git checkout main && git pull && git checkout -b chore/cleanup
```

Expected: `Switched to a new branch 'chore/cleanup'`

---

### Task 2: Fix lint errors — lab files need Node globals

**Files:**

- Modify: `eslint.config.js`

**Context:** `lab/**/*.ts` files use `process.env` / `process.argv` but the current eslint config gives them `globals.browser` (which doesn't include `process`). The `scripts/` entry already uses `globals.node` — extend it to cover `lab/**/*.ts` too.

**Step 1: Update eslint.config.js**

Replace the scripts-only node block:

```js
// Node.js scripts
{
  files: ['scripts/**/*.mjs', 'scripts/**/*.js'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
},
```

With a combined block covering `lab/` as well:

```js
// Node.js scripts and lab
{
  files: ['lab/**/*.ts', 'scripts/**/*.mjs', 'scripts/**/*.js'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
},
```

**Step 2: Verify**

```bash
npm run lint 2>&1 | grep "lab/"
```

Expected: no output (no more `process` errors in lab files)

---

### Task 3: Fix lint warning — unused prop param name in DayStrip

**Files:**

- Modify: `src/components/DayStrip.svelte`

**Context:** Line 15 has `onHourSelect: (hour: ScoredHour | null) => void;` — the parameter name `hour` in the function-type annotation triggers the `no-unused-vars` warning. Renaming it to `_hour` matches the `argsIgnorePattern: '^_'` rule.

**Step 1: Rename the param in the type annotation**

In `src/components/DayStrip.svelte`, in the `$props()` type block, change:

```ts
onHourSelect: (hour: ScoredHour | null) => void;
```

to:

```ts
onHourSelect: (_hour: ScoredHour | null) => void;
```

**Step 2: Verify zero lint problems**

```bash
npm run lint 2>&1 | tail -5
```

Expected: `✖ 0 problems` (or clean prettier output with no eslint errors)

---

### Task 4: Apply Prettier formatting

**Step 1: Run formatter**

```bash
npm run format
```

Expected: files reformatted, no errors.

**Step 2: Verify lint passes end-to-end**

```bash
npm run lint
```

Expected: clean exit, no errors or warnings.

---

### Task 5: Delete stale plan docs

**Files to delete:**

- `docs/plans/2026-06-19-ai-clothing-recommendations-design.md`
- `docs/plans/2026-06-19-phase0-prompt-lab.md`
- `docs/plans/2026-06-19-phase1-backend.md`
- `docs/plans/2026-06-20-phase2-implementation.md`
- `docs/plans/2026-06-20-phase2-ui-redesign-design.md`

All five plans are for shipped features (auth, worker, AI clothing). Keep only this current plan.

**Step 1: Delete them**

```bash
rm docs/plans/2026-06-19-ai-clothing-recommendations-design.md \
   docs/plans/2026-06-19-phase0-prompt-lab.md \
   docs/plans/2026-06-19-phase1-backend.md \
   docs/plans/2026-06-20-phase2-implementation.md \
   docs/plans/2026-06-20-phase2-ui-redesign-design.md
```

**Step 2: Verify**

```bash
ls docs/plans/
```

Expected: only `2026-06-20-repo-cleanup.md` remains.

---

### Task 6: Update README.md

The README is from the initial launch — it doesn't mention auth, AI clothing recommendations, the worker, or the Supabase backend. Rewrite it to reflect what the app actually is today.

**Files:**

- Modify: `README.md`

Replace the entire content with:

````markdown
# Run Weather

Find the best time to go for a run based on weather forecasts. Enter any location worldwide and get an 8-day hourly breakdown of running conditions, colour-coded from red (awful) to green (perfect).

## Features

- **8-day hourly forecast** with colour-coded "runnability" scores (0–100)
- **Global location search** — city names, postcodes, or place names anywhere in the world
- **GPS location** — one click to use your current position
- **Customisable preferences** — rain tolerance, comfortable temperature range
- **Smart scoring** with a "misery multiplier" that compounds penalties when rain + wind + cold stack together
- **AI clothing recommendations** — click any hour to get a "what to wear" suggestion from Claude, personalised over time via a per-user memory
- **Run feedback** — rate past hours; the AI learns what works for you
- **Accounts** — email/password sign-up so your memory persists across devices
- **Dark mode** — respects system preference, toggleable in the header
- **iOS widget** — Scriptable widget showing today/tomorrow as coloured hour bars

## Getting Started

```bash
npm install
npm run dev
```
````

Open http://localhost:5173 and search for a location.

## Commands

### Frontend

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Start dev server                  |
| `npm run build`  | Production build                  |
| `npm run check`  | TypeScript + Svelte type checking |
| `npm run lint`   | ESLint + Prettier checks          |
| `npm run format` | Auto-format all files             |

### Worker (API)

```bash
cd worker
npm run dev     # local dev with wrangler
npm run deploy  # deploy to Cloudflare Workers
```

Secrets required (set via `wrangler secret put`):

- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$props`)
- **Vite 7** for dev/build
- **Tailwind CSS v4** with custom theme tokens
- **TypeScript** in strict mode
- **Open-Meteo API** — free, no API key required, CORS-friendly
- **Cloudflare Workers** — AI proxy (keeps Anthropic key server-side)
- **Supabase** — auth + Postgres for per-user AI memory
- **Claude Sonnet** — clothing recommendations + memory updates

## How Scoring Works

Each hour is scored 0–100 based on:

| Factor           | Max penalty | Notes                                                     |
| ---------------- | ----------- | --------------------------------------------------------- |
| Rain probability | 65 pts      | Squared curve, scaled by rain tolerance preference        |
| Rain amount      | 25 pts      | Saturates at 2 mm/h                                       |
| Temperature      | 30 pts      | 4 pts per degree outside your comfort range               |
| Wind             | 30 pts      | Kicks in above 8 km/h                                     |
| Dew point        | 20 pts      | High humidity makes warm runs miserable                   |
| Weather severity | 25 pts      | Based on WMO weather code (fog, snow, thunderstorm, etc.) |
| Darkness         | 10 pts      | Binary, from Open-Meteo `is_day` field                    |

When 2+ bad factors stack simultaneously, a **misery multiplier** compounds the penalty by 8% per additional factor.

## iOS Home Screen Widget

A Scriptable widget shows today and tomorrow as coloured hour bars with the best run window time, using the same scoring logic as the web app.

### Requirements

- [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) (free, App Store)
- The built widget file: `scriptable/widget.js` in this repo

### Setup

1. Copy the full contents of `scriptable/widget.js`. In Scriptable, tap **+**, paste the code, and rename the script **"Run Weather"**.
2. Tap the play button inside Scriptable to trigger the location permission prompt.
3. Long-press the home screen → **+** → search **Scriptable** → choose **Medium** size → **Add Widget**.
4. Long-press the widget → **Edit Widget** → set **Script** to **Run Weather**.

## Data Sources

Weather data provided by [Open-Meteo.com](https://open-meteo.com/).

````

---

### Task 7: Update FUTURE.md

Remove items that have shipped (PWA manifest, auth, AI memory/clothing, dew point/humidity scoring). Keep what's genuinely still future.

**Files:**
- Modify: `FUTURE.md`

Replace the entire content with:

```markdown
# Future Improvements

Ideas and improvements to revisit after real-world usage.

## Scoring & Data

- **Gradual sunrise/sunset scoring** — Currently `is_day` is binary. Open-Meteo provides daily `sunrise`/`sunset` times for a softer twilight penalty.
- **UV index** — High UV in summer could be a factor for midday runs (`uv_index` daily parameter).
- **Air quality** — Open-Meteo has an air quality API that could flag high-pollution hours.
- **Scoring calibration** — After a few weeks of use, compare predicted scores against actual "how did the run feel?" ratings and adjust weights.

## UI & UX

- **Svelte transitions** — Animate day expand/collapse and run-window cards appearing.
- **Mobile improvements** — Test thoroughly on small screens; tooltip positioning may need adjustment on touch devices.
- **Preferred hours filter** — Optional setting to grey out hours you'd never run (e.g. 22:00–06:00).
- **Weekly summary** — A "best day this week" callout at the top for at-a-glance planning.
- **Share a window** — Copy a shareable text snippet like "Best run: Tuesday 14:00–15:00, score 87, 12 °C partly cloudy".

## Performance & Caching

- **Forecast caching** — Cache forecast data in sessionStorage with a 30-min TTL keyed by lat/lng.
- **Service worker** — For offline support: cache the app shell and last forecast.
- **Debounce location search** — Short debounce on the search input to avoid hammering the geocoding API.

## Stretch Ideas

- **Multi-location comparison** — Save 2–3 favourite locations and see them side by side.
- **Garmin/Strava integration** — Pull in actual run data to correlate weather conditions with performance.
- **Push notifications** — "Your best run window today is in 2 hours".
- **Historical accuracy** — After a day passes, compare forecast vs actual weather to show prediction reliability.
````

---

### Task 8: Migrate root wrangler.toml → wrangler.jsonc

**Files:**

- Create: `wrangler.jsonc`
- Delete: `wrangler.toml`

The root wrangler config deploys the frontend as Cloudflare Workers static assets. Migrate it from TOML to JSONC to match the worker's format.

**Step 1: Create wrangler.jsonc**

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "run-weather",
  "compatibility_date": "2026-06-01",
  "assets": {
    "directory": "./dist",
  },
}
```

**Step 2: Delete the old file**

```bash
rm wrangler.toml
```

**Step 3: Verify wrangler picks it up**

```bash
npx wrangler whoami 2>&1 | head -5
```

Expected: shows your Cloudflare account (or "not logged in" — either is fine, just no "config not found" error).

---

### Task 9: Add GitHub Actions deploy workflow

Both the frontend and worker should auto-deploy when `main` is updated.

**Files:**

- Create: `.github/workflows/deploy.yml`

**Step 1: Create the workflow**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    name: Deploy frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-worker:
    name: Deploy worker
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: worker/package-lock.json

      - run: npm ci
        working-directory: worker

      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: worker
```

**Step 2: Add required secrets in GitHub**

In the repo settings → Secrets and variables → Actions, add:

- `CLOUDFLARE_API_TOKEN` — create a token at dash.cloudflare.com with Workers/Pages deploy permissions
- `CLOUDFLARE_ACCOUNT_ID` — found on any Workers/Pages dashboard page in the right sidebar

(These are one-time manual steps; not scripted.)

---

### Task 10: Final checks and commit

**Step 1: Type check**

```bash
npm run check
```

Expected: 0 errors.

**Step 2: Lint**

```bash
npm run lint
```

Expected: clean.

**Step 3: Build**

```bash
npm run build
```

Expected: successful build.

**Step 4: Commit**

```bash
git add -p   # review each chunk
git commit -m "chore: lint fixes, prettier, migrate wrangler config, add CI deploy, refresh docs"
```

**Step 5: Open PR**

```bash
gh pr create --title "chore: repo cleanup" --body "..."
```
