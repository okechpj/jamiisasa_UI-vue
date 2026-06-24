// Service worker intentionally disabled. File kept to avoid build errors.
// Previously this file implemented runtime caching; the app now unregisters
// service workers by default and clears caches to avoid stale UI. Leaving
// this no-op worker here prevents accidental registration of older builds.

self.addEventListener('install', (event) => {
  // Immediately skip waiting and activate a benign worker.
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // No caching or fetch interception performed.
})
