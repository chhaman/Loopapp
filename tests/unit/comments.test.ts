import { describe, expect, it } from "vitest";
import { COMMENT_MAX_LENGTH, validateComment } from "@/lib/domain/comments";

describe("validateComment (RF-024, TC-008)", () => {
  it("rejects empty and whitespace-only comments", () => {
    expect(validateComment("")).toEqual({ ok: false, error: "empty" });
    expect(validateComment("   \n\t ")).toEqual({ ok: false, error: "empty" });
    expect(validateComment(undefined)).toEqual({ ok: false, error: "empty" });
    expect(validateComment(42)).toEqual({ ok: false, error: "empty" });
  });

  it("rejects comments over the limit and accepts the limit exactly", () => {
    expect(validateComment("a".repeat(COMMENT_MAX_LENGTH + 1))).toEqual({ ok: false, error: "too_long" });
    expect(validateComment("a".repeat(COMMENT_MAX_LENGTH))).toEqual({ ok: true, body: "a".repeat(COMMENT_MAX_LENGTH) });
  });

  it("trims and normalizes line endings", () => {
    expect(validateComment("  hola\r\nmundo  ")).toEqual({ ok: true, body: "hola\nmundo" });
  });
});
