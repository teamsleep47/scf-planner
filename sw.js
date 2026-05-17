// SCF Planner Service Worker
const CACHE = 'scf-planner-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll([
      '/scf-planner/',
      '/scf-planner/index.html',
      '/scf-planner/manifest.json'
    ]).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  self.clients.claim();
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  // Network first for API calls, cache fallback for app shell
  const url = new URL(e.request.url);
  if(url.hostname !== 'teamsleep47.github.io') {
    // External (Google APIs etc) — network only
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }
  // App shell — network first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
