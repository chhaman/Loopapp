export type ActionError = "auth" | "not_configured" | "validation" | "rate_limited" | "forbidden" | "unknown";
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: ActionError; detail?: string };

export const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: ActionError, detail?: string): ActionResult<never> => ({ ok: false, error, detail });

/** Only same-site relative paths are accepted as post-login destinations (no open redirects). */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}
