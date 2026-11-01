"use strict";

// El nombre distingue esta aplicación de otras del mismo servidor.
const PREFIJO =
  "taskmanager-" +
  encodeURIComponent(self.registration.scope) +
  "-";

const CACHE = PREFIJO + "v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js"
];

const URLS = ARCHIVOS.map(ruta => {
  return new URL(ruta, self.registration.scope).href;
});

// INSTALACIÓN Y GUARDADO INICIAL

self.addEventListener("install", evento => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);

      const solicitudes = URLS.map(url => {
        return new Request(url, {
          cache: "reload"
        });
      });

      await cache.addAll(solicitudes);

      await self.skipWaiting();
    })()
  );
});

// ACTIVACIÓN Y LIMPIEZA DE VERSIONES ANTERIORES

self.addEventListener("activate", evento => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();

      const anteriores = nombres.filter(nombre => {
        return (
          nombre.startsWith(PREFIJO) &&
          nombre !== CACHE
        );
      });

      await Promise.all(
        anteriores.map(nombre => caches.delete(nombre))
      );

      await self.clients.claim();
    })()
  );
});

// RED PRIMERO; CACHÉ CUANDO LA RED FALLA

self.addEventListener("fetch", evento => {
  if (evento.request.method !== "GET") {
    return;
  }

  const url = new URL(evento.request.url);
  const limpia = new URL(url.href);

  limpia.search = "";
  limpia.hash = "";

  // Solo intercepta los archivos propios de esta aplicación.
  // La API externa no se guarda en esta caché.
  if (!URLS.includes(limpia.href)) {
    return;
  }

  evento.respondWith(
    (async () => {
      try {
        const respuesta = await fetch(evento.request);

        if (!respuesta.ok) {
          throw new Error("Respuesta HTTP incorrecta");
        }

        try {
          const cache = await caches.open(CACHE);

          await cache.put(
            evento.request,
            respuesta.clone()
          );
        } catch (error) {
          // La respuesta de red puede utilizarse aunque
          // falle su almacenamiento en caché.
        }

        return respuesta;
      } catch (error) {
        const cache = await caches.open(CACHE);

        const guardada = await cache.match(
          evento.request,
          {
            ignoreSearch: true
          }
        );

        if (guardada) {
          return guardada;
        }

        return new Response(
          "Archivo no disponible sin conexión.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});