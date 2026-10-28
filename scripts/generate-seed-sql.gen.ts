import { test } from "vitest";
import { writeFileSync } from "node:fs";
import { SEED_APPS } from "@/lib/catalog/seed";
const q = (s: string) => `'${s.replaceAll("'", "''")}'`;
const j = (o: unknown) => `${q(JSON.stringify(o))}::jsonb`;
// Regenerates supabase/seed.sql from the catalog. Run: npm run db:seed:generate
test("generate supabase/seed.sql", () => {
  let sql = `-- Seed data: the five first-party demo miniapps.\n-- Mirrors src/lib/catalog/seed.ts (checked by tests/unit/seed-sql.test.ts).\n\n`;
  for (const a of SEED_APPS) {
    sql += `insert into public.apps (id, slug, provenance, status, category, name, tagline, description, creator_name, accent, external_url)\nvalues (${q(a.id)}, ${q(a.slug)}, ${q(a.provenance)}, ${q(a.status)}, ${q(a.category)},\n  ${j(a.name)},\n  ${j(a.tagline)},\n  ${j(a.description)},\n  ${q(a.creatorName)}, ${q(a.accent)}, ${a.externalUrl ? q(a.externalUrl) : "null"});\n`;
    const v = a.version;
    sql += `insert into public.app_versions (id, app_id, version, entry_path, sha256, status, permissions, approved_at)\nvalues (${q(v.id)}, ${q(a.id)}, ${q(v.version)}, ${q(v.entryPath)}, ${v.sha256 ? q(v.sha256) : "null"}, ${q(v.status)}, '{}', now());\n`;
    sql += `update public.apps set current_version_id = ${q(v.id)} where id = ${q(a.id)};\n`;
    if (a.feed) sql += `insert into public.feed_items (app_id, position, featured) values (${q(a.id)}, ${a.feed.position}, ${a.feed.featured});\n`;
    sql += "\n";
  }
  writeFileSync("supabase/seed.sql", sql);
});
