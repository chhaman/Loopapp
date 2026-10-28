import "server-only";
import { SEED_APPS } from "@/lib/catalog/seed";
import { buildFeed, isPubliclyRunnable } from "@/lib/domain/feed";
import type { AppStats, CatalogApp, FeedEntry, Permission } from "@/lib/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./auth";

type FeedRow = {
  id: string;
  slug: string;
  provenance: CatalogApp["provenance"];
  category: CatalogApp["category"];
  name: CatalogApp["name"];
  tagline: CatalogApp["tagline"];
  description: CatalogApp["description"];
  creator_name: string;
  accent: string;
  external_url: string | null;
  status: CatalogApp["status"];
  version_id: string;
  version: string;
  entry_path: string;
  sha256: string | null;
  version_status: CatalogApp["version"]["status"];
  permissions: Permission[];
  position: number | null;
  featured: boolean | null;
};

function rowToApp(row: FeedRow): CatalogApp {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    creatorName: row.creator_name,
    category: row.category,
    provenance: row.provenance,
    status: row.status,
    accent: row.accent,
    externalUrl: row.external_url,
    version: {
      id: row.version_id,
      version: row.version,
      entryPath: row.entry_path,
      sha256: row.sha256,
      status: row.version_status,
      permissions: row.permissions ?? [],
    },
    feed: row.position === null ? null : { position: row.position, featured: Boolean(row.featured) },
  };
}

const NO_STATS: AppStats = { likes: 0, comments: 0 };

async function enrich(apps: CatalogApp[]): Promise<FeedEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || apps.length === 0) {
    return apps.map((app) => ({ ...app, stats: NO_STATS, viewer: { liked: false, saved: false } }));
  }
  const ids = apps.map((a) => a.id);
  const user = await getCurrentUser();
  const [stats, likes, saves] = await Promise.all([
    supabase.rpc("app_stats", { app_ids: ids }),
    user ? supabase.from("likes").select("app_id").in("app_id", ids) : Promise.resolve({ data: [] }),
    user ? supabase.from("saves").select("app_id").in("app_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const statsById = new Map<string, AppStats>(
    ((stats.data ?? []) as { app_id: string; likes: number; comments: number }[]).map((s) => [
      s.app_id,
      { likes: Number(s.likes), comments: Number(s.comments) },
    ]),
  );
  const liked = new Set((likes.data ?? []).map((r: { app_id: string }) => r.app_id));
  const saved = new Set((saves.data ?? []).map((r: { app_id: string }) => r.app_id));
  return apps.map((app) => ({
    ...app,
    stats: statsById.get(app.id) ?? NO_STATS,
    viewer: { liked: liked.has(app.id), saved: saved.has(app.id) },
  }));
}

async function loadRunnableApps(): Promise<CatalogApp[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return SEED_APPS.filter(isPubliclyRunnable);
  const { data, error } = await supabase.from("public_feed").select("*");
  if (error) throw new Error(`Could not load the catalog: ${error.message}`);
  return (data as FeedRow[]).map(rowToApp).filter(isPubliclyRunnable);
}

export async function getFeed(): Promise<FeedEntry[]> {
  return enrich(buildFeed(await loadRunnableApps()));
}

/** Only publicly runnable apps resolve; retired/suspended ones return null (TC-012). */
export async function getAppBySlug(slug: string): Promise<FeedEntry | null> {
  const app = (await loadRunnableApps()).find((a) => a.slug === slug);
  return app ? (await enrich([app]))[0] : null;
}

export async function getSavedApps(): Promise<FeedEntry[] | null> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return null;
  const { data } = await supabase.from("saves").select("app_id").order("created_at", { ascending: false });
  const order = (data ?? []).map((r) => r.app_id as string);
  const apps = await loadRunnableApps();
  const byId = new Map(apps.map((a) => [a.id, a]));
  return enrich(order.map((id) => byId.get(id)).filter((a): a is CatalogApp => Boolean(a)));
}
