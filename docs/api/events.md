# API de eventos — `POST /api/events`

Ingesta de eventos de producto (RF-040). Pública (también anónima), solo escritura.

```http
POST /api/events
Content-Type: application/json

{
  "events": [
    {
      "type": "impression",
      "appId": "00000000-0000-4000-a000-000000000001",
      "versionId": "00000000-0000-4000-b000-000000000001",
      "sessionId": "8c7c2c55-41a6-4f63-9a4a-3d2b1c0e9f00",
      "at": "2026-10-27T12:00:00.000Z",
      "props": { "dwellMs": 5400 }
    }
  ]
}
```

| Campo | Regla |
|---|---|
| `type` | `impression`, `trial_start`, `interaction`, `exit`, `error`, `external_link_open`, `share` |
| `sessionId` | 8–64 caracteres `[a-zA-Z0-9-]`, aleatorio por pestaña |
| `at` | ISO 8601; la DB rechaza eventos de más de 1 día o futuros (> 5 min) |
| `props` | ≤ 10 claves, valores string (≤ 200), número o booleano |
| lote | 1–50 eventos, ≤ 32 KB |

Respuestas: `202` aceptado (también sin Supabase configurado, se descarta), `400` inválido, `413` demasiado grande, `422` rechazado por la DB.

| Evento | Cuándo lo emite el cliente |
|---|---|
| `impression` | Un ítem queda activo en el feed |
| `trial_start` | Primera interacción con la miniapp en esa carga |
| `interaction` | Primera vez de cada nombre de interacción en esa carga |
| `exit` | El ítem deja de estar activo (`props.dwellMs`) |
| `error` | Timeout o error de runtime (`props.kind`) |
| `share` | Botón compartir |
