const CACHE_NAME = 'stylon-assets-cache-v1';
const IMAGE_CACHE_NAME = 'stylon-images-cache-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // We only cache GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Check if it's an image request
  const isImage = 
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpe?g|gif|svg|webp|ico)/i) ||
    url.host.includes('kroymela.com') && url.pathname.includes('/storage/');

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request.clone()).then((networkResponse) => {
            // Cache valid HTTP 200 or opaque (status 0) responses
            if (networkResponse.status === 200 || networkResponse.status === 0) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {});
          
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for fonts, CSS, JS
  const isStaticAsset = 
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.match(/\.(woff2?|ttf|otf|css|js)/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {});
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
});
