// Service Worker for VoiceBridge PWA
const CACHE_NAME = 'voicebridge-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('PWA: Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: Opened cache');
        return cache.addAll(urlsToCache).catch((error) => {
          console.log('PWA: Cache addAll failed:', error);
          // Continue installation even if caching fails
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('PWA: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and API calls for real-time functionality
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
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