// Almacenamos en el appshell 
const CACHE_NAME = 'cache-v2';

self.addEventListener('install', (event) => {
  const preCache = caches.open(CACHE_NAME)
    .then((cache) => {
      return cache.addAll([
        '/index.html',
        '/css/styles.css',
        '/css/bootstrap.min.css',
        '/css/londinium-theme.css',
        '/js/app.js',
        '/offline.html'
      ]);
    });

  event.waitUntil(preCache);
});
//Agregamos un evento para crear un nuevo espacio en cache y elimine el anterior
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});
//Agregamos este evento por si no encuentra el archivo en cache lo busque en la web y lo almacene.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        console.log('No existe en cache', event.request.url);

        // Se hace la solicitud para una página HTML y si esta offline, redirige a offline.html
        if (event.request.headers.get('accept').includes('text/html') && !navigator.onLine) {
          return caches.match('/offline.html');
        }

        return fetch(event.request)
          .then((webResponse) => {
            // Verificar si la respuesta es válida antes de hacer la caché
            if (!webResponse || webResponse.status !== 200 || webResponse.type !== 'basic') {
              return webResponse;
            }

            const responseToCache = webResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return webResponse;
          });
      })
      .catch((error) => {
        console.error('Fetch error:', error);

        if (event.request.headers.get('accept').includes('text/html')) {
          // Manejar la solicitud de la página HTML cuando hay un error de red
          return caches.match('/offline.html');
        }
      })
  );
});