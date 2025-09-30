const CACHE_NAME = 'schedule-v1';
const CACHE_TARGETS = ['/', '/index.html'];

self.addEventListener('install', (event) => 
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(CACHE_TARGETS))
        .then(() => self.skipWaiting())
    )
);

self.addEventListener('activate', (event) => 
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cacheName => {
                if (cacheName !== CACHE_NAME)
                    return caches.delete(cacheName)
            })
        )).then(() => self.clients.claim())
    )
);

self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html')
                .then(cachedResponse => cachedResponse || fetch(event.request))
        );
    }
});