// Red primero: siempre se descarga la versión nueva si hay conexión (adiós pantalla en blanco
// tras actualizar). La caché solo se usa cuando NO hay cobertura.
const CACHE = "viajes-ta-v10";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);
self.addEventListener("fetch", (e) => {
  const r = e.request;
  const u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); }
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match("/index.html")))
  );
});
