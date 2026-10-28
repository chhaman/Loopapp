import { describe, expect, it } from "vitest";
import { createTranslator, dictionaries } from "@/lib/i18n/dictionaries";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("have the same keys, no empty strings and matching placeholders", () => {
    const es = dictionaries.es;
    const en = dictionaries.en;
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    for (const key of Object.keys(es) as (keyof typeof es)[]) {
      expect(es[key].trim(), `es.${key}`).not.toBe("");
      expect(en[key].trim(), `en.${key}`).not.toBe("");
      expect(placeholders(en[key]), key).toEqual(placeholders(es[key]));
    }
  });

  it("interpolates variables", () => {
    expect(createTranslator("es")("feed.position", { current: 2, total: 5 })).toBe("2 de 5");
    expect(createTranslator("en")("feed.position", { current: 2, total: 5 })).toBe("2 of 5");
  });
});
