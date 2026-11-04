// Guarda la app para que abra rápido. Al subir cambios, aumenta el número de versión.
const VERSION = "cj-gh-1";
const SHELL = ["./", "index.html", "app.js", "firebase-config.js", "manifest.webmanifest", "logo.webp", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return; const url = new URL(req.url);
  if (url.origin === self.location.origin) e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
  else if (url.hostname === "www.gstatic.com" || url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com") e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(req, c)); return res; })));
});
