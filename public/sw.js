const CACHE_NAME = "prediq-v3";

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/prediq-logo.png",
];

// Install: pre-cache static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin && !url.hostname.includes("railway.app")) return;

  // API calls: network-first, no caching
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("railway.app")
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: "Offline — no cached data available" }),
          { headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // Pages: network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") return response;
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
