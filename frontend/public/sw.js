const CACHE_NAME = 'montador-pro-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg'
];

// Instalação do SW: faz cache dos arquivos estáticos báscios
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Interceptação de Fetch (Network First para API, Stale-While-Revalidate para estáticos)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/') || event.request.url.includes('basemaps.cartocdn.com') || event.request.url.includes('openstreetmap.org')) {
    // Para API e Mapas: tenta ir na rede primeiro e não faz cache agressivo de milhares de tiles
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request).then(res => res || new Response('', { status: 503 })))
    );
  } else {
    // Para Assets: Stale-While-Revalidate
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((response) => {
          // Só faz cache de requisições http/https para evitar erro com chrome-extension
          if (event.request.url.startsWith('http')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          return new Response('', { status: 408 });
        });
        return cachedResponse || networkFetch;
      }).catch(() => new Response('', { status: 503 }))
    );
  }
});

// Recepção de Notificações Push Web
self.addEventListener('push', (event) => {
  let pushData = { title: 'Nova Ordem de Serviço', body: 'Você tem um convite pendente.', url: '/convite' };
  
  if (event.data) {
    try {
      pushData = event.data.json();
    } catch(e) {
      pushData.body = event.data.text();
    }
  }

  const options = {
    body: pushData.body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    data: { url: pushData.url || '/convite' },
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, options)
  );
});

// Clique na Notificação Push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta, foca nela
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
