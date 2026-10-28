# ADR 0004 — Aislamiento de miniapps

- **Estado:** aceptada (27/10/2026) — revisar antes de aceptar miniapps de terceros

## Contexto

Las miniapps son código no confiable (RF-012, RNF-005, §8). No deben poder leer credenciales, storage, DOM ni datos de otras miniapps, ni usar capacidades sensibles sin permiso explícito.

## Decisión

Defensa en capas:

1. **`<iframe sandbox="allow-scripts">` sin `allow-same-origin`.** El documento tiene un origen opaco: no puede leer `document.cookie`, `localStorage`, `sessionStorage` ni el DOM del host, aunque se sirva desde el mismo dominio.
2. **CSP en `/miniapps/*`:** `default-src 'none'`, `connect-src 'none'` (sin red), `form-action 'none'`, `frame-ancestors 'self'` y `sandbox allow-scripts` (el sandbox se aplica aunque alguien abra el archivo directo).
3. **`allow=""` y `Permissions-Policy`** deniegan cámara, micrófono, ubicación, portapapeles, pantalla completa, etc.
4. **Protocolo mínimo por `postMessage`:** solo `ready`, `interaction` y `error`, validados y filtrados por `event.source`. El host nunca ejecuta nada que venga de la miniapp.
5. **Datos mínimos hacia la miniapp:** solo `lang` y `theme` por query string.
6. **Versiones inmutables con hash** (`sha256` en `app_versions`, verificado en tests).

## Alternativas

- *Origen separado (p. ej. `apps.loopapp.dev`):* soportado vía `NEXT_PUBLIC_MINIAPP_ORIGIN`; recomendado antes de aceptar código de terceros (aísla también ante un bug del sandbox y permite cookies particionadas).
- *Runtime remoto (render en servidor):* mayor aislamiento, peor latencia y costo; no justificado para el MVP.

## Verificación

`tests/e2e/security.spec.ts` ejecuta la fixture `escape`, que intenta leer cookies/storage/DOM del host y hacer `fetch`; debe reportar `blocked`.
