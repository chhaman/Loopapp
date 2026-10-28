# Contrato de miniapp v1

## Paquete

- Un único `index.html` autocontenido: todo el JS y CSS inline. Sin recursos externos (scripts, estilos, imágenes, fuentes por URL). Imágenes como `data:`.
- Tamaño máximo: **200 KB**.
- Ruta inmutable: `/miniapps/<slug>/<version>/index.html`. Un cambio = una versión nueva.
- Hash SHA-256 registrado en `app_versions.sha256`.

## Entorno de ejecución

| Capacidad | Disponible |
|---|---|
| JavaScript, DOM propio, timers, `requestAnimationFrame`, Canvas, Web Audio | Sí |
| `fetch`, XHR, WebSocket, formularios | **No** (`connect-src 'none'`) |
| Cookies, `localStorage`, `sessionStorage`, IndexedDB | **No** (origen opaco). Guardá el estado en memoria. |
| `window.parent` / `window.top` (DOM o URL) | **No** |
| Popups, navegación del top, descargas | **No** |
| Cámara, micrófono, ubicación, portapapeles, pantalla completa | **No** (salvo permiso aprobado en una versión futura) |

## Parámetros de entrada

La URL recibe solo `?lang=es|en&theme=light|dark`. El SDK los aplica a `<html lang>` y `<html data-theme>`.

## SDK (`window.Loop`)

Se inyecta con `/*LOOP_SDK*/` al construir (`npm run miniapps:build`).

| API | Uso |
|---|---|
| `Loop.lang`, `Loop.theme` | Idioma y tema actuales |
| `Loop.t({ es, en })` | Elegir texto según idioma |
| `Loop.ready()` | **Obligatorio.** Avisar que la miniapp está lista (si no llega en 10 s, el host muestra timeout) |
| `Loop.interaction(name)` | Interacción significativa (`[a-z0-9:_-]{1,40}`). La primera de cada carga cuenta como *inicio de prueba* |

Los errores no capturados (`error`, `unhandledrejection`) se reportan solos; el host muestra un estado recuperable.

## Mensajes (`postMessage` al host)

```json
{ "source": "loop-miniapp", "v": 1, "type": "ready" }
{ "source": "loop-miniapp", "v": 1, "type": "interaction", "name": "start" }
{ "source": "loop-miniapp", "v": 1, "type": "error", "message": "…(≤200)" }
```

Cualquier otro mensaje se ignora. El host no envía mensajes a la miniapp; reiniciar = recargar el documento.

## Reinicio

La demo debe volver a su estado inicial al recargarse (no persistir nada). El botón *Reiniciar demo* del host recarga el iframe.

## Crear una miniapp nueva

1. `miniapps/apps/<slug>/index.html` con los marcadores `/*LOOP_BASE_CSS*/` y `/*LOOP_SDK*/` (copiá una existente).
2. `npm run miniapps:build` → genera el bundle y el hash.
3. Agregala a `src/lib/catalog/seed.ts` y corré `npm run db:seed:generate`.
4. En producción: insertá `apps` + `app_versions` (estado `pending`), aprobala con `admin_set_version_status` y publicala desde `/admin`.
