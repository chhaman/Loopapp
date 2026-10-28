import type { Lang } from "@/lib/i18n/dictionaries";

export type Localized = Record<Lang, string>;

export const PROVENANCES = ["demo", "authorized_integration", "independent"] as const;
export type Provenance = (typeof PROVENANCES)[number];

export const APP_STATUSES = ["draft", "published", "suspended", "retired"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

export const VERSION_STATUSES = ["pending", "approved", "rejected", "suspended"] as const;
export type VersionStatus = (typeof VERSION_STATUSES)[number];

export const CATEGORIES = ["productivity", "finance", "design", "tools", "wellbeing"] as const;
export type Category = (typeof CATEGORIES)[number];

/** Capabilities a miniapp may request. All are denied unless explicitly approved (RF-013). */
export const PERMISSIONS = ["clipboard-write", "network"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type AppVersion = {
  id: string;
  version: string;
  /** Path of the immutable entry point, relative to the miniapp origin. */
  entryPath: string;
  sha256: string | null;
  status: VersionStatus;
  permissions: Permission[];
};

export type CatalogApp = {
  id: string;
  slug: string;
  name: Localized;
  tagline: Localized;
  description: Localized;
  creatorName: string;
  category: Category;
  provenance: Provenance;
  status: AppStatus;
  accent: string;
  externalUrl: string | null;
  version: AppVersion;
  feed: { position: number; featured: boolean } | null;
};

export type AppStats = { likes: number; comments: number };

export type FeedEntry = CatalogApp & {
  stats: AppStats;
  viewer: { liked: boolean; saved: boolean };
};
