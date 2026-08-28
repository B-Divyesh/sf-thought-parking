const VERSION = 'thought-parking-v6';
const BUILD_ASSETS = /* INJECT_BUILD_ASSETS */ [];
const SHELL = [
  '/', '/index.html', '/offline.html', '/manifest.webmanifest',
  '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png',
  '/assets/cassette-still-life.webp', '/privacy/', '/terms/', '/review/', '/settings/', '/demo/', ...BUILD_ASSETS
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.searchParams.has('network-probe')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => (await caches.match(event.request, { ignoreSearch: true, ignoreVary: true })) || (await caches.match('/index.html', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true, ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && ['style', 'script', 'image', 'font'].includes(event.request.destination)) {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
