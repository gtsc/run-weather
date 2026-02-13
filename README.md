# Run Weather

Find the best time to go for a run based on weather forecasts. Enter any location worldwide and get an 8-day hourly breakdown of running conditions, colour-coded from red (awful) to green (perfect).

## Features

- **8-day hourly forecast** with colour-coded "runnability" scores (0-100)
- **Best run window detection** -- finds the top 3 consecutive-hour windows per day
- **Global location search** -- works with city names, postcodes, or place names anywhere in the world
- **GPS location** -- use your current position with one click
- **Customisable preferences** -- rain tolerance, comfortable temperature range, run duration
- **Smart scoring** with a "misery multiplier" that compounds penalties when rain + wind + cold stack together
- **Forecast confidence indicators** -- days further out are marked as approximate or less reliable
- **Dark mode** -- respects system preference, toggleable in the header
- **Hover tooltips** on hourly segments showing detailed conditions

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 and search for a location.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run check` | TypeScript + Svelte type checking |
| `npm run lint` | ESLint + Prettier checks |
| `npm run format` | Auto-format all files |

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$props`)
- **Vite 7** for dev/build
- **Tailwind CSS v4** with custom theme tokens
- **TypeScript** in strict mode
- **Open-Meteo API** -- free, no API key required, CORS-friendly

## How Scoring Works

Each hour is scored 0-100 based on:

| Factor | Max penalty | Notes |
|--------|------------|-------|
| Rain probability | 65 pts | Squared curve, scaled by rain tolerance preference |
| Rain amount | 25 pts | Saturates at 2mm/h |
| Temperature | 30 pts | 4 pts per degree outside your comfort range |
| Wind | 30 pts | Kicks in above 8 km/h |
| Weather severity | 25 pts | Based on WMO weather code (fog, snow, thunderstorm, etc.) |
| Darkness | 10 pts | Binary, from Open-Meteo `is_day` field |

When 2+ bad factors stack simultaneously, a **misery multiplier** compounds the penalty by 8% per additional factor.

## Data Sources

Weather data provided by [Open-Meteo.com](https://open-meteo.com/).
