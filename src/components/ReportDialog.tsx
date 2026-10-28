"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/actions/social";
import { REPORT_DETAILS_MAX_LENGTH, REPORT_REASONS, type ReportReason } from "@/lib/domain/comments";
import { Dialog } from "./Dialog";
import { usePrefs } from "./PrefsProvider";
import { toast } from "./Toaster";

export type ReportTarget = { type: "app" | "comment"; id: string };

export function ReportDialog({
  target,
  onClose,
  onNeedsAuth,
}: {
  target: ReportTarget | null;
  onClose: () => void;
  onNeedsAuth: () => void;
}) {
  const { t } = usePrefs();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!target) return;
    startTransition(async () => {
      const result = await reportContent({ targetType: target.type, targetId: target.id, reason, details });
      if (result.ok) {
        toast(t("report.thanks"));
        setDetails("");
        onClose();
      } else if (result.error === "auth") {
        onClose();
        onNeedsAuth();
      } else {
        toast(t(result.error === "not_configured" ? "actions.notConfigured" : "actions.error"));
      }
    });
  }

  return (
    <Dialog open={target !== null} onClose={onClose} title={t("report.title")}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold text-muted">{t("report.reason")}</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              {t(`report.reason.${r}`)}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1 text-sm font-bold text-muted">
          {t("report.details")}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={REPORT_DETAILS_MAX_LENGTH}
            rows={3}
            className="rounded-xl border border-line bg-surface-2 p-3 font-normal text-fg"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-line px-4 py-2 font-bold">
            {t("report.cancel")}
          </button>
          <button type="submit" disabled={pending} className="rounded-full bg-accent px-4 py-2 font-extrabold text-on-accent disabled:opacity-60">
            {t("report.send")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
