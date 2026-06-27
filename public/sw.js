const CACHE_NAME = "stylon-sw-cache-v2";

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
        // Determine if we should attempt to upgrade a cross-origin 'no-cors' request to 'cors'.
        // This lets us inspect the response status (e.g. 200 vs 404/500) and avoid caching broken assets.
        const isCrossOriginAsset = url.origin !== self.location.origin && request.mode === "no-cors";

        const makeFetch = () => {
          if (isCrossOriginAsset) {
            return fetch(new Request(request, { mode: "cors" }))
              .then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                  cache.put(request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(() => {
                // If CORS fails (e.g. server CORS configuration mismatch), fallback to standard no-cors fetch.
                // We do NOT cache opaque (status 0) responses to prevent caching broken/failed resources.
                return fetch(request);
              });
          } else {
            return fetch(request).then((networkResponse) => {
              // Only cache successful same-origin or CORS responses (status 200-299)
              if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            });
          }
        };

        const fetchPromise = makeFetch().catch((err) => {
          console.warn("Service Worker: background fetch failed for:", request.url);
          throw err;
        });

        // Serve cached response first, fallback to network response
        return cachedResponse || fetchPromise;
      });
    })
  );
});
