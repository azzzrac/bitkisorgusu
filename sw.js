const CACHE_NAME = 'bitki-kesif-cache-v31';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/firebase-config.js',
    '/manifest.json'
];

// Service Worker Yükleme (Install) Eventi - Statik Dosyaları Önbellekle
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Service Worker Aktifleştirme (Activate) Eventi - Eski Önbellekleri Temizle
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Service Worker İstek Yakalama (Fetch) Eventi - Önce Ağ, Yoksa Önbellek
self.addEventListener('fetch', (e) => {
    // Sadece GET isteklerini önbellekle
    if (e.request.method !== 'GET') return;
    
    // API veya Firebase isteklerini pas geç
    if (e.request.url.includes('/api/') || e.request.url.includes('googleapis') || e.request.url.includes('firebase')) {
        return;
    }

    e.respondWith(
        fetch(e.request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseClone);
                });
            }
            return response;
        }).catch(() => {
            return caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                if (e.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
