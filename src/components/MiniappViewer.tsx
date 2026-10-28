"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { track } from "@/lib/client/analytics";
import { miniappUrl, parseMiniappMessage } from "@/lib/domain/miniapp-protocol";
import { usePrefs } from "./PrefsProvider";

export const MINIAPP_READY_TIMEOUT_MS = 10_000;
const MINIAPP_ORIGIN = process.env.NEXT_PUBLIC_MINIAPP_ORIGIN ?? "";

type Status = "loading" | "ready" | "error" | "timeout";

export type ViewerApp = {
  id: string;
  slug: string;
  name: string;
  accent: string;
  versionId: string;
  entryPath: string;
};

/**
 * Runs one miniapp inside a sandboxed iframe (RF-010, RF-012, RF-014).
 *
 * Isolation: `sandbox="allow-scripts"` without `allow-same-origin` gives the
 * document an opaque origin, so it cannot read the host's cookies, storage or
 * DOM. `allow=""` denies every powerful feature (camera, mic, geolocation…).
 * The server additionally sends a restrictive CSP for /miniapps/* (no network).
 */
export function MiniappViewer(props: {
  app: ViewerApp;
  /** Whether the iframe should be mounted (active item or its neighbors, for preloading). */
  load: boolean;
  active: boolean;
  resetKey: number;
  onSkip: () => void;
}) {
  const { lang, resolvedTheme } = usePrefs();
  const [attempt, setAttempt] = useState(0);
  // A new key mounts a fresh session: new document, new state, new timeout.
  const sessionKey = `${props.load}:${props.resetKey}:${attempt}:${lang}:${resolvedTheme}`;
  return <FrameSession key={sessionKey} {...props} onRetry={() => setAttempt((n) => n + 1)} />;
}

const noopSubscribe = () => () => {};

/**
 * False during SSR and hydration, true afterwards. The iframe is only mounted
 * on the client so its "ready" message can't arrive before the listener exists.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function FrameSession({
  app,
  load,
  active,
  onSkip,
  onRetry,
}: {
  app: ViewerApp;
  load: boolean;
  active: boolean;
  onSkip: () => void;
  onRetry: () => void;
}) {
  const { t, lang, resolvedTheme } = usePrefs();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const activeRef = useRef(active);
  const isClient = useIsClient();
  const mounted = load && isClient;

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Layout effect: the listener is attached in the same commit that inserts the iframe.
  useLayoutEffect(() => {
    if (!mounted) return;
    const seen = new Set<string>();
    let trialStarted = false;
    const ref = { id: app.id, versionId: app.versionId };

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "loading" ? "timeout" : current));
      track("error", ref, { kind: "timeout" });
    }, MINIAPP_READY_TIMEOUT_MS);

    function onMessage(event: MessageEvent) {
      // Only accept messages from this iframe's own window.
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      const message = parseMiniappMessage(event.data);
      if (!message) return;
      if (message.type === "ready") {
        clearTimeout(timeout);
        setStatus((current) => (current === "loading" ? "ready" : current));
      } else if (message.type === "error") {
        clearTimeout(timeout);
        setStatus("error");
        track("error", ref, { kind: "runtime", message: message.message });
      } else if (message.type === "interaction" && activeRef.current) {
        if (!trialStarted) {
          trialStarted = true;
          track("trial_start", ref);
        }
        if (!seen.has(message.name)) {
          seen.add(message.name);
          track("interaction", ref, { name: message.name });
        }
      }
    }

    window.addEventListener("message", onMessage);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };
  }, [mounted, app.id, app.versionId]);

  const src = miniappUrl(MINIAPP_ORIGIN, app.entryPath, { lang, theme: resolvedTheme });
  const failed = status === "error" || status === "timeout";

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[28px] border border-line bg-surface"
      style={{ boxShadow: `0 0 0 1px ${app.accent}22, 0 18px 50px -20px ${app.accent}88` }}
      data-testid="miniapp-viewer"
      data-status={mounted ? status : "idle"}
    >
      {mounted && (
        <iframe
          ref={frameRef}
          src={src}
          title={t("viewer.frameTitle", { name: app.name })}
          sandbox="allow-scripts"
          allow=""
          referrerPolicy="no-referrer"
          className={`h-full w-full border-0 transition-opacity duration-300 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
          tabIndex={active ? 0 : -1}
          aria-hidden={!active}
        />
      )}

      {(!mounted || status === "loading") && (
        <div className="absolute inset-0 grid place-items-center" aria-live="polite">
          <div className="flex flex-col items-center gap-3 text-muted">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-line" style={{ borderTopColor: app.accent }} aria-hidden="true" />
            <span className="text-sm font-semibold">{t("viewer.loading")}</span>
          </div>
        </div>
      )}

      {failed && (
        <div role="alert" className="absolute inset-0 grid place-items-center bg-surface p-6 text-center" data-testid="miniapp-error">
          <div className="flex max-w-xs flex-col items-center gap-3">
            <p className="font-display text-xl font-extrabold">
              {t(status === "timeout" ? "viewer.timeout.title" : "viewer.error.title")}
            </p>
            <p className="text-sm text-muted">{t(status === "timeout" ? "viewer.timeout.body" : "viewer.error.body")}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-accent px-5 py-2.5 font-extrabold text-on-accent"
                onClick={onRetry}
              >
                {t("viewer.retry")}
              </button>
              <button type="button" className="rounded-full border border-line px-5 py-2.5 font-bold" onClick={onSkip}>
                {t("viewer.skip")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
