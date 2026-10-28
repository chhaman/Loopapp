"use client";

import { useState } from "react";
import { AuthPrompt } from "./AuthPrompt";
import { FlagIcon } from "./Icons";
import { usePrefs } from "./PrefsProvider";
import { ReportDialog, type ReportTarget } from "./ReportDialog";

export function ReportAppButton({ appId, signedIn, next }: { appId: string; signedIn: boolean; next: string }) {
  const { t } = usePrefs();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => (signedIn ? setTarget({ type: "app", id: appId }) : setNeedsAuth(true))}
        className="inline-flex items-center gap-2 self-start text-sm font-bold text-muted hover:text-fg"
      >
        <FlagIcon width={16} height={16} /> {t("actions.report")}
      </button>
      <ReportDialog target={target} onClose={() => setTarget(null)} onNeedsAuth={() => setNeedsAuth(true)} />
      <AuthPrompt reason={needsAuth ? "report" : null} next={next} onClose={() => setNeedsAuth(false)} />
    </>
  );
}
