# Arquitectura

## Vista general

```
                    ┌──────────────────────── Cloudflare Workers ────────────────────────┐
 Navegador          │                                                                   │
 ┌──────────────┐   │  Static assets (.open-next/assets)                                │
 │ Cliente web  │──▶│   ├─ /_next/static/*      (JS/CSS de la app)                       │
 │ (Next/React) │   │   └─ /miniapps/<slug>/<ver>/index.html   ← CSP sin red + sandbox  │
 │              │   │                                                                   │
 │  ┌────────┐  │   │  Worker (OpenNext)                                                │
 │  │ iframe │  │   │   ├─ middleware (edge): refresca la sesión de Supabase            │
 │  │sandbox │  │   │   ├─ páginas RSC: feed, ficha, ingresar, guardados, admin         │
 │  └────────┘  │   │   ├─ Server Actions: likes, guardados, comentarios, reportes, admin│
 └──────────────┘   │   └─ /api/events: ingesta de eventos                              │
                    └───────────────────────────────┬───────────────────────────────────┘
                                                    │ HTTPS (supabase-js, clave publicable + JWT del usuario)
                                          ┌─────────▼──────────┐
                                          │ Supabase           │
                                          │ Auth + PostgreSQL  │
                                          │ RLS + funciones    │
                                          └────────────────────┘
```

## Principios aplicados (§7.1)

- **Web-first, monolito modular.** Un solo proyecto Next.js con módulos claros; nada de microservicios.
- **Contratos explícitos.** Cliente ↔ miniapp: [`miniapp-contract.md`](api/miniapp-contract.md). Cliente ↔ backend: Server Actions tipadas + [`events.md`](api/events.md). Backend ↔ DB: vistas `public_feed`, `comment_feed` y funciones RPC.
- **Código no confiable aislado.** Ver [ADR 0004](adr/0004-miniapp-isolation.md) y [`security.md`](security.md).
- **Proveedores detrás de adaptadores.** Toda lectura pasa por `src/lib/data/*`; si Supabase no está configurado, se usa el catálogo local. Cambiar de proveedor afecta esa capa, no la UI.
- **Trazabilidad por app, versión, sesión y evento.** Cada evento lleva `appId`, `versionId` y una sesión seudónima.

## Módulos

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| Presentación | `src/app/**`, `src/components/**` | Rutas, UI, i18n, tema |
| Dominio | `src/lib/domain/**` | Reglas puras: qué es publicable, orden del feed, validación de comentarios, protocolo de miniapps, esquema de eventos |
| Acceso a datos | `src/lib/data/**`, `src/app/actions/**` | Lectura (DAL) y mutaciones; traduce filas ↔ tipos de dominio |
| Persistencia | `supabase/migrations/**` | Esquema, RLS, triggers de integridad, funciones admin |
| Runtime de miniapps | `miniapps/**` → `public/miniapps/**` | Fuente, SDK, bundles inmutables |

## Modelo de datos (§7.4)

| Entidad del documento | Implementación |
|---|---|
| users | `auth.users` (Supabase) + `profiles` (nombre visible, estado) |
| roles / user_roles | `user_roles` (`admin`, `moderator`, `creator`, `developer`) |
| apps | `apps` (slug, procedencia, estado, metadatos bilingües, acento, enlace externo) |
| app_versions | `app_versions` (versión, entry point, sha256, estado; inmutable salvo el estado) |
| app_permissions | Columna `app_versions.permissions` (lista cerrada; vacío = nada permitido) — ver ADR 0005 |
| feed_items | `feed_items` (posición, destacado) |
| sessions | Sesión seudónima del lado cliente (`sessionStorage`), registrada en cada evento |
| likes | `likes` (PK usuario+app) |
| collections / collection_items | `saves` (una colección implícita por usuario) — ver ADR 0005 |
| comments | `comments` (+ vista `comment_feed`) |
| reports | `reports` |
| app_events | `app_events` |
| review_records | `audit_log` (append-only) |

## Flujos clave

**Descubrir y probar.** `page.tsx` obtiene el feed (`getFeed` → `public_feed` + `app_stats` + likes/guardados propios) y lo renderiza. El visor monta el iframe del ítem activo y sus vecinos; la miniapp avisa `ready` por `postMessage`; si no llega en 10 s → timeout con reintento.

**Me gusta.** `setLike(appId, true|false)` fija el estado deseado (no alterna), así un reintento no duplica. La PK compuesta garantiza la unicidad.

**Suspender.** El admin llama `admin_set_app_status` → valida rol, exige motivo, cambia estado y escribe `audit_log` en la misma transacción. `public_feed` deja de incluir la app inmediatamente.
