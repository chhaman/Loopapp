import type { CatalogApp } from "@/lib/domain/types";
import hashes from "./miniapp-hashes.json";

/**
 * Initial catalog: the five first-party demos (MVP objective 2.1).
 * Used directly when Supabase is not configured, and mirrored by supabase/seed.sql.
 * IDs are fixed so both sources agree.
 */
const CREATOR = "Equipo Loopapp";

function entry(slug: string, version: string) {
  const entryPath = `/miniapps/${slug}/${version}/index.html`;
  return { entryPath, sha256: (hashes as Record<string, string>)[entryPath] ?? null };
}

export const SEED_APPS: CatalogApp[] = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    slug: "foco",
    name: { es: "Foco", en: "Focus" },
    tagline: {
      es: "Temporizador Pomodoro: 25 minutos de foco, 5 de pausa.",
      en: "Pomodoro timer: 25 minutes of focus, 5 of rest.",
    },
    description: {
      es: "Alterná bloques de trabajo y descanso, saltá fases y llevá la cuenta de tus ciclos. Todo queda en tu pantalla: no se guarda nada.",
      en: "Alternate work and rest blocks, skip phases and keep count of your cycles. Everything stays on your screen: nothing is stored.",
    },
    creatorName: CREATOR,
    category: "productivity",
    provenance: "demo",
    status: "published",
    accent: "#FF5A47",
    externalUrl: null,
    version: {
      id: "00000000-0000-4000-b000-000000000001",
      version: "1.0.0",
      ...entry("foco", "1.0.0"),
      status: "approved",
      permissions: [],
    },
    feed: { position: 1, featured: true },
  },
  {
    id: "00000000-0000-4000-a000-000000000002",
    slug: "dividi-la-cuenta",
    name: { es: "Dividí la cuenta", en: "Split the bill" },
    tagline: {
      es: "Total, propina y personas: cuánto pone cada uno.",
      en: "Total, tip and people: how much each one pays.",
    },
    description: {
      es: "Ingresá el total, elegí la propina y cuántas personas son. Redondeá hacia arriba si no quieren andar con monedas.",
      en: "Enter the total, pick a tip and how many people are paying. Round up if nobody wants to deal with coins.",
    },
    creatorName: CREATOR,
    category: "finance",
    provenance: "demo",
    status: "published",
    accent: "#FFB830",
    externalUrl: null,
    version: {
      id: "00000000-0000-4000-b000-000000000002",
      version: "1.0.0",
      ...entry("dividi-la-cuenta", "1.0.0"),
      status: "approved",
      permissions: [],
    },
    feed: { position: 2, featured: false },
  },
  {
    id: "00000000-0000-4000-a000-000000000003",
    slug: "paletas",
    name: { es: "Paletas", en: "Palettes" },
    tagline: {
      es: "Generá paletas de color armónicas y bloqueá las que te gustan.",
      en: "Generate harmonious color palettes and lock the ones you like.",
    },
    description: {
      es: "Cinco colores por paleta con distintas armonías. Bloqueá un color para conservarlo mientras generás el resto.",
      en: "Five colors per palette with different harmonies. Lock a color to keep it while you regenerate the rest.",
    },
    creatorName: CREATOR,
    category: "design",
    provenance: "demo",
    status: "published",
    accent: "#7B6CF6",
    externalUrl: null,
    version: {
      id: "00000000-0000-4000-b000-000000000003",
      version: "1.0.0",
      ...entry("paletas", "1.0.0"),
      status: "approved",
      permissions: [],
    },
    feed: { position: 3, featured: false },
  },
  {
    id: "00000000-0000-4000-a000-000000000004",
    slug: "conversor",
    name: { es: "Conversor", en: "Converter" },
    tagline: {
      es: "Longitud, peso y temperatura al instante.",
      en: "Length, weight and temperature in an instant.",
    },
    description: {
      es: "Convertí entre unidades métricas e imperiales mientras escribís, e intercambiá origen y destino con un toque.",
      en: "Convert between metric and imperial units as you type, and swap source and target with one tap.",
    },
    creatorName: CREATOR,
    category: "tools",
    provenance: "demo",
    status: "published",
    accent: "#22C59A",
    externalUrl: null,
    version: {
      id: "00000000-0000-4000-b000-000000000004",
      version: "1.0.0",
      ...entry("conversor", "1.0.0"),
      status: "approved",
      permissions: [],
    },
    feed: { position: 4, featured: false },
  },
  {
    id: "00000000-0000-4000-a000-000000000005",
    slug: "respira",
    name: { es: "Respirá", en: "Breathe" },
    tagline: {
      es: "Respiración en caja 4-4-4-4 para bajar un cambio.",
      en: "4-4-4-4 box breathing to slow down.",
    },
    description: {
      es: "Seguí la animación: inhalá, sostené, exhalá y sostené, cuatro segundos cada fase. Ideal para un minuto de pausa.",
      en: "Follow the animation: inhale, hold, exhale and hold, four seconds each. Perfect for a one-minute break.",
    },
    creatorName: CREATOR,
    category: "wellbeing",
    provenance: "demo",
    status: "published",
    accent: "#4FB3FF",
    externalUrl: null,
    version: {
      id: "00000000-0000-4000-b000-000000000005",
      version: "1.0.0",
      ...entry("respira", "1.0.0"),
      status: "approved",
      permissions: [],
    },
    feed: { position: 5, featured: false },
  },
];
