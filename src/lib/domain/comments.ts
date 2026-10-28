export const COMMENT_MAX_LENGTH = 500;

export type CommentValidation =
  | { ok: true; body: string }
  | { ok: false; error: "empty" | "too_long" };

/** Mirrors the database CHECK constraint so the UI can explain errors (RF-024, TC-008). */
export function validateComment(raw: unknown): CommentValidation {
  if (typeof raw !== "string") return { ok: false, error: "empty" };
  const body = raw.replace(/\r\n/g, "\n").trim();
  if (body.length === 0) return { ok: false, error: "empty" };
  if (body.length > COMMENT_MAX_LENGTH) return { ok: false, error: "too_long" };
  return { ok: true, body };
}

export const REPORT_REASONS = ["spam", "abuse", "malicious", "ip", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_DETAILS_MAX_LENGTH = 1000;
