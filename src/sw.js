const CACHE_NAME = 'schedule-v1';
const CACHE_TARGETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(CACHE_TARGETS))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
        .then(cacheNames => Promise.all(cacheNames.map(cache => {
            if (cache !== CACHE_NAME) return caches.delete(cache);
        })))
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    
    const url = new URL(request.url);
    if (url.origin !== location.origin) return;

    if (request.url.includes('/api/')) return; 

    event.respondWith(
        caches.match(request)
        .then(response => {
            if (response) return response;
            return fetch(request)
            .then(fetchResponse => {
                if (!fetchResponse || fetchResponse.status !== 200) return fetchResponse;
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
                return fetchResponse;
            })
        })
    );
});
