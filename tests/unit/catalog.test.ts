import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SEED_APPS } from "@/lib/catalog/seed";
import { CATEGORIES, PROVENANCES } from "@/lib/domain/types";
import { miniappHeaders } from "../../security-headers.mjs";

const root = join(__dirname, "../..");

describe("seed catalog (miniapp contract §7.3)", () => {
  it("has five demo apps with unique ids and slugs", () => {
    expect(SEED_APPS).toHaveLength(5);
    expect(new Set(SEED_APPS.map((a) => a.id)).size).toBe(5);
    expect(new Set(SEED_APPS.map((a) => a.slug)).size).toBe(5);
    expect(new Set(SEED_APPS.map((a) => a.version.id)).size).toBe(5);
  });

  for (const app of SEED_APPS) {
    describe(app.slug, () => {
      const file = join(root, "public", app.version.entryPath);

      it("has complete, bilingual metadata", () => {
        for (const field of [app.name, app.tagline, app.description]) {
          expect(field.es.trim()).not.toBe("");
          expect(field.en.trim()).not.toBe("");
        }
        expect(CATEGORIES).toContain(app.category);
        expect(PROVENANCES).toContain(app.provenance);
        expect(app.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(app.version.permissions).toEqual([]);
      });

      it("points to an immutable, versioned bundle whose hash matches", () => {
        expect(app.version.entryPath).toBe(`/miniapps/${app.slug}/${app.version.version}/index.html`);
        const content = readFileSync(file);
        expect(statSync(file).size).toBeLessThan(200 * 1024);
        expect(createHash("sha256").update(content).digest("hex")).toBe(app.version.sha256);
      });

      it("embeds the SDK and has no external resources", () => {
        const html = readFileSync(file, "utf8");
        expect(html).toContain('source: "loop-miniapp"');
        expect(html).toContain("Loop.ready()");
        expect(html).not.toMatch(/<(script|link|img|iframe)[^>]+(src|href)=["']?(https?:)?\/\//i);
      });

      it("is mirrored in supabase/seed.sql", () => {
        const sql = readFileSync(join(root, "supabase/seed.sql"), "utf8");
        expect(sql).toContain(app.id);
        expect(sql).toContain(app.version.id);
        expect(sql).toContain(app.version.sha256!);
      });
    });
  }
});

describe("miniapp security headers (RNF-005)", () => {
  const csp = miniappHeaders["Content-Security-Policy"];
  it("blocks network access and forces the sandbox", () => {
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("sandbox allow-scripts");
    expect(csp).not.toContain("allow-same-origin");
  });
});
