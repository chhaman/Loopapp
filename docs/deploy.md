# Deploy en Cloudflare Workers

La app se compila con [OpenNext](https://opennext.js.org/cloudflare) a un Worker (`.open-next/worker.js`) más assets estáticos. Config: [`wrangler.jsonc`](../wrangler.jsonc), [`open-next.config.ts`](../open-next.config.ts).

## Opción A — GitHub Actions (recomendada, ya configurada)

`.github/workflows/deploy.yml` despliega `main` **solo si CI pasó** (lint, typecheck, unit, DB, E2E). Mientras no haya credenciales, el job se saltea con un aviso.

1. **Cuenta de Cloudflare:** creá una (gratis alcanza para empezar).
2. **Account ID:** Cloudflare dashboard → *Workers & Pages* → columna derecha *Account ID*.
3. **API token:** *My Profile → API Tokens → Create Token →* template **Edit Cloudflare Workers** → limitá a tu cuenta → crear.
4. **GitHub:** repo → *Settings → Secrets and variables → Actions*:
   - *Secrets*: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - *Variables* (cuando tengas Supabase): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Hacé merge a `main` (o *Actions → Deploy to Cloudflare → Run workflow*). La app queda en `https://loopapp.<tu-subdominio>.workers.dev`.

> Las variables `NEXT_PUBLIC_*` se fijan **en el build**: si las cambiás, volvé a desplegar.

## Opción B — desde tu máquina

```bash
npx wrangler login
npm run deploy           # build OpenNext + wrangler deploy
```

## Dominio propio

Cloudflare → *Workers & Pages → loopapp → Settings → Domains & Routes → Add → Custom domain* (el dominio tiene que estar en Cloudflare). Agregá el dominio en Supabase → *Authentication → URL Configuration*.

### Origen separado para miniapps (recomendado antes de abrir a terceros)

1. Creá un segundo dominio/subdominio (p. ej. `apps.tudominio.com`) que sirva la carpeta `public/miniapps/` con los mismos headers (`public/_headers`).
2. Configurá `NEXT_PUBLIC_MINIAPP_ORIGIN=https://apps.tudominio.com` y en `security-headers.mjs` cambiá `frame-ancestors 'self'` por el origen de la app.

## Probar el runtime de Workers en local

```bash
npm run preview          # http://localhost:8787
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8787 npx playwright test --project=desktop
```

## Observabilidad

`observability.enabled` está activo en `wrangler.jsonc`: logs y trazas en Cloudflare → *Workers → loopapp → Observability*. Los errores de ingesta de eventos se registran como JSON estructurado sin datos personales.
