# ADR 0001 — Stack: Next.js + Supabase + Cloudflare

- **Estado:** aceptada (27/10/2026)

## Contexto

El documento pide web-first, backend modular, PostgreSQL y autenticación, con un equipo chico que trabaja con asistencia de IA. Hosting pedido: Cloudflare.

## Decisión

- **Next.js 16 (App Router)** como monolito modular: UI + Server Actions + route handlers en un solo despliegue.
- **Supabase** para PostgreSQL gestionado, Auth (email + contraseña) y RLS. La autorización se expresa en SQL y se testea en CI.
- **Cloudflare Workers** mediante **OpenNext** (`@opennextjs/cloudflare`). Los assets estáticos (incluidas las miniapps) se sirven desde el CDN de Cloudflare.

## Alternativas descartadas

- *Frontend y API separados (NestJS):* más fiel a “backend”, pero duplica despliegues y contratos para un MVP.
- *Prisma + Postgres propio + Auth.js:* más control, más infraestructura a operar.
- *Cloudflare D1:* SQLite no ofrece RLS ni el ecosistema de auth de Supabase.

## Consecuencias

- Sin Supabase la app sigue funcionando en modo catálogo (útil para desarrollo y demos).
- Las variables `NEXT_PUBLIC_*` se fijan en build: cambiar de proyecto Supabase requiere redeploy.
