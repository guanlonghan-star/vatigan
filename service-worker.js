const VERSION = '1.3.1';
const SHELL_CACHE = 'vatican-shell-1.3.1';
const SHELL = [
  './', './index.html', './credits.html', './manifest.webmanifest',
  './css/app.css', './js/app.js', './js/content.js', './js/player.js',
  './js/offline.js', './js/route-map.js', './js/hotspots.js', './js/sistine.js',
  './data/guide.json', './data/hotspots.json', './data/image-credits.json', './data/offline-manifest.json',
  './assets/maps/vatican-route-map.svg',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names
    .filter((name) => name.startsWith('vatican-shell-') && name !== SHELL_CACHE)
    .map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

async function respondToRange(request) {
  const full = await caches.match(request.url);
  if (!full) return fetch(request);
  const bytes = await full.arrayBuffer();
  const match = /bytes=(\d+)-(\d*)/.exec(request.headers.get('range') || '');
  if (!match) return full;
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (start > end || start >= bytes.byteLength) {
    return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${bytes.byteLength}`}});
  }
  const headers = new Headers(full.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  return new Response(bytes.slice(start, end + 1), {status: 206, statusText: 'Partial Content', headers});
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.headers.has('range')) {
    event.respondWith(respondToRange(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, response.clone()));
    }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
