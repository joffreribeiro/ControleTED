/**
 * Service Worker do Controle TED — instalação como PWA e cache offline.
 * Padrão portado de ../Ponto/sw.js (mesmo autor, mesma stack Firebase vanilla-JS sem build).
 */

// v3: força re-cache de app.js/firebase-init.js (fix da regravação de cache velho pelo autosave)
const CACHE_NAME = 'controle-ted-v3';
const CACHE_ASSETS = [
    'index.html',
    'styles.css',
    'js/main.js',
    'firebase-init.js',
    'app.js',
    'pwa.js',
    'manifest.json',
    'favicon.svg',
    'logo-controle-ted.svg'
];

// Instalação - cachear assets (best-effort: um asset faltando não derruba a instalação)
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...');

    event.waitUntil((async () => {
        try {
            const cache = await caches.open(CACHE_NAME);
            for (const asset of CACHE_ASSETS) {
                try {
                    const req = new Request(asset, { cache: 'no-cache' });
                    const res = await fetch(req);
                    if (res && res.ok) await cache.put(req, res);
                    else console.warn('[SW] Falha ao cachear:', asset, res && res.status);
                } catch (e) {
                    console.warn('[SW] Erro ao buscar asset:', asset, e);
                }
            }
        } catch (err) {
            console.error('[SW] Erro durante install/cache:', err);
        }
        await self.skipWaiting();
    })());
});

// Ativação - limpar caches de versões antigas
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativando Service Worker...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Permitir skipWaiting sob demanda (usado pelo fluxo de update em pwa.js)
self.addEventListener('message', (event) => {
    try {
        const data = event.data || {};
        if (data && data.type === 'SKIP_WAITING') {
            self.skipWaiting();
        }
    } catch (e) { /* ignore */ }
});

self.addEventListener('fetch', (event) => {
    // Ignorar requisições não-GET
    if (event.request.method !== 'GET') return;

    // Ignorar URLs externas (CDN do Firebase SDK, fontes do Google, ícones lucide) —
    // ficam por conta do cache HTTP normal do navegador/WebView, não deste SW.
    if (!event.request.url.startsWith(self.location.origin)) return;

    const url = new URL(event.request.url);
    const isDocument = event.request.mode === 'navigate' || event.request.destination === 'document' || url.pathname.endsWith('/index.html');
    const isCriticalAsset = isDocument || url.pathname.endsWith('/js/main.js') || url.pathname.endsWith('/styles.css');

    // HTML e assets críticos: Network First com fallback para cache — evita servir uma
    // versão desatualizada da lógica de negócio quando há conexão disponível.
    if (isCriticalAsset) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(event.request);
                    return cached || caches.match('./index.html');
                })
        );
        return;
    }

    // Demais recursos: Cache First com atualização em background
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    fetch(event.request).then(response => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, response);
                            });
                        }
                    }).catch(() => {});
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then(response => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch(() => caches.match('./index.html'));
            })
    );
});

// Sincronização em background (quando a conexão voltar) — usado pelo fluxo de
// registro de entrega em campo (Fase 2), aqui só o encaminhamento para os clients.
self.addEventListener('sync', (event) => {
    console.log('[SW] Sincronização em background:', event.tag);
    if (event.tag === 'sync-data') {
        event.waitUntil((async () => {
            const allClients = await self.clients.matchAll({ type: 'window' });
            for (const client of allClients) {
                client.postMessage({ type: 'SYNC_REQUEST' });
            }
        })());
    }
});

// Notificações push (preparação futura, sem uso ativo ainda)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nova atualização disponível',
        icon: './icon-192.png',
        vibrate: [200, 100, 200],
        data: { dateOfArrival: Date.now() }
    };
    event.waitUntil(
        self.registration.showNotification('Controle TED', options)
    );
});
