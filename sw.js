const CACHE_NAME = 'bmf-smart-farming-v1';
const APP_ROOT = '/BANTEN-MUDA-FARM/';
const APP_FILES = [APP_ROOT, APP_ROOT + 'index.html', APP_ROOT + 'manifest.json', APP_ROOT + 'icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(APP_ROOT + 'index.html', copy));
      return response;
    }).catch(() => caches.match(APP_ROOT + 'index.html')));
    return;
  }
  if (url.pathname.startsWith(APP_ROOT)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    })));
  }
});
