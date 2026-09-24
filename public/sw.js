// Service worker mínimo: habilita la instalación como app (Chrome exige uno
// registrado con manejador de "fetch") y da un colchón offline básico para
// el shell de la app. Nunca cachea /api ni /login: esas siempre van a red,
// para no servir datos de estudio ni sesión desactualizados.
const CACHE_NAME = "kine-study-shell-v1";
const SHELL_URLS = ["/", "/manifest.webmanifest", "/icon", "/pwa-icon-192", "/pwa-icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api") || url.pathname === "/login") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/")))
  );
});
