import { describe, expect, it } from "vitest";
import { miniappUrl, parseMiniappMessage } from "@/lib/domain/miniapp-protocol";

const msg = (extra: object) => ({ source: "loop-miniapp", v: 1, ...extra });

describe("parseMiniappMessage", () => {
  it("accepts the three message types", () => {
    expect(parseMiniappMessage(msg({ type: "ready" }))).toEqual({ type: "ready" });
    expect(parseMiniappMessage(msg({ type: "interaction", name: "start" }))).toEqual({ type: "interaction", name: "start" });
    expect(parseMiniappMessage(msg({ type: "error", message: "boom" }))).toEqual({ type: "error", message: "boom" });
  });

  it("ignores foreign or malformed messages", () => {
    expect(parseMiniappMessage(null)).toBeNull();
    expect(parseMiniappMessage("ready")).toBeNull();
    expect(parseMiniappMessage({ type: "ready" })).toBeNull();
    expect(parseMiniappMessage(msg({ type: "ready", v: 2 }))).toBeNull();
    expect(parseMiniappMessage(msg({ type: "navigate", url: "https://evil.example" }))).toBeNull();
  });

  it("rejects interaction names that could smuggle data", () => {
    expect(parseMiniappMessage(msg({ type: "interaction", name: "x".repeat(41) }))).toBeNull();
    expect(parseMiniappMessage(msg({ type: "interaction", name: "user@example.com" }))).toBeNull();
    expect(parseMiniappMessage(msg({ type: "interaction", name: 5 }))).toBeNull();
  });

  it("truncates error messages", () => {
    const parsed = parseMiniappMessage(msg({ type: "error", message: "e".repeat(500) }));
    expect(parsed).toEqual({ type: "error", message: "e".repeat(200) });
  });
});

describe("miniappUrl", () => {
  it("only passes language and theme to the miniapp", () => {
    expect(miniappUrl("", "/miniapps/foco/1.0.0/index.html", { lang: "en", theme: "dark" })).toBe(
      "/miniapps/foco/1.0.0/index.html?lang=en&theme=dark",
    );
    expect(miniappUrl("https://apps.example/", "/miniapps/foco/1.0.0/index.html", { lang: "es", theme: "light" })).toBe(
      "https://apps.example/miniapps/foco/1.0.0/index.html?lang=es&theme=light",
    );
  });
});
