const CACHE_VERSION = "planner-pwa-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./components/planner-content.html",
  "./components/task-modal.html",
  "./assets/css/styles.css",
  "./assets/css/base.css",
  "./assets/css/forms.css",
  "./assets/css/calendar.css",
  "./assets/css/agenda.css",
  "./assets/css/calendar-days.css",
  "./assets/css/modals.css",
  "./assets/css/responsive.css",
  "./assets/js/script.js",
  "./assets/js/app/planner-app.js",
  "./assets/js/components/component-loader.js",
  "./assets/js/managers/task-manager.js",
  "./assets/js/services/storage-service.js",
  "./assets/js/ui/confirm-modal.js",
  "./assets/js/ui/planner-renderer.js",
  "./assets/js/ui/task-modal.js",
  "./assets/js/utils/date-utils.js",
  "./assets/js/utils/dom.js",
  "./assets/js/utils/holiday-utils.js",
  "./assets/js/utils/task-helpers.js",
  "./assets/pwa/icon.svg",
  "./assets/pwa/icon-192.png",
  "./assets/pwa/icon-512.png",
  "./assets/pwa/apple-touch-icon.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js",
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap"
];

const toCacheKey = (requestUrl) => {
  const url = new URL(requestUrl);
  return url.origin === self.location.origin ? `${url.origin}${url.pathname}` : url.href;
};

const buildCacheMap = () =>
  new Map(APP_SHELL.map((asset) => {
    const requestUrl = new URL(asset, self.location.href).href;
    return [toCacheKey(requestUrl), requestUrl];
  }));

const APP_SHELL_MAP = buildCacheMap();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll([...APP_SHELL_MAP.values()]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const cacheKey = toCacheKey(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        return cache.match(new URL("./index.html", self.location.href).href);
      })
    );
    return;
  }

  if (APP_SHELL_MAP.has(cacheKey)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(APP_SHELL_MAP.get(cacheKey));
        if (cached) {
          return cached;
        }

        const response = await fetch(event.request);
        cache.put(APP_SHELL_MAP.get(cacheKey), response.clone());
        return response;
      })
    );
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request))
    );
  }
});
