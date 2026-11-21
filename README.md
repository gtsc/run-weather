# Run Weather

Find the best time to run. Search any location and get an 8-day hourly forecast, with each hour scored 0–100 for running conditions (rain, temperature, wind, humidity, darkness). Rain tolerance and comfortable temperature range are adjustable in Settings; the scoring lives in `src/lib/scoring/engine.ts`.

Weather data by [Open-Meteo](https://open-meteo.com/). Hosted as static assets on Cloudflare Workers.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run deploy   # build + wrangler deploy
```

## iOS widget

A [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) widget shows today and tomorrow as coloured hour bars, using the same scoring.

1. `npm run build:widget`, then copy `scriptable/widget.js` into a new Scriptable script named **Run Weather**.
2. Run it once in Scriptable to grant location access.
3. Add a **Medium** Scriptable widget to the home screen and set its script to **Run Weather**.
