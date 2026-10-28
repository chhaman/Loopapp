# Testing

| Nivel | Herramienta | Dónde | Comando |
|---|---|---|---|
| Unitarias (dominio) | Vitest | `tests/unit/` | `npm test` |
| Contrato | Vitest | `tests/unit/catalog.test.ts`, `miniapp-protocol.test.ts`, `events.test.ts`, `i18n.test.ts` | `npm test` |
| Integración DB / seguridad | SQL sobre PostgreSQL 16 | `supabase/tests/rls_test.sql` | `npm run test:db` |
| E2E (desktop + mobile) | Playwright | `tests/e2e/` | `npm run test:e2e` |
| Seguridad del sandbox | Playwright + fixtures | `tests/e2e/security.spec.ts`, `miniapps/fixtures/` | `npm run test:e2e` |

CI (`.github/workflows/ci.yml`) corre los tres niveles en cada PR y en `main`, más `npm audit` (dependencias de producción) y el build de Cloudflare.

## Tests de base de datos

`scripts/test-db.sh` crea una base `loop_test`, aplica un *stub* mínimo del esquema `auth` de Supabase (`supabase/tests/auth-stub.sql`), las migraciones, los grants por defecto de Supabase y el seed, y ejecuta `rls_test.sql` en una transacción. Cada aserción imprime `ok - …`; la primera que falla corta con error.

Local con Docker:

```bash
docker run -d --name loop-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres npm run test:db
```

## E2E

- Por defecto levanta `next dev` en el puerto 3100. Con `E2E_PROD=1` usa `next start` (hacer `npm run build` antes, con `NEXT_PUBLIC_ENABLE_TEST_HARNESS=1`).
- Con `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8787` corre contra un servidor existente, por ejemplo `npm run preview` (runtime real de Workers).
- `/test-harness?fixture=broken|escape` solo existe con `NEXT_PUBLIC_ENABLE_TEST_HARNESS=1` (nunca en producción).
- Los tests no necesitan Supabase: cubren el modo anónimo. Los flujos con cuenta están cubiertos a nivel DB; agregar E2E con cuenta cuando exista un proyecto Supabase de staging.

## Casos del documento (§9.2)

| Caso | Cobertura |
|---|---|
| TC-001 Visitante abre la plataforma | E2E `feed.spec.ts` |
| TC-002 Desliza a la siguiente | E2E (botón y teclado) |
| TC-003 Miniapp ejecuta interacción | E2E (Foco: Empezar → Pausar) |
| TC-004 Miniapp intenta leer el token | E2E fixture `escape` |
| TC-005 Miniapp lanza excepción | E2E fixture `broken` |
| TC-006 Guardar sin cuenta | E2E (diálogo + `next=` conservado) |
| TC-007 Like dos veces | DB |
| TC-008 Comentario vacío/largo | unit + DB |
| TC-009 Paquete no admitido | `npm run miniapps:check` + unit catálogo (tamaño, recursos externos). Portal de carga: P1 |
| TC-010 Versión no aprobada | unit `isPubliclyRunnable` + DB |
| TC-011 Admin suspende versión | DB (feed + auditoría) |
| TC-012 Enlace a app retirada | E2E + DB |
| TC-013 Falla de red | E2E (request abortado → timeout → reintentar) |
| TC-014 Navegación repetida | E2E TC-002 (ida y vuelta); medición de rendimiento pendiente |
| TC-015 Acceso admin sin permiso | E2E + DB |

## Criterios de salida (§9.3) — estado

- [x] Requerimientos MVP implementados vinculados a pruebas ([matriz](requirements.md)).
- [x] Controles básicos de aislamiento y autorización pasan.
- [x] Retirada de contenido verificada (DB).
- [ ] Matriz de dispositivos/navegadores acordada (hoy: Chromium desktop + Pixel 7).
- [ ] Métricas de error/rendimiento en producción (Workers Observability activado; falta tablero).
- [ ] Restauración de backups probada (Supabase PITR según plan).
