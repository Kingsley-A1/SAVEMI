/**
 * SAVEMI service worker.
 *
 * Scope: make the site installable and keep a minimal offline fallback.
 * Deliberately conservative — it never touches API routes or mutations, and
 * never caches cross-origin requests (R2 media, Resend, etc.), so uploads,
 * admin writes, and third-party media are always fetched fresh from the
 * network.
 */

const CACHE_VERSION = "savemi-v1";
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/images/logo.jpg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(RUNTIME_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => {
              // Ignore individual precache failures (e.g. first deploy, offline build).
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("savemi-") && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept mutations, or anything other than a plain GET.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never touch cross-origin requests (R2 media subdomain, Resend, etc.) or
  // the app's own API routes — those must always be live.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: network first, offline page as the last resort.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () => caches.match(OFFLINE_URL).then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  // Static assets (Next.js chunks, images, fonts): stale-while-revalidate.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached ?? networkFetch;
    }),
  );
});
