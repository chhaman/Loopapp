/**
 * Messages a miniapp may send to the host through window.parent.postMessage.
 * The host never trusts these messages for anything privileged: they only
 * drive UI state (ready/error) and anonymous analytics (interaction).
 * See docs/api/miniapp-contract.md.
 */
export const MINIAPP_MESSAGE_SOURCE = "loop-miniapp";

export type MiniappMessage =
  | { type: "ready" }
  | { type: "interaction"; name: string }
  | { type: "error"; message: string };

const NAME_PATTERN = /^[a-z0-9:_-]{1,40}$/i;

export function parseMiniappMessage(data: unknown): MiniappMessage | null {
  if (typeof data !== "object" || data === null) return null;
  const msg = data as Record<string, unknown>;
  if (msg.source !== MINIAPP_MESSAGE_SOURCE || msg.v !== 1) return null;
  switch (msg.type) {
    case "ready":
      return { type: "ready" };
    case "interaction":
      return typeof msg.name === "string" && NAME_PATTERN.test(msg.name)
        ? { type: "interaction", name: msg.name }
        : null;
    case "error":
      return {
        type: "error",
        message: typeof msg.message === "string" ? msg.message.slice(0, 200) : "unknown",
      };
    default:
      return null;
  }
}

/** Builds the iframe URL for an approved version; lang/theme are the only data shared with the miniapp. */
export function miniappUrl(
  origin: string,
  entryPath: string,
  opts: { lang: string; theme: "light" | "dark" },
): string {
  const base = origin.replace(/\/$/, "");
  const params = new URLSearchParams({ lang: opts.lang, theme: opts.theme });
  return `${base}${entryPath}?${params.toString()}`;
}
