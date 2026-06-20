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
