// Curious Quest service worker: lets the game open and play offline.
// Pages: try the network first (so updates arrive), fall back to the cache.
// Everything else (scripts, pictures, sounds): serve from the cache, refresh it in the background.
const CACHE = 'cq-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('/', copy)); return res })
        .catch(() => caches.match('/'))
    )
    return
  }

  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const cached = await c.match(req)
      const fresh = fetch(req)
        .then((res) => { if (res.ok) c.put(req, res.clone()); return res })
        .catch(() => cached)
      return cached || fresh
    })
  )
})
