# Future Improvements

Ideas and improvements to revisit after real-world usage.

## Scoring & Data

- **Gradual sunrise/sunset scoring** -- Currently `is_day` is binary (0/1). Open-Meteo provides daily `sunrise` and `sunset` times which could enable a softer twilight penalty instead of the hard cutoff.
- **Scoring calibration** -- After using the app for a few weeks, compare actual "how did the run feel?" against predicted scores. Adjust weights based on real experience.
- **UV index** -- High UV in summer could be a factor for midday runs. Open-Meteo provides `uv_index` as a daily parameter.
- **Humidity** -- High humidity makes warm runs miserable. Could add `relative_humidity_2m` to the hourly params.
- **Air quality** -- Open-Meteo has an air quality API that could flag high-pollution hours.

## UI & UX

- **Svelte transitions** -- Animate day expand/collapse and run window cards appearing.
- **Mobile improvements** -- Test thoroughly on small screens. The tooltip positioning may need adjustment on touch devices (tap instead of hover).
- **Preferred hours filter** -- Optional setting to grey out hours you'd never run (e.g. 22:00-06:00) so the best-window algorithm skips them. Discussed but deliberately left out to keep the app focused on weather.
- **Weekly summary** -- A quick "best day this week" callout at the top, so you can plan at a glance without expanding each day.
- **Share a window** -- Copy a shareable link or text snippet like "Best run: Tuesday 14:00-15:00, score 87, 12°C partly cloudy" for sending to running buddies.

## Performance & Caching

- **Forecast caching** -- Cache forecast data in sessionStorage with a 30-min TTL keyed by lat/lng. Avoids re-fetching on page refresh.
- **Service worker** -- For PWA-like offline support. Cache the app shell and last forecast so it works without internet.
- **Debounce location search** -- Add a short debounce to the search input to avoid hammering the geocoding API on fast typing.

## Deployment

- **Deploy to Vercel/Netlify** -- Pure static site, zero backend. Just `npm run build` and deploy the `dist/` folder.
- **PWA manifest** -- Add `manifest.json` for "Add to Home Screen" on mobile.
- **Custom domain** -- If it becomes a regular tool, give it a memorable URL.

## Stretch Ideas

- **Multi-location comparison** -- Save 2-3 favourite locations and see them side by side.
- **Garmin/Strava integration** -- Pull in actual run data to correlate weather conditions with performance.
- **Notification** -- "Your best run window today is in 2 hours" via push notifications (would need a service worker).
- **Historical accuracy** -- After a day passes, compare forecast vs actual weather to show how reliable the predictions were.
