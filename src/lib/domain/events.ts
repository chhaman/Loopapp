import { z } from "zod";

/** Product events (RF-040). Only pseudonymous, minimal context is accepted. */
export const EVENT_TYPES = [
  "impression",
  "trial_start",
  "interaction",
  "exit",
  "error",
  "external_link_open",
  "share",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const productEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  appId: z.string().min(1).max(64),
  versionId: z.string().min(1).max(64),
  sessionId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  at: z.iso.datetime(),
  props: z
    .record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()]))
    .refine((value) => Object.keys(value).length <= 10, "too many props")
    .optional(),
});

export const eventBatchSchema = z.object({
  events: z.array(productEventSchema).min(1).max(50),
});

export type ProductEvent = z.infer<typeof productEventSchema>;
