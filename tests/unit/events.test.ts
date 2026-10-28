import { describe, expect, it } from "vitest";
import { eventBatchSchema } from "@/lib/domain/events";

const event = {
  type: "impression",
  appId: "00000000-0000-4000-a000-000000000001",
  versionId: "00000000-0000-4000-b000-000000000001",
  sessionId: "8c7c2c55-41a6-4f63-9a4a-3d2b1c0e9f00",
  at: "2026-10-27T12:00:00.000Z",
};

describe("eventBatchSchema (RF-040)", () => {
  it("accepts well-formed batches", () => {
    expect(eventBatchSchema.safeParse({ events: [event, { ...event, type: "interaction", props: { name: "start" } }] }).success).toBe(true);
  });

  it("rejects unknown event types, bad session ids and oversized batches", () => {
    expect(eventBatchSchema.safeParse({ events: [{ ...event, type: "purchase" }] }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ events: [{ ...event, sessionId: "short" }] }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ events: [] }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ events: Array(51).fill(event) }).success).toBe(false);
  });

  it("limits free-form properties", () => {
    const props = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`k${i}`, 1]));
    expect(eventBatchSchema.safeParse({ events: [{ ...event, props }] }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ events: [{ ...event, props: { note: "x".repeat(201) } }] }).success).toBe(false);
    expect(eventBatchSchema.safeParse({ events: [{ ...event, props: { nested: { a: 1 } } }] }).success).toBe(false);
  });
});
