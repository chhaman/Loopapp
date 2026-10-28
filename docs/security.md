# Seguridad

## Modelo de amenazas (resumen)

| Amenaza | Activo | Mitigación | Verificación |
|---|---|---|---|
| Miniapp roba la sesión o datos del usuario | Cookies, storage, DOM | Sandbox con origen opaco, CSP, `allow=""` ([ADR 0004](adr/0004-miniapp-isolation.md)) | E2E TC-004 |
| Miniapp exfiltra datos por red | Lo que se escriba en la miniapp | `connect-src 'none'`, `form-action 'none'`, sin `allow-popups` ni `allow-top-navigation` | headers (unit + E2E) |
| Miniapp suplanta mensajes al host | Analítica, UI | Se aceptan solo mensajes del `contentWindow` propio, con esquema validado | unit `miniapp-protocol.test.ts` |
| Usuario actúa como otro | likes, comentarios, reportes | RLS `user_id = auth.uid()` | DB tests |
| Usuario sin rol usa funciones admin | catálogo, auditoría | `has_role('admin')` dentro de cada función `SECURITY DEFINER`; `/admin` valida en servidor | DB + E2E TC-015 |
| Alteración de la auditoría | `audit_log` | Sin políticas de escritura + trigger append-only | DB tests |
| Versión publicada cambia en silencio | Código ejecutado | `app_versions` inmutable (trigger) + `sha256` | DB + unit catálogo |
| Spam de comentarios | Moderación | CHECK de longitud + trigger 5/min + reportes | DB TC-008 |
| Open redirect tras login | Usuario | `safeNextPath` solo acepta rutas relativas | unit |
| Clickjacking de la app | Usuario | `X-Frame-Options: DENY`, `frame-ancestors 'none'` | E2E |
| Abuso del endpoint de eventos | DB | Validación zod, tope 32 KB / 50 eventos, ventana temporal en RLS | unit + E2E + DB |
| Enumeración de cuentas | Emails | Mismo error para email inexistente y contraseña errónea | revisión |

## Secretos

- No hay secretos en el repo ni en el cliente. La clave publicable de Supabase es pública por diseño; los datos los protege RLS.
- La *service role key* de Supabase **no se usa** en la app. Si alguna vez hace falta (jobs), debe vivir como secret de Cloudflare (`wrangler secret put`) y nunca con prefijo `NEXT_PUBLIC_`.
- Secrets de deploy (`CLOUDFLARE_API_TOKEN`) solo en GitHub Actions, en el environment `production`.

## Privacidad (RNF-006)

- Eventos: `session_id` aleatorio por pestaña, sin user id, sin IP, sin texto libre de la miniapp (nombres de interacción restringidos a `[a-z0-9:_-]{1,40}`).
- La miniapp no recibe ningún dato del usuario.
- Pendiente antes del piloto (DP-08, DP-13): política de privacidad, consentimiento de analítica, retención de `app_events` y borrado de cuenta (hoy: borrar en `auth.users` elimina en cascada perfil, likes, guardados, comentarios y reportes).

## Respuesta a incidentes

1. **Miniapp vulnerable o maliciosa:** en `/admin` → *Suspender* con motivo (sale del feed al instante y queda auditado). Para una versión concreta: `select admin_set_version_status('<version_id>', 'suspended', '<motivo>');`
2. **Comentario abusivo:** resolver el reporte con *Ocultar comentario*.
3. **Cuenta comprometida:** suspender el perfil (`profiles.status = 'suspended'` impide comentar) y revocar sesiones desde Supabase Auth.
4. Revisar `audit_log` y los logs del Worker (Cloudflare → Workers → loopapp → Logs).

## Antes de abrir publicación a terceros

- Servir miniapps desde un **origen separado** (`NEXT_PUBLIC_MINIAPP_ORIGIN`).
- Validación automática de paquetes (tamaño, sin recursos externos, hash) en el portal de publicación (RF-031/032).
- Pruebas de escape del sandbox ampliadas y revisión externa.
- Condiciones de uso, reglas de marca y procedimiento de apelación (§8).
