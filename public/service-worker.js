const CACHE_PREFIX = "calitrack-";
const CACHE_VERSION = "v1";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const CHART_URL = "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js";

function appUrl(path = "") {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      appUrl("./"),
      appUrl("manifest.webmanifest"),
      appUrl("icons/calitrack.svg"),
    ]);

    // Chart.js is optional; the tracker still works when its CDN is unavailable.
    try {
      const response = await fetch(CHART_URL);
      if (response.ok) await cache.put(CHART_URL, response);
    } catch {
      // Offline use should not fail just because the optional chart could not download.
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isChartScript = requestUrl.href === CHART_URL;

  if (request.method !== "GET" || (!isSameOrigin && !isChartScript)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    try {
      const response = await fetch(request);
      if (response.ok && (isSameOrigin || response.type === "cors")) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        const appShell = await cache.match(appUrl("./"));
        if (appShell) return appShell;
      }
      throw error;
    }
  })());
});
