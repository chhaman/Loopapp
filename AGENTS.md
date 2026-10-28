<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Loopapp — guía para agentes y colaboradores

Producto: feed vertical de miniapps interactivas (ver `README.md` y `docs/requirements.md`).

## Reglas del proyecto

- **Una historia por cambio.** Cambios chicos, con tests, y referenciando el requerimiento (`RF-xxx`, `TC-xxx`) en el commit o PR.
- **La autorización vive en la base de datos** (RLS + funciones `SECURITY DEFINER` en `supabase/migrations/`). Nunca dependas solo de ocultar un botón. Todo cambio de permisos lleva un test en `supabase/tests/rls_test.sql`.
- **Las miniapps son código no confiable.** No agregues `allow-same-origin` al sandbox, no relajes la CSP de `/miniapps/*` (`security-headers.mjs`) y no le pases datos del usuario por la URL. Ver `docs/security.md`.
- **Versiones inmutables.** No edites `public/miniapps/**` a mano: editá `miniapps/` y corré `npm run miniapps:build`. Si cambia un bundle, cambia su hash: corré `npm run db:seed:generate`. Para un cambio publicado, creá una versión nueva (carpeta nueva) en vez de pisar la existente.
- **Textos de UI** siempre en `src/lib/i18n/dictionaries.ts`, en español y en inglés (el test de i18n lo verifica).
- **Colores** solo vía tokens de `src/app/globals.css` (`bg-surface`, `text-muted`, `bg-accent`…), nunca hex sueltos en componentes (excepto el acento propio de cada app).
- Sin secretos en el repo. Las variables `NEXT_PUBLIC_*` son públicas por definición.

## Antes de dar algo por terminado

```bash
npm run check        # bundles al día + lint + typecheck + unit
npm run test:e2e     # flujos principales y aislamiento
npm run test:db      # si tocaste supabase/ (necesita PostgreSQL)
```

## Decisiones técnicas que conviene conocer

- `src/middleware.ts` es *edge middleware* a propósito (no `proxy.ts`): ver `docs/adr/0003-middleware-on-cloudflare.md`.
- `cacheComponents` está desactivado: todas las páginas son dinámicas (sesión + preferencias). Ver `docs/adr/0002-rendering-and-runtime.md`.
- Sin Supabase configurado, la app cae al catálogo de `src/lib/catalog/seed.ts`.
