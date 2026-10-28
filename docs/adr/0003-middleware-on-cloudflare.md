# ADR 0003 — `middleware.ts` (edge) en lugar de `proxy.ts`

- **Estado:** aceptada (27/10/2026)

## Contexto

Supabase SSR necesita refrescar el token de sesión antes de renderizar, porque los Server Components no pueden escribir cookies. En Next.js 16 `middleware` está deprecado en favor de `proxy`, pero `proxy` corre siempre en runtime Node.js. OpenNext para Cloudflare marca el soporte de middleware Node como **experimental**; el middleware edge es el camino soportado.

## Decisión

Mantener `src/middleware.ts` (runtime edge), como indica la guía de migración de Next 16 para quien necesita edge. El build muestra un aviso de deprecación; es esperado.

## Consecuencias

- Revisar cuando OpenNext declare estable el soporte de `proxy`: el cambio es renombrar archivo y función.
- El matcher excluye `/miniapps/`, `/_next/static`, `/brand/` y `/api/events` para no tocar Supabase en requests que no lo necesitan.
