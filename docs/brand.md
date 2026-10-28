# Marca Loopapp

## Idea

**Loopapp = probar → seguir.** El producto es un bucle: probás una app, pasás a la siguiente, volvés a las que te gustaron. La marca es cálida, directa y un poco juguetona: habla de vos, no de “usuarios”.

- **Nombre:** Loopapp (siempre así; el wordmark va en minúsculas: `loopapp`).
- **Tagline:** *Descubrí apps probándolas.* / *Discover apps by trying them.*
- **Tono:** cercano (voseo rioplatense en español), frases cortas, verbos de acción (“Probá”, “Guardá”, “Seguí explorando”). Nada de jerga técnica en la UI.

## Logo

| Archivo | Uso |
|---|---|
| [`public/brand/loopapp-mark.svg`](../public/brand/loopapp-mark.svg) | Isotipo (favicon, avatar, ícono de app) |
| [`public/brand/loopapp-logo.svg`](../public/brand/loopapp-logo.svg) | Isotipo + wordmark |
| `src/components/Logo.tsx` | Versión en código (usa los tokens, se adapta al tema) |

**El isotipo:** una “ficha” de app (cuadrado redondeado coral) con un **loop** que rodea un **play**: probar algo y seguir al siguiente. El punto al final del trazo es la “cabeza” del loop, el instante en el que estás.

Reglas:
- Área de respeto: ¼ del lado del isotipo alrededor.
- Tamaño mínimo: 16 px (favicon), 24 px en UI.
- El trazo y el play siempre en **Ink** sobre **Coral**. No invertir, no rotar, no usar degradados.
- Wordmark en Bricolage Grotesque ExtraBold, tracking −2 %.

## Paleta

| Token | Hex | Rol |
|---|---|---|
| **Coral** | `#FF5A47` | Color de marca, acción principal, isotipo |
| **Ink** | `#16131F` | Texto en claro, texto sobre coral, trazo del logo |
| **Paper** | `#FBF8F3` | Fondo claro (cálido, no blanco puro) |
| **Mint** | `#22C59A` | Éxito, pausa/descanso, acento secundario |
| **Sun** | `#FFB830` | Destacados, guardados |
| **Iris** | `#7B6CF6` | Foco de teclado, acento terciario |

### Tokens por tema (`src/app/globals.css`)

| Token | Claro | Oscuro |
|---|---|---|
| `--bg` | `#FBF8F3` | `#0F0D16` |
| `--surface` | `#FFFFFF` | `#1A1724` |
| `--surface-2` | `#F3EEE6` | `#242031` |
| `--border` | `#E6DFD4` | `#322D42` |
| `--text` | `#16131F` | `#F4F1EC` |
| `--text-muted` | `#615B6E` | `#AAA4B8` |
| `--accent` | `#FF5A47` | `#FF6B59` |
| `--accent-strong` (links) | `#C93422` | `#FF8A7C` |
| `--success` | `#12825F` | `#3DDBB0` |
| `--danger` | `#C42B2B` | `#FF7A7A` |
| `--focus` | `#7B6CF6` | `#A99FFB` |

### Contraste (WCAG 2.1)

| Combinación | Claro | Oscuro |
|---|---|---|
| Texto / fondo | 17.3 : 1 | 17.1 : 1 |
| Texto secundario / fondo | 6.1 : 1 | 8.0 : 1 |
| Ink sobre coral (botones) | 5.9 : 1 | 6.5 : 1 |
| Link (`accent-strong`) / fondo | 5.0 : 1 | 8.4 : 1 |
| Éxito / fondo | 4.5 : 1 | 11.0 : 1 |

⚠️ **Nunca texto blanco sobre coral** (3.1 : 1, no cumple AA). Los botones primarios usan Ink sobre Coral.

## Tipografía

- **Display:** [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) 700/800 — títulos, wordmark, nombres de apps.
- **Texto:** [Inter](https://fonts.google.com/specimen/Inter) — interfaz y lectura.
- Cargadas con `next/font` (self-hosted en el build, sin requests a Google en runtime).

## Formas y movimiento

- Radios generosos: botones en píldora, tarjetas 24–28 px, ícono 18/64.
- Cada miniapp tiene su **color de acento** (borde/halo del visor y avatar). Las cinco demos: Coral (Foco), Sun (Dividí la cuenta), Iris (Paletas), Mint (Conversor), Sky `#4FB3FF` (Respirá).
- Movimiento corto y funcional (fade del visor, scroll con snap). Respeta `prefers-reduced-motion`.

## Temas

Claro, oscuro y **sistema** (por defecto). El tema elegido se guarda en la cookie `loop_theme` y se le pasa a cada miniapp (`?theme=`), que usa los mismos tokens desde `miniapps/shared/base.css`.
