const CACHE_NAME = 'stylon-assets-cache-v1';
const IMAGE_CACHE_NAME = 'stylon-images-cache-v1';
const PAGES_CACHE_NAME = 'stylon-pages-cache-v1';

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
          if (
            cacheName !== CACHE_NAME && 
            cacheName !== IMAGE_CACHE_NAME && 
            cacheName !== PAGES_CACHE_NAME
          ) {
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

  // We only cache GET requests and HTTP/HTTPS schemes (ignoring chrome-extension, etc.)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Exclude admin pages, livewire, filament, etc.
  const isExcluded = 
    url.pathname.includes('/admin') || 
    url.pathname.includes('/filament') || 
    url.pathname.includes('/livewire');

  if (isExcluded) {
    return;
  }

  // 1. Check if it's an image request
  const isImage = 
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpe?g|gif|svg|webp|ico)/i) ||
    url.pathname.includes('/storage/');

  if (isImage) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Update cache in the background
            fetch(request.clone()).then((networkResponse) => {
              if (networkResponse.status === 200 || networkResponse.status === 0) {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }

          // Fetch from network directly
          return fetch(request.clone()).then((networkResponse) => {
            if (networkResponse.status === 200 || networkResponse.status === 0) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Stale-while-revalidate for fonts, CSS, JS
  const isStaticAsset = 
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.match(/\.(woff2?|ttf|otf|css|js)/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            fetch(request.clone()).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }

          return fetch(request.clone()).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. Stale-while-revalidate for Pages & API Data (Offline-First)
  const isPageOrData = 
    request.mode === 'navigate' ||
    url.pathname.startsWith('/_next/data/') ||
    request.headers.get('rsc') === '1' ||
    url.pathname.includes('/api/storefront/') ||
    url.pathname.startsWith('/products/') ||
    url.pathname.startsWith('/shop/');

  if (isPageOrData) {
    event.respondWith(
      caches.open(PAGES_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            fetch(request.clone()).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }

          return fetch(request.clone()).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return caches.match('/');
          });
        });
      })
    );
    return;
  }
});
