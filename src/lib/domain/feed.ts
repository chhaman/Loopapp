import type { CatalogApp } from "./types";

/** An app may be executed publicly only if it is published AND its version is approved (RF-035, TC-010). */
export function isPubliclyRunnable(app: Pick<CatalogApp, "status" | "version">): boolean {
  return app.status === "published" && app.version.status === "approved";
}

/**
 * Editorial feed (RF-042): runnable apps that have a feed slot,
 * featured first, then by position, then by slug for a stable order.
 */
export function buildFeed<T extends CatalogApp>(apps: readonly T[]): T[] {
  return apps
    .filter((app) => isPubliclyRunnable(app) && app.feed !== null)
    .sort((a, b) => {
      const fa = a.feed!;
      const fb = b.feed!;
      if (fa.featured !== fb.featured) return fa.featured ? -1 : 1;
      if (fa.position !== fb.position) return fa.position - fb.position;
      return a.slug.localeCompare(b.slug);
    });
}

/** Moves the requested app to the front so shared links open the right experience (RF-006). */
export function startFeedAt<T extends { slug: string }>(feed: readonly T[], slug: string | undefined): T[] {
  if (!slug) return [...feed];
  const index = feed.findIndex((item) => item.slug === slug);
  if (index <= 0) return [...feed];
  return [...feed.slice(index), ...feed.slice(0, index)];
}
