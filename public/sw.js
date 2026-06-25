const CACHE_NAME = "stylon-sw-cache-v1";

// Cache dynamic pages, media files, and script bundles.
// Clean up old caches on activate.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: clearing old cache", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Cache first with network revalidation only for GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Avoid caching web sockets, extension resources, or unsupported protocols
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // Prevent caching development server reload components and hot module updates
  if (
    url.pathname.includes("_next/webpack-hmr") ||
    url.pathname.includes("__next_js_original_module_loc") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // Spawn background network fetch to revalidate cache
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            // Check if response is valid (status 200 or status 0 for opaque cross-origin resources like images)
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.status === 0)
            ) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn("Service Worker: background fetch failed for:", request.url);
            throw err;
          });

        // Serve cached response first, fallback to network response
        return cachedResponse || fetchPromise;
      });
    })
  );
});
