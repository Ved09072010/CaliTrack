const CACHE_PREFIX = "calitrack-";
const CACHE_VERSION = "v2";
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const HASHED_ASSET = /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/;

function appUrl(path = "") {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const shellUrl = appUrl("./");
    await cache.addAll([
      shellUrl,
      appUrl("manifest.webmanifest"),
      appUrl("icons/calitrack.svg"),
      appUrl("icons/calitrack-192.png"),
      appUrl("icons/calitrack-512.png"),
      appUrl("icons/apple-touch-icon.png"),
    ]);
    const assetManifestUrl = appUrl("asset-manifest.json");
    const manifestResponse = await fetch(assetManifestUrl);
    if (!manifestResponse.ok) {
      throw new Error("Could not load the asset manifest for offline caching.");
    }
    const manifest = await manifestResponse.json();
    const buildAssets = [...new Set(Object.values(manifest).flatMap((entry) => [
      entry.file,
      ...(entry.css || []),
    ]))].map((asset) => new URL(asset, shellUrl).href);
    await cache.add(assetManifestUrl);
    await cache.addAll(buildAssets);
    const shell = await cache.match(shellUrl);
    const shellText = await shell.text();
    const assets = [...shellText.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
      .map((match) => new URL(match[1], shellUrl).href);
    await cache.addAll(assets);

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
  if (request.method !== "GET" || !isSameOrigin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (HASHED_ASSET.test(requestUrl.pathname)) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        const page = await cache.match(request);
        if (page) return page;
        const appShell = await cache.match(appUrl("./"));
        if (appShell) return appShell;
      }
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;
      throw error;
    }
  })());
});
