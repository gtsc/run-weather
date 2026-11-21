# Run Weather

Svelte 5 + Vite + Tailwind v4 SPA, served as static assets by a Cloudflare Worker (no server code). Data from Open-Meteo, geocoding via Open-Meteo/Nominatim. Keep this file and the README lean — only add what can't be learned from the code.

## Workflow

- Never commit to `main`. Branch (`feat/…`, `fix/…`, `chore/…`) and open a PR.
- Before committing: `npm run check`, `npm run lint` (`npm run format` fixes style), `npm test`, `npm run build`.

## Gotchas

- Forecast times are wall-clock strings in the **location's** time zone. Compare them with `weather.now`, never `new Date()` / `toISOString()`.
- `src/lib/api/forecast.ts` and `src/lib/utils/dates.ts` are also bundled into the Scriptable widget (`npm run build:widget`), so no browser-only APIs there.
- Vitest runs without the Svelte compiler, so put testable logic in plain `.ts` files, not `.svelte.ts`.
- CSP is in `public/_headers`. The inline theme script in `index.html` is allowed by hash (`src/security.test.ts` checks it), and new API origins go in `connect-src`.
- Dark mode is `color-scheme` + `light-dark()` tokens in `app.css` with the override on `<meta name="color-scheme">`. There is no `.dark` class. Use `run-*` colour tokens, not raw Tailwind greys.
- The `*.workers.dev` URL is used for preview deployments, so keep it enabled.
