// Offline support: keeps the app shell and the most recent forecast.
//   pages      → network first, cached shell when offline
//   /assets/*  → cache first (fingerprinted, never change)
//   forecasts  → network first, last cached copy when offline (stamped x-sw-cached-at)
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;
const DATA = `forecast-${VERSION}`;
const FORECAST_ORIGIN = 'https://api.open-meteo.com';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Precache the current page and the hashed bundles it references.
      const html = await (await fetch('/', { cache: 'no-cache' })).text();
      const assets = [...html.matchAll(/\/assets\/[\w.-]+/g)].map((m) => m[0]);
      await cache.addAll(['/', '/manifest.json', '/favicon.svg', ...new Set(assets)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== SHELL && key !== DATA) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL, '/'));
  } else if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  } else if (url.origin === FORECAST_ORIGIN) {
    event.respondWith(networkFirst(request, DATA, undefined, true));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(SHELL)).put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName, fallbackKey, stamp = false) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const copy = stamp ? await withCachedAt(response.clone()) : response.clone();
      await cache.put(fallbackKey ?? request, copy);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(fallbackKey ?? request);
    if (cached) return cached;
    throw error;
  }
}

/** Store when a forecast was fetched, so the app can say how old offline data is. */
async function withCachedAt(response) {
  const headers = new Headers(response.headers);
  headers.set('x-sw-cached-at', String(Date.now()));
  return new Response(await response.blob(), { status: response.status, headers });
}
