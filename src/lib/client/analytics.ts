"use client";

import type { EventType, ProductEvent } from "@/lib/domain/events";

/**
 * Batched, pseudonymous product analytics. The session id is random per browser
 * tab session and is never linked to an account.
 */
let sessionId: string | null = null;
const queue: ProductEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem("loop_sid");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("loop_sid", sessionId);
    }
  } catch {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

function flush() {
  timer = null;
  if (queue.length === 0) return;
  const body = JSON.stringify({ events: queue.splice(0, 50) });
  const sent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  if (!sent) {
    fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  }
  if (queue.length) timer = setTimeout(flush, 0);
}

export function track(
  type: EventType,
  app: { id: string; versionId: string },
  props?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;
  queue.push({ type, appId: app.id, versionId: app.versionId, sessionId: getSessionId(), at: new Date().toISOString(), props });
  if (!timer) timer = setTimeout(flush, 2000);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
