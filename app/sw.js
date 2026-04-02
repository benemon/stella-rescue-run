/**
 * Service Worker for offline support
 * Cache-first strategy for all assets
 */

const CACHE_NAME = 'stella-rescue-v1';

// Assets to cache on install (core files only)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/js/main.js',
  '/js/game.js',
  '/js/map.js',
  '/js/rocket.js',
  '/js/missions.js',
  '/js/scoring.js'
];

// Optional assets (fonts - may not exist yet)
const OPTIONAL_ASSETS = [
  '/assets/fonts/Baloo2-Bold.woff2',
  '/assets/fonts/Nunito-Regular.woff2',
  '/assets/fonts/Nunito-Bold.woff2'
];

// Install event - cache assets with error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching core assets');

        // Cache core assets (must succeed)
        await cache.addAll(CORE_ASSETS);
        console.log('[SW] Core assets cached');

        // Try to cache optional assets (fonts)
        for (const asset of OPTIONAL_ASSETS) {
          try {
            const response = await fetch(asset);
            if (response.ok) {
              await cache.put(asset, response);
              console.log('[SW] Cached optional asset:', asset);
            }
          } catch (err) {
            console.log('[SW] Skipping missing asset:', asset);
          }
        }
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a success response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});
