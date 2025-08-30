const CACHE_NAME = 'padel-segria-v2';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logo_yellow.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip intercepting authentication routes to avoid redirect caching issues
  if (url.pathname.startsWith('/api/auth/') || 
      url.pathname.startsWith('/auth/callback') ||
      url.hostname.includes('supabase.co')) {
    return; // Let the browser handle these directly
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Check if we received a valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response
            const responseToCache = fetchResponse.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          })
          .catch(() => {
            // If both cache and network fail, return a fallback
            if (event.request.destination === 'document') {
              return caches.match('/dashboard').then(dashboardResponse => {
                if (dashboardResponse) {
                  return dashboardResponse;
                }
                // Return a minimal offline page
                return new Response(`
                  <!DOCTYPE html>
                  <html>
                    <head><title>Padel Segrià - Offline</title></head>
                    <body>
                      <h1>Sin conexión</h1>
                      <p>La aplicación no está disponible sin conexión.</p>
                    </body>
                  </html>
                `, {
                  headers: { 'Content-Type': 'text/html' }
                });
              });
            }
          });
      })
  );
});