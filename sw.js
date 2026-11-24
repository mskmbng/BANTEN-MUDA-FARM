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

// ======================================
// BMF PUSH NOTIFICATION
// ======================================

self.addEventListener('push', event => {
  let data = {
    title: 'Banten Muda Farm',
    body: 'Ada informasi terbaru dari BMF.',
    url: '/BANTEN-MUDA-FARM/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/BANTEN-MUDA-FARM/icon-192.png',
      badge: '/BANTEN-MUDA-FARM/icon-192.png',
      data: {
        url: data.url || '/BANTEN-MUDA-FARM/'
      }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || '/BANTEN-MUDA-FARM/',
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin)) {
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
