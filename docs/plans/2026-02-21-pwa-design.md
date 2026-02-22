# PWA Support Design

**Date:** 2026-02-21
**Status:** Approved

## Summary

Add "Add to Home Screen" support so the app installs as a full-screen PWA from Safari on iOS.

## Approach

Minimal PWA: manifest + icons + meta tags. No service worker, no new runtime dependencies.
A service worker adds no value here since the app requires live network data.

## Files to Add

- `public/manifest.json` — app name, theme colour, `display: standalone`, icon references (paths relative to `/run-weather/` base)
- `public/icons/icon-192.png` — 192×192 app icon
- `public/icons/icon-512.png` — 512×512 app icon

## Changes to Existing Files

**`index.html`** — add inside `<head>`:

```html
<link rel="manifest" href="/run-weather/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Run Weather" />
<link rel="apple-touch-icon" href="/run-weather/icons/icon-192.png" />
```

Note: `apple-touch-icon` is required specifically for iOS — iOS ignores manifest icons for the home screen shortcut.

## manifest.json Shape

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

## Icon Design

Simple green circle (`#22c55e` = run-green) with a white "R". Generated programmatically via a small Node script using `sharp` — no design tool needed.

## Out of Scope

- Service worker / offline support
- Custom domain (GitHub Pages URL only)
- Splash screen customisation
