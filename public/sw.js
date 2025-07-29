// Service Worker for VoiceBridge PWA
const CACHE_NAME = 'voicebridge-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Cache essential app shell resources
const ESSENTIAL_CACHE = [
  '/',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('PWA: Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: Opened cache');
        // Cache essential resources first
        return cache.addAll(ESSENTIAL_CACHE)
          .then(() => {
            console.log('PWA: Essential resources cached');
            // Try to cache additional resources
            return Promise.allSettled(
              urlsToCache.map(url => 
                fetch(url)
                  .then(response => {
                    if (response.ok) {
                      return cache.put(url, response);
                    }
                  })
                  .catch(error => console.log('PWA: Failed to cache:', url, error))
              )
            );
          });
      })
      .then(() => {
        console.log('PWA: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.log('PWA: Installation failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and API calls for real-time functionality
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline message for API calls when offline
          return new Response(
            JSON.stringify({ 
              error: 'Offline - Translation services unavailable',
              offline: true 
            }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Handle app shell requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('PWA: Serving from cache:', request.url);
          return cachedResponse;
        }

        // Try to fetch from network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok && request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // If offline and requesting HTML, return the cached main page
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/') || new Response(
                '<html><body><h1>Offline</h1><p>Please check your connection</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
            
            // For other resources, return a generic offline response
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('PWA: Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('PWA: Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Handle background sync for offline translation queue (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'translation-sync') {
    console.log('PWA: Background sync triggered for translations');
    // Future: Handle offline translation queue
  }
});