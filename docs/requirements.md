# Requerimientos y trazabilidad

Fuente: *Documento de Requerimientos — Plataforma de Miniapps*, v0.1 (27/10/2026). Este archivo resume los requerimientos **MVP**, cómo se implementaron y qué prueba los cubre. Los P1/P2 quedan listados como backlog.

## Decisiones pendientes resueltas (§13)

| ID | Decisión | Resolución |
|---|---|---|
| DP-02 | Plataforma de lanzamiento | Web-first, responsive (mobile + desktop). PWA más adelante. |
| DP-03 | Formato de miniapp | HTML autocontenido (JS/CSS inline), sin dependencias externas, ≤ 200 KB, con SDK de la plataforma. Ver [contrato](api/miniapp-contract.md). |
| DP-04 | Autenticación | Supabase Auth, email + contraseña. Cuenta requerida solo para me gusta, guardar, comentar y reportar. |
| DP-05 | Ejecución aislada | `<iframe sandbox="allow-scripts">` (origen opaco) + CSP sin red + `allow=""`. Origen separado opcional (`NEXT_PUBLIC_MINIAPP_ORIGIN`). Ver [ADR 0004](adr/0004-miniapp-isolation.md). |
| DP-06 | Publicación inicial | Solo equipo interno (catálogo controlado vía seed/SQL + panel admin). |
| DP-11 | Nombre y marca | **Loopapp**, identidad en [brand.md](brand.md). |
| DP-12 | Infraestructura | Cloudflare Workers (app) + Supabase (datos/auth). |
| DP-01, 07–10, 13, 14 | Público, IA, analítica/consentimiento, monetización, moderación, legal, criterios de éxito | **Abiertas.** No bloquean el MVP técnico; deben resolverse antes del piloto. |

## Matriz MVP: requerimiento → implementación → prueba

| Req. | Descripción | Implementación | Pruebas |
|---|---|---|---|
| RF-001 | Feed vertical | `src/components/Feed.tsx` (scroll-snap, teclado, botones) | E2E TC-001, TC-002 |
| RF-002 | Ficha resumida en el feed | `FeedCard` en `Feed.tsx` | E2E TC-001 |
| RF-003 | Carga anticipada | Feed monta el iframe del ítem activo ±1 | E2E RF-003 |
| RF-005 | Ficha de app | `src/app/app/[slug]/page.tsx` | E2E RF-005 |
| RF-006 | Compartir | `ActionBar` (Web Share / portapapeles), `/app/<slug>`, `/?app=<slug>`, `startFeedAt` | unit `feed.test.ts`, E2E RF-006, TC-012 |
| RF-010 | Ejecutar miniapp | `MiniappViewer.tsx`, `miniapps/` | E2E TC-003 |
| RF-011 | Reiniciar demo | Remonta la sesión del iframe (`resetKey`) | E2E RF-011 |
| RF-012 | Aislar experiencias | sandbox sin `allow-same-origin`, CSP, `allow=""` | E2E TC-004 (fixture `escape`), headers |
| RF-013 | Permisos denegados por defecto | `allow=""`, `Permissions-Policy`, `app_versions.permissions` | E2E “sin capacidades extra”, unit catálogo |
| RF-014 | Estados de error | Timeout 10 s, error en runtime, reintentar/siguiente | E2E TC-005, TC-013 |
| RF-015 | Enlace externo | Ficha: `rel="noopener noreferrer"`, solo `https://` (CHECK en DB) | — (sin apps externas aún) |
| RF-020 | Exploración sin cuenta | Feed y ficha públicos; RLS `apps_read` | E2E TC-001, DB “anon sees 5” |
| RF-021 | Registro / login | `src/app/actions/auth.ts`, `/ingresar` | DB perfil creado; E2E modo sin configurar |
| RF-022 | Me gusta idempotente | `setLike(appId, liked)` + PK compuesta | DB TC-007 |
| RF-023 | Guardados | `saves` + `/guardados` | DB privacidad de guardados |
| RF-024 | Comentar | `CommentsSheet`, CHECK 1–500, trigger 5/min | unit `comments.test.ts`, DB TC-008 |
| RF-025 | Reportar | `ReportDialog`, `reports` solo legible por staff | DB “reporter cannot read” |
| RF-035 | Suspender/retirar | `admin_set_app_status`, `admin_set_version_status` | DB TC-011, TC-010; unit `isPubliclyRunnable` |
| RF-036 | Auditoría | `audit_log` append-only, sin políticas de escritura | DB “append-only” |
| RF-040 | Eventos de producto | `src/lib/client/analytics.ts`, `/api/events`, `app_events` | unit `events.test.ts`, E2E endpoint, DB |
| RF-042 | Feed editorial | `admin_set_feed_item`, `buildFeed` | unit `feed.test.ts` |
| RNF-005 | Aislamiento | `security-headers.mjs` | unit + E2E headers |
| RNF-007 | Accesibilidad | Botones con nombre accesible, foco visible, teclado, `prefers-reduced-motion`, `<dialog>` | E2E por rol/nombre |
| TC-015 | Acceso admin denegado | `/admin` valida rol en servidor; RLS | E2E, DB |

## Más allá del documento

- Idioma español/inglés y tema claro/oscuro/sistema (pedido de producto).
- RF-041 (panel de métricas, P1) incluido en versión básica: conteo por app y tipo de evento, 7 días.

## Backlog (P1/P2)

RF-004 categorías navegables · RF-016 integraciones de terceros · RF-026 perfil de creador · RF-030–034 portal de publicación (borradores, carga de paquetes, validación, revisión) · RF-043 recomendación · RF-050–053 creación con IA · RF-027 mensajería.
