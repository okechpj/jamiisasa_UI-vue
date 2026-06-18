const CACHE_NAME = 'jamii-sasa-v1'
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  // Only process HTTP and HTTPS requests to prevent chrome-extension:// or data:// scheme failures in cache operations
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  if (event.request.method !== 'GET') return
  
  // Skip caching for API queries and Firestore/Firebase communication
  if (
    url.pathname.startsWith('/api/') || 
    url.hostname.includes('firebase') || 
    url.hostname.includes('onrender')
  ) {
    return
  }

  // SPA fallback: return index.html for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedIndex) => {
        return cachedIndex || fetch(event.request)
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      }).catch(() => {
        // Ignore errors
      })
    })
  )
})
