# ADR 0005 — Simplificaciones del modelo de datos del MVP

- **Estado:** aceptada (27/10/2026)

## Decisión

- **`app_permissions` → `app_versions.permissions`**: los permisos se declaran por versión (inmutable) como lista cerrada (`clipboard-write`, `network`). Ninguna demo pide permisos. Se separará en tabla cuando exista aprobación por permiso (RF-030+).
- **`collections` → `saves`**: una colección implícita por usuario cubre RF-023 (“colección personal básica”). Migrar a colecciones con nombre agregando `collections` y moviendo `saves` a `collection_items`.
- **`review_records` → `audit_log`**: toda decisión administrativa (estado de app/versión, feed, reportes) queda en una tabla append-only con actor, fecha, motivo y payload.
- **`sessions`**: la sesión de prueba es seudónima y vive en el cliente; se registra como `session_id` en cada evento, sin vínculo con la cuenta.
