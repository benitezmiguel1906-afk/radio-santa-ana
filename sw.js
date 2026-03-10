const CACHE_NAME = 'radio-santa-ana-v1';
const ARCHIVOS_CACHE = [
  '/radio-santa-ana/',
  '/radio-santa-ana/index.html',
  '/radio-santa-ana/manifest.json'
];

// Instalación: guardar archivos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARCHIVOS_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) => {
      return Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      );
    })
  );
  self.clients.claim();
});

// Fetch: intentar red primero, caché como respaldo
self.addEventListener('fetch', (event) => {
  // No interceptar el streaming de audio
  if (event.request.url.includes('zeno.fm')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        // Guardar copia en caché si es válida
        if (respuesta && respuesta.status === 200) {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copia);
          });
        }
        return respuesta;
      })
      .catch(() => {
        // Sin internet: usar caché
        return caches.match(event.request).then((cached) => {
          return cached || new Response(
            '<h1>Sin conexión</h1><p>Conectate a internet para escuchar Radio Santa Ana.</p>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
  );
});
