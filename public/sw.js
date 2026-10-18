// ✏️ Incrementa este número cada vez que despliegues
const CACHE_NAME = "viajes-ta-v9";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Nunca cachear: API, archivos JS/CSS compilados, o peticiones de navegación
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/assets/") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("openrouter.ai") ||
    url.hostname.includes("er-api.com") ||
    url.hostname.includes("nominatim.openstreetmap.org") ||
    e.request.mode === "navigate"
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Solo cachear archivos estáticos básicos
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
