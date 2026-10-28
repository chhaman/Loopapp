# Loopapp

**Descubrí apps probándolas.** Loopapp es una plataforma web-first donde el usuario recorre un feed vertical —como una red de videos cortos— pero cada elemento es una **miniapp interactiva** que se puede usar al instante, sin instalar nada y sin registrarse.

Este repositorio implementa el MVP descrito en el *Documento de Requerimientos — Plataforma de Miniapps v0.1* (ver [`docs/requirements.md`](docs/requirements.md)).

| | |
|---|---|
| **Frontend + backend** | Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS 4 |
| **Datos y auth** | Supabase (PostgreSQL + Auth email/contraseña + RLS) — opcional en desarrollo |
| **Hosting** | Cloudflare Workers vía [OpenNext](https://opennext.js.org/cloudflare) |
| **Miniapps** | HTML autocontenido, versionado e inmutable, ejecutado en `<iframe sandbox>` con CSP sin red |
| **Tests** | Vitest (unitarios), SQL/pgTAP-style (RLS), Playwright (E2E desktop + mobile) |

## Qué incluye el MVP

- Feed vertical con scroll-snap, teclado (↑/↓, j/k) y botones como alternativa al gesto; precarga de la siguiente miniapp.
- Visor aislado con estados de carga, error, timeout, reintento y **reinicio de demo**.
- Cinco miniapps propias: **Foco** (Pomodoro), **Dividí la cuenta**, **Paletas**, **Conversor** y **Respirá**.
- Ficha de cada app (procedencia, versión, permisos) y **enlaces compartibles** estables (`/app/<slug>`).
- Cuentas con email + contraseña: **me gusta**, **guardados**, **comentarios** (con límite de frecuencia) y **reportes**.
- **Panel de administración**: orden editorial y destacados, suspender/retirar/publicar, moderación de reportes, auditoría inmutable y métricas de los últimos 7 días.
- Analítica de producto seudónima (impresión, inicio de prueba, interacción, salida, error, compartir).
- **Español / inglés** y **tema claro / oscuro / sistema**, recordados por cookie.
- Identidad de marca propia: ver [`docs/brand.md`](docs/brand.md).

## Empezar

Requisitos: Node.js 22+.

```bash
npm install
npm run dev          # http://localhost:3000
```

Sin variables de entorno la app funciona en **modo catálogo**: el feed, las miniapps, la ficha y los enlaces funcionan; las acciones que requieren cuenta explican que las cuentas no están habilitadas. Para habilitarlas, conectá Supabase (abajo).

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | Todo lo rápido: bundles al día, lint, typecheck y unit tests |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright; levanta el servidor solo) |
| `npm run test:db` | Migraciones + seed + tests de RLS contra un PostgreSQL (ver [`docs/testing.md`](docs/testing.md)) |
| `npm run miniapps:build` | Re-empaqueta las miniapps de `miniapps/` en `public/miniapps/` y recalcula hashes y `_headers` |
| `npm run db:seed:generate` | Regenera `supabase/seed.sql` desde el catálogo |
| `npm run preview` | Build de Cloudflare + `wrangler dev` (runtime real de Workers en local) |
| `npm run deploy` | Build + deploy a Cloudflare Workers |

## Conectar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutá en orden:
   - [`supabase/migrations/20261027000000_init.sql`](supabase/migrations/20261027000000_init.sql)
   - [`supabase/seed.sql`](supabase/seed.sql)

   (o con la CLI: `supabase link` + `supabase db push` + `psql -f supabase/seed.sql`).
3. Copiá `.env.example` a `.env.local` y completá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (*Project Settings → API*).
4. En **Authentication → URL Configuration** agregá tu dominio (y `http://localhost:3000`) como *Site URL / Redirect URLs*.
5. Creá tu cuenta desde `/ingresar` y convertite en admin ejecutando en el SQL Editor:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'tu-email@ejemplo.com';
   ```

## Deploy en Cloudflare

Resumen (detalle en [`docs/deploy.md`](docs/deploy.md)):

1. Creá un API token de Cloudflare con el template **Edit Cloudflare Workers**.
2. En GitHub → *Settings → Secrets and variables → Actions* agregá los secrets `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`, y (cuando tengas Supabase) las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Cada push a `main` que pase CI se despliega solo. También podés lanzarlo a mano desde *Actions → Deploy to Cloudflare*.

## Estructura

```
miniapps/            Fuente de las miniapps (SDK y estilos compartidos + una carpeta por app)
public/miniapps/     Bundles generados, versionados e inmutables (no editar a mano)
src/app/             Rutas: feed, /app/[slug], /ingresar, /guardados, /admin, /api/events
src/components/      UI (feed, visor aislado, acciones, diálogos)
src/lib/domain/      Reglas de dominio puras y testeadas (feed, comentarios, protocolo, eventos)
src/lib/data/        Capa de acceso a datos (Supabase o catálogo local)
supabase/            Migraciones, seed y tests de RLS
tests/               unit/ (Vitest) y e2e/ (Playwright)
docs/                Requerimientos, arquitectura, ADRs, seguridad, testing, marca, deploy
```

## Documentación

- [Requerimientos y trazabilidad](docs/requirements.md)
- [Arquitectura](docs/architecture.md) y [decisiones (ADR)](docs/adr/)
- [Seguridad](docs/security.md)
- [Testing](docs/testing.md)
- [Contrato de miniapps](docs/api/miniapp-contract.md) y [API de eventos](docs/api/events.md)
- [Marca](docs/brand.md)
- [Deploy](docs/deploy.md)
