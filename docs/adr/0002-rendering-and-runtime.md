# ADR 0002 — Renderizado dinámico, sin Cache Components

- **Estado:** aceptada (27/10/2026)

## Contexto

Next.js 16 trae `cacheComponents` (prerender + streaming, `use cache`). Todas nuestras páginas leen cookies por request (idioma, tema, sesión de Supabase) y el feed depende del usuario (me gusta/guardados).

## Decisión

`cacheComponents` desactivado. Las páginas se renderizan por request (`ƒ` en el build). No se usa caché incremental, por lo que OpenNext no necesita bucket R2.

## Consecuencias

- Simplicidad: no hay que envolver cada lectura de sesión en `<Suspense>` ni razonar sobre caché por usuario.
- Coste: cada visita consulta Supabase. Si el tráfico lo justifica, cachear el catálogo público (`use cache` + `cacheTag('catalog')` invalidado desde las acciones admin) y agregar R2 en `open-next.config.ts`.
