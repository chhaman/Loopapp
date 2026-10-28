import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/action-result";
import { nextTheme, parseLang, parseTheme } from "@/lib/prefs/prefs";

describe("preferences", () => {
  it("parses language from cookie, then Accept-Language, then defaults to Spanish", () => {
    expect(parseLang("en")).toBe("en");
    expect(parseLang(undefined, "en-US,en;q=0.9")).toBe("en");
    expect(parseLang("fr", "fr-FR")).toBe("es");
    expect(parseLang(undefined, null)).toBe("es");
  });

  it("parses and cycles themes", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("neon")).toBe("system");
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
  });
});

describe("safeNextPath (no open redirects)", () => {
  it("keeps same-site relative paths", () => {
    expect(safeNextPath("/?app=foco")).toBe("/?app=foco");
    expect(safeNextPath("/guardados")).toBe("/guardados");
  });
  it("rejects absolute, protocol-relative and odd paths", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", null, 3]) {
      expect(safeNextPath(bad)).toBe("/");
    }
  });
});
