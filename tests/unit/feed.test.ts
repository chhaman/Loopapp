import { describe, expect, it } from "vitest";
import { SEED_APPS } from "@/lib/catalog/seed";
import { buildFeed, isPubliclyRunnable, startFeedAt } from "@/lib/domain/feed";
import type { CatalogApp } from "@/lib/domain/types";

const base = SEED_APPS[0];
function app(slug: string, overrides: Partial<CatalogApp> = {}, version: Partial<CatalogApp["version"]> = {}): CatalogApp {
  return { ...base, id: slug, slug, ...overrides, version: { ...base.version, ...version } };
}

describe("isPubliclyRunnable (RF-035, TC-010)", () => {
  it("requires a published app with an approved version", () => {
    expect(isPubliclyRunnable(app("a"))).toBe(true);
    expect(isPubliclyRunnable(app("a", { status: "suspended" }))).toBe(false);
    expect(isPubliclyRunnable(app("a", { status: "retired" }))).toBe(false);
    expect(isPubliclyRunnable(app("a", { status: "draft" }))).toBe(false);
    expect(isPubliclyRunnable(app("a", {}, { status: "pending" }))).toBe(false);
    expect(isPubliclyRunnable(app("a", {}, { status: "suspended" }))).toBe(false);
  });
});

describe("buildFeed (RF-042)", () => {
  it("orders featured first, then by position, then by slug", () => {
    const feed = buildFeed([
      app("c", { feed: { position: 1, featured: false } }),
      app("b", { feed: { position: 2, featured: false } }),
      app("a", { feed: { position: 1, featured: false } }),
      app("z", { feed: { position: 9, featured: true } }),
    ]);
    expect(feed.map((a) => a.slug)).toEqual(["z", "a", "c", "b"]);
  });

  it("drops apps that are not runnable or have no feed slot", () => {
    const feed = buildFeed([
      app("ok", { feed: { position: 1, featured: false } }),
      app("suspended", { status: "suspended", feed: { position: 0, featured: true } }),
      app("pending", { feed: { position: 0, featured: false } }, { status: "pending" }),
      app("no-slot", { feed: null }),
    ]);
    expect(feed.map((a) => a.slug)).toEqual(["ok"]);
  });

  it("does not mutate its input", () => {
    const input = [app("b", { feed: { position: 2, featured: false } }), app("a", { feed: { position: 1, featured: false } })];
    buildFeed(input);
    expect(input.map((a) => a.slug)).toEqual(["b", "a"]);
  });
});

describe("startFeedAt (RF-006)", () => {
  const feed = ["a", "b", "c", "d"].map((slug) => ({ slug }));
  it("rotates the feed so the shared app comes first and none is lost", () => {
    expect(startFeedAt(feed, "c").map((x) => x.slug)).toEqual(["c", "d", "a", "b"]);
  });
  it("keeps the order for unknown or missing slugs", () => {
    expect(startFeedAt(feed, "nope").map((x) => x.slug)).toEqual(["a", "b", "c", "d"]);
    expect(startFeedAt(feed, undefined).map((x) => x.slug)).toEqual(["a", "b", "c", "d"]);
  });
});
