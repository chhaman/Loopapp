"use client";

import Link from "next/link";
import { Dialog } from "./Dialog";
import { usePrefs } from "./PrefsProvider";

export type AuthReason = "like" | "save" | "comment" | "report";

/** Explains why an action needs an account and keeps the context via ?next= (TC-006). */
export function AuthPrompt({ reason, next, onClose }: { reason: AuthReason | null; next: string; onClose: () => void }) {
  const { t } = usePrefs();
  return (
    <Dialog open={reason !== null} onClose={onClose} title={t("authPrompt.title")}>
      {reason && (
        <div className="flex flex-col gap-4" data-testid="auth-prompt">
          <p className="text-muted">{t(`authPrompt.${reason}`)}</p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/ingresar?next=${encodeURIComponent(next)}`}
              className="rounded-full bg-accent px-5 py-3 text-center font-extrabold text-on-accent"
            >
              {t("authPrompt.cta")}
            </Link>
            <button type="button" onClick={onClose} className="rounded-full border border-line px-5 py-3 font-bold">
              {t("authPrompt.cancel")}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
