/* Atelier · fonctionnement sans Internet
   En ligne : tout vient du réseau, comme d'habitude (jamais d'ancienne version).
   Hors ligne : la dernière copie reçue prend le relais, y compris l'outil Pour Inès. */
const CACHE = 'atelier-hors-ligne-1';
const BASE = new URL('./', self.location).pathname;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './pour-ines.html'])).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || !u.pathname.startsWith(BASE)) return;
  e.respondWith(fetch(r).then((res) => {
    if (res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)).catch(() => {}); }
    return res;
  }).catch(async () => {
    const m = (await caches.match(r)) || (await caches.match(r, { ignoreSearch: true }));
    if (m) return m;
    if (r.mode === 'navigate') { const home = await caches.match('./'); if (home) return home; }
    return Response.error();
  }));
});
