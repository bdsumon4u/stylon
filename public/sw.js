// ─── Version ─────────────────────────────────────────────────────────────────
// Bump this string whenever you deploy changes to the SW. The activate handler
// deletes all caches whose name doesn't match the new version, forcing a fresh
// start for every cache bucket.
const SW_VERSION = 'v5';

const CACHE_NAME       = `stylon-assets-${SW_VERSION}`;
const IMAGE_CACHE_NAME = `stylon-images-${SW_VERSION}`;
const PAGES_CACHE_NAME = `stylon-pages-${SW_VERSION}`;

// ─── Expiry / LRU limits ─────────────────────────────────────────────────────
const IMAGE_MAX_ENTRIES  = 200;            // keep last N images
const PAGES_MAX_ENTRIES  = 60;             // keep last N page/API responses
const IMAGE_MAX_AGE_MS   = 24 * 3600_000; // 24 h
const PAGES_MAX_AGE_MS   =      3600_000; // 1 h
const ASSETS_MAX_AGE_MS  = 7 * 24 * 3600_000; // 7 days

// Custom header we stamp on every cached response so we can check freshness.
const CACHE_TIME_HEADER = 'x-sw-cache-time';

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(['/', '/favicon.ico']))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const knownCaches = new Set([CACHE_NAME, IMAGE_CACHE_NAME, PAGES_CACHE_NAME]);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => !knownCaches.has(n))
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clone a Response and stamp the current time in a custom header. */
function stampResponse(response) {
  if (response.type === 'opaque') {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set(CACHE_TIME_HEADER, String(Date.now()));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** True if the cached response is older than maxAgeMs. */
function isExpired(cachedResponse, maxAgeMs) {
  if (cachedResponse.type === 'opaque') {
    return false; // Serve immediately from cache, update in background (SWR)
  }
  const cacheTime = parseInt(cachedResponse.headers.get(CACHE_TIME_HEADER) || '0', 10);
  return cacheTime === 0 || Date.now() - cacheTime > maxAgeMs;
}

/**
 * Cache-then-network: cache the response for future navigations, but always
 * return the fresh network response immediately. Background caching never
 * blocks the user response.
 */
async function cacheFirst(request, cacheName, maxAgeMs, maxEntries) {
  const cache = await caches.open(cacheName);
  // Fire-and-forget network refresh + cache update.
  fetch(request.clone())
    .then((networkRes) => {
      if (networkRes.ok || networkRes.type === 'opaque') {
        cache.put(request, stampResponse(networkRes.clone()));
        if (maxEntries) trimCache(cacheName, maxEntries);
      }
    })
    .catch(() => null);

  const cached = await cache.match(request);
  if (cached && !isExpired(cached, maxAgeMs)) {
    return cached;
  }

  // Cache miss or expired — wait for the network.
  try {
    const networkRes = await fetch(request.clone());
    if (networkRes.ok || networkRes.type === 'opaque') {
      cache.put(request, stampResponse(networkRes.clone()));
      if (maxEntries) trimCache(cacheName, maxEntries);
    }
    return networkRes;
  } catch (e) {
    return cached || new Response('Network error', { status: 503 });
  }
}

/**
 * FIFO trim: removes the oldest entries when the cache exceeds `maxEntries`.
 * Cache.keys() returns entries in insertion order (oldest first in Chrome).
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys  = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept GET over HTTP/HTTPS.
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Leave admin / backend-only paths alone.
  if (
    url.pathname.includes('/admin') ||
    url.pathname.includes('/filament') ||
    url.pathname.includes('/livewire')
  ) return;

  // ── 1. Images ──────────────────────────────────────────────────────────────
  const isImage =
    request.destination === 'image' ||
    /\.(png|jpe?g|gif|svg|webp|ico)(\?.*)?$/i.test(url.pathname) ||
    url.pathname.includes('/storage/') ||
    url.pathname.startsWith('/_next/image');

  if (isImage) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME, IMAGE_MAX_AGE_MS, IMAGE_MAX_ENTRIES));
    return;
  }

  // ── 2. Static assets (fonts, JS, CSS) ─────────────────────────────────────
  const isStaticAsset =
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    /\.(woff2?|ttf|otf|css|js)(\?.*)?$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(cacheFirst(request, CACHE_NAME, ASSETS_MAX_AGE_MS, null));
    return;
  }

  // ── 3. Pages & API data — never block navigation on stale cache ────────────
  const isPageOrData =
    request.mode === 'navigate' ||
    url.pathname.startsWith('/_next/data/') ||
    request.headers.get('rsc') === '1' ||
    url.pathname.includes('/api/storefront/') ||
    url.pathname.startsWith('/products/') ||
    url.pathname.startsWith('/shop/');

  if (isPageOrData) {
    event.respondWith(
      cacheFirst(request, PAGES_CACHE_NAME, PAGES_MAX_AGE_MS, PAGES_MAX_ENTRIES)
        .then((res) => {
          if (!res || res.status === 503) {
            return caches.match('/').then((shell) => shell || res);
          }
          return res;
        })
    );
    return;
  }
});
