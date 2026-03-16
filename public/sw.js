const CACHE_VERSION = 'smart-rabbit-v3';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const OFFLINE_URL = '/offline';

const APP_SHELL_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== DATA_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore unsupported schemes (e.g. chrome-extension://) and cross-origin requests.
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== self.location.origin) {
    return;
  }

  if (request.method !== 'GET') return;

  // Network-first for API requests with cache fallback.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests: network-first with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static assets: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, copy).catch(() => null));
          return response;
        })
        .catch(() => caches.match('/logo.png'));
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag !== 'smart-rabbit-sync') return;

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true }).then((clients) =>
      Promise.all(
        clients.map((client) => client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' }))
      )
    )
  );
});
